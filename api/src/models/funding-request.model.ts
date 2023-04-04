import { Money } from '@boom-platform/globals';
import { Model, model, property } from '@loopback/repository';

@model({ settings: {} })
export class FundingRequest extends Model {
  @property({
    name: 'uid',
    description: 'Unique ID',
    /**
     * Is that all? What is the id for maybe?
     */
    type: 'string',
    id: true,
    required: true,
  })
  uid: string;

  @property({
    name: 'nonce',
    description: '',
    /**
     * What is nonce?
     */
    type: 'string',
    required: true,
  })
  nonce: string;

  @property({
    name: 'amount',
    description:
      'The monetary value linked to the funding request. (i.e. how much money is being requested)',
    type: 'object',
    required: true,
  })
  amount: Money;

  @property({
    name: 'publicToken',
    description: '',
    /**
     * What is this? How is it used?
     */
    type: 'string',
    required: true,
  })
  publicToken: string;

  @property({
    name: 'plaidAccessToken',
    description: 'Unique access token provided by Plaid',
    /**
     * Honestly I'm not even quite sure what this one does...
     */
    type: 'string',
    required: true,
  })
  plaidAccessToken: string;

  @property({
    name: 'plaidAccountId',
    description: 'Unique account ID provided by Plaid',
    /**
     * These are provided to protect the user's bank account number right?
     */
    type: 'string',
    required: true,
  })
  plaidAccountId: string;

  constructor(data?: Partial<FundingRequest>) {
    super(data);
  }
}

export interface FundingRequestRelations {
  // describe navigational properties here
}

export type FundingRequestWithRelations = FundingRequest & FundingRequestRelations;
