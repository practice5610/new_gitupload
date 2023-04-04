import {
  AllOptionalExceptFor,
  APIResponse,
  BoomAccountStatus,
  BoomUser,
  dineroToMoney,
  isBoomUser,
  isStore,
  Money,
  Store,
  toMoney,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { Filter, FilterBuilder, Options, repository } from '@loopback/repository';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  APIResponseMessages,
  BoomAccountResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
} from '../constants';
import { BoomAccount, Transaction } from '../models';
import { BoomAccountRepository, TransactionRepository } from '../repositories';
import { ServiceResponse } from '../types/service';
import { senderHasUID } from '../types/transactions';
import { ProfileService } from './profile.service';

export class BoomAccountService {
  logger: Logger = getLogger(LoggingCategory.BOOM_ACCOUNT_SERVICE);
  constructor(
    @repository(BoomAccountRepository)
    private boomAccountRepository: BoomAccountRepository,
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository,
    @service(ProfileService)
    private profileServices: ProfileService
  ) {}

  /**
   * Since the Boom Account is not created when new user is created, we need to verify that User can have only 1 boom account at time.
   * @param {string} customerID User UID for verification
   * @returns {Promise<APIResponse<BoomAccount>>} { success: boolean, message: string, data?: BoomAccount, error?: Error}
   * @memberof BoomAccountService
   */
  public async verifyExistingAccounts(customerID: string): Promise<APIResponse<BoomAccount>> {
    const filterBuilder: FilterBuilder = new FilterBuilder();
    const filter: Filter<BoomAccount> = filterBuilder
      .where({ customerID: customerID })
      .build() as Filter<BoomAccount>;
    const existingAccount: BoomAccount[] = await this.boomAccountRepository.find(filter);
    // If no existing account or existing more than one should return false.
    if (!existingAccount?.length) {
      return {
        success: false,
        message: !existingAccount.length
          ? BoomAccountResponseMessages.NOT_FOUND
          : BoomAccountResponseMessages.MORE_THAN_ONE_ACCOUNT,
      };
    }
    // Otherwise there is one account and should return true, and given back the existing boomAccount
    return {
      success: true,
      message: `Success`,
      data: existingAccount[0] as BoomAccount,
    };
  }

  /**
   * This method handle charge amount to a customer from his boom account. If cashback it add cashback to the account in same process.
   * @param {string} boomAccountID Boom Account Mongo ID to charge
   * @param {Money} amount Amount to charge
   * @param {Money} cashback Optional cashback amount to add after charge
   * @returns {Promise<APIResponse<BoomAccount>>} { success: boolean, message: string, data?: T, error?: Error}
   * @memberof BoomAccountService
   */
  public async charge(
    boomAccountID: string,
    amount: Money,
    cashback?: Money
  ): Promise<APIResponse<BoomAccount>> {
    const oldStateAccount: BoomAccount = await this.boomAccountRepository.findById(boomAccountID);
    // If not existing, account.
    if (!oldStateAccount) {
      return {
        success: false,
        message: BoomAccountResponseMessages.NOT_FOUND,
      };
    }
    // Otherwise there is an account and we validate if the account is lower than the amount.
    if (Dinero(oldStateAccount.balance).lessThan(Dinero(amount))) {
      return {
        success: false,
        message: BoomAccountResponseMessages.NOT_FUNDS,
      };
    }
    // At this point there is an account with enough funds, we proceed to subtact the amount from the account.
    let newBalance: Dinero.Dinero = Dinero(oldStateAccount.balance).subtract(Dinero(amount));
    // If there is any cashback we also add to the account.
    if (cashback) {
      newBalance = newBalance.add(Dinero(cashback));
    }
    // We build the new BoomAccount state to update it.
    const newStateAccount: BoomAccount = {
      ...oldStateAccount,
      updatedAt: moment().utc().unix(),
      balance: dineroToMoney(newBalance),
    } as BoomAccount;
    // We call the updateById method which ALLOW_TRANSACTIONAL_FEATURE.
    const response = await this.updateById(newStateAccount._id, newStateAccount);
    // and return the same final response if update success or not.
    return response;
  }

