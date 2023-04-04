import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Count, Filter, FilterBuilder, FilterExcludingWhere, Where } from '@loopback/repository';
import {
  get,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  LoggingCategory,
  OrderResponseMessages,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { Order } from '../models';
import { OrderService } from '../services';
import {
  GETOrdersByIdSpecification,
  GETOrdersCountSpecification,
  GETOrdersSpecification,
  PATCHOrdersByIdSpecification,
} from '../specifications';
import { PATCHORdersByIdRequestBody } from '../specifications/examples/requestBody/order-specifications-requestBody';
import { handleServiceResponseResult } from '../utils/service-response-helpers';

export class OrderController {
  logger: Logger = getLogger(LoggingCategory.ORDER_CONTROLLER);
  constructor(
    @service(OrderService)
    public orderService: OrderService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/orders/count', GETOrdersCountSpecification)
  async count(@param.where(Order) where?: Where<Order>): Promise<Response<Count>> {
    try {
      console.log('workingwithid555');
      const data: Count | undefined = handleServiceResponseResult<Count>(
        await this.orderService.countOrders(where)
      );
      if (data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: data,
        });
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/orders', GETOrdersSpecification)
  async find(@param.filter(Order) incomingFilter?: Filter<Order>): Promise<Response<Order[]>> {
    try {
      console.log('workingwithid121');
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.NO_PROFILE_FOUND);

      const filterBuilder: FilterBuilder<Order> = new FilterBuilder<Order>(incomingFilter);
      if (currentUser.roles.includes(RoleKey.Member)) {
        filterBuilder.impose({ where: { customerUID: currentUser.uid } });
      }
      const filter: Filter<Order> = filterBuilder.build();

      const orders: Order[] | undefined = handleServiceResponseResult<Order[]>(
        await this.orderService.findOrders(filter)
      );
      if (!orders) throw new HttpErrors.NotFound(OrderResponseMessages.NOT_FOUND);

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: orders,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/orders/{id}', GETOrdersByIdSpecification)
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Order, { exclude: 'where' }) filter?: FilterExcludingWhere<Order>
  ): Promise<Response<Order>> {
    console.log('workingwithid');
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.NO_PROFILE_FOUND);

      const order: Order | undefined = handleServiceResponseResult<Order>(
        await this.orderService.findOrderById(id, filter)
      );
      if (!order) throw new HttpErrors.NotFound(OrderResponseMessages.NOT_FOUND);

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: order,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.SuperAdmin])
  @patch('/orders/{id}', PATCHOrdersByIdSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHORdersByIdRequestBody)
    order: Order
  ): Promise<Response<void>> {
    try {
      handleServiceResponseResult(await this.orderService.updateOrderById(id, order));
      return this.response.status(ServiceResponseCodes.NO_CONTENT).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
