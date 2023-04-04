import { ReturnRequest } from '@boom-platform/globals/lib/returns';
import { Entity, model, property } from '@loopback/repository';

@model({ name: 'return_dispute', settings: {} })
export class ReturnDisputeModel extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date return dispute was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date return dispute was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'returnRequest',
    description: 'The return request that is being disputed',
    type: 'object',
    required: true,
  })
  returnRequest: ReturnRequest;

  @property({
    name: 'isOpen',
    description:
      'True or false to let the user know if the dispute is still open / pending resolution',
    type: 'boolean',
    required: true,
  })
  isOpen: boolean;

  @property({
    name: 'comment',
    description: 'Space for a Boom Admin to provide any comments or notes regarding the dispute',
    type: 'string',
    jsonSchema: {
      minLength: 2,
      maxLength: 500,
      errorMessage: {
        minLength: 'Comments should be at least 2 characters',
        maxLength: 'Comments should not exceed 500 characters',
      },
    },
    required: true,
  })
  comment: string;
}

export interface ReturnDisputeRelations {
  /**
   * Describe navigational properties here
   */
}

export type ReturnDisputeWithRelations = ReturnDisputeModel & ReturnDisputeRelations;
