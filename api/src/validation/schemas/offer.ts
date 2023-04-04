import { SchemaObject } from '@loopback/openapi-v3';

import { BaseSchema, BaseSchemaObject } from './base';
import { MoneySchemaObject } from './money';
import { ProductSchema, ProductSchemaObject } from './product';

//const { createdAt, updatedAt, ...ProductSchemaPartialProperties } = ProductSchema.properties; //TODO: Review if we need to send these values
const { ...ProductSchemaPartialProperties } = ProductSchema.properties;
const ProductSchemaObjectPartial: SchemaObject = {
  ...ProductSchemaObject,
  properties: {
    ...ProductSchemaPartialProperties,
    status: { ...ProductSchema.properties.status, enum: [...ProductSchema.properties.status.enum] },
    store: {
      ...ProductSchema.properties.store,
      required: [...ProductSchema.properties.store.required],
    },
  },
  required: [
    ...ProductSchema.required,
    '_id',
    'merchantUID',
    'category',
    'name',
    'description',
    'store',
    'price',
    'attributes',
    '_tags',
    'objectID',
    'packageDetails',
    'shippingPolicy',
    'status',
  ],
};

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const OfferSchema = {
  type: 'object',
  description: 'Offer',
  properties: {
    ...BaseSchema.properties, // If this is enabled the user would be able to modify _id, createdAt, updatedAt fields
    cashBackPerVisit: MoneySchemaObject,
    conditions: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    description: { type: 'string', minLength: 2 },
    maxQuantity: { type: 'integer' },
    maxVisits: { type: 'integer' },
    merchantUID: { type: 'string', minLength: 2 },
    startDate: { type: 'integer' },
    title: { type: 'string', minLength: 2 },
    product: ProductSchemaObjectPartial,
    expiration: { type: 'integer' },
  },
  required: [],
  additionalProperties: false,
} as const;

export const OfferSchemaObject: SchemaObject = {
  ...OfferSchema,
  properties: {
    ...OfferSchema.properties,
    product: {
      ...OfferSchema.properties.product,
    },
  },
  required: [...OfferSchema.required],
};
