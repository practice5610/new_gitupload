import {
  AllOptionalExceptFor,
  BoomUser,
  Geolocation,
  PhoneRegex,
  StoreTypes,
} from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';
export class StoreBasic extends Entity {
  @property({
    mongodb: { dataType: 'ObjectID' },
    id: true,
    name: '_id',
    description: 'Store instance database unique identifier.',
  })
  _id: string;

  @property({
    name: 'companyName',
    description: 'Legal company name.',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Name should be at least 2 characters.',
        maxLength: 'Name should not exceed 80 characters.',
      },
    },
  })
  companyName: string;

  @property({
    name: 'emails',
    description: 'Store email address list.',
    type: 'array',
    itemType: 'string',
    required: true,
  })
  emails: string[];

  @property({
    name: 'phoneNumber',
    description: 'Store phone number.',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 10,
      maxLength: 15,
      pattern: PhoneRegex.source,
      errorMessage: {
        minLength: 'Phone Number should be at least 10 characters.',
        maxLength: 'Phone Number should not exceed 15 characters.',
        pattern: 'Invalid phone number.',
      },
    },
  })
  phoneNumber: string;

  @property({
    name: 'number',
    description: 'House number or building number of HQ or store location.',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 10,
      errorMessage: {
        minLength: 'House number or building number should be at least 1 characters.',
        maxLength: 'House number or building number should not exceed 10 characters.',
      },
    },
  })
  number: string;

  @property({
    name: 'street1',
    description: 'Street address of HQ or store location',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Street should be at least 2 characters.',
        maxLength: 'Street should not exceed 80 characters.',
      },
    },
  })
  street1: string;

  @property({
    name: 'street2',
    description: 'Apt or suite number of HQ or store location',
    type: 'string',
    jsonSchema: {
      minLength: 2,
      maxLength: 80,
      errorMessage: {
        minLength: 'Street2 should be at least 2 characters.',
        maxLength: 'Street2 should not exceed 80 characters.',
      },
    },
  })
  street2?: string;

  @property({
    name: 'city',
    description: 'City of HQ or store location',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 30,
      errorMessage: {
        minLength: 'City should be at least 2 characters.',
        maxLength: 'City should not exceed 30 characters.',
      },
    },
  })
  city: string;

  @property({
    name: 'state',
    description: 'State of HQ or store location',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 2,
      errorMessage: 'State must be 2 characters.',
    },
  })
  state: string;

  @property({
    name: 'zip',
    description: 'Zip code of HQ or store location',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 30,
      errorMessage: {
        minLength: 'Zip should be at least 1 characters.',
        maxLength: 'Zip should not exceed 30 characters.',
      },
    },
  })
  zip: string;

  @property({
    name: 'country',
    description: 'Country of HQ or store location',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 2,
      errorMessage: 'Country must have 2 characters.',
    },
  })
  country: string;
}

@model({ name: 'stores', settings: {} })
export class Store extends StoreBasic {
  @property({
    name: 'pin',
    description: '5 digit control access pin used for tablet',
    type: 'number',
    jsonSchema: {
      minLength: 5,
      maxLength: 5,
      errorMessage: 'Pin must have 5 characters.',
    },
  })
  pin?: number;

  @property({
    name: 'objectID',
    description: 'The Algolia document ID',
    type: 'string',
    id: true,
  })
  objectID?: string; // TODO: This needs to be removed(already removed from globals), it was used by Algolia - "The Algolia document ID"

  @property({
    name: 'createdAt',
    description: 'Date Store was created with Boom',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date Store was updated by merchant',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'companyLogoUrl',
    description: 'Image URL for Company Logo',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 1000,
      errorMessage: {
        minLength: 'companyLogoUrl should be at least 1 characters.',
        maxLength: 'companyLogoUrl should not exceed 1000 characters.',
      },
    },
  })
  companyLogoUrl: string;

  @property({
    name: 'coverImageUrl',
    description: 'Image URL for Company Cover Image',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 1000,
      errorMessage: {
        minLength: 'coverImageUrl should be at least 1 characters.',
        maxLength: 'coverImageUrl should not exceed 1000 characters.',
      },
    },
  })
  coverImageUrl: string;

  @property({
    name: 'companyType',
    description: 'Type of bussines registration LLC, S-Corp, etc',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 3,
      maxLength: 30,
      errorMessage: {
        minLength: 'companyType should be at least 3 characters.',
        maxLength: 'companyType should not exceed 30 characters.',
      },
    },
  })
  companyType: string;

  @property({
    name: 'companyDescription',
    description: 'Description about the Company',
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 5,
      maxLength: 280,
      errorMessage: {
        minLength: 'companyDescription should be at least 5 characters.',
        maxLength: 'companyDescription should not exceed 280 characters.',
      },
    },
  })
  companyDescription: string;

  @property({
    name: 'fein',
    description: 'Federal Tax Number',
    type: 'number',
    required: true,
  })
  fein: number;

  @property({
    name: 'years',
    description: 'Years in business',
    years: 'number',
    required: true,
    jsonSchema: {
      maximum: 23,
      minimum: 0,
      errorMessage: {
        maximum: 'Years in business should not exceed 200 years.',
        minimum: 'Years in business should be at least 0 years.',
      },
    },
  })
  years: number;

  @property({
    name: 'storeType',
    description: 'Online, Brick & Mortar, or Online and Brick & Mortar',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(StoreTypes),
    },
  })
  storeType: StoreTypes;

  @property({
    name: 'links',
    description: 'Website and social media list of links',
    type: 'array',
    itemType: 'string',
  })
  links: string[];

  @property({
    name: '_tags',
    description: 'Special Algolia field holding array of keywords that aid in search',
    type: 'array',
    itemType: 'string',
  })
  _tags: string[];

  @property({
    name: '_geoloc',
    description: 'Special Algolia field that aids in geolocation searches',
    type: 'object',
  })
  _geoloc: Geolocation;

  @property({
    name: 'openingTime',
    description: '0-23 (24 hour time)',
    type: 'number',
    jsonSchema: {
      maximum: 23,
      minimum: 0,
      errorMessage: {
        maximum: 'closingTime should not exceed 23.',
        minimum: 'closingTime should be at least 0.',
      },
    },
  })
  openingTime: number;

  @property({
    name: 'closingTime',
    description: '0-23 (24 hour time)',
    type: 'number',
    jsonSchema: {
      maximum: 23,
      minimum: 0,
      errorMessage: {
        maximum: 'closingTime should not exceed 23.',
        minimum: 'closingTime should be at least 0.',
      },
    },
  })
  closingTime: number;

  @property({
    name: 'days',
    description: 'Company operating days list',
    type: 'array',
    itemType: 'string',
    default: ['sun', 'mon', 'tue', 'wed', 'thr', 'fri', 'sat'],
  })
  days: string[];

  @property({
    name: 'merchant',
    description: 'The store owner instance',
    type: 'object',
    required: true,
  })
  merchant: AllOptionalExceptFor<BoomUser, 'uid' | 'firstName' | 'lastName'>;

  constructor(data?: Partial<Store>) {
    super(data);
  }
}

export interface StoreRelations {
  // describe navigational properties here
}

export type StoreWithRelations = Store & StoreRelations;
