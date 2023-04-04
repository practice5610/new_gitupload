import { Money, ShippingOrderStatus } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'shipping_orders', settings: {} })
export class ShippingOrder extends Entity {
  @property({
    name: '_id',
    description: 'Mongodb ObjectID of the ShippingOrder',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'utc unix time record was created',
    type: 'number',
  })
  createdAt?: number;

  @property({
    name: 'updatedAt',
    description: 'utc unix time record was updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'shippo_id',
    description: 'object id of a Shippo Transaction',
    type: 'string',
  })
  shippo_id?: string;

  @property({
    name: 'trackingNumber',
    description: 'tracking number for the shipment',
    type: 'string',
  })
  trackingNumber?: string;

  @property({
    name: 'trackingLink',
    description: 'url to track the shipment',
    type: 'string',
  })
  trackingLink?: string;

  @property({
    name: 'price',
    description: 'Price paid for shipping',
    type: 'object',
  })
  price: Money;

  @property({
    name: 'purchaser',
    description: 'uid of user who paid the shipping cost',
    type: 'string',
  })
  purchaser: string;

  @property({
    name: 'status',
    description: 'status of this Shipping order. paid, refund pending, or refunded',
    type: 'string',
    jsonSchema: {
      enum: Object.values(ShippingOrderStatus),
    },
  })
  status: ShippingOrderStatus;
}

export interface ShippingOrderRelations {
  // describe navigational properties here
}

export type ShippingOrderWithRelations = ShippingOrder & ShippingOrderRelations;
