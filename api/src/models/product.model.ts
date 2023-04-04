import { Money, PackageDetails, ProductStatus } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { Category } from './category.model';
import { Store } from './store.model';

@model({ name: 'products', settings: {} })
export class Product extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'objectID',
    description: 'Search engine objectID',
    type: 'string',
    id: true,
  })
  objectID?: string; // TODO: This needs to be removed(already removed from globals), it was used by Algolia - "The Algolia document ID"

  @property({
    name: 'createdAt',
    description: 'The date a product was created',
    type: 'number',
  })
  createdAt?: number;

  @property({
    name: 'updatedAt',
    description: 'The date a product was updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'imageUrl',
    description: 'The url to the image of a product',
    type: 'string',
    jsonSchema: {
      minLength: 1,
      maxLength: 1000,
      errorMessage: {
        minLength: 'imageUrl should be at least 1 characters.',
        maxLength: 'imageUrl should not exceed 1000 characters.',
      },
    },
  })
  imageUrl?: string;

  @property({
    name: 'merchantUID',
    description: 'The unique merchant ID',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 80,
      errorMessage: {
        minLength: 'merchantUID should be at least 1 characters.',
        maxLength: 'merchantUID should not exceed 80 characters.',
      },
    },
  })
  merchantUID: string;

  @property({
    name: 'category',
    description: 'The category in which a product falls under',
    type: 'object',
    required: true,
  })
  category: Category;

  @property({
    name: 'name',
    description: 'The name or title of a product',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 80,
      errorMessage: {
        minLength: 'Name should be at least 1 characters.',
        maxLength: 'Name should not exceed 80 characters.',
      },
    },
  })
  name?: string;

  @property({
    name: 'description',
    description: 'The description of a product',
    type: 'string',
    jsonSchema: {
      minLength: 1,
      maxLength: 280,
      errorMessage: {
        minLength: 'Description should be at least 1 characters.',
        maxLength: 'Description should not exceed 280 characters.',
      },
    },
  })
  description?: string;

  @property({
    name: 'store',
    description: 'The store that sells said product',
    type: 'object',
    required: true,
  })
  store: Partial<Store>;

  @property({
    name: 'price',
    description: 'The amount of money the product calls',
    type: 'object',
    required: true,
  })
  price: Money;

  @property({
    name: 'attributes',
    description: 'Unique key-value pairs for a product (i.e. sku, color, etc)',
    type: 'object',
  })
  attributes?: object;

  @property({
    name: '_tags',
    description: 'Tags to help categorize a products',
    itemType: 'string',
  })
  _tags?: string[];

  @property({
    name: 'shippingPolicy',
    description: 'The object ID of the ShippingPolicy document chosen for this product',
    type: 'string',
  })
  shippingPolicy: string;

  @property({
    name: 'packageDetails',
    description: 'Details about how this product ships that is needed to calculate rates',
    type: 'object',
  })
  packageDetails?: PackageDetails;

  @property({
    name: 'status',
    description: 'The status of the product in the Boom system. approved, denied, pending',
    type: 'string',
    jsonSchema: {
      enum: Object.values(ProductStatus),
    },
    default: ProductStatus.PENDING,
  })
  status: ProductStatus;

  @property({
    name: 'quantity',
    description: 'Quantity of products available to sell',
    type: 'number',
  })
  quantity?: number;

  @property({
    name: 'returnPolicy',
    description: '_id of return policy',
    type: 'string',
  })
  returnPolicy: string;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  // describe navigational properties here
}

export type ProductWithRelations = Product & ProductRelations;
