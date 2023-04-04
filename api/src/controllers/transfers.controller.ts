import {
  AllOptionalExceptFor,
  APIResponse,
  BoomAccount,
  BoomUser,
  PhoneRegex2,
  RoleKey,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { Count, CountSchema, Filter, repository, Where } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { authorize } from '../authorization';
import {
  APIResponseMessages,
  FundTransferResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
} from '../constants';
import { Transaction } from '../models';
import { TransactionRepository } from '../repositories';
import {
  BoomAccountService,
  EmailService,
  getProfileOptions,
  ProfileService,
  SNSService,
  TransfersService,
} from '../services';
import { ServiceResponse } from '../types';
import { handleServiceResponseResult } from '../utils';

export class TransferController {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);

  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(TransfersService)
    private transfersService: TransfersService,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(EmailService)
    private emailService: EmailService,
    @service(SNSService)
    private snsService: SNSService,
    @service(BoomAccountService)
    private boomAccountService: BoomAccountService
  ) {}

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/transfers', {
    responses: {
      '200': {
        description: 'Transfers funds from one user to another.',
        content: { 'application/json': { schema: { 'x-ts-type': Transaction } } },
      },
    },
  })
  async create(
    @requestBody() transaction: Transaction
  ): Promise<APIResponse<Transaction | object>> {
    try {
      this.logger.info('Transfer Requested: ', transaction);
      const sender: AllOptionalExceptFor<BoomUser, 'uid'> | null =
        transaction.sender as AllOptionalExceptFor<BoomUser, 'uid'>;
      const receiver: BoomUser | undefined = transaction.receiver as BoomUser;

      // TODO: on ticket BW-1528 we should remove this validation the controller endpoint should check we get a number and verify that the +1 is present (Check line 102 api\src\controllers\users.controller.ts)
      let receiverPhone: string = receiver.contact?.phoneNumber ?? '';
      if (receiverPhone.length === 10) {
        receiverPhone = '+1' + receiverPhone;
      }

      if (!receiverPhone.match(PhoneRegex2)) {
        // TODO: on ticket BW-1528 we should remove this, the controller validator should validate the number is ok
        this.logger.error(
          `Transfer failed: receiver phone number is not in correct format. Number: ${receiverPhone}`
        );
        throw new HttpErrors.BadRequest(FundTransferResponseMessages.BAD_PHONE_FORMAT);
      }

      if (
        !sender ||
        !sender.uid ||
        !receiverPhone ||
        !transaction.amount ||
        !transaction.amount.amount ||
        !transaction.amount.precision
      ) {
        this.logger.error(`Transfer failed: missing information`);
        throw new HttpErrors.BadRequest(FundTransferResponseMessages.TRANSACTION_MISSING_INFO);
      }

      const senderProfile = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'contact' | 'firstName'>
      >(sender.uid, {
        requiredFields: ['contact', 'firstName'],
      });

      const senderProfileData =
        handleServiceResponseResult<typeof senderProfile.data>(senderProfile);
      if (!senderProfileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      let receiverProfile: ServiceResponse<
        AllOptionalExceptFor<
          BoomUser,
          'uid' | 'createdAt' | 'updatedAt' | 'roles' | 'contact' | 'firstName'
        >
      >;
      if (receiverPhone) {
        receiverProfile = await this.profileService.getProfile<typeof receiverProfile.data>(
          receiverPhone,
          {
            requiredFields: ['contact', 'firstName'],
            method: getProfileOptions.BY_PHONE,
          }
        );
      } else if (receiver?.uid) {
        receiverProfile = await this.profileService.getProfile<typeof receiverProfile.data>(
          receiver.uid,
          {
            requiredFields: ['contact', 'firstName'],
            method: getProfileOptions.BY_PHONE,
          }
        );
      } else {
        throw new HttpErrors.BadRequest(FundTransferResponseMessages.TRANSACTION_MISSING_INFO);
      }

      if (
        receiverProfile.statusCode !== ServiceResponseCodes.SUCCESS &&
        receiverProfile.statusCode !== ServiceResponseCodes.RECORD_NOT_FOUND
      ) {
        this.logger.error(`Transfer failed: profile service error`);
        throw new HttpErrors.BadRequest(
          receiverProfile.message ?? APIResponseMessages.RECORD_CONFLICT
        );
      }

      const receiverProfileData: typeof receiverProfile.data | undefined =
        receiverProfile.statusCode === ServiceResponseCodes.SUCCESS
          ? handleServiceResponseResult<typeof receiverProfile.data>(receiverProfile)
          : undefined;

      if (receiverProfileData?.roles.includes(RoleKey.Merchant)) {
        this.logger.error(`Transfer failed: receiver is merchant`);
        throw new HttpErrors.BadRequest(FundTransferResponseMessages.RECEIVER_IS_MERCHANT);
      }
      const senderEmail: string | undefined = senderProfileData.contact.emails?.[0];
      const receiverEmail: string | undefined = receiverProfileData?.contact.emails?.[0];
      const senderPhone: string | undefined = senderProfileData.contact.phoneNumber;

      if (!senderProfileData.boomAccounts?.length) {
        this.logger.error(`Transfer failed: user was missing boom account`);
        throw new HttpErrors.NotFound(GlobalResponseMessages.NO_BOOM_ACCOUNT);
      }

      if (!receiverProfileData?.boomAccounts?.length && receiver.uid) {
        // TODO: this only covers if the receiver has id to create account but when phone number is received we don't create account
        // This logic should be moved to the transfer service when the funds are added - ticket BW-1529 should fix this
        this.logger.info(`Creating Boom Account for Receiver. ${receiver.uid}`);
        const creatingResponse: APIResponse<BoomAccount> = await this.boomAccountService.create(
          receiver.uid
        );
        if (!creatingResponse.success) {
          throw new HttpErrors.BadRequest(creatingResponse.message);
        }
      }

      //we get the first account for this user
      const senderBoomAccountResponse: APIResponse<BoomAccount> =
        await this.boomAccountService.verifyExistingAccounts(senderProfileData.uid);
      if (!senderBoomAccountResponse.success || !senderBoomAccountResponse.data) {
        throw new HttpErrors.NotFound(senderBoomAccountResponse.message);
      }
      const senderBoomAccount: BoomAccount = senderBoomAccountResponse.data;

      if (Dinero(senderBoomAccount.balance).lessThan(Dinero(transaction.amount))) {
        this.logger.error(`Transfer failed: sender did not have enough funds`);
        throw new HttpErrors.BadRequest(FundTransferResponseMessages.INSUFFICIENT_FUNDS);
      }

      const preparedTransaction: Transaction = {
        ...transaction,
        createdAt: moment().utc().unix(),
        updatedAt: moment().utc().unix(),
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        sender: { ...sender, firstName: senderProfileData.firstName },
        receiver: {
          uid: receiverProfileData?.uid,
          firstName: receiverProfileData?.firstName,
          contact: {
            phoneNumber: receiverPhone,
            emails: receiverEmail ? [receiverEmail] : undefined,
          },
        } as BoomUser,
      } as Transaction;

      let result;
      try {
        result = await this.transactionRepository.create(preparedTransaction);
      } catch (err) {
        this.logger.error(`Transfer failed: transaction repository create failed`);
        throw new HttpErrors.InternalServerError(
          FundTransferResponseMessages.TRANSACTION_CREATION_ERROR
        );
      }

      if (receiverProfileData?.uid) {
        // receiver is a member
        try {
          const receiverSNSResult = await this.snsService.sendSMS({
            Message: `You have a pending transfer of ${Dinero(transaction.amount).toFormat(
              '$0,0.00'
            )} to your Boom account! To receive this transfer, please follow this link: ${
              process.env.DOMAIN_SOURCE
            }/confirm-transfer/${result._id}`,
            PhoneNumber: receiverPhone.replace(/\s/g, ''),
          });
          this.logger.info(
            `SMS to transfer receiver was successful: ${receiverSNSResult.success}\nSNSService message: ${receiverSNSResult.message}`
          );
        } catch (err) {
          this.logger.error(`Transfer SNS failed: ${err.message}`);
        }
      } else {
        // receiver is not a member
        try {
          const receiverSNSResult = await this.snsService.sendSMS({
            Message: `${senderProfileData.firstName ?? 'Your friend'} sent you ${Dinero(
              transaction.amount
            ).toFormat(
              '$0,0.00'
            )} in Boom Rewards! To receive this transfer, download the app and create an account using this phone number!`,
            PhoneNumber: receiverPhone.replace(/\s/g, ''),
          });
          this.logger.info(
            `SMS to transfer receiver was successful: ${receiverSNSResult.success}\nSNSService message: ${receiverSNSResult.message}`
          );
        } catch (err) {
          this.logger.error(`Transfer SNS failed: ${err.message}`);
        }
      }

      try {
        const senderSNSResult = await this.snsService.sendSMS({
          Message: `You have initiated a transfer of ${Dinero(transaction.amount).toFormat(
            '$0,0.00'
          )} to ${receiverPhone}! You may cancel this transfer here: ${
            process.env.DOMAIN_SOURCE
          }/cancel-transfer/${result._id}`,
          PhoneNumber: senderPhone?.replace(/\s/g, ''),
        });
        this.logger.info(
          `SMS to transfer sender was successful: ${senderSNSResult.success}\nSNSService message: ${senderSNSResult.message}`
        );
      } catch (err) {
        this.logger.error(`Transfer SNS failed: ${err.message}`);
      }

      if (senderEmail) {
        this.logger.info('Transfer Saved. Will send sender email: ', senderEmail);
        try {
          await this.emailService.send({
            to: senderEmail,
            from: 'Boom Rewards <noreply@boomcarding.com>',
            subject: 'Transfer started from your account',
            html: this.emailService.mailGenerator.generate({
              body: {
                name:
                  senderProfileData.firstName +
                  (senderProfileData.lastName ? ' ' + senderProfileData.lastName : ''),
                intro: `You have initiated a transfer of ${Dinero(transaction.amount).toFormat(
                  '$0,0.00'
                )} to ${receiverEmail}!`,
                action: {
                  instructions:
                    'If you did not intend to make this transfer, you can cancel it below.',
                  button: {
                    color: '#d52c25',
                    text: 'Cancel transfer',
                    link: `${process.env.DOMAIN_SOURCE}/cancel-transfer/${result._id}`,
                  },
                },
              },
            }),
          });
        } catch (err) {
          this.logger.error(`Transfer email failed: ${err.message}`);
        }
      }

      if (receiverEmail) {
        try {
          this.logger.info('Transfer Saved. Will send receiver email: ', receiverEmail);
          await this.emailService.send({
            to: receiverEmail,
            from: 'Boom Rewards <noreply@boomcarding.com>',
            subject: 'Request for Transfer of Funds',
            html: this.emailService.mailGenerator.generate({
              body: {
                name:
                  receiverProfileData?.firstName +
                  (receiverProfileData?.lastName ? ' ' + receiverProfileData?.lastName : ''),
                intro: `You have a pending transfer of ${Dinero(transaction.amount).toFormat(
                  '$0,0.00'
                )} to your Boom account!`,
                action: {
                  instructions: 'To receive this transfer, please click the button below.',
                  button: {
                    color: '#d52c25',
                    text: 'Accept transfer',
                    link: `${process.env.DOMAIN_SOURCE}/confirm-transfer/${result._id}`,
                  },
                },
                hideSignature: true,
              },
            }),
          });
        } catch (err) {
          this.logger.error(`Transfer email failed: ${err.message}`);
        }
      }

      this.logger.info('Transfer Request Created:', result);
      return { success: true, message: 'Success', data: result };
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/transfers/count', {
    responses: {
      '200': {
        description: 'Transaction model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Transaction)) where?: Where<Transaction>
  ): Promise<Count> {
    //@TODO: The logged in user id and the id you passed over must match, else throw 403
    return this.transactionRepository.count(where);
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/transfers', {
    responses: {
      '200': {
        description: 'Array of Transaction model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Transaction } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Transaction)) filter?: Filter<Transaction>
  ): Promise<Transaction[]> {
    return this.transactionRepository.find(filter);
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @patch('/transfers/{id}', {
    responses: {
      '204': {
        description: 'Transaction PUT success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() transaction: Transaction
  ): Promise<APIResponse<object>> {
    try {
      const exists: boolean = await this.transactionRepository.exists(id);
      if (!exists) {
        return { success: false, message: 'This transfer was not found' };
      }

      const current: Transaction = await this.transactionRepository.findById(id);

      if (transaction.status === TransactionStatus.CANCELLED) {
        if (current.status !== TransactionStatus.PENDING) {
          return { success: false, message: `This transfer has already been ${current.status}!` };
        }

        const updatedTransaction: Transaction = {
          ...current,
          status: transaction.status,
          updatedAt: moment().utc().unix(),
        } as Transaction;

        await this.transactionRepository.updateById(id, updatedTransaction);

        return { success: true, message: 'Transfer cancelled' };
      } else if (transaction.status === TransactionStatus.COMPLETED) {
        if (current.status !== TransactionStatus.PENDING) {
          return {
            success: false,
            message: `This transfer has already been ${current.status}!`,
            data: { isStillPending: false },
          };
        }

        if (!current?.createdAt || moment().utc().unix() - current.createdAt > 3 * 24 * 60 * 60) {
          return {
            success: false,
            message: `This transfer is expired!`,
            data: { isStillPending: false },
          };
        }
        try {
          await this.transfersService.transferFunds(current);
          return { success: true, message: 'Success' };
        } catch (err) {
          this.logger.error(err);
          return { success: false, message: 'Transfer Failed', data: { isStillPending: true } };
        }
      }
      return { success: false, message: 'Request not found', data: { isStillPending: false } };
    } catch (error) {
      this.logger.error(error);
      return { success: false, message: 'Update Failed' };
    }
  }
}
