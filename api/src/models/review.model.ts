import { Entity, model, property } from '@loopback/repository';

import { Store } from './store.model';

@model({ name: 'reviews', settings: {} })
export class Review extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'The date a review was created',
    type: 'number',
  })
  createdAt?: number;

  @property({
    name: 'updatedAt',
    description: 'The date a review was updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'content',
    description: 'The content provided within a review by a customer',
    type: 'string',
  })
  content?: string;

  @property({
    name: 'memberUID',
    description: 'Unique merchant ID',
    type: 'string',
  })
  memberUID?: string;
  /**
   * why is merchant uid listed twice???
   */
  @property({
    name: '',
    description: '',
    type: 'string',
  })
  merchantUID?: string;

  @property({
    name: 'rating',
    description:
      'The value (1 to 5) a customer provides to show their likeness of a store or product',
    /**
     * Can customers review stores too or only products?
     */
    type: 'number',
  })
  rating?: number;

  @property({
    name: 'date',
    description: '',
    /**
     * There is already a created at and updated at date so what is this for???
     */
    type: 'number',
  })
  date?: number;

  @property({
    name: 'store',
    description: 'The store a product is sold from',
    type: 'object',
  })
  store?: Partial<Store>;

  constructor(data?: Partial<Review>) {
    super(data);
  }
}

export interface ReviewRelations {
  // describe navigational properties here
}

export type ReviewWithRelations = Review & ReviewRelations;
