import { Gender, RoleKey } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { AddressInfoSchemaObject } from './addressInfo';
import { ContactInfoSchemaObject } from './contactInfo';
import { MoneySchemaObject } from './money';
import { ProfileImageSchemaObject } from './profileImage';

export const ProfileSchema = {
  type: 'object',
  description: "BoomUser's Profile",
  properties: {
    uid: { type: 'string', description: "BoomUser's id" },
    firstName: { type: 'string', description: "BoomUser's First Name", minLength: 2 }, // Check web\validation\schemas\FormCustomerEditProfile.ts
    lastName: { type: 'string', description: "BoomUser's Last Name", minLength: 2 }, // Check web\validation\schemas\FormCustomerEditProfile.ts
    contact: ContactInfoSchemaObject,
    addresses: {
      type: 'array',
      description: 'All Addresses that belong to this BoomUser',
      items: {
        ...AddressInfoSchemaObject,
        required: ['name', 'street1', 'city', 'state', 'zip'],
      },
    },
    createdAt: {
      type: 'integer',
      description: "Unix time when this BoomUser's profile was created",
    },
    updatedAt: {
      type: 'integer',
      description: "Last unix time when this BoomUser's profile was modified",
    },
    gender: { description: "BoomUser's gender", enum: [Gender.MALE, Gender.FEMALE, Gender.NONE] },
    registrationStep: { type: 'integer', description: "BoomUser's registration step" },
    finishedRegistration: { type: 'boolean', description: 'BoomUser is registered ' },
    roles: {
      type: 'array',
      description: "BoomUser's roles",
      items: {
        enum: [RoleKey.Admin, RoleKey.All, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin],
      },
    },
    cards: {
      //TODO: enable null or undefined
      type: 'array',
      description: "BoomUser's cards",
      items: {
        type: 'string',
      },
      nullable: true, // TODO: When we update BoomUser interfaces we should remove this
    },
    hasCards: { type: 'boolean' }, // TODO: Could be removed
    store: { type: 'object', description: "BoomUser's store" }, // TODO: Create schema for this one
    profileImg: ProfileImageSchemaObject,
    enableNotification: { type: 'boolean', description: 'BoomUser allows notifications' },
    notificationSound: { type: 'boolean', description: 'BoomUser allows notifications sound' },
    notificationVibration: {
      type: 'boolean',
      description: 'BoomUser allows notifications vibrations',
    },
    fcmToken: { type: 'string' },
    range: { type: 'integer' },
    grossEarningsPendingWithdrawal: MoneySchemaObject,
    netEarningsPendingWithdrawal: MoneySchemaObject,
    tempPassword: { type: 'string' }, // TODO: Need to be removed on ticket 1412
    password: { type: 'string' }, // TODO: Need to be removed on ticket 1412
    plaidInfo: {
      type: 'array',
      items: {
        type: 'object', // TODO: Create schema for this one
      },
    },
    taxableNexus: {
      type: 'array',
      items: {
        type: 'object', // TODO: Create schema for this one
      },
    },
    boomAccounts: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    forceUpdate: { type: 'boolean' }, // Used on our Firebase functions "functions\functions\src\user.ts"
  },
  //required: ['uid', 'contact', 'addresses', 'createdAt', 'updatedAt'], // old default ones
  required: [],
  additionalProperties: true, // TODO: set to false once this ticket is completed : 1655 - [API] Create path to update BoomUser account data
} as const;

export const ProfileSchemaObject: SchemaObject = {
  ...ProfileSchema,
  properties: {
    ...ProfileSchema.properties,
    addresses: {
      ...ProfileSchema.properties.addresses,
      items: {
        ...ProfileSchema.properties.addresses.items,
        required: [...ProfileSchema.properties.addresses.items.required],
      },
    },
    gender: { ...ProfileSchema.properties.gender, enum: [...ProfileSchema.properties.gender.enum] },
    roles: {
      ...ProfileSchema.properties.roles,
      items: { enum: [...ProfileSchema.properties.roles.items.enum] },
    },
  },
  //required: [...ProfileSchema.required, 'uid', 'createdAt', 'updatedAt', 'roles'], // These defaults are always set (also available on api\src\services\profile.service.ts)
  required: [...ProfileSchema.required],
};
