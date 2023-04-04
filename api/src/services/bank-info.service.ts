import {
  APIResponse as APIResponse2,
  PlaidAuthAccountNumbers,
  PlaidAuthResult,
  PlaidIdentityResult,
  TransactionStatus,
} from '@boom-platform/globals';
import { Filter, Options, repository } from '@loopback/repository';
import { getLogger } from 'log4js';
import { IsolationLevel, transactional } from 'loopback4-spring';

import { BankAccountResponseMessages, LoggingCategory } from '../constants';
import { CustomerBilling } from '../models';
import { BankInfoRepository, CustomerBillingRepository } from '../repositories';

const plaid = require('plaid');
const plaidMode = process.env.PLAID_MODE || '';
const plaidProduct = (process.env.PLAID_PRODUCT || '').split(',');
const plaidAppName = process.env.PLAID_APP_NAME || '';
const plaidPublicKey = process.env.PLAID_PUBLIC_KEY || '';
const plaidSecretKey = process.env.PLAID_SECRET_KEY || '';
const plaidClientId = process.env.PLAID_CLIENT_ID || '';

/**
 * Bank info class using Plaid service
 */
export class BankInfoService {
  client: any;
  logger = getLogger(LoggingCategory.BANK_INFO_SERVICE);

  constructor(
    @repository(BankInfoRepository)
    public bankInfoRepository: BankInfoRepository,
    @repository(CustomerBillingRepository)
    public customerBillingRepository: CustomerBillingRepository
  ) {
    this.client = new plaid.Client(
      plaidClientId,
      plaidSecretKey,
      plaidPublicKey,
      plaid.environments.sandbox
    );
  }

  getPlaidEnvInfo(): object {
    return {
      success: true,
      env: {
        plaidMode,
        plaidProduct,
        plaidAppName,
        plaidPublicKey,
      },
    };
  }

  async getPlaidPublicToken(accessToken: string): Promise<object> {
    try {
      return await new Promise((resolve, reject) => {
        this.client.createPublicToken(accessToken, (error: any, result: any) => {
          if (error !== null) {
            return reject(error);
          }
          resolve({ success: true, publicToken: result.public_token });
        });
      });
    } catch (error) {
      return { success: false, message: error.error_message };
    }
  }

  async exchangeToken(publicToken: string): Promise<object> {
    try {
      return await new Promise((resolve, reject) => {
        this.client.exchangePublicToken(publicToken, function (error: any, tokenResponse: any) {
          if (error !== null) {
            return reject(error);
          }
          const data = {
            accessToken: tokenResponse.access_token,
            itemId: tokenResponse.item_id,
          };
          resolve(data);
        });
      });
    } catch (error) {
      return { success: false, message: error.error_message };
    }
  }

  async getPlaidBalance(accessToken: string): Promise<object> {
    try {
      return await new Promise((resolve, reject) => {
        this.client.getBalance(accessToken, (error: any, result: any) => {
          if (error !== null) {
            return reject(error); // TODO: to improve the test maybe these errors can be hardcoded on the constants file
          }
          const accounts = result.accounts;
          return resolve({ success: true, accounts });
        });
      });
    } catch (error) {
      return { success: false, message: error.error_message, error_code: error.error_code };
    }
  }

  async getAuth(accessToken: string): Promise<APIResponse2<PlaidAuthResult>> {
    try {
      return await new Promise((resolve, reject) => {
        this.client.getAuth(accessToken, {}, (err: any, results: any) => {
          if (err) {
            if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
              this.logger.warn(err.error_message);
            } else {
              this.logger.error(err.error_message);
            }
            return reject(err);
          }

          const accountNumbers: PlaidAuthAccountNumbers = {} as PlaidAuthAccountNumbers;

          if (results.numbers.ach.length > 0) {
            // Handle ACH numbers (US accounts)
            accountNumbers.achNumbers = results.numbers.ach;
          }
          if (results.numbers.eft.length > 0) {
            // Handle EFT numbers (Canadian accounts)
            accountNumbers.eftNumbers = results.numbers.eft;
          }
          if (results.numbers.international.length > 0) {
            // Handle International numbers (Standard International accounts)
            accountNumbers.internationalNumbers = results.numbers.international;
          }
          if (results.numbers.bacs.length > 0) {
            // Handle BACS numbers (British accounts)
            accountNumbers.bacsNumbers = results.numbers.bacs;
          }

          return resolve({
            success: true,
            message: 'Success',
            data: {
              numbers: accountNumbers,
              accounts: results.accounts,
            },
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        message: error.error_message,
        data: error,
      };
    }
  }

  async getIdentity(accessToken: string): Promise<APIResponse2<PlaidIdentityResult>> {
    try {
      return await new Promise((resolve, reject) => {
        this.client.getIdentity(accessToken, (err: any, results: any) => {
          if (err) {
            return reject(err);
          }
          return resolve({
            success: true,
            message: 'Success',
            data: results,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        message: error.error_message,
        data: error,
      };
    }
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async deleteAccounts(
    accounts: { plaidID: string; userID: string }[],
    options?: Options
  ): Promise<void> {
    try {
      for (const account of accounts) {
        const filter = {
          where: {
            plaidAccountId: account.plaidID,
            or: [
              { 'transaction.status': TransactionStatus.UNPROCESSED },
              { 'transaction.status': TransactionStatus.PENDING },
            ],
          },
        } as Filter<CustomerBilling>;
        const pendingBillings = await this.customerBillingRepository.find(filter);

        if (pendingBillings.length) {
          throw new Error(BankAccountResponseMessages.BANK_DELETE_BLOCKED);
        }

        const foundAccount = await this.bankInfoRepository.find({
          where: { plaidID: account.plaidID, userID: account.userID },
        });
        for (const acc of foundAccount) {
          await this.bankInfoRepository.delete(
            acc,
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );
        }
      }
    } catch (err) {
      this.logger.error(err);
      throw new Error(err.message);
    }
  }
}
