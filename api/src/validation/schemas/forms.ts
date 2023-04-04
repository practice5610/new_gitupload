import { RoleKey } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { ContactInfoSchema } from './contactInfo';
import { ProfileSchema } from './profile';

export type VerifyPhoneNumberType = {
  firstName: string;
  lastName: string;
  phone: string;
};
export const VerifyPhoneNumberSchemaObject: SchemaObject = {
  type: 'object',
  description: "BoomUser's Profile",
  properties: {
    firstName: ProfileSchema.properties.firstName,
    lastName: ProfileSchema.properties.lastName,
    phone: ContactInfoSchema.properties.phoneNumber,
  },
  required: ['firstName', 'lastName', 'phone'],
  additionalProperties: false,
};

export type CreateUserType = {
  email: string;
  password: string;
  roles: RoleKey[];
};
export const CreateUserSchemaObject: SchemaObject = {
  type: 'object',
  description: "BoomUser's Profile",
  properties: {
    email: {
      ...ContactInfoSchema.properties.emails.items,
      description: 'Email for this BoomUser',
    },
    password: { type: 'string', minLength: 6, description: 'Password for this BoomUser' },
    roles: {
      type: 'array',
      items: { enum: [RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin] },
      description: 'Roles for this BoomUser',
    },
  },
  required: ['email', 'password', 'roles'],
  additionalProperties: false,
};
