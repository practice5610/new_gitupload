import { AddressInfo } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';
import moment from 'moment';

import { OrderGroup } from '../types/shipping';
import { Transaction } from './transaction.model';

@model({ name: 'orders', settings: {} })
export class Order extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createAt',
    description: 'Instance creation date in Unix Epoch Time',
    type: 'number',
    default: moment().utc().unix(),
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'The date an order was updated',
    type: 'number',
    required: false,
  })
  updatedAt: number;

  @property({
    name: 'orderGroups',
    description: 'Bookings group by shipping parcel',
    type: 'array',
    itemType: 'object',
    required: true,
  })
  orderGroups: OrderGroup[];

  @property({
    name: 'shipToAddressId',
    description: 'Delivery shipping address ID selected by user.',
    type: 'object',
    required: true,
  })
  shipToAddress: AddressInfo;

  @property({
    name: 'customerUID',
    description: 'Customer ID who order belong to.',
    type: 'string',
    required: true,
  })
  customerUID: string;

  @property({
    name: 'transactions',
    description: 'Transactions list, generated from this order.',
    type: 'array',
    itemType: 'object',
  })
  transactions?: Transaction[];

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
