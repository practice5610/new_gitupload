import { Money } from '@boom-platform/globals';
import { Options, repository } from '@loopback/repository';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  APIResponseMessages,
  FulfillmentStatus,
  LoggingCategory,
  MerchantTransactionStatus,
  MerchantTransactionType,
} from '../constants';
import MerchantTransactionError from '../errors/merchant-transaction-error';
import { InventoryItem, InventoryLease, MerchantTransaction } from '../models';
import {
  InventoryItemRepository,
  InventoryLeaseRepository,
  MerchantTransactionRepository,
} from '../repositories';
import { APIResponse } from '../types';

export class MerchantTransactionService {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);
  constructor(
    @repository(InventoryItemRepository)
    public inventoryItemRepository: InventoryItemRepository,
    @repository(InventoryLeaseRepository)
    public inventoryLeaseRepository: InventoryLeaseRepository,
    @repository(MerchantTransactionRepository)
    public merchantTransactionRepository: MerchantTransactionRepository
  ) {}

  /**
   * Updates merchant transaction, inventorylease and inventoryItem when the Type is Return and Status Completed
   * @param {string | null} id
   * @param {MerchantTransaction | null} merchantTransaction
   * @param {Options} [options] This is a param auto-filled by the transactional decorator. It should not be passed when calling
   * this method.
   * @returns {Promise<APIResponse>}
   * @memberof MerchantTransactionService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async updateMerchantTransaction(
    id: string | null,
    merchantTransaction: MerchantTransaction | null,
    options?: Options
  ): Promise<APIResponse> {
    this.logger.info('Starting merchant transaction update request');
    try {
      if (!id || !merchantTransaction) {
        throw new MerchantTransactionError(
          'Cannot create merchant transaction without required params',
          'Request param error',
          {}
        );
      }
      const now: number = moment().utc().unix();

      if (
        merchantTransaction.type === MerchantTransactionType.RETURN &&
        merchantTransaction.status === MerchantTransactionStatus.COMPLETED
      ) {
        if (merchantTransaction.purchaseItem._id) {
          await this.inventoryItemRepository.updateById(
            merchantTransaction.purchaseItem._id,
            {
              merchant: null,
              updatedAt: now,
            } as InventoryItem,
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );
          this.logger.debug(`updated inventory item`);
        }
        if (merchantTransaction.inventoryLease && merchantTransaction.inventoryLease._id) {
          await this.inventoryLeaseRepository.updateById(
            merchantTransaction.inventoryLease._id,
            {
              fulfillmentStatus: FulfillmentStatus.CANCELLED,
            } as InventoryLease,
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );
          merchantTransaction.inventoryLease = {};
          this.logger.debug(`updated inventory Lease`);
        }
      }

      if (
        merchantTransaction.type === MerchantTransactionType.RECURRING &&
        merchantTransaction.status === MerchantTransactionStatus.COMPLETED
      ) {
        if (merchantTransaction.inventoryLease?._id) {
          const amount =
            (merchantTransaction.inventoryLease.amountPaid?.amount || 0) +
            (merchantTransaction.amount?.amount || 0);
          const amountPaid = {
            ...merchantTransaction.inventoryLease.amountPaid,
            amount,
          } as Money;
          const fulfillmentStatus =
            amount >= (merchantTransaction.inventoryLease.fulfillmentAmount?.amount || 0)
              ? FulfillmentStatus.FULFILLED
              : merchantTransaction.inventoryLease.fulfillmentStatus;

          await this.inventoryLeaseRepository.updateById(
            merchantTransaction.inventoryLease._id,
            {
              amountPaid,
              fulfillmentStatus,
            } as InventoryLease,
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );
        }
      }

      const newMerchantTransaction: MerchantTransaction = {
        ...merchantTransaction,
        updatedAt: now,
      } as MerchantTransaction;

      await this.merchantTransactionRepository.updateById(
        id,
        newMerchantTransaction,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
      this.logger.debug(`updated merchant transaction`);
      return {
        success: true,
        message: APIResponseMessages.SUCCESS_MERCHANT_TRANSACTION_PATCH,
      };
    } catch (error) {
      this.logger.error(error);

      throw new MerchantTransactionError(error.toString(), 'Db error', {});
    }
  }
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async createMerchantTransactions(
    merchantTransactions: MerchantTransaction[],
    options?: Options
  ): Promise<APIResponse> {
    try {
      await this.merchantTransactionRepository.createAll(
        merchantTransactions,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );

      this.logger.debug(`created merchant transactions count is ${merchantTransactions.length}`);
      return {
        success: true,
        message: APIResponseMessages.SUCCESS_MERCHANT_TRANSACTION_PATCH,
      };
    } catch (error) {
      this.logger.error(error);

      throw new MerchantTransactionError(error.toString(), 'Db error', {});
    }
  }
}
