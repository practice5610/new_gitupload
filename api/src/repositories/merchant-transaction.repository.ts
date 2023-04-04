import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { MerchantTransaction, MerchantTransactionRelations } from '../models';

export class MerchantTransactionRepository extends DefaultCrudRepository<
  MerchantTransaction,
  typeof MerchantTransaction.prototype._id,
  MerchantTransactionRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(MerchantTransaction, dataSource);
  }
}
