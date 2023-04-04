import { BookingStatus, BookingTypes } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { BaseSchema, BaseSchemaObject } from './base';
import { OfferSchema, OfferSchemaObject } from './offer';
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

const { ...OfferSchemaPartialProperties } = OfferSchema.properties;
const OfferSchemaObjectPartial: SchemaObject = {
  ...OfferSchemaObject,
  properties: {
    ...OfferSchemaPartialProperties,
    product: {
      ...OfferSchema.properties.product,
      //required: [...OfferSchema.properties.product.required],
    },
  },
  required: [
    ...OfferSchema.required,
    '_id',
    'cashBackPerVisit',
    'conditions',
    'description',
    'maxQuantity',
    'maxVisits',
    'merchantUID',
    'startDate',
    'title',
    'product',
    'expiration',
  ],
};

/**
 * When using this schema take into account that it contains _id, createdAt, updatedAt
 */
export const BookingSchema = {
  type: 'object',
  description: 'Booking',
  properties: {
    ...BaseSchemaObject.properties,
    type: {
      enum: [BookingTypes.OFFER, BookingTypes.PRODUCT],
    },
    item: {
      type: 'object',
      oneOf: [
        // TODO: This one needs to be used carefully, if any of the fields set fails, all the items on the schema are reported as wrong ones
        ProductSchemaObjectPartial,
        OfferSchemaObjectPartial,
      ],
    },
    quantity: { type: 'integer' },
    status: {
      enum: [BookingStatus.ACTIVE, BookingStatus.CANCELLED, BookingStatus.USED],
    },
    memberUID: { type: 'string', description: "Merchant's id" },
    visits: { type: 'integer' },
  },
  required: [...BaseSchema.required],
  additionalProperties: false,
} as const;

export const BookingSchemaObject: SchemaObject = {
  ...BookingSchema,
  properties: {
    ...BookingSchema.properties,
    type: { enum: [...BookingSchema.properties.type.enum] },
    item: {
      ...BookingSchema.properties.item,
      oneOf: [
        {
          ...ProductSchemaObjectPartial,
          //...ProductSchemaObject,
          //required: [...BookingSchema.properties.item.oneOf[0].required],
        },
        {
          ...OfferSchemaObjectPartial,
          //...BookingSchemaObject,
          //required: [...BookingSchema.properties.item.oneOf[1].required],
        },
      ],
    },
    status: { enum: [...BookingSchema.properties.status.enum] },
  },
  required: [...BookingSchema.required],
};
