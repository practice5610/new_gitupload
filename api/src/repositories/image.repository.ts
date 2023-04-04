import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { Image, ImageRelations } from '../models';

export class ImageRepository extends DefaultCrudRepository<
  Image,
  typeof Image.prototype._id,
  ImageRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(Image, dataSource);
  }
}
