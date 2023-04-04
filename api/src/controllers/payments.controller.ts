import {
  AddressInfo,
  AllOptionalExceptFor,
  BoomUser,
  BoomUserPlaidInfo,
  ContactInfo,
  isArray,
  Money,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors, post, requestBody, Response, RestBindings } from '@loopback/rest';
import Dinero from 'dinero.js';
import { getLogger } from 'log4js';
import { service } from 'loopback4-spring';

import { authorize } from '../authorization';
import { AuthorizatonBindings } from '../authorization';
import {
  APIResponseMessages,
  BankAccountResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
} from '../constants';
import { BankInfo, Transaction } from '../models';
import {
  BoomCardRepository,
  CustomerBillingRepository,
  TransactionRepository,
} from '../repositories';
import { BankInfoRepository } from '../repositories/bank-info.repository';
import {
  BankInfoService,
  EmailService,
  PaymentProcessorService,
  ProfileService,
  TransfersService,
} from '../services';
import { ProcessEMVSREDRequest } from '../types/processEMVSRED-request';
import { fromMoney, handleServiceResponseResult } from '../utils';
export class PaymentController {
  logger = getLogger(LoggingCategory.CUSTOMER_BILLING);

  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository,
    @repository(BankInfoRepository)
    public bankInfoRepository: BankInfoRepository,
    @repository(CustomerBillingRepository)
    public billingRepository: CustomerBillingRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(TransfersService)
    private transfersService: TransfersService,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(EmailService)
    private emailService: EmailService,
    @service(BankInfoService)
    private bankInfoService: BankInfoService,
    @service(PaymentProcessorService)
    private paymentProcessorService: PaymentProcessorService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/payments', {
    responses: {
      '200': {
        description: 'Adds funds to user account',
        content: {
          'application/json': { schema: { 'x-ts-type': Transaction } },
        },
      },
    },
  })
  async create(
    @requestBody()
    req: {
      nonce: string;
      uid: string;
      plaidItemId: string;
      amount: Money;
      plaidAccountId: string;
    }
  ): Promise<Transaction | object> {
    const { nonce, uid, amount, plaidItemId, plaidAccountId } = req;
    // const { transaction, billingTransaction } = await this.transfersService.addFunds(
    //   uid,
    //   amount,
    //   nonce
    // );
    const value = amount.amount / 100;

    const profile = await this.profileService.getProfile<
      AllOptionalExceptFor<BoomUser, 'firstName' | 'lastName' | 'contact' | 'addresses'>
    >(uid, {
      requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
    });

    const profileData = handleServiceResponseResult<typeof profile.data>(profile);
    if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

    const plaidInfo: BoomUserPlaidInfo | undefined = profileData.plaidInfo?.find(
      (info: BoomUserPlaidInfo) => info.item.itemId === plaidItemId
    );

    if (!plaidInfo) {
      throw new HttpErrors.NotFound('Plaid info for user not found');
    }
    const plaidAccessToken: string = plaidInfo.item.accessToken;
    const { firstName, lastName, contact, addresses } = profileData;
    const { phoneNumber } = contact as ContactInfo;

    if (!isArray(addresses) || !addresses.length) {
      throw new HttpErrors.BadRequest('There are no addresses for this user');
    }
    const { number, street1, city, state, zip } = addresses[0] as AddressInfo;

    if (!firstName || !lastName || !number || !street1 || !city || !phoneNumber || !state || !zip) {
      throw new HttpErrors.BadRequest(
        'One or more fields are missing: first name, last name, address number, street, city, phone number, state, zip code'
      );
    }

    const email: string = profileData.contact.emails?.[0] ?? '';

    this.logger.debug(
      `Add funds requested for ${uid} for ${fromMoney(amount)}, using nonce: ${nonce}`
    );

    const balanceResult: any = await this.bankInfoService.getPlaidBalance(plaidAccessToken);

    //console.log('Plaid Balance Result', balanceResult);

    if (!balanceResult.success) {
      return {
        success: false,
        message: balanceResult.message,
        errorCode: balanceResult.error_code,
      };
    }
    const balances = balanceResult.accounts.find(
      (item: any) => item.account_id === plaidAccountId
    )?.balances;
    if (!balances) {
      return { success: false, message: BankAccountResponseMessages.BALANCE_CHECK_FAILED };
    }

    /**
     *  Because we do not instantly charge people, we need to keep track of the number of charges a user
     *  is making in addition to checking their balance with Plaid.
     *  For example, if a user has $100 in an account, the old system would let them add $100 to their boom
     *  account as many times as they want until we actually take the money.
     *  To get around this, we check if the real time current total balance is equal to the total balance we
     * have saved for them. If it is, we can assume that means they have added funds more than once since the
     *  last time we charged them, so we should use their "available" balance that we saved rather than their
     *  real time Plaid available balance
     */
    const { available, current } = balances;
    let savedAccountInfo: BankInfo | null;
    try {
      savedAccountInfo = await this.bankInfoRepository.findOne({
        where: { plaidID: plaidAccountId, userID: uid },
      });
    } catch (err) {
      this.logger.error('There was an error finding the bank account');
      return { success: false, message: 'Error finding account' };
    }

    /**
     * This says:
     * if the current real time balance is the same as the balance we have saved, check if the amount being charged is
     *  less than the available funds we have saved.
     * else check if the amount being charged is less than the real time available balance
     *
     * if the saved available balance is undefined (it never should be), just deny the transaction.
     */
    const canPay =
      current === savedAccountInfo?.balances.current
        ? value <= (savedAccountInfo?.balances.available ? savedAccountInfo?.balances.available : 0)
        : value <= available;

    if (!canPay) {
      return { success: false, balanceInfo: { available, current, canPay } };
    }

    if (canPay) {
      const { transaction, billingTransaction } = await this.transfersService.addFunds(
        uid,
        amount,
        nonce
      );

      try {
        // update the balance in our saved account info
        if (savedAccountInfo) {
          savedAccountInfo.balances.available =
            current === savedAccountInfo?.balances.current
              ? savedAccountInfo.balances.available - value
              : available - value;
          savedAccountInfo.balances.current = current;
          await this.bankInfoRepository.updateById(savedAccountInfo._id, savedAccountInfo);
        }
      } catch (err) {
        this.logger.error('There was an error deducting the charge from the account balance');
        return { success: false, message: 'Error updating account' };
      }

      this.logger.debug('Will prepare email body...');

      let html = this.emailService.mailGenerator.generate({
        body: {
          title: profileData.firstName + (profileData.lastName ? ' ' + profileData.lastName : ''),
          intro: fromMoney(amount) + ' was added to your Boom Rewards card.',
          action: {
            instructions:
              'You can check your current balance and transaction history in your dashboard:',
            button: {
              color: '#d52c25',
              text: 'Go to Dashboard',
              link: `${process.env.DOMAIN_SOURCE}/account/history`,
            },
          },
          outro: 'Thank you for your business.',
        },
      });

      const css =
        '.email-masthead { background-color: #d52c25; } .email-footer { background-color: #191919; }</style>';
      html = html.replace(/<\/style>/, css);

      this.logger.debug('Email body prepared. Will email fund added confirmation to', email);

      await this.emailService.send({
        to: email,
        from: 'Boom Rewards <noreply@boomcarding.com>',
        subject: 'Funds Added to your Boom Card Account',
        html: html,
      });
      this.logger.info('Funds added successfully');

      //save to collection bank_account, transactions
      const resultSaveDB = await this.billingRepository.create({
        transaction: billingTransaction as AllOptionalExceptFor<Transaction, '_id'>,
        plaidItemId,
        plaidAccountId,
      });

      this.logger.debug('billing: ', resultSaveDB);

      if (!resultSaveDB) {
        return { success: false, message: 'Failed to save into DB' };
      } else {
        return {
          success: true,
          transaction,
        };
      }
    } else {
      this.logger.error('Checkout unsuccessful');
      return { success: false, message: 'Incomplete Transaction' };
    }
  }

  // Add Funds via credit card
  @authorize([RoleKey.Member])
  @post('payments/credit-card', {
    responses: {
      '200': {
        description: 'Add funds via credit card',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async ProcessCreditCardPayment(
    @requestBody()
    req: {
      amount: Money;
      ksn: string;
      EMVSREDData: string;
      numberOfPaddedBytes: string;
      userEmail: string;
      userFirstName: string;
      userLastName: string;
      userUid: string;
    }
  ): Promise<object> {
    const {
      // boomCardId,
      amount,
      ksn,
      EMVSREDData,
      numberOfPaddedBytes,
      userEmail,
      userFirstName,
      userLastName,
      userUid,
    }: {
      // boomCardId: string;
      amount: Money;
      ksn: string;
      EMVSREDData: string;
      numberOfPaddedBytes: string;
      userEmail: string;
      userFirstName: string;
      userLastName: string;
      userUid: string;
    } = req;

    if (
      !(
        amount ||
        ksn ||
        EMVSREDData ||
        numberOfPaddedBytes ||
        userEmail ||
        userUid ||
        userFirstName ||
        userLastName
      )
    )
      throw new HttpErrors.BadRequest(
        `One Of these is missing: amount || ksn || EMVSREDData || numberOfPaddedBytes || userEmail || userUid || userFirstName || userLastName`
      );

    this.logger.info(
      'Will add funds for user ',
      userUid,
      ' to his boom account With amount: ',
      fromMoney(amount)
    );

    // charge the credit card
    const requestJsonCardInfo: ProcessEMVSREDRequest[] = [
      {
        KeyValuePairOfstringstring: [
          {
            key: 'NonremovableTags',
            value:
              '<![CDATA[<NonremovableTags><Tag>CCTrack2</Tag><Tag>CCNum</Tag><Tag>YY</Tag><Tag>MM</Tag ></NonremovableTags>]]>',
          },
          {
            key: 'PayloadResponseFieldsToMask',
            value:
              '<![CDATA[<FieldsToMask><Field><FieldStart>&lt;AcctNum&gt;</FieldStart><FieldEnd>&lt;/Ac ctNum&gt;</FieldEnd></Field></FieldsToMask>]]>',
          },
        ],
        EMVSREDInput: {
          EMVSREDData,
          EncryptionType: '80',
          KSN: ksn,
          NumberOfPaddedBytes: numberOfPaddedBytes,
          PaymentMode: 'EMV',
        },
        TransactionInput: {
          Amount: Dinero(amount).toUnit(),
          TransactionInputDetails: {
            KeyValuePairOfstringstring: {
              key: '',
              value: '',
            },
          },
          TransactionType: 'SALE',
        },
      },
    ];

    this.logger.debug('Will request EMVSRED process with data:', requestJsonCardInfo);

    const processorResult: {
      success: boolean;
      message?: string;
      data?: object[];
    } = await this.paymentProcessorService.ProcessEMVSRED(requestJsonCardInfo);

    this.logger.debug('ProcessEMVSRED-Response(JSON)', processorResult);

    if (processorResult.success) {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      //if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND); // We could use this one probably, we need to check the Frontend
      if (!currentUser) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: false,
          message: 'No token provided...will not process request.',
        });
      }

      // get userInfo
      const uid: string = userUid;
      const email: string = userEmail;
      const firstName: string = userFirstName;
      const lastName: string = userLastName;

      // add funds
      await this.transfersService.addFunds(uid, amount, '', false);

      // send email
      this.logger.info('Will prepare email body...');

      let html = this.emailService.mailGenerator.generate({
        body: {
          title: (firstName || '') + (lastName ? ' ' + lastName : ''),
          intro: fromMoney(amount) + ' was added to your Boom Rewards card.',
          action: {
            instructions:
              'You can check your current balance and transaction history in your dashboard:',
            button: {
              color: '#d52c25',
              text: 'Go to Dashboard',
              link: `${process.env.DOMAIN_SOURCE}/account/history`,
            },
          },
          outro: 'Thank you for your business.',
        },
      });

      const css =
        '.email-masthead { background-color: #d52c25; } .email-footer { background-color: #191919; }</style>';
      html = html.replace(/<\/style>/, css);

      this.logger.info('Email body prepared. Will email fund added confirmation to', email);

      await this.emailService.send({
        to: email,
        from: 'Boom Rewards <noreply@boomcarding.com>',
        subject: 'Funds Added to your Boom Card Account',
        html: html,
      });

      this.logger.info('Funds added successfully');
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: processorResult.message,
        data: processorResult.data,
      });
    } else
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: false, message: processorResult.message });
  }
}
