import { Entity, model, property } from '@loopback/repository';
@model({ name: 'images', settings: {} })
export class Image extends Entity {
  @property({
    name: '_id',
    description: 'Unique ID created by MongoDB',
    mongodb: { dataType: 'ObjectID' },
    id: true,
    required: false,
  })
  _id: string;

  @property({
    name: 'uploadedBy',
    description: '',
    /**
     * What info is gathered here? Name? IP Address?
     */
    type: 'string',
    required: false,
  })
  uploadedBy: string;

  @property({
    name: 'fileName',
    description: 'The unique name of the image file',
    type: 'string',
    required: false,
  })
  fileName: string;

  @property({
    name: 'path',
    description: 'The path where the image file can be found (i.e. C:Users\boomPictures)',
    /**
     * not sure with the u, b, and p are yellow... Does that negatively affect anything?
     */
    type: 'string',
    required: false,
  })
  path: string;

  @property({
    name: '',
    description: '',
    type: 'date',
    default: () => new Date(),
  })
  createdAt: 'date'; //why is this like this?
  /**
   * Why do both of these have functions in them? This file is setup differently from the rest
   */
  @property({
    name: '',
    description: '',
    type: 'date',
    default: () => new Date(),
  })
  modifiedAt: 'date'; //why is this like this? why is this not updatedAt?

  constructor(data?: Partial<Image>) {
    super(data);
  }
}

export interface ImageRelations {
  // describe navigational properties here
}

export type ImageWithRelations = Image & ImageRelations;
