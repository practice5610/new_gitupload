import {
  AllOptionalExceptFor,
  BoomUser,
  Money,
  TaxCode,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';
import { customAlphabet } from 'nanoid';

import { Booking } from './booking.model';
import { Offer } from './offer.model';
import { Product } from './product.model';
import { Store } from './store.model';

/**
 * Short IDs with nanoid under 8 chars wasn't quite unique enough and nanoid includes
 * chars that make shortId hard to read, so this is our shortId generator that fixes
 * these problems by removing uppercase O, hyphen, and underscore. With a length of 8,
 * we need to make 1,950,000 ids to have a 1% of at least one collision
 * nanoid calculator: https://zelark.github.io/nano-id-cc/
 */
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);

@model({ name: 'transactions', settings: {} })
export class Transaction extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'The date the transaction was created',
    type: 'number',
  })
  createdAt?: number;

  @property({
    name: 'updatedAt',
    description: 'The date the transaction was updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'type',
    description:
      'The type of transaction being made. Whether it is a funding, purchase, cash back, transfer, return, merchant withdrawal, or customer billing transaction',
    type: 'string',
  })
  type: TransactionType;

  @property({
    name: 'status',
    description:
      'The status of a transaction. Whether it is pending, cancelled, completed, failed, or unprocessed',
    type: 'string',
  })
  status?: TransactionStatus;

  @property({
    name: 'amount',
    description: 'The amount of money spent in a transaction',
    type: 'object',
  })
  amount: Money;

  @property({
    name: 'cashback',
    description: 'The amount of money a customer will get back in the transaction',
    type: 'object',
  })
  cashback?: Money;

  @property({
    name: 'nonce',
    description: '',
    /**
     * What is nonce?
     */
    type: 'string',
  })
  nonce?: string;

  @property({
    name: 'sender',
    description:
      'The sender of a transaction. Can be a customer or merchant depending on the type of transaction',
    type: 'object',
  })
  sender: AllOptionalExceptFor<BoomUser, 'uid'> | AllOptionalExceptFor<Store, '_id'>;

  @property({
    name: 'receiver',
    description:
      'The receiver of the transaction. Can be a customer or a merchant depending on the type of transaction',
    type: 'object',
  })
  receiver: AllOptionalExceptFor<BoomUser, 'uid'> | AllOptionalExceptFor<Store, '_id'>;

  @property({
    name: 'title',
    description: 'The title of the purchase item',
    type: 'string',
  })
  title?: string;

  @property({
    name: 'taxcode',
    description:
      'The country, state, county, city of where the taxes are to be paid to and calculated by',
    type: 'object',
  })
  taxcode?: TaxCode;

  @property({
    name: 'salestax',
    description: 'The amount of taxes owed',
    type: 'object',
  })
  salestax?: Money;

  @property({
    name: 'boomAccountID',
    description: 'The unique ID for a Boom Account',
    type: 'string',
  })
  boomAccountID?: string;

  @property({
    name: 'purchaseItem',
    description: 'The item being purchased in a transaction. Can be a product or an offer',
    type: 'object',
  })
  purchaseItem?: Partial<Offer> | Partial<Product>;

  @property({
    name: 'booking',
    description: 'This can describe the quantity of items being purchased in a transaction',
    /**
     * This is a partial booking so I'm not sure what will be used from booking and what will not be
     */
    type: 'object',
  })
  booking?: Partial<Booking>;

  @property({
    name: 'dateReceived',
    description: '',
    /**
     * Date the transaction was received or the delivery was received?
     */
    type: 'number',
  })
  dateReceived?: number;

  @property({
    name: 'commissionCollected',
    description: 'The monetary value that is given to Boom for each purchase',
    type: 'object',
  })
  commissionCollected?: Money;

  @property({
    name: 'shippingOrderId',
    description: 'The unique shipping order ID that links to the shipping information',
    type: 'string',
  })
  shippingOrderId?: string;

  @property({
    name: 'shortId',
    description: '',
    /**
     * What is the short id used for?
     */
    type: 'string',
  })
  shortId: string;

  constructor(data?: Partial<Transaction>) {
    super(data);
    this.shortId = nanoid();
  }
}

export interface TransactionRelations {
  // describe navigational properties here
}

export type TransactionWithRelations = Transaction & TransactionRelations;
