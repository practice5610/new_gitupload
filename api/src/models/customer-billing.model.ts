import { AllOptionalExceptFor } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { Transaction } from './transaction.model';

@model({ name: 'customer_billings', settings: {} })
export class CustomerBilling extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'transaction',
    description: 'Transaction record linked to a unique store ID and a unique customer ID.',
    type: 'object',
  })
  transaction: AllOptionalExceptFor<Transaction, '_id'>;

  @property({
    name: 'plaidAccountId',
    description: 'Unique account ID provided by Plaid',
    type: 'string',
  })
  plaidAccountId?: string;

  @property({
    name: 'plaidItemId',
    description: 'Unique item ID provided by Plaid',
    type: 'string',
  })
  plaidItemId?: string;

  constructor(data?: Partial<CustomerBilling>) {
    super(data);
  }
}

export interface CustomerBillingRelations {
  // describe navigational properties here
}

export type CustomerBillingWithRelations = CustomerBilling & CustomerBillingRelations;
