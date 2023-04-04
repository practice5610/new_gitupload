import { FreeShippingThreshold, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'shipping_policies', settings: {} })
export class ShippingPolicy extends Entity {
  @property({
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    type: 'number',
  })
  createdAt?: number;

  @property({
    type: 'number',
  })
  updatedAt?: number;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
  })
  merchantId: string;

  @property({
    type: 'object',
  })
  flatRate?: Money;

  @property({
    type: 'number',
  })
  itemsPerFlatRate?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  freeShippingThresholds?: FreeShippingThreshold[];

  @property({
    type: 'boolean',
  })
  pickUpOnly?: boolean;

  @property({
    type: 'array',
    itemType: 'string',
  })
  pickUpLocations?: string[];
}

export interface ShippingPolicyRelations {
  // describe navigational properties here
}

export type ShippingPolicyWithRelations = ShippingPolicy & ShippingPolicyRelations;
