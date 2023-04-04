import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { Store, StoreRelations } from '../models';

export class StoreRepository extends DefaultCrudRepository<
  Store,
  typeof Store.prototype._id,
  StoreRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(Store, dataSource);
  }
}
