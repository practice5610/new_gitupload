import { AllOptionalExceptFor, BoomUserBasic, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { FulfillmentStatus } from '../constants';
import { InventoryItem, StoreBasic } from '../models';

@model({ name: 'inventory_leases', settings: {} })
export class InventoryLease extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date an inventory lease was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date an inventory lease was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'lastChargedAt',
    description: 'Date an inventory lease payment was last processed',
    /**
     * Not sure if this is accurate
     */
    type: 'number',
  })
  lastChargedAt: number;

  @property({
    name: 'inventoryItem',
    description: 'The inventory item the inventory lease is for',
    type: 'object',
    required: true,
  })
  inventoryItem: Partial<InventoryItem>; //this is different from globals

  @property({
    name: 'leaseAmount',
    description: 'The monetary value a merchant has to pay for their lease',
    type: 'object',
    required: true,
  })
  leaseAmount: Money;

  @property({
    name: 'leaseExpiration',
    description: 'Date the lease ends or expires',
    type: 'number',
    required: true,
  })
  leaseExpiration: number;

  @property({
    name: 'fulfillmentAmount',
    description: 'Monetary value a merchant would have to pay to satisfy a lease',
    type: 'object',
    required: true,
  })
  fulfillmentAmount: Money;

  @property({
    name: 'amountPaid',
    description: 'Monetary value of how much a merchant has paid on their lease',
    /**
     * is this calculated to date?
     */
    type: 'object',
    required: true,
  })
  amountPaid: Money;

  @property({
    name: 'merchant',
    description: 'The merchant who is responsible for the lease payments',
    type: 'object',
    required: true,
  })
  merchant: AllOptionalExceptFor<BoomUserBasic, 'uid'>; //this is different from globals

  @property({
    name: '',
    description: '',
    /**
     * This property is not listed on globals
     */
    type: 'object',
  })
  store: StoreBasic;

  @property({
    name: 'fulfillmentStatus',
    description: 'The status of the inventory lease. Whether it is fulfilled, active, or cancelled',
    type: 'string',
    required: true,
  })
  fulfillmentStatus: FulfillmentStatus;

  constructor(data?: Partial<InventoryLease>) {
    super(data);
  }
}

export interface InventoryLeaseRelations {
  // describe navigational properties here
}

export type InventoryLeaseWithRelations = InventoryLease & InventoryLeaseRelations;
