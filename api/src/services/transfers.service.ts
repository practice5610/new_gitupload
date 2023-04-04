import {
  AllOptionalExceptFor,
  APIResponse,
  BoomAccount,
  BoomAccountStatus,
  BoomUser,
  Money,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { Options, repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import Dinero from 'dinero.js';
import { getLogger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  APIResponseMessages,
  BoomAccountResponseMessages,
  FundTransferResponseMessages,
  LoggingCategory,
} from '../constants';
import AppError from '../errors/app-error';
import { Transaction } from '../models';
import { TransactionRepository } from '../repositories';
import { ServiceResponse } from '../types';
import { fromMoney, handleServiceResponseResult } from '../utils';
import { BoomAccountService } from './boom-account.service';
import { getProfileOptions, ProfileService } from './profile.service';

export class TransfersService {
  logger = getLogger(LoggingCategory.TRANSACTION_SERVICE);
  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(BoomAccountService)
    private boomAccountService: BoomAccountService
  ) {}

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async transferFunds(
    transaction: AllOptionalExceptFor<Transaction, '_id' | 'sender' | 'receiver' | 'amount'>,
    options?: Options
  ): Promise<object> {
    const updatedTransaction: Transaction = {
      ...transaction,
      status: TransactionStatus.COMPLETED,
    } as Transaction;

    const sender: AllOptionalExceptFor<BoomUser, 'uid'> =
      transaction.sender as AllOptionalExceptFor<BoomUser, 'uid'>;

    const receiver: AllOptionalExceptFor<BoomUser, 'uid'> =
      transaction.receiver as AllOptionalExceptFor<BoomUser, 'uid'>;

    const senderProfile = await this.profileService.getProfile(sender.uid);

    //TODO: here we need to use receiverProfile.data and forward the error properly using ServiceResponse not throwing error with handleServiceResponseResult
    const senderProfileData = handleServiceResponseResult<typeof senderProfile.data>(senderProfile);
    if (!senderProfileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

    /**
     * Check if this is a phone number only transfer
     * (if it was created before the receiver had a uid)
     */
    let receiverProfile: ServiceResponse<
      AllOptionalExceptFor<BoomUser, 'uid' | 'createdAt' | 'updatedAt' | 'roles'>
    >;
    if (receiver?.uid) {
      receiverProfile = await this.profileService.getProfile(receiver.uid);
    } else if (receiver?.contact?.phoneNumber) {
      receiverProfile = await this.profileService.getProfile(receiver.contact.phoneNumber, {
        method: getProfileOptions.BY_PHONE,
      });
    } else {
      // TODO: here we don't have uid or phone number, is it ok to throw Error?? - Maybe we don't get here at any point since the controller has a validator, but TS is not aware of that
      throw new HttpErrors.NotFound(FundTransferResponseMessages.TRANSACTION_MISSING_INFO);
    }
    //TODO: here we need to use receiverProfile.data and forward the error properly using ServiceResponse not throwing error with handleServiceResponseResult
    const receiverProfileData =
      handleServiceResponseResult<typeof receiverProfile.data>(receiverProfile);

    // If the transfer was created before the receiver had a boom account we add the uid to the transfer
    // now so it is easier to look up in the future
    if (!(updatedTransaction.receiver as BoomUser)?.uid && receiverProfileData?.uid) {
      updatedTransaction.receiver = {
        ...updatedTransaction.receiver,
        uid: receiverProfileData.uid,
      };
    }

    const senderBoomAccountResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
      await this.boomAccountService.verifyExistingAccounts(senderProfileData.uid);
    if (!senderBoomAccountResponse.success || !senderBoomAccountResponse.data) {
      return {
        success: false,
        message: FundTransferResponseMessages.SENDER_BOOM_ACCOUNT_NOT_FOUND,
      };
    }

    const receiverBoomAccountResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
      await this.boomAccountService.verifyExistingAccounts(receiverProfileData?.uid || '');
    if (!receiverBoomAccountResponse.success || !receiverBoomAccountResponse.data) {
      return {
        success: false,
        message: FundTransferResponseMessages.RECEIVER_BOOM_ACCOUNT_NOT_FOUND,
      };
    }

    const senderBoomAccount: AllOptionalExceptFor<BoomAccount, '_id'> =
      senderBoomAccountResponse.data;
    const receiverBoomAccount: AllOptionalExceptFor<BoomAccount, '_id'> =
      receiverBoomAccountResponse.data;

    if (Dinero(senderBoomAccount.balance).lessThan(Dinero(transaction.amount))) {
      return { success: false, message: FundTransferResponseMessages.INSUFFICIENT_FUNDS };
    }

    const chargeSenderResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
      await this.boomAccountService.charge(senderBoomAccount._id, transaction.amount);
    if (!chargeSenderResponse.success) {
      return { success: false, message: chargeSenderResponse.message };
    }

    const addFundsToReceiverResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
      await this.boomAccountService.addFunds(receiverBoomAccount._id, transaction.amount);
    if (!addFundsToReceiverResponse.success) {
      return { success: false, message: addFundsToReceiverResponse.message };
    }

    const transactionOptions =
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined;
    await this.transactionRepository.updateById(
      transaction._id,
      updatedTransaction,
      transactionOptions
    );

    return { success: true };
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async addFunds(
    uid: string,
    amount: Money,
    nonce: string,
    createBillingDoc: boolean = true,
    options?: Options
  ): Promise<{ transaction: Transaction; billingTransaction: Transaction | null }> {
    const customerBoomAccountResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
      await this.boomAccountService.verifyExistingAccounts(uid);
    if (!customerBoomAccountResponse.success || !customerBoomAccountResponse.data) {
      throw new AppError(
        customerBoomAccountResponse.message,
        customerBoomAccountResponse.message,
        customerBoomAccountResponse.data
      );
    }
    const customerBoomAccount: AllOptionalExceptFor<BoomAccount, '_id'> =
      customerBoomAccountResponse.data;

    if (customerBoomAccount.status === BoomAccountStatus.CANCELLED) {
      throw new AppError(
        BoomAccountResponseMessages.CANCELLED,
        BoomAccountResponseMessages.CANCELLED,
        customerBoomAccountResponse.data
      );
    }

    const newBalance: Money = Dinero(customerBoomAccount.balance)
      .add(Dinero(amount))
      .toObject() as Money;

    this.logger.log(
      `Adding funds to BoomCard. Old balance: ${fromMoney(
        customerBoomAccount.balance
      )}, amount to add: ${fromMoney(amount)}, new balance: ${fromMoney(newBalance)} `
    );

    const addFundsToCustomerResponse = await this.boomAccountService.addFunds(
      customerBoomAccount._id,
      amount
    );
    if (!addFundsToCustomerResponse.success) {
      throw new AppError(
        addFundsToCustomerResponse.message,
        addFundsToCustomerResponse.message,
        customerBoomAccountResponse.data?._id
      );
    }

    this.logger.log(addFundsToCustomerResponse.message);
    this.logger.log('Creating transaction...');
    const now: number = moment().utc().unix();
    const transaction: Transaction = {
      createdAt: now,
      updatedAt: now,
      amount,
      boomAccountID: customerBoomAccount._id,
      nonce,
      type: TransactionType.FUNDING,
      status: TransactionStatus.COMPLETED,
      sender: { uid },
    } as Transaction;

    const transaction2: Transaction = {
      createdAt: now,
      updatedAt: now,
      amount,
      boomAccountID: customerBoomAccount._id,
      nonce,
      type: TransactionType.CUSTOMER_BILLING,
      status: TransactionStatus.UNPROCESSED,
      sender: { uid },
    } as Transaction;

    const result: Transaction = await this.transactionRepository.create(
      transaction,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    const result2: Transaction | null = createBillingDoc
      ? await this.transactionRepository.create(
          transaction2,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        )
      : null;

    this.logger.log('Transaction created:', result);

    if (result2) this.logger.log('Billing Transaction created:', result2);
    return { transaction: result, billingTransaction: result2 };
  }
}
