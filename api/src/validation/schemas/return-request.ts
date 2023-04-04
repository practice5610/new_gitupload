import { ReturnMethod, ReturnReason, Status } from '@boom-platform/globals/lib/enums/returns';
import { SchemaObject } from 'openapi3-ts';

import { BaseSchema } from './base';
import { MoneySchemaObject } from './money';
import { ProfileSchema } from './profile';

export const ReturnRequestSchema = {
  type: 'object',
  description: 'Return Request submitted by customer',
  properties: {
    ...BaseSchema.properties,
    customerID: ProfileSchema.properties.uid,
    merchantID: ProfileSchema.properties.uid,
    refundStatus: {
      description: 'Status of refund',
      items: {
        enum: [
          Status.APPROVED,
          Status.COMPLETE,
          Status.DENIED,
          Status.DISPUTED,
          Status.EXPIRED,
          Status.PROCESSING,
          Status.REQUESTED,
        ],
      },
    },
    returnStatus: {
      description: 'Status of return',
      items: {
        enum: [
          Status.APPROVED,
          Status.COMPLETE,
          Status.DENIED,
          Status.DISPUTED,
          Status.EXPIRED,
          Status.PROCESSING,
          Status.REQUESTED,
        ],
      },
    },
    merchantPolicyID: { type: 'string', description: 'Unique return policy ID', minLength: 2 },
    returnReason: {
      type: 'array',
      description: 'Reason for return',
      items: {
        enum: [
          ReturnReason.BETTER_PRICE,
          ReturnReason.DAMAGED_PRODUCT,
          ReturnReason.DAMAGED_PRODUCT_AND_BOX,
          ReturnReason.DEFECTIVE_ITEM,
          ReturnReason.DID_NOT_APPROVE,
          ReturnReason.EXTRA_ITEM,
          ReturnReason.INACCURATE_DESCRIPTIONS,
          ReturnReason.LATE_ARRIVAL,
          ReturnReason.MISSING_OR_BROKEN_PARTS,
          ReturnReason.MISTAKE_PURCHASE,
          ReturnReason.NO_LONGER_NEEDED,
          ReturnReason.WRONG_ITEM,
        ],
      },
    },
    customReason: { type: 'string', description: 'Custom reason for return', minLength: 2 },
    returnMethod: {
      description: 'Methods a customer can take to return an item',
      items: { enum: [ReturnMethod.DROP_OFF, ReturnMethod.NO_RETURN, ReturnMethod.SHIP] },
    },
    purchaseTransactionID: {
      type: 'string',
      description: 'Unique ID of original purchase transaction',
      minLength: 2,
    },
    refundAmount: MoneySchemaObject,
    returnTransactionID: { type: 'string', description: 'Unique ID of return transaction' },
    comment: {
      type: 'string',
      description: 'Comments a customer may leave for the merchant regarding the return or item',
      minLength: 2,
    },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const ReturnRequestSchemaObject: SchemaObject = {
  ...ReturnRequestSchema,
  properties: {
    ...ReturnRequestSchema.properties,
    refundStatus: {
      ...ReturnRequestSchema.properties.refundStatus,
      items: {
        enum: [...ReturnRequestSchema.properties.refundStatus.items.enum],
      },
    },
    returnStatus: {
      ...ReturnRequestSchema.properties.returnStatus,
      items: {
        enum: [...ReturnRequestSchema.properties.returnStatus.items.enum],
      },
    },
    returnReason: {
      ...ReturnRequestSchema.properties.returnReason,
      items: {
        enum: [...ReturnRequestSchema.properties.returnReason.items.enum],
      },
    },
    returnMethod: {
      ...ReturnRequestSchema.properties.returnMethod,
      items: {
        enum: [...ReturnRequestSchema.properties.returnMethod.items.enum],
      },
    },
  },
  required: [...ReturnRequestSchema.required],
};
