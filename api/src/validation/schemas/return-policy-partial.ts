import { SchemaObject } from '@loopback/openapi-v3';

import { PolicySchema, PolicySchemaObject } from '.';

const { _id, createdAt, updatedAt, ...POSTPolicySchemaPartialProperties } = PolicySchema.properties;

export const POSTPolicySchemaObjectPartial: SchemaObject = {
  ...PolicySchemaObject,
  properties: {
    ...POSTPolicySchemaPartialProperties,
    costsImposed: {
      ...POSTPolicySchemaPartialProperties.costsImposed,
      items: {
        ...POSTPolicySchemaPartialProperties.costsImposed.items,
        required: [...POSTPolicySchemaPartialProperties.costsImposed.items.required],
      },
    },
    returnMethod: {
      ...POSTPolicySchemaPartialProperties.returnMethod,
      items: { enum: [...POSTPolicySchemaPartialProperties.returnMethod.items.enum] },
    },
    transactionTotalPartsToRefund: {
      ...POSTPolicySchemaPartialProperties.transactionTotalPartsToRefund,
      items: {
        enum: [...POSTPolicySchemaPartialProperties.transactionTotalPartsToRefund.items.enum],
      },
    },
    returnCosts: {
      ...POSTPolicySchemaPartialProperties.returnCosts,
      items: {
        ...POSTPolicySchemaPartialProperties.returnCosts.items,
        required: [...POSTPolicySchemaPartialProperties.returnCosts.items.required],
      },
    },
  },
  required: [
    'merchantID',
    'name',
    'description',
    'refundsAccepted',
    'autoApprove',
    'daysToReturn',
    'returnMethod',
    'returnCosts',
  ],
};
