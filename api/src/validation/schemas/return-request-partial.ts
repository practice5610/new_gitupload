import { SchemaObject } from '@loopback/openapi-v3';

import { ReturnRequestSchema, ReturnRequestSchemaObject } from '.';

const { _id, createdAt, updatedAt, ...POSTReturnRequestSchemaPartialProperties } =
  ReturnRequestSchema.properties;

export const POSTReturnRequestSchemaObjectPartial: SchemaObject = {
  ...ReturnRequestSchemaObject,
  properties: {
    ...POSTReturnRequestSchemaPartialProperties,
    refundStatus: {
      ...POSTReturnRequestSchemaPartialProperties.refundStatus,
      items: {
        enum: [...POSTReturnRequestSchemaPartialProperties.refundStatus.items.enum],
      },
    },
    returnStatus: {
      ...POSTReturnRequestSchemaPartialProperties.returnStatus,
      items: {
        enum: [...POSTReturnRequestSchemaPartialProperties.returnStatus.items.enum],
      },
    },
    returnReason: {
      ...POSTReturnRequestSchemaPartialProperties.returnReason,
      items: {
        enum: [...POSTReturnRequestSchemaPartialProperties.returnReason.items.enum],
      },
    },
    returnMethod: {
      ...POSTReturnRequestSchemaPartialProperties.returnMethod,
      items: {
        enum: [...POSTReturnRequestSchemaPartialProperties.returnMethod.items.enum],
      },
    },
  },
  required: [
    'customerID',
    'merchantID',
    'merchantPolicyID',
    'returnReason',
    'returnMethod',
    'purchaseTransactionID',
  ],
};

const {
  customerID,
  merchantID,
  merchantPolicyID,
  returnReason,
  returnMethod,
  purchaseTransactionID,
  customReason,
  returnTransactionID,
  comment,
  refundAmount,
  ...PATCHReturnRequestSchemaPartialProperties
} = ReturnRequestSchema.properties;

export const PATCHReturnRequestSchemaObjectPartial: SchemaObject = {
  ...ReturnRequestSchemaObject,
  properties: {
    ...PATCHReturnRequestSchemaPartialProperties,
    refundStatus: {
      ...PATCHReturnRequestSchemaPartialProperties.refundStatus,
      items: {
        enum: [...PATCHReturnRequestSchemaPartialProperties.refundStatus.items.enum],
      },
    },
    returnStatus: {
      ...PATCHReturnRequestSchemaPartialProperties.returnStatus,
      items: {
        enum: [...PATCHReturnRequestSchemaPartialProperties.returnStatus.items.enum],
      },
    },
  },
  required: ['returnStatus'],
};
