import { BoomAccountStatus, Money } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'boom_accounts', settings: {} })
export class BoomAccount extends Entity {
  @property({
    mongodb: { dataType: 'ObjectID' },
    id: true,
    required: false,
    name: '_id',
    description: 'Boom account instance database unique identifier.',
  })
  _id: string;

  @property({
    name: 'createdAt',
    description:
      'Boom account date of creation in unix epoch time format, should be set on instance creation and never updated.',
    type: 'number',
    required: false,
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description:
      'Boom account date of update in unix epoch time format, should be set on instance creation and updated in any modification.',
    type: 'number',
    required: false,
  })
  updatedAt: number;

  @property({
    name: 'status',
    description: 'Boom account current Status.',
    type: 'string',
    required: false,
  })
  status: BoomAccountStatus;

  @property({
    name: 'balance',
    description: 'Boom account current balance.',
    type: 'object',
    required: false,
  })
  balance: Money;

  @property({
    name: 'customerID',
    description: 'Boom user database identifier, related to boom account instance owner',
    type: 'string',
    required: false,
  })
  customerID: string;

  constructor(data?: Partial<BoomAccount>) {
    super(data);
  }
}

export interface BoomAccountRelations {
  // describe navigational properties here
}

export type BoomAccountWithRelations = BoomAccount & BoomAccountRelations;
