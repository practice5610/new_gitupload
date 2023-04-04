import { AdminConfigType } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { BaseSchema } from './base';

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const ConfigSchema = {
  type: 'object',
  description: 'Config',
  properties: {
    ...BaseSchema.properties,
    type: {
      enum: [AdminConfigType.DEFAULT_PROCESSING_RATE, AdminConfigType.INVENTORY_TYPES],
    },
    label: { type: 'string' },
    value: { type: 'object' },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const ConfigSchemaObject: SchemaObject = {
  ...ConfigSchema,
  properties: {
    ...ConfigSchema.properties,
    type: { enum: [...ConfigSchema.properties.type.enum] },
  },
  required: [...ConfigSchema.required],
};
