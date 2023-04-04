import { APIResponse } from '@boom-platform/globals';
import { BindingScope, injectable } from '@loopback/core';
import {
  Count,
  Filter,
  FilterExcludingWhere,
  Options,
  repository,
  Where,
} from '@loopback/repository';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, transactional } from 'loopback4-spring';

import {
  APIResponseMessages,
  LoggingCategory,
  LoopbackErrorCodes,
  OrderResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { Order } from '../models';
import { OrderRepository } from '../repositories/order.repository';
import { ServiceResponse } from '../types/service';
import { APIResponseFalseOutput } from '../utils';

@injectable({ scope: BindingScope.TRANSIENT })
export class OrderService {
  logger: Logger = getLogger(LoggingCategory.ORDER_SERVICE);
  constructor(
    @repository(OrderRepository)
    public orderRepository: OrderRepository
  ) {}

  //TODO: Update this method once purchase.service get updated to use handlerServiceResponse
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async create(order: Order, options?: Options): Promise<APIResponse<Order>> {
    try {
      console.log('checkdborder1255', order);
      // const neworder = order?.transactions?.map((x) => {
      //   x.updatedAt = 1678676809;
      // });
      // console.log('neworder', neworder);
      // const neworder2 = { ...order, transactions: neworder };
      // console.log('neworder2', neworder2);
      //  order?.transactions&& order?.transactions[0].updatedAt = 1678676809;
      //  order?.transactions&&order?.transactions[1].updatedAt = 1678676809;
      //   console.log('checkdborder12', order.transactions);

      const response = await this.orderRepository
        .create(order)
        .then((response) => {
          console.log('checkordercreat', response);
          return response;
        })
        .catch((error) => {
          console.log('errorddd', error);
        });

      if (!response) return APIResponseFalseOutput('error creating order instance.');
      return {
        success: true,
        message: 'Order instance created successful.',
      };
    } catch (error) {
      this.logger.error(error);
      return APIResponseFalseOutput('db error.');
    }
  }

  async countOrders(where: Where<Order> | undefined): Promise<ServiceResponse<Count>> {
    try {
      const counter: Count = await this.orderRepository.count(where);
      return {
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        message: APIResponseMessages.SUCCESS,
        data: counter,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
          privateMessage: error.details,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async findOrders(filter: Filter<Order>): Promise<ServiceResponse<Order[]>> {
    try {
      console.log('orderfiltere', filter);
      const orders: Order[] = await this.orderRepository
        .find(filter)
        .then((result) => {
          console.log('orderchek', result);
          return result;
        })
        .catch((err) => {
          console.log('orderchekerre', err);
          return err;
        });
      console.log('checkorder', orders);
      if (orders.length) {
        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          message: APIResponseMessages.SUCCESS,
          data: orders,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
        message: APIResponseMessages.RECORD_NOT_FOUND,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
          privateMessage: error.details,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async findOrderById(
    id: string,
    filter: FilterExcludingWhere<Order> | undefined
  ): Promise<ServiceResponse<Order>> {
    try {
      const orders: Order = await this.orderRepository.findById(id, filter);
      if (orders) {
        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          message: APIResponseMessages.SUCCESS,
          data: orders,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
        message: APIResponseMessages.RECORD_NOT_FOUND,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) {
        return {
          success: false,
          statusCode:
            error.code === LoopbackErrorCodes.RECORD_NOT_FOUND
              ? ServiceResponseCodes.RECORD_NOT_FOUND
              : error.statusCode,
          message: error.message,
          privateMessage: error.details,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async updateOrderById(id: string, order: Order): Promise<ServiceResponse<Order>> {
    try {
      await this.orderRepository.updateById(id, order);
      return {
        success: true,
        statusCode: ServiceResponseCodes.NO_CONTENT,
        message: APIResponseMessages.SUCCESS,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) {
        return {
          success: false,
          statusCode:
            error.code === LoopbackErrorCodes.RECORD_NOT_FOUND
              ? ServiceResponseCodes.RECORD_NOT_FOUND
              : error.statusCode,
          message:
            error.code === LoopbackErrorCodes.RECORD_NOT_FOUND
              ? OrderResponseMessages.NOT_FOUND
              : error.message,
          privateMessage: error.details,
        };
      }
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
