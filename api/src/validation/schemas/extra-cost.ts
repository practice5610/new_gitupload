import { SchemaObject } from 'openapi3-ts';

import { MoneySchemaObject } from './money';

export const ExtraCostSchema = {
  type: 'object',
  description: 'Extra return fees the Merchant may charge to the Customer',
  properties: {
    name: { type: 'string', description: 'Name of return fee', minLength: 2 },
    description: { type: 'string', description: 'Explanation of return fee', minLength: 2 },
    price: MoneySchemaObject,
  },
  required: [],
  additionalProperties: false,
} as const;

export const ExtraCostSchemaObject: SchemaObject = {
  ...ExtraCostSchema,
  properties: {
    ...ExtraCostSchema.properties,
  },
  required: [...ExtraCostSchema.required],
};
