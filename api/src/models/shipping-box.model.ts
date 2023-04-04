import { DistanceUnit } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'shipping_boxes', settings: {} })
export class ShippingBox extends Entity {
  @property({
    name: '_id',
    description: 'Mongodb ObjectID of the ShippingBox',
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
    name: 'merchantId',
    description: 'uid of the user who created this ShippingBox',
    type: 'string',
  })
  merchantId: string;

  @property({
    name: 'name',
    description: 'Name of this box set by the user',
    type: 'string',
  })
  name?: string;

  @property({
    name: 'unit',
    description: 'Unit that the box dimensions are measured in',
    type: 'string',
  })
  unit: DistanceUnit;

  @property({
    name: 'length',
    description: 'length of box in units',
    type: 'number',
  })
  length: number;

  @property({
    name: 'width',
    description: 'width of box in units',
    type: 'number',
  })
  width: number;

  @property({
    name: 'height',
    description: 'height of box in units',
    type: 'number',
  })
  height: number;
}

export interface ShippingBoxRelations {
  // describe navigational properties here
}

export type ShippingBoxWithRelations = ShippingBox & ShippingBoxRelations;
