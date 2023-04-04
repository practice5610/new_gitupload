import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { InventoryLease, InventoryLeaseRelations } from '../models';

export class InventoryLeaseRepository extends DefaultCrudRepository<
  InventoryLease,
  typeof InventoryLease.prototype._id,
  InventoryLeaseRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(InventoryLease, dataSource);
  }
}