  /**
   * This method handle add funds to a customer to his boom account.
   * @param {string} boomAccountID Boom Account Mongo ID to charge
   * @param {Money} amount Amount to add
   * @returns {Promise<APIResponse<BoomAccount>>} { success: boolean, message: string, data?: T, error?: Error}
   * @memberof BoomAccountService
   */
  public async addFunds(boomAccountID: string, amount: Money): Promise<APIResponse<BoomAccount>> {
    // Query the boom Account by ID
    const oldStateAccount: BoomAccount = await this.boomAccountRepository.findById(boomAccountID);
    // If not existing BoomAccount return false.
    if (!oldStateAccount) {
      return {
        success: false,
        message: BoomAccountResponseMessages.NOT_FOUND,
      };
    }
    // Add the Amount to the boom account.
    const newBalance: Dinero.Dinero = Dinero(oldStateAccount.balance).add(Dinero(amount));
    // Build the new boom account state.
    const newStateAccount: BoomAccount = {
      ...oldStateAccount,
      updatedAt: moment().utc().unix(),
      balance: dineroToMoney(newBalance),
    } as BoomAccount;
    // Call updateById method with the new boom account state. which ALLOW_TRANSACTIONAL_FEATURE.
    const response = await this.updateById(newStateAccount._id, newStateAccount);
    // and return the same final response if update success or not.
    return response;
  }
  /**
   * Boom Account Creation Method.
   * @param {string} customerID User UID issues to create a new Boom Account.
   * @param {Money} amount Amount to add
   * @returns {Promise<APIResponse<BoomAccount>>} { success: boolean, message: string, data?: T, error?: Error}
   * @memberof BoomAccountService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async create(customerID: string, options?: Options): Promise<APIResponse<BoomAccount>> {
    const verificationResponse: APIResponse<BoomAccount> = await this.verifyExistingAccounts(
      customerID
    );
    //Verify if customer have an existing account. If true return that account.
    if (verificationResponse.success) {
      return {
        success: true,
        message: BoomAccountResponseMessages.ALREADY_HAVE_ACCOUNT,
        data: verificationResponse.data,
      };
    }

    //Call Create Method to Boom Account creation. Which is Transactional.
    const brandNewBoomAccount: BoomAccount = await this.boomAccountRepository.create(
      {
        updatedAt: moment().utc().unix(),
        createdAt: moment().utc().unix(),
        status: BoomAccountStatus.ACTIVE,
        balance: toMoney(0),
        customerID: customerID,
      },
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    //On success FireStore User Profile will be updated with data related to new boom account _id
    const profileUpdates: AllOptionalExceptFor<BoomUser, 'updatedAt' | 'boomAccounts'> = {
      updatedAt: moment().utc().unix(),
      boomAccounts: [brandNewBoomAccount._id.toString()],
    };

    await this.profileServices.updateProfileById(customerID, profileUpdates);

    //All success
    return {
      success: true,
      message: BoomAccountResponseMessages.CREATE_SUCCESS,
      data: brandNewBoomAccount,
    };
  }
  /**
   * Boom Account updateById Method.
   * @param {string} boomAccountID Boom Account MongoID.
   * @param {BoomAccount} newBoomAccount New Boom Account state to be updated.
   * @param {Options} options Optional.
   * @returns {Promise<APIResponse<BoomAccount>>} { success: boolean, message: string, data?: T, error?: Error}.
   * @memberof BoomAccountService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async updateById(
    boomAccountID: string,
    newBoomAccount: BoomAccount,
    options?: Options
  ): Promise<APIResponse<BoomAccount>> {
    await this.boomAccountRepository.updateById(
      boomAccountID,
      newBoomAccount,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    return {
      success: true,
      message: BoomAccountResponseMessages.UPDATE_SUCCESS,
    };
  }

  async pendingBalance(uid: string): Promise<ServiceResponse<Money>> {
    try {
      const transfersPending: Transaction[] = await this.transactionRepository.find({
        where: {
          and: [
            // { sender: { eq: { uid: uid } } },  // REMINDER: This should be used to properly query if Store is no longer used as Transaction.sender type.
            { type: { eq: TransactionType.TRANSFER } },
            { status: { eq: TransactionStatus.PENDING } },
          ],
        },
      });

      let pendingBalance: Money = toMoney(0);
      transfersPending.forEach((transfer: Transaction) => {
        if (senderHasUID(transfer.sender)) {
          if (transfer.sender.uid === uid) {
            pendingBalance = toMoney(Dinero(pendingBalance).add(Dinero(transfer.amount)).toUnit());
          }
        }
      });

      return {
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        message: APIResponseMessages.SUCCESS,
        data: pendingBalance,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
