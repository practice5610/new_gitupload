import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ReturnRequestModel, ReturnRequestRelations } from '../models';

export class ReturnRequestRepository extends DefaultCrudRepository<
  ReturnRequestModel,
  typeof ReturnRequestModel.prototype._id,
  ReturnRequestRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ReturnRequestModel, dataSource);
  }
}
