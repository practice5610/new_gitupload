import { AllOptionalExceptFor, BoomUserBasic, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { InventoryOrderBillingType, InventoryOrderStatus, InventoryOrderType } from '../constants';
import { InventoryItem, Store } from '../models';

@model({ name: 'inventory_orders', settings: {} })
export class InventoryOrder extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'Date the inventory order is made',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date the inventory order is updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'item',
    description: 'The inventory item that is being ordered in the inventory order',
    type: 'object',
  })
  item: InventoryItem;

  @property({
    name: 'status',
    description:
      'The status of the inventory order. Whether it is pending, shipped, closed, or cancelled',
    /**
     * Should there also be a delivered status? Or complete? Something to show the order was successful
     */
    type: 'string',
    jsonSchema: {
      enum: Object.values(InventoryOrderStatus),
    },
  })
  status: InventoryOrderStatus;

  @property({
    name: 'billingType',
    description:
      'The way the billing is handled for the inventory order. Whether it will be a recurring billing type or a one-time payment',
    type: 'string',
    jsonSchema: {
      enum: Object.values(InventoryOrderBillingType),
    },
  })
  billingType: InventoryOrderBillingType;

  @property({
    name: 'orderType',
    description:
      'The type of inventory order being placed. Whether it is a purchase, return, or cancelled order. For return orders, there is the return-defective option for orders that are returned due to the items being defective and the return-other category for all other returns',
    type: 'string',
    jsonSchema: {
      enum: Object.values(InventoryOrderType),
    },
  })
  orderType: InventoryOrderType;

  @property({
    name: 'amount',
    description: 'The cost of the inventory order',
    type: 'object',
  })
  amount?: Money;

  @property({
    name: 'merchant',
    description: 'The merchant that is placing the inventory order',
    type: 'object',
  })
  merchant: AllOptionalExceptFor<BoomUserBasic, 'uid'>;

  @property({
    name: 'store',
    description: 'The store in which the inventory order is being delivered to',
    /**
     * Is this correct?
     */
    type: 'object',
  })
  store?: Partial<Store>; //This is different from globals

  @property({
    name: 'notes',
    description:
      'Any miscellaneous information regarding the order that the Boom Admin feels is worth noting',
    type: 'string',
  })
  notes?: string;

  constructor(data?: Partial<InventoryOrder>) {
    super(data);
  }
}

export interface InventoryOrderRelations {
  // describe navigational properties here
}

export type InventoryOrderWithRelations = InventoryOrder & InventoryOrderRelations;
