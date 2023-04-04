import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { Order, OrderRelations } from '../models';

export class OrderRepository extends DefaultCrudRepository<
  Order,
  typeof Order.prototype._id,
  OrderRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(Order, dataSource);
  }
}
