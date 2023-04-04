import { Entity, model, property } from '@loopback/repository';

@model()
export class StorageContainer extends Entity {
  @property({
    name: 'name',
    description: 'The name or title of a storage container',
    type: 'string',
    required: true,
  })
  name: string;

  constructor(data?: Partial<StorageContainer>) {
    super(data);
  }
}
