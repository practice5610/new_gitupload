import { BoomUser } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

import { ActivityLogOperation, ActivityLogOperatorRole } from '../constants';
import { InventoryLease } from './inventory-lease.model';
import { InventoryOrder } from './inventory-order.model';
import { Transaction } from './transaction.model';

@model({ name: 'activity_logs', settings: {} })
export class ActivityLog extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'Date that a new activity gets logged',
    type: 'number',
    required: true,
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date that an activity is updated',
    type: 'number',
    required: true,
  })
  updatedAt: number;

  /**How do I make the name and description for this one? */
  @property.array(Object)
  documents?: (InventoryOrder | Transaction | InventoryLease)[];

  @property({
    name: 'operation',
    description: 'The operation of each activity logged (i.e. created, cancelled, shipped, closed)',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ActivityLogOperation),
    },
  })
  operation: ActivityLogOperation;

  /**What should I put for this description? I'm not sure what user we will have */
  @property({
    name: 'user',
    description: '',
    type: 'object',
  })
  user?: BoomUser;

  @property({
    name: 'operatorRole',
    description:
      'The role of the activity log operator (i.e. merchant, customer, admin, superadmin, system)',
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ActivityLogOperatorRole),
    },
  })
  operatorRole: ActivityLogOperatorRole;

  constructor(data?: Partial<ActivityLog>) {
    super(data);
  }
}

export interface ActivityLogRelations {
  // describe navigational properties here
}

export type ActivityLogWithRelations = ActivityLog & ActivityLogRelations;
