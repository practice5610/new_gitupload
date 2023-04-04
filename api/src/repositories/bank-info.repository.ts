import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { BankInfo, BankInfoRelations } from '../models';

export class BankInfoRepository extends DefaultCrudRepository<
  BankInfo,
  typeof BankInfo.prototype._id,
  BankInfoRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(BankInfo, dataSource);
  }
}
