import { SchemaObject } from 'openapi3-ts';

import { BaseSchema } from './base';
import { ReturnRequestSchema, ReturnRequestSchemaObject } from './return-request';

export const DisputeSchema = {
  type: 'object',
  description: 'Dispute regarding return',
  properties: {
    ...BaseSchema.properties,
    returnRequest: {
      ...ReturnRequestSchemaObject,
      required: [
        '_id',
        'createdAt',
        'updatedAt',
        'customerID',
        'merchantID',
        'returnStatus',
        'merchantPolicyID',
        'returnReason',
        'returnMethod',
        'purchaseTransactionID',
        'returnTransactionID',
      ],
    },
    isOpen: {
      type: 'boolean',
      description: 'Lets the merchant, customer, or admin know if a dispute is still open',
    },
    comment: { type: 'string', description: 'Comments regarding a dispute', minLength: 2 },
  },
  required: [...BaseSchema.required, ...ReturnRequestSchema.required],
  additionalProperties: false,
} as const;

export const DisputeSchemaObject: SchemaObject = {
  ...DisputeSchema,
  properties: {
    ...DisputeSchema.properties,
    returnRequest: {
      ...DisputeSchema.properties.returnRequest,
      required: [...DisputeSchema.properties.returnRequest.required],
    },
  },
  required: [...DisputeSchema.required],
};
