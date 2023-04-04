import { Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { Product } from './product.model';

@model({ name: 'offers', settings: {} })
export class Offer extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'The date an offer is created',
    type: 'number',
  })
  createdAt?: number;

  @property({
    name: 'updatedAt',
    description: 'The date an offer is updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'cashBackPerVisit',
    description: 'The amount of cash back a customer receives each time they visit/use an offer',
    type: 'object',
  })
  cashBackPerVisit?: Money;

  @property({
    name: 'conditions',
    description: 'Conditions that can be added by the merchant (i.e. no refunds)',
    type: 'array',
    itemType: 'string',
  })
  conditions?: string[];

  @property({
    name: 'description',
    description:
      'The desceiption of an offer explaining any specific details a merchant can offer to the customer',
    type: 'string',
  })
  description?: string;

  @property({
    name: 'maxQuantity',
    description: 'The max amount of times a customer can select a specific offer',
    type: 'number',
  })
  maxQuantity: number;

  @property({
    name: 'maxVisits',
    description: 'The max number visits a customer can use the offer they selected',
    type: 'number',
  })
  maxVisits: number;

  @property({
    name: 'merchantUID',
    description: 'The unique ID for a merchant',
    type: 'string',
  })
  merchantUID: string;

  @property({
    name: 'startDate',
    description: 'The day an offer starts and is available to customers',
    type: 'number',
  })
  startDate?: number;

  @property({
    name: 'title',
    description: 'The title of an offer',
    type: 'string',
  })
  title?: string;

  @property({
    name: 'product',
    description: 'The product the offer correlates to',
    type: 'object',
  })
  product: Product;

  @property({
    name: 'expiration',
    description: 'The date an offer expires and is no longer available to customers',
    type: 'number',
  })
  expiration: number;

  @property({
    name: 'returnPolicy',
    description: '_id of return policy',
    type: 'string',
  })
  returnPolicy?: string;

  constructor(data?: Partial<Offer>) {
    super(data);
  }
}

export interface OfferRelations {
  // describe navigational properties here
}

export type OfferWithRelations = Offer & OfferRelations;
