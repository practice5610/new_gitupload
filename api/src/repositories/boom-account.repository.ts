import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { BoomAccount, BoomAccountRelations } from '../models';

export class BoomAccountRepository extends DefaultCrudRepository<
  BoomAccount,
  typeof BoomAccount.prototype._id,
  BoomAccountRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(BoomAccount, dataSource);
  }
}
