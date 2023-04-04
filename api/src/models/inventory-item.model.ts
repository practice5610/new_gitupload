import { InventoryItemInactiveReason, InventoryItemStatus } from '@boom-platform/globals';
import { AllOptionalExceptFor, BoomUserBasic, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { Store } from './store.model';

/**
 * Aren't the types of each property supposed to match what is set in globals?
 */

@model({ name: 'inventory_items', settings: {} })
export class InventoryItem extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date a particular inventory item was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date a particular inventory item was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'friendlyID',
    description: 'A unique but shorter ID to make for a better user experience',
    type: 'string',
  })
  friendlyID: string;

  @property({
    name: 'itemID',
    description: 'A unique ID generated for each inventory item',
    type: 'string',
  })
  itemID?: string;

  @property({
    name: 'itemType',
    description: 'The type of item the new inventory item may be',
    /**
     * (i.e. an updated table that would fall under the tablet type?)
     */
    type: 'string',
  })
  itemType: string;

  @property({
    name: 'itemName',
    description: 'The unique name or title of an inventory item',
    type: 'string',
  })
  itemName: string;

  @property({
    name: 'nickname',
    description: 'A uniquie name or title of an inventory item usually created by a merchant',
    /**
     * Is this right? Admins don't create nicknames right? Just merchants?
     */
    type: 'string',
  })
  nickname?: string;

  @property({
    name: 'merchant',
    description: '',
    /**
     * Why is merchant here? Boom Admins create inventory items for merchants to lease/purchase...
     * would this be a list of each merchant that leases/purchases each item?
     */
    type: 'object',
  })
  merchant?: AllOptionalExceptFor<BoomUserBasic, 'uid'> | null;

  @property({
    name: 'store',
    description: '',
    /**
     * Why is store here? Boom Admins create inventory items for merchants to lease/purchase...
     * would this be a list of each store that has each item?
     */
    type: 'object',
  })
  store?: Partial<Store>; //According to globals, this should be StoreBasic not Partial<Store>. But also, StoreBasic does not have much in terms of info

  @property({
    name: 'status',
    description: 'The status of the inventory item. Whether it is active or inactive',
    /**
     * What is inactive issued and is it ever used?
     */
    type: 'string',
    jsonSchema: {
      enum: Object.values(InventoryItemStatus),
    },
  })
  status: InventoryItemStatus;

  @property({
    name: 'purchasePrice',
    description: 'The price of the inventory item',
    type: 'object',
  })
  purchasePrice: Money;

  @property({
    name: 'inactiveReason',
    description: 'The reason behind why an item has been set to inactive',
    type: 'string',
    jsonSchema: {
      enum: Object.values(InventoryItemInactiveReason),
    },
  })
  inactiveReason?: InventoryItemInactiveReason;

  @property({
    name: 'count',
    description: '',
    /**
     * This field is not listed on globals. I am not sure what it does
     */
    type: 'number',
    jsonSchema: {
      minimum: 1,
    },
  })
  count: number;

  constructor(data?: Partial<InventoryItem>) {
    super(data);
  }
}

export interface InventoryItemRelations {
  // describe navigational properties here
}

export type InventoryItemWithRelations = InventoryItem & InventoryItemRelations;
