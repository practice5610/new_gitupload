import { BoomCardStatus } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'boomcards', settings: {} })
export class BoomCard extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date the boom card was assigned to a user',
    type: 'number',
  })
  createdAt: number;
  /**
   * Verify these date descriptions
   * maybe updated date is because the boom card expired? Do boom cards expire?????
   */
  @property({
    name: 'updatedAt',
    description: 'Date the boom card info was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'cardNumber',
    description: 'The unique card number assigned to each boom card given to each boom user',
    type: 'string',
    required: true,
  })
  cardNumber: string;

  @property({
    name: 'pinNumber',
    description:
      'Unique 4-6 digit number chosen by the user to be used as their pin when making purchases',
    /**
     * is this correct? are pins automatically assigned that a user can then change? is it for making purchases?
     */
    type: 'number',
  })
  pinNumber: number;

  @property({
    name: 'status',
    description: 'The status of the boom card itself. Whether it is active, inactive, or blocked',
    /**
     * I don't understand the point of the inactive issued status
     */
    type: 'string',
    jsonSchema: {
      enum: Object.values(BoomCardStatus),
    },
    default: BoomCardStatus.INACTIVE,
    required: true,
  })
  status: BoomCardStatus;

  @property({
    name: 'boomAccountID',
    description: 'Unique ID given to each boom account',
    type: 'object',
  })
  boomAccountID: string;

  @property({
    name: 'qrcode',
    description:
      'Unique code generated for users to scan with their phones to access certain features',
    /**
     * what features are these linked to?
     */
    type: 'string',
  })
  qrcode: string;

  @property({
    name: 'fromBatchId',
    description: '',
    /**
     * I have no idea what this is...
     */
    type: 'string',
    required: true,
  })
  fromBatchId: string;

  @property({
    name: 'storeID',
    description: 'The unique ID for a given store',
    /**
     * How is this used?
     */
    type: 'string',
  })
  storeID?: string;

  @property({
    name: 'storeMerchantID',
    description: 'The unique ID for a given merchant of a given store',
    type: 'string',
  })
  storeMerchantID?: string;

  @property({
    name: 'customerID',
    description: 'The unique ID for a given customer',
    type: 'string',
  })
  customerID?: string;

  constructor(data?: Partial<BoomCard>) {
    super(data);
  }
}

export interface BoomCardRelations {
  // describe navigational properties here
}

export type BoomCardWithRelations = BoomCard & BoomCardRelations;
