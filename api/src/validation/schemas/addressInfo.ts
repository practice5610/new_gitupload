import {
  CountryUpperOrLowerRegex,
  StatesUpperOrLowerRegex,
  ZipCodeRegex,
} from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

export const AddressInfoSchema = {
  type: 'object',
  description: 'AddressInfo',
  properties: {
    object_id: { type: 'string' },
    is_complete: { type: 'boolean' },
    name: {
      type: 'string',
      description: 'Name of the person at this address',
      minLength: 1,
      maxLength: 35,
    },
    number: {
      type: 'string',
      description: 'Address number. This can be provided here or in street1',
      minLength: 1,
      maxLength: 35,
    },
    street1: { type: 'string', description: 'Street line 1', minLength: 1, maxLength: 35 },
    street2: { type: 'string', description: 'Street line 2', minLength: 1, maxLength: 35 },
    city: { type: 'string', description: 'city', minLength: 1, maxLength: 35 },
    state: {
      type: 'string',
      description: '2 letter state code',
      pattern: StatesUpperOrLowerRegex.source,
    },
    zip: { type: 'string', description: 'zip code', pattern: ZipCodeRegex.source },
    country: {
      type: 'string',
      description: '2 letter country code',
      pattern: CountryUpperOrLowerRegex.source,
    },
  },
  //required: ['name', 'street1', 'city', 'state', 'zip', 'country'], // DON'T ever enable this, or all our validators would need to send this
  required: [],
  additionalProperties: false,
} as const;

export const AddressInfoSchemaObject: SchemaObject = {
  ...AddressInfoSchema,
  required: [...AddressInfoSchema.required],
};
