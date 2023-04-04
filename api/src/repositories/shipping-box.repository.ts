import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ShippingBox, ShippingBoxRelations } from '../models';

export class ShippingBoxRepository extends DefaultCrudRepository<
  ShippingBox,
  typeof ShippingBox.prototype._id,
  ShippingBoxRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ShippingBox, dataSource);
  }
}
