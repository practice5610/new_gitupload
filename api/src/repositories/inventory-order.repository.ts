import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { InventoryOrder, InventoryOrderRelations } from '../models';

export class InventoryOrderRepository extends DefaultCrudRepository<
  InventoryOrder,
  typeof InventoryOrder.prototype._id,
  InventoryOrderRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(InventoryOrder, dataSource);
  }
}
