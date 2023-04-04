import { Filter, Options, repository } from '@loopback/repository';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  InventoryItemStatus,
  InventoryOrderBillingType,
  InventoryOrderStatus,
  LoggingCategory,
  MerchantTransactionStatus,
  MerchantTransactionType,
  OrderResponseMessages,
} from '../constants';
import OrderError from '../errors/order-error';
import { InventoryOrder, MerchantTransaction } from '../models';
import {
  InventoryItemRepository,
  InventoryOrderRepository,
  MerchantTransactionRepository,
} from '../repositories';
import { InventoryOrderResult } from '../types';

export class InventoryOrderService {
  logger: Logger = getLogger(LoggingCategory.INVENTORY_ORDERS);
  constructor(
    @repository(InventoryOrderRepository)
    public inventoryOrderRepository: InventoryOrderRepository,
    @repository(MerchantTransactionRepository)
    public merchantTransactionRepository: MerchantTransactionRepository,
    @repository(InventoryItemRepository)
    public inventoryItemRepository: InventoryItemRepository
  ) {}

  /**
   * Creates inventory orders and merchant transactions,
   * so when an inventory item is ordered, a record of an inventory order and a merchant transaction with 'pending' status is created
   * @param {(BoomUserBasic | null)} merchant A merchant orders inventory items
   * @param {(InventoryOrder[] | null)} orders orders contain order information
   * @param {Options} [options] This is a param auto-filled by the transactional decorator. It should not be passed when calling this method.
   * @returns {Promise<InventoryOrderResult>}
   * @memberof InventoryOrderService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async createInventoryOrders(
    orders: InventoryOrder[] | null,
    options?: Options
  ): Promise<InventoryOrderResult> {
    this.logger.info('Starting inventory orders create request');
    console.log('orderdetails', orders);

    try {
      if (!orders || orders.length === 0) {
        throw new OrderError(
          'Cannot create inventory order without required params',
          'Request param error',
          {}
        );
      }

      const inventoryOrders: InventoryOrder[] = [];
      const merchantTransactions: MerchantTransaction[] = [];

      const now: number = moment().utc().unix();

      // prepare inventory order & merchant transaction records
      for (const order of orders) {
        const inventoryOrder: InventoryOrder = {
          ...order,
          createdAt: now,
          updatedAt: now,
          status: InventoryOrderStatus.PENDING,
        } as InventoryOrder;

        inventoryOrders.push(inventoryOrder);
        const merchantTransactionType: MerchantTransactionType =
          order.billingType === InventoryOrderBillingType.ONE_TIME
            ? MerchantTransactionType.ONE_TIME
            : MerchantTransactionType.RECURRING;
        const merchantTransaction: MerchantTransaction = {
          createdAt: now,
          updatedAt: now,
          status: MerchantTransactionStatus.PENDING,
          type: merchantTransactionType,
          amount: order.amount,
          merchant: order.merchant,
          store: order.store,
          purchaseItem: order.item,
        } as MerchantTransaction;

        merchantTransactions.push(merchantTransaction);
      }
      console.log('checkorder1', inventoryOrders);
      const checkk = await this.inventoryItemRepository
        .find()
        .then((result) => {
          console.log('getresult11', result);
        })
        .catch((err) => {
          console.log('error121', err);
        });
      console.log('result111121', checkk);

      // create inventory order & merchant transaction records
      const createdInventoryOrders = await this.inventoryOrderRepository
        .createAll(
          inventoryOrders,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        )
        .then((result) => {
          console.log('result22', result);
          return result;
        })
        .catch((err) => {
          console.log('err22', err);
          return err;
        });

      this.logger.debug(`created inventory orders count is ${createdInventoryOrders.length}`);

      const createdMerchantTransactions = await this.merchantTransactionRepository.createAll(
        merchantTransactions,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
      this.logger.debug(
        `created merchant transactions count is ${createdMerchantTransactions.length}`
      );

      return {
        success: true,
        message: OrderResponseMessages.SUCCESS,
        inventoryOrders: createdInventoryOrders,
        merchantTransactions: createdMerchantTransactions,
      };
    } catch (error) {
      this.logger.error(error);

      throw new OrderError(error.toString(), 'Db error', {});
    }
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async updateInventoryOrders(orders: Partial<InventoryOrder>[]): Promise<void> {
    // TODO: Seems like this function is not using the transactional features correctly, missing options
    try {
      for (const order of orders) {
        let extraData = {};
        // consider boom card activation only when order request is CLOSED
        if (order.status === InventoryOrderStatus.CLOSED) {
          const inventoryOrder: InventoryOrder | null = await this.inventoryOrderRepository.findOne(
            {
              where: {
                _id: order._id,
                'item.itemType': 'Boom cards',
                'item.status': { ne: InventoryItemStatus.ACTIVE },
                status: { ne: InventoryOrderStatus.CLOSED },
              },
            } as Filter<InventoryOrder>
          );
          if (inventoryOrder) {
            extraData = {
              item: {
                ...inventoryOrder.item,
                status: InventoryItemStatus.ACTIVE,
              },
            };
            // make inventory_item status = ACTIVE
            await this.inventoryItemRepository.updateById(inventoryOrder.item._id, {
              status: InventoryItemStatus.ACTIVE,
              updatedAt: moment().utc().unix(),
            });
          }
        }

        await this.inventoryOrderRepository.updateById(order._id, {
          ...order,
          ...extraData,
          updatedAt: moment().utc().unix(),
        });
      }
    } catch (error) {
      this.logger.error(error);
      throw new OrderError(error.toString(), 'Db error', {});
    }
  }
}
