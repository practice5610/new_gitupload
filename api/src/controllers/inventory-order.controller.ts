import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Count, Filter, repository, Where } from '@loopback/repository';
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
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { InventoryOrder } from '../models';
import { InventoryOrderRepository } from '../repositories';
import { InventoryOrderService } from '../services';
import { GETInventoryOrderCountSpecification } from '../specifications/inventory-order-specification';
import { InventoryOrderResult } from '../types';

export class IventoryOrderController {
  logger: Logger = getLogger(LoggingCategory.ORDER_CONTROLLER);
  constructor(
    @repository(InventoryOrderRepository)
    public inventoryOrderRepository: InventoryOrderRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(InventoryOrderService)
    public inventoryOrderService: InventoryOrderService
  ) {}

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/inventory-orders', {
    responses: {
      '200': {
        description: 'Inventory Order model instances',
        content: { 'application/json': { schema: { 'x-ts-type': InventoryOrder } } },
      },
    },
  })
  async create(@requestBody() inventoryOrders: InventoryOrder[]): Promise<void | Response> {
    try {
      const result: InventoryOrderResult = await this.inventoryOrderService.createInventoryOrders(
        inventoryOrders
      );

      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      return this.response.status(500).send({ success: false, message: error });
    }
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/inventory-orders/count', GETInventoryOrderCountSpecification)
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(InventoryOrder))
    where?: Where<InventoryOrder>
  ): Promise<Response<Count>> {
    try {
      const inventory_count: Count = await this.inventoryOrderRepository.count(where);
      console.log('inventory_count', inventory_count);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(inventory_count);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/inventory-orders/{id}', {
    responses: {
      '204': {
        description: 'Inventory Order PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() body: Partial<InventoryOrder>
  ): Promise<void | Response> {
    try {
      await this.inventoryOrderService.updateInventoryOrders([{ _id: id, ...body }]);
    } catch (error) {
      let publicMessage = 'Server error. Try again.';
      if (error.name === 'OrderError') {
        publicMessage = error.publicMessage;
      }
      return this.response.status(500).send({ success: false, message: publicMessage });
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/inventory-orders', {
    responses: {
      '204': {
        description: 'Bulk Inventory Order PATCH success',
      },
    },
  })
  async updateList(@requestBody() list: Partial<InventoryOrder>[]): Promise<void | Response> {
    try {
      await this.inventoryOrderService.updateInventoryOrders(list);
    } catch (error) {
      let publicMessage = 'Server error. Try again.';
      if (error.name === 'OrderError') {
        publicMessage = error.publicMessage;
      }
      return this.response.status(500).send({ success: false, message: publicMessage });
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/inventory-orders', {
    responses: {
      '200': {
        description: 'Inventory Order model instances',
        content: { 'application/json': { schema: { 'x-ts-type': InventoryOrder } } },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(InventoryOrder))
    filter?: Filter<InventoryOrder>
  ): Promise<InventoryOrder[]> {
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

    if (isMerchant) {
      filter = {
        // use filter[skip] & filter[limit] for pagination
        ...filter,
        where: {
          and: [{ ...filter?.where }, { 'merchant.uid': currentUser.uid }],
        },
      } as Filter<InventoryOrder>;
    }

    return this.inventoryOrderRepository.find(filter);
  }
}
