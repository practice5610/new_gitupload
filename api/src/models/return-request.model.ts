import { Money } from '@boom-platform/globals';
import { ReturnMethod, ReturnReason, Status } from '@boom-platform/globals/lib/enums/returns';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'return_request', settings: {} })
export class ReturnRequestModel extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date return request was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date return request was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'customerID',
    description: 'Unique customer ID',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Customer ID should be at least 2 characters',
        maxLength: 'Customer ID should not exceed 80 characters',
      },
    },
  })
  customerID: string;

  @property({
    name: 'merchantID',
    description: 'Unique merchant ID',
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
    name: 'refundStatus',
    description: 'Status of the refund',
    type: 'string',
    default: Status.REQUESTED,
    jsonSchema: {
      enum: Object.values(Status),
    },
  })
  refundStatus?: Status;

  @property({
    name: 'returnStatus',
    description: 'Status of the return',
    type: 'string',
    default: Status.REQUESTED,
    jsonSchema: {
      enum: Object.values(Status),
    },
  })
  returnStatus: Status;

  @property({
    name: 'merchantPolicyID',
    description: 'Unique ID for the policy of the merchant',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Merchant Return Policy ID should be at least 2 characters.',
        maxLength: 'Merchant Return Policy ID should not exceed 80 characters.',
      },
    },
  })
  merchantPolicyID: string;

  @property({
    name: 'returnReason',
    description: 'The reason for the return',
    type: 'array',
    itemType: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ReturnReason),
    },
  })
  returnReason: ReturnReason[];

  @property({
    name: 'customReason',
    description: 'A specific reason for the return that is not listed in the return reasons',
    type: 'string',
    jsonSchema: {
      minLength: 2,
      maxLength: 500,
      errorMessage: {
        minLength: 'Custom reason should be at least 2 characters.',
        maxLength: 'Custom reason should not exceed 500 characters.',
      },
    },
  })
  customReason?: string;

  @property({
    name: 'returnMethod',
    description: 'The method of return. i.e, shipping or drop-off',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ReturnMethod),
    },
  })
  returnMethod: ReturnMethod;

  @property({
    name: 'purchaseTransactionID',
    description: 'Unique ID for the original purchase transaction',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Purchase Transaction ID should be at least 2 characters.',
        maxLength: 'Purchase Transaction ID should not exceed 80 characters.',
      },
    },
  })
  purchaseTransactionID: string;

  @property({
    name: 'refundAmount',
    description: 'Amount of money to be refunded to the customer',
    type: 'object',
  })
  refundAmount?: Money;

  @property({
    name: 'returnTransactionID',
    description: 'Unique ID for the return transaction',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Return Transaction ID should be at least 2 characters.',
        maxLength: 'Return Transaction ID should not exceed 80 characters.',
      },
    },
  })
  returnTransactionID: string;

  @property({
    name: 'comment',
    description: 'Any comments or notes regarding the return',
    type: 'string',
    jsonSchema: {
      minLength: 2,
      maxLength: 500,
      errorMessage: {
        minLength: 'Comments should be at least 2 characters.',
        maxLength: 'Comments should not exceed 500 characters.',
      },
    },
  })
  comment?: string;
}

export interface ReturnRequestRelations {
  /**
   * Describe navigational properties here
   */
}

export type ReturnRequestWithRelations = ReturnRequestModel & ReturnRequestRelations;
