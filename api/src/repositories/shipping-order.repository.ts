import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ShippingOrder, ShippingOrderRelations } from '../models';

export class ShippingOrderRepository extends DefaultCrudRepository<
  ShippingOrder,
  typeof ShippingOrder.prototype._id,
  ShippingOrderRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ShippingOrder, dataSource);
  }
}
