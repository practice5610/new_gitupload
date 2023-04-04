import { ProductStatus } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { BaseSchema } from './base';
import { CategorySchema, CategorySchemaObject } from './category';
import { MoneySchemaObject } from './money';
import { StoreSchema, StoreSchemaObject } from './store';

const { _id, createdAt, updatedAt, ...CategorySchemaPartialProperties } = CategorySchema.properties;
const CategorySchemaObjectPartial: SchemaObject = {
  ...CategorySchemaObject,
  properties: { ...CategorySchemaPartialProperties },
  //required: ['name', 'commissionRate', 'subCategories'], // TODO: Review if we need subCategories and commissionRate
  required: [...CategorySchema.required, 'name'],
};

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const ProductSchema = {
  type: 'object',
  description: 'Product',
  properties: {
    ...BaseSchema.properties,
    //objectID: { type: 'string' }, // Check StoreSchema - Removed on Globals
    imageUrl: { type: 'string', minLength: 2 }, // Check ProfileImageSchema
    category: CategorySchemaObjectPartial,
    name: { type: 'string', minLength: 2 },
    description: { type: 'string', minLength: 2 },
    store: {
      ...StoreSchemaObject,
      required: [
        ...StoreSchema.required,
        '_id',
        'name', // Set as required on POSTAddressValidationRequestBody
        'street1', // Set as required on POSTAddressValidationRequestBody
        'city', // Set as required on POSTAddressValidationRequestBody
        'state', // Set as required on POSTAddressValidationRequestBody
        'zip', // Set as required on POSTAddressValidationRequestBody
        'country', // Set as required on POSTAddressValidationRequestBody
        //'phoneNumber',
        //'emails',
        'companyName',
        //'companyType',
        //'companyDescription',
        //'fein',
        //'years',
        '_geoloc',
        'merchant',
      ],
    },
    price: MoneySchemaObject,
    attributes: { type: 'object' },
    _tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    merchantUID: { type: 'string', minLength: 2 },
    packageDetails: { type: 'object' }, // TODO: Create Validator if needed
    shippingPolicy: { type: 'string', minLength: 2 },
    status: { enum: [ProductStatus.APPROVED, ProductStatus.DECLINED, ProductStatus.PENDING] },
    quantity: { type: 'integer' },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const ProductSchemaObject: SchemaObject = {
  ...ProductSchema,
  properties: {
    ...ProductSchema.properties,
    status: { ...ProductSchema.properties.status, enum: [...ProductSchema.properties.status.enum] },
    store: {
      ...ProductSchema.properties.store,
      required: [...ProductSchema.properties.store.required],
    },
  },
  required: [...ProductSchema.required],
};
