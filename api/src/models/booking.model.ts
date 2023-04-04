import { BookingStatus, BookingTypes } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { Offer } from './offer.model';
import { Product } from './product.model';

@model({ name: 'bookings', settings: {} })
export class Booking extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date the booking was created / Date the item was placed in shopping cart',
    type: 'number',
  })
  createdAt: number;
  /**
   * need to figure out how to describe dates
   */
  @property({
    name: 'updatedAt',
    description: 'Date the item/booking was updated in the shopping cart',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'type',
    description: 'Booking type (offer or product) that a user can view',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(BookingTypes),
    },
  })
  type: BookingTypes;

  @property({
    name: 'item',
    description: 'Item that is either an offer or a product that a user can add to their cart',
    type: 'object',
    required: true,
  })
  item: Offer | Product;

  @property({
    name: 'quantity',
    description: 'The total number of a specific item that a user is adding to their cart.',
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 1,
      errorMessage: {
        maximum: 'Booking must have at least 1 item to book.',
      },
    },
  })
  quantity: number;

  @property({
    name: 'status',
    description:
      'The status of the booking itself. Whether it is active, used by the user, or cancelled',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(BookingStatus),
    },
  })
  status: BookingStatus;

  @property({
    name: 'memberUID',
    description: 'The unique member ID provided to each boom member',
    type: 'string',
    required: true,
  })
  memberUID: string;

  @property({
    name: 'visits',
    description:
      'How many times an offer can be used. This will also track how many times a customer has used an offer, allowing the customer to know how many visits they have left. (i.e. max of 5 visits. 3 visits left)',
    type: 'number',
  })
  visits?: number;

  constructor(data?: Partial<Booking>) {
    super(data);
  }
}

export interface BookingRelations {
  // describe navigational properties here
}

export type BookingWithRelations = Booking & BookingRelations;
