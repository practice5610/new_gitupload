import { EmailRegex } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

export const ContactInfoSchema = {
  type: 'object',
  description: 'ContactInfo',
  properties: {
    phoneNumber: { type: 'string', minLength: 10 },
    emails: {
      type: 'array',
      items: {
        type: 'string',
        pattern: EmailRegex.source,
      },
    },
  },
  required: [],
  additionalProperties: false,
} as const;

export const ContactInfoSchemaObject: SchemaObject = {
  ...ContactInfoSchema,
  properties: {
    ...ContactInfoSchema.properties,
  },
  required: [...ContactInfoSchema.required],
};
