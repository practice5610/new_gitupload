import { ReturnCostType } from '@boom-platform/globals/lib/enums/returns';
import { SchemaObject } from 'openapi3-ts';

import { MoneySchemaObject } from './money';

export const ReturnCostSchema = {
  type: 'object',
  description: 'Return fees the Merchant may charge to the Customer',
  properties: {
    name: { type: 'string', description: 'Name of return fee', minLength: 2 },
    description: { type: 'string', description: 'Explanation of return fee', minLength: 2 },
    price: MoneySchemaObject,
    type: {
      description: 'The type of return cost',
      items: { enum: [ReturnCostType.FLAT_FEE, ReturnCostType.SHIPPING] },
    },
  },
  required: [],
  additionalProperties: false,
} as const;

export const ReturnCostSchemaObject: SchemaObject = {
  ...ReturnCostSchema,
  properties: {
    ...ReturnCostSchema.properties,
    type: {
      ...ReturnCostSchema.properties.type,
      items: {
        enum: [...ReturnCostSchema.properties.type.items.enum],
      },
    },
  },
  required: [...ReturnCostSchema.required],
};
