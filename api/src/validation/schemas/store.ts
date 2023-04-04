import { StoreTypes } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { AddressInfoSchema, AddressInfoSchemaObject } from './addressInfo';
import { BaseSchemaObject } from './base';
import { ContactInfoSchema, ContactInfoSchemaObject } from './contactInfo';
import { GeolocationSchemaObject } from './geolocation';
import { ProfileSchemaObject } from './profile';

export const StoreBasicSchema = {
  type: 'object',
  description: 'Store Basic',
  properties: {
    ...BaseSchemaObject.properties,
    ...AddressInfoSchemaObject.properties,
    ...ContactInfoSchemaObject.properties,
    companyName: { type: 'string', minLength: 2 },
  },
  required: [...AddressInfoSchema.required, ...ContactInfoSchema.required],
  additionalProperties: false,
} as const;
export const StoreBasicSchemaObject: SchemaObject = {
  ...StoreBasicSchema,
  properties: {
    ...StoreBasicSchema.properties,
  },
  required: [...StoreBasicSchema.required],
};

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const StoreSchema = {
  type: 'object',
  description: 'Store',
  properties: {
    ...StoreBasicSchemaObject.properties,
    pin: { type: 'integer' },
    //objectID: { type: 'string' }, // Check ProductSchema - Removed on Globals
    companyLogoUrl: { type: 'string', minLength: 2 }, // Check ProfileImageSchema
    coverImageUrl: { type: 'string', minLength: 2 }, // Check ProfileImageSchema
    companyType: { type: 'string', minLength: 2 },
    companyDescription: { type: 'string', minLength: 2 },
    fein: { type: 'integer' },
    years: { type: 'integer' }, // TODO: is this an array?
    storeType: {
      enum: [StoreTypes.BRICK_AND_MORTAR, StoreTypes.ONLINE, StoreTypes.BOTH],
    },
    links: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    _tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    _geoloc: GeolocationSchemaObject,
    openingTime: { type: 'integer' },
    closingTime: { type: 'integer' },
    days: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    merchant: { ...ProfileSchemaObject, required: ['uid', 'firstName', 'lastName'] },
  },
  required: [...StoreBasicSchema.required],
  additionalProperties: false,
} as const;
export const StoreSchemaObject: SchemaObject = {
  ...StoreSchema,
  properties: {
    ...StoreSchema.properties,
    storeType: { enum: [...StoreSchema.properties.storeType.enum] },
    merchant: {
      ...StoreSchema.properties.merchant,
      required: [...StoreSchema.properties.merchant.required],
    },
  },
  required: [...StoreSchema.required],
};
