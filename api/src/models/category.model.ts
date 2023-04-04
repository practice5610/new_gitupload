import { Entity, model, property } from '@loopback/repository';

@model({ name: 'categories', settings: {} })
export class Category extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
  })
  _id: string;

  @property({
    name: 'createdAt',
    description: 'Date the category was created',
    type: 'number',
  })
  createdAt: number;

  @property({
    name: 'updatedAt',
    description: 'Date the category was updated',
    type: 'number',
  })
  updatedAt: number;

  @property({
    name: 'name',
    description: 'Name of the category',
    type: 'string',
  })
  name: string;

  @property({
    name: 'commissionRate',
    description: 'The rate given to determine the commission amount that goes to boom',
    type: 'number',
  })
  commissionRate: number;

  @property({
    name: 'subCategories',
    description: 'Categories that all fall under a specific category',
    type: 'array',
    itemType: 'string',
  })
  subCategories: string[];

  constructor(data?: Partial<Category>) {
    super(data);
  }
}

export interface CategoryRelations {
  // describe navigational properties here
}

export type CategoryWithRelations = Category & CategoryRelations;
