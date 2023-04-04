import { RoleKey } from '@boom-platform/globals';
import { InventoryItemInactiveReason, InventoryItemStatus } from '@boom-platform/globals';
import { inject, service } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import moment from 'moment';

import { authorize } from '../authorization';
import { InventoryLeaseResponseMessages } from '../constants';
import { InventoryItem, InventoryLease } from '../models';
import { InventoryItemRepository, InventoryLeaseRepository } from '../repositories';
import { LeaseService } from '../services';

export class InventoryLeasesController {
  constructor(
    @repository(InventoryLeaseRepository)
    public inventoryLeaseRepository: InventoryLeaseRepository,
    @repository(InventoryItemRepository)
    public inventoryItemRepository: InventoryItemRepository,
    @service(LeaseService)
    public leaseService: LeaseService,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  /**
   * Gets a list of all inventory leases
   * @param filter filters the leases to return
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/inventory-leases', {
    responses: {
      '200': {
        description: 'Inventory Lease Data',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Object } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(InventoryLease))
    filter?: Filter<InventoryLease>
  ): Promise<object> {
    return this.inventoryLeaseRepository.find(filter);
  }

  /**
   * Updates the Inventory Leases fuilfilment state
   * @param leases
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/inventory-leases', {
    responses: {
      '200': {
        description: 'Bulk Inventory Lease PATCH success',
        content: { 'application/json': { schema: Object } },
      },
    },
  })
  async updateLeases(@requestBody() leases: any[]): Promise<object> {
    try {
      for (const lease of leases) {
        const inventoryLease = await this.inventoryLeaseRepository.findById(lease._id);
        inventoryLease.fulfillmentStatus = lease.fulfillmentStatus;
        inventoryLease.updatedAt = moment().utc().unix();

        await this.inventoryLeaseRepository.updateById(lease._id, inventoryLease);
      }
      return this.response.json({ success: true });
    } catch (err) {
      return this.response.json({ success: false, message: err.message });
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/inventory-leases/replace', {
    responses: {
      '200': {
        description: 'Inventory Lease Replacement',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Object } },
          },
        },
      },
    },
  })
  async replace(
    @requestBody() body: { item: InventoryLease; reason: InventoryItemInactiveReason }
  ): Promise<object> {
    try {
      /* 
        This first line of this filter should be:
        _id: { neq: body.item.inventoryItem._id },
        but neq won't work. We are using nin (not-in)
        and putting the id in an array as a workaround
       */
      const replacement = await this.inventoryItemRepository.findOne({
        where: {
          _id: { nin: [body.item.inventoryItem._id as string] },
          itemType: body.item.inventoryItem.itemType,
          status: InventoryItemStatus.INACTIVE,
          inactiveReason: InventoryItemInactiveReason.NOT_ISSUED,
        },
      });

      if (!replacement) {
        return this.response.json({
          success: false,
          message: InventoryLeaseResponseMessages.REPLACEMENT_INVENTORY_NOT_FOUND,
        });
      }

      const oldItem: InventoryItem = body.item.inventoryItem as InventoryItem;
      oldItem.status = InventoryItemStatus.INACTIVE;
      oldItem.inactiveReason = body.reason;
      oldItem.updatedAt = moment().utc().unix();

      const newLease: InventoryLease = {
        ...body.item,
        updatedAt: moment().utc().unix(),
        inventoryItem: {
          ...replacement,
          updatedAt: moment().utc().unix(),
          status: InventoryItemStatus.INACTIVE_ISSUED,
          inactiveReason: undefined,
        },
        getId: body.item.getId,
        getIdObject: body.item.getIdObject,
        toJSON: body.item.toJSON,
        toObject: body.item.toObject,
      };

      await this.leaseService.swapItems(oldItem, newLease.inventoryItem as InventoryItem, newLease);
    } catch (err) {
      return this.response.json({ success: false, message: err.message });
    }
    return this.response.json({
      success: true,
      message: InventoryLeaseResponseMessages.REPLACEMENT_INVENTORY_FOUND,
    });
  }
}
