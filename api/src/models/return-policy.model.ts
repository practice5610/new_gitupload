import { ReturnMethod, TransactionTotalParts } from '@boom-platform/globals/lib/enums/returns';
import { ExtraCosts, ReturnCost } from '@boom-platform/globals/lib/returns';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'return_policy', settings: {} })
export class ReturnPolicyModel extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date policy was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date policy was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'merchantID',
    description: 'Unique ID for a merchant',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Merchant ID should be at least 2 characters.',
        maxLength: 'Merchant ID should not exceed 80 characters.',
      },
    },
  })
  merchantID: string;

  @property({
    name: 'name',
    description: 'name of the policy',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Name should be at least 2 characters.',
        maxLength: 'Name should not exceed 80 characters.',
      },
    },
  })
  name: string;

  @property({
    name: 'description',
    description: 'Description of the policy',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 500,
      errorMessage: {
        minLength: 'Description should be at least 2 characters.',
        maxLength: 'Description should not exceed 500 characters.',
      },
    },
  })
  description: string;

  @property({
    name: 'refundsAccepted',
    description: 'True or False if refunds are accepted by the merchant',
    type: 'boolean',
    required: true,
  })
  refundsAccepted: boolean;

  @property({
    name: 'autoApprove',
    description: 'True or False if merchant accepts auto-approval of returns/refunds/exchanges',
    type: 'boolean',
    required: true,
  })
  autoApprove: boolean;

  @property({
    name: 'costsImposed',
    descrition: 'Optional extra costs a merchant may charge for a return. i.e. restocking fee',
    type: 'array',
    itemType: 'object',
  })
  costsImposed?: ExtraCosts[];

  @property({
    name: 'daysToReturn',
    description: 'Specified timeframe inwhich a customer can return/exchange an item',
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 1,
      maximum: 30,
      errorMessage: {
        minimum: 'Days to return should be at least 1 day.',
        maximum: 'Days to return should not exceed 30 days.',
      },
    },
  })
  daysToReturn: number;

  @property({
    name: 'returnMethod',
    description: 'The return method used to return an item. i.e. ship or drop off',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ReturnMethod),
    },
  })
  returnMethod: ReturnMethod;

  @property({
    name: 'dropOffAddress',
    description: 'A list of addresses/locations a customer can drop off their returns too',
    type: 'array',
    itemType: 'string',
  })
  dropOffAddress?: string[];

  @property({
    name: 'transactionTotalPartsToRefuned',
    description: 'Each part of a transaction total that is to be refunded',
    type: 'array',
    itemType: 'string',
  })
  transactionTotalPartsToRefund?: TransactionTotalParts[];

  @property({
    name: 'returnCosts',
    description: 'Fees owed by the customer for a return. i.e. shipping fee',
    type: 'array',
    itemType: 'object',
    required: true,
  })
  returnCosts: ReturnCost[];
}

export interface ReturnPolicyRelations {
  /**
   * Describe navigational properties here
   */
}

export type ReturnPolicyWithRelations = ReturnPolicyModel & ReturnPolicyRelations;
