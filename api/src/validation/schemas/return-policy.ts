import { ReturnMethod, TransactionTotalParts } from '@boom-platform/globals/lib/enums/returns';
import { SchemaObject } from 'openapi3-ts';

import { BaseSchema } from './base';
import { ExtraCostSchemaObject } from './extra-cost';
import { ProfileSchema } from './profile';
import { ReturnCostSchemaObject } from './return-cost';

export const PolicySchema = {
  type: 'object',
  description: "Merchant's Return Policy",
  properties: {
    ...BaseSchema.properties,
    merchantID: ProfileSchema.properties.uid,
    name: { type: 'string', description: 'Name of Return Policy', minLength: 2 },
    description: { type: 'string', description: 'Description of the Return Policy', minLength: 2 },
    refundsAccepted: { type: 'boolean', description: 'Merchant accepts refund request' },
    autoApprove: {
      type: 'boolean',
      description: 'Merchant accepts all return requests with this policy',
    },
    costsImposed: {
      type: 'array',
      description: 'All extra costs the customer may incurr for return',
      items: {
        ...ExtraCostSchemaObject,
        required: ['name', 'description', 'price'],
      },
    },
    daysToReturn: { type: 'integer', description: 'How many days an item is eligible for return' },
    returnMethod: {
      description: 'Methods a customer can take to retun an item',
      items: { enum: [ReturnMethod.DROP_OFF, ReturnMethod.NO_RETURN, ReturnMethod.SHIP] },
    },
    dropOffAddress: { type: 'array', items: { type: 'string' } },
    transactionTotalPartsToRefund: {
      type: 'array',
      description: 'Parts of the transaction to be refunded to the customer',
      items: {
        enum: [
          TransactionTotalParts.BOOM_FEE,
          TransactionTotalParts.NET_PRODUCT_COST,
          TransactionTotalParts.SHIPPING,
          TransactionTotalParts.TAX,
        ],
      },
    },
    returnCosts: {
      type: 'array',
      description: 'Costs customer incurrs for return',
      items: {
        ...ReturnCostSchemaObject,
        required: ['name', 'description', 'price', 'type'],
      },
    },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const PolicySchemaObject: SchemaObject = {
  ...PolicySchema,
  properties: {
    ...PolicySchema.properties,
    costsImposed: {
      ...PolicySchema.properties.costsImposed,
      items: {
        ...ExtraCostSchemaObject,
        required: [...PolicySchema.properties.costsImposed.items.required],
      },
    },
    returnMethod: {
      ...PolicySchema.properties.returnMethod,
      items: { enum: [...PolicySchema.properties.returnMethod.items.enum] },
    },
    transactionTotalPartsToRefund: {
      ...PolicySchema.properties.transactionTotalPartsToRefund,
      items: { enum: [...PolicySchema.properties.transactionTotalPartsToRefund.items.enum] },
    },
    returnCosts: {
      ...PolicySchema.properties.returnCosts,
      items: {
        ...ReturnCostSchemaObject,
        required: [...PolicySchema.properties.returnCosts.items.required],
      },
    },
  },
  required: [...PolicySchema.required],
};
