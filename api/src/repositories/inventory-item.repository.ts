import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { InventoryItem, InventoryItemRelations } from '../models';

export class InventoryItemRepository extends DefaultCrudRepository<
  InventoryItem,
  typeof InventoryItem.prototype._id,
  InventoryItemRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(InventoryItem, dataSource);
  }
}
