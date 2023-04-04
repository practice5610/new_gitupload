import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ReturnDisputeModel, ReturnDisputeRelations } from '../models';

export class ReturnDisputeRepository extends DefaultCrudRepository<
  ReturnDisputeModel,
  typeof ReturnDisputeModel.prototype._id,
  ReturnDisputeRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ReturnDisputeModel, dataSource);
  }
}
