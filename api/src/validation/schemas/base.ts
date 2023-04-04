import { SchemaObject } from '@loopback/openapi-v3';

export const BaseSchema = {
  type: 'object',
  description: 'Base',
  properties: {
    _id: { type: 'string', minLength: 2 },
    createdAt: { type: 'integer' },
    updatedAt: { type: 'integer' },
  },
  required: [],
  additionalProperties: false,
} as const;

export const BaseSchemaObject: SchemaObject = {
  ...BaseSchema,
  properties: {
    ...BaseSchema.properties,
  },
  required: [...BaseSchema.required],
};
