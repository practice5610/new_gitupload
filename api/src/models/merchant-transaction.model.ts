import { AllOptionalExceptFor, BoomUserBasic, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { MerchantTransactionStatus, MerchantTransactionType } from '../constants';
import { InventoryItem, InventoryLease, StoreBasic } from '../models';

/**
 * What do the merchant transactions track specifically? Are these the transactions that merchants process for their stores?
 */

@model({ name: 'merchant_transactions', settings: {} })
export class MerchantTransaction extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'Date the transaction was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date the transaction was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'title',
    description: 'The title of the transaction',
    /**
     * I don't think this is right. Why would the transaction have a title... What is the title for?
     */
    type: 'string',
  })
  title: string;

  @property({
    name: 'status',
    description:
      'The status of the transaction. Whether it is pending, completed, cancelled, or failed',
    type: 'string',
    jsonSchema: {
      enum: Object.values(MerchantTransactionStatus),
    },
  })
  status: MerchantTransactionStatus;

  @property({
    name: 'type',
    description: 'The type of the transaction. Whether it is recurring, one-time, or return',
    type: 'string',
    jsonSchema: {
      enum: Object.values(MerchantTransactionType),
    },
  })
  type: MerchantTransactionType;

  @property({
    name: 'salestax',
    description: 'The sales tax charged to the customer on a particular transaction',
    type: 'object',
  })
  salestax?: Money;

  @property({
    name: 'salestaxState',
    description: 'The state to which the sales tax is owed',
    type: 'string',
    pattern:
      '^(AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)$',
  })
  salestaxState?: string;

  @property({
    name: 'amount',
    description: 'The amount the customer owes on a particular transaction',
    type: 'object',
  })
  amount?: Money;

  @property({
    name: 'merchant',
    description: 'The merchant the transaction goes to',
    type: 'object',
  })
  merchant: AllOptionalExceptFor<BoomUserBasic, 'uid'>;

  @property({
    name: 'store',
    description: 'The store the transaction corresponds to',
    type: 'object',
  })
  store: StoreBasic;

  @property({
    name: 'purchaseItem',
    description: 'The item that the customer purchases from the merchant',
    type: 'object',
  })
  purchaseItem: Partial<InventoryItem>;

  @property({
    name: 'inventoryLease',
    description: 'The lease for inventory items that merchants are able to lease from Boom',
    type: 'object',
  })
  inventoryLease?: Partial<InventoryLease>;

  constructor(data?: Partial<MerchantTransaction>) {
    super(data);
  }
}

export interface MerchantTransactionRelations {
  // describe navigational properties here
}

export type MerchantTransactionWithRelations = MerchantTransaction & MerchantTransactionRelations;
