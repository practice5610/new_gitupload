import { AllOptional, BoomUser, RoleKey } from '@boom-platform/globals';
import { SchemaObject } from '@loopback/openapi-v3';

import { FirebaseFilter } from '../../types';
import { TimeRangeRegex } from '../../utils/tempLocation';

export type FilterAdminUsersType = FirebaseFilter<
  AllOptional<Pick<BoomUser, 'uid' | 'hasCards'>> & {
    roles?: [RoleKey.Member | RoleKey.Merchant];
    createdAt?: string;
  }
>;
/*export const FilterAdminUsersSchema = {
  ...FilterAdminUsersSchemaObject,
} as const;*/

export const FilterAdminUsersSchemaObject: SchemaObject = {
  //$schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  description: 'Filter used to get users records from Firebase',
  properties: {
    where: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: "User's id to search for" },
        hasCards: { type: 'boolean', description: "Filter by users who have cards or haven't" },
        roles: {
          type: 'array',
          items: { enum: [RoleKey.Member, RoleKey.Merchant] },
          description: 'Filter by roles, only one role can be set, member or merchant, not both',
        },
        createdAt: {
          type: 'string',
          pattern: TimeRangeRegex.source,
          description: 'Unix time, it could be a fixed time to start the search, or a time range',
        },
      },
      additionalProperties: false,
    },
  },
  required: ['where'],
  additionalProperties: false,
};
