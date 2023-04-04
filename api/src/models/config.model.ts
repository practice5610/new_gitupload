import { AdminConfigType } from '@boom-platform/globals';
import { Entity, model, property } from '@loopback/repository';

/**
 * double check all of these as I have no idea what config is supposed to be...
 */

@model({ name: 'configs', settings: {} })
export class Config extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: '',
    description: '',
    type: 'number',
  })
  createdAt: number;
  /**
   * Do configs get created? What are they?
   */
  @property({
    name: '',
    description: '',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'type',
    description: 'The type of configuration being made',
    /**
     * I'm not sure if this is correct
     */
    type: 'string',
    jsonSchema: {
      enum: Object.values(AdminConfigType),
    },
  })
  type: AdminConfigType;

  @property({
    name: 'label',
    description: 'The label a user will see of a particular configuration',
    type: 'string',
  })
  label: string;

  @property({
    name: 'value',
    description: 'The value of the configuration',
    type: 'object',
  })
  value: number | { [key: string]: any };

  constructor(data?: Partial<Config>) {
    super(data);
  }
}

export interface ConfigRelations {
  // describe navigational properties here
}

export type ConfigWithRelations = Config & ConfigRelations;
