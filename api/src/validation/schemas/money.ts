import { SchemaObject } from '@loopback/openapi-v3';

export const MoneySchema = {
  type: 'object',
  description: 'Money',
  properties: {
    amount: { type: 'integer' },
    precision: { type: 'integer' },
    currency: { type: 'string' }, // TODO: Create schema for this one located at : import { Currency } from 'dinero.js';
    symbol: { type: 'string' },
  },
  required: ['amount', 'precision', 'currency'], // TODO: 'symbol' seems to be required
  additionalProperties: false,
} as const;

export const MoneySchemaObject: SchemaObject = {
  ...MoneySchema,
  properties: {
    ...MoneySchema.properties,
  },
  required: [...MoneySchema.required],
};
