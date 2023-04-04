import { SchemaObject } from '@loopback/openapi-v3';

import { BaseSchema, BaseSchemaObject } from './base';

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const CategorySchema = {
  type: 'object',
  description: 'Category',
  properties: {
    ...BaseSchema.properties, // _id, createdAt, updatedAt fields
    name: { type: 'string', minLength: 2 },
    commissionRate: { type: 'integer' },
    subCategories: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 2,
      },
    },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const CategorySchemaObject: SchemaObject = {
  ...CategorySchema,
  properties: {
    ...CategorySchema.properties,
  },
  required: [...CategorySchema.required],
};
