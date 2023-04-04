import { AccountBalanceInfo, AccountOwnerInfo } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'bank_info', settings: {} })
export class BankInfo extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id?: string;

  @property({
    name: 'createdAt',
    description: 'Date ',
    type: 'number',
  })
  createdAt?: number;
  /**
   * need to see how to describe these dates
   */
  @property({
    name: 'createdAt',
    description: 'Date ',
    type: 'number',
  })
  updatedAt?: number;

  @property({
    name: 'plaidID',
    description: 'Unique ID generated through Plaid',
    type: 'string',
  })
  plaidID: string;

  @property({
    name: 'accountNumber',
    description: 'The bank account number for the user',
    type: 'string',
  })
  accountNumber: string;

  @property({
    name: 'routingNumber',
    description:
      'The routing number for the bank the user uses. Each bank has their own routing number',
    type: 'string',
  })
  routingNumber: string;

  @property({
    name: 'wireRoutingNumber',
    description:
      'The wire routing number for the bank the user uses. This will be different from the routing number for each bank',
    type: 'string',
  })
  wireRoutingNumber: string;

  @property({
    name: 'plaidItemID',
    description: 'Unique item ID that is provided by Plaid',
    type: 'string',
  })
  plaidItemID: string;

  @property({
    name: 'plaidAccessToken',
    description: 'Unique access token that is provided by Plaid',
    type: 'string',
  })
  plaidAccessToken: string;

  @property({
    name: 'name',
    description: 'The name of the bank',
    type: 'string',
  })
  name: string;

  @property({
    name: 'userID',
    description: 'The unique ID of the user',
    type: 'string',
  })
  userID: string;

  @property({
    name: 'accountOwner',
    description:
      'Information gathered from the bank by Plaid regarding the user/owner of the account. This includes their name, phone number, address, and emails.',
    type: 'object',
  })
  accountOwner: AccountOwnerInfo;

  @property({
    name: 'balances',
    description:
      'Balance information gathered by Plaid regarding how much funds the user has available to them, the current account standings, and their banking limits.',
    type: 'object',
  })
  balances: Pick<AccountBalanceInfo, 'available' | 'current' | 'limit'>;

  constructor(data?: Partial<BankInfo>) {
    super(data);
  }
}

export interface BankInfoRelations {
  // describe navigational properties here
}

export type BankInfoWithRelations = BankInfo & BankInfoRelations;
