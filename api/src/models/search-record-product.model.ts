import { Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'products', settings: { strict: false } })
export class SearchRecordProduct extends Entity {
  @property({
    name: 'productID',
    description: 'The unique ID for a product',
    type: 'string',
  })
  productID: string;

  @property({
    name: 'id',
    description: '',
    /**
     * Is this a search id?
     */
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    name: 'categoryName',
    description: 'The name or title of a category',
    type: 'string',
  })
  categoryName: string;

  @property({
    name: 'subCategoryName',
    description: 'The name or title of a sub category',
    type: 'string',
  })
  subCategoryName: string;

  @property({
    name: 'hasOffer',
    description: 'Lets the customer know if there is an offer for the product in question',
    type: 'boolean',
  })
  hasOffer: boolean;

  @property({
    name: '_geoloc',
    description: 'The coordinates',
    /**
     * What are these coordinates for or to?
     */
    type: 'object',
  })
  _geoloc: { lat: number; lon: number };

  @property({
    name: 'offer',
    description: 'The offer related to a product',
    type: 'object',
  })
  offer: object;

  @property({
    name: 'priceNum',
    description: 'The price of a product',
    type: 'number',
  })
  priceNum: number;

  @property({
    name: 'createdAt',
    description: 'The date ...',
    /**
     * Date what was created? The product?
     */
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: '',
    /**
     * Date what was updated? The product?
     */
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'imageUrl',
    description: 'The URL to the image of a product',
    type: 'string',
  })
  imageUrl: string;

  @property({
    name: 'merchantUID',
    description: 'The unique merchant ID',
    type: 'string',
  })
  merchantUID: string;

  @property({
    name: 'category',
    description: 'The category in which a product is classified under',
    type: 'object',
  })
  category: object;

  @property({
    name: 'name',
    description: 'Name or title of the product',
    type: 'string',
  })
  name: string;

  @property({
    name: 'description',
    description: 'Description of the product',
    type: 'string',
  })
  description: string;

  @property({
    name: 'store',
    description: 'The store that sells the product',
    type: 'object',
  })
  store: {
    _id: string;
    number: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }; // TODO: Don't we need to use something similar like our Store Interface?

  @property({
    name: 'price',
    description: 'The price of the product',
    type: 'object',
  })
  price: Money;

  @property({
    name: 'attributes',
    description: 'Key value pairs relating to the product (i.e. color, sku, etc)',
    type: 'object',
  })
  attributes?: object;

  @property({
    name: '_tags',
    description: '',
    /**
     * Not completely sure what the tags do or what they are for
     */
    type: 'array',
    itemType: 'string',
  })
  _tags: string[];

  constructor(data?: Partial<SearchRecordProduct>) {
    super(data);
  }
}

export interface SearchRecordProductRelations {
  // describe navigational properties here
}

export type SearchRecordProductWithRelations = SearchRecordProduct & SearchRecordProductRelations;
