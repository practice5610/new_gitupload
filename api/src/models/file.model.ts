import { Entity, model, property } from '@loopback/repository';

@model({ name: 'file', settings: {} })
export class File extends Entity {
  @property({
    name: 'name',
    description: 'Unite name or title of a file',
    type: 'string',
  })
  name?: string;

  @property({
    name: 'size',
    description: 'The size of the file',
    type: 'number',
  })
  size?: number;

  constructor(data?: Partial<File>) {
    super(data);
  }
}
