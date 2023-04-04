import { AllOptionalExceptFor, BoomUser, StoreTypes } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'stores', settings: { strict: false } })
export class SearchRecordStore extends Entity {
  @property({
    name: 'id',
    description: 'Unique ID',
    type: 'string',
  })
  id?: string;

  @property({
    name: 'createdAt',
    description: 'The date the store was created',
    type: 'number',
  })
  createdAt?: number;
  /**
   * Are these date pertaining to the store or the search? I think store
   */
  @property({
    name: 'updatedAt',
    description: 'The date the store was updated',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'companyLogoUrl',
    description: 'The URL to the company logo',
    type: 'string',
  })
  companyLogoUrl?: string;

  @property({
    name: 'coverImageUrl',
    description: 'The URL to the company cover image',
    type: 'string',
  })
  coverImageUrl?: string;

  @property({
    name: 'companyType',
    description: 'The type of company. Whether it is an LLC, Corp, etc',
    type: 'string',
  })
  companyType?: string;

  @property({
    name: 'companyName',
    description: 'Name of the company',
    type: 'string',
  })
  companyName?: string;

  @property({
    name: 'companyDescription',
    description: 'Description of the company',
    type: 'string',
  })
  companyDescription?: string;

  @property({
    name: 'years',
    description: 'How many years the company has been in business',
    years: 'number',
  })
  years?: number;

  @property({
    name: 'storeType',
    description: 'The type of store. Whether it is an online store, brick and mortar, or both',
    type: 'string',
    jsonSchema: {
      enum: Object.values(StoreTypes),
    },
  })
  storeType?: StoreTypes;

  @property({
    name: 'links',
    description: 'Any links pertaining to the store/company like Facebook, Instagram, etc',
    type: 'array',
    itemType: 'string',
  })
  links?: string[];

  @property({
    name: 'emails',
    description:
      'Any email addresses pertaining to the store/company that a customer can use to reach out to a merchant',
    type: 'array',
    itemType: 'string',
  })
  emails?: string[];

  @property({
    name: 'phoneNumber',
    description:
      'The phone number to the store/company that a customer can use to reach out to a merchant',
    type: 'string',
  })
  phoneNumber?: string;

  @property({
    name: 'number',
    description: 'The building number in the store/company address',
    type: 'string',
  })
  number?: string;

  @property({
    name: 'street1',
    description: 'The street address of the store/company address',
    type: 'string',
  })
  street1?: string;

  @property({
    name: 'street2',
    description: 'The suite number of the store/company',
    type: 'string',
  })
  street2?: string;

  @property({
    name: 'city',
    description: 'The city the store/company is located in',
    type: 'string',
  })
  city?: string;

  @property({
    name: 'state',
    description: 'The state the store/company is located in',
    type: 'string',
  })
  state?: string;

  @property({
    name: 'zip',
    description: 'The zipcode the store/company is located in',
    type: 'string',
  })
  zip?: string;

  @property({
    name: 'country',
    description: 'The country the store/company is located in',
    type: 'string',
  })
  country?: string;

  @property({
    name: '_tags',
    description: '',
    /**
     * Still not sure how to classify tags
     */
    type: 'array',
    itemType: 'string',
  })
  _tags?: string[];

  @property({
    name: '_geoloc',
    description: 'The coordinates of the store/company',
    type: 'object',
  })
  _geoloc: { lat: number; lon: number };

  @property({
    name: 'openingTime',
    description: 'The opening hours of the store/company',
    type: 'string',
  })
  openingTime?: string;

  @property({
    name: 'closingTime',
    description: 'The closing hours of the store/company',
    type: 'string',
  })
  closingTime?: string;

  @property({
    name: 'days',
    description: 'The days of the week the store/company is open',
    type: 'array',
    itemType: 'string',
    default: ['sun', 'mon', 'tue', 'wed', 'thr', 'fri', 'sat'],
  })
  days?: string[];

  @property({
    name: 'merchant',
    description: 'The merchant for the store/company. Usually a store/company owner or admin',
    type: 'object',
  })
  merchant?: AllOptionalExceptFor<BoomUser, 'uid' | 'firstName' | 'lastName'>;

  constructor(data?: Partial<SearchRecordStore>) {
    super(data);
  }
}

export interface SearchRecordStoreRelations {
  // describe navigational properties here
}

export type SearchRecordStoreWithRelations = SearchRecordStore & SearchRecordStoreRelations;
