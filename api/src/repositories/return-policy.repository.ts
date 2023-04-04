import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ReturnPolicyModel, ReturnPolicyRelations } from '../models';

export class ReturnPolicyRepository extends DefaultCrudRepository<
  ReturnPolicyModel,
  typeof ReturnPolicyModel.prototype._id,
  ReturnPolicyRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ReturnPolicyModel, dataSource);
  }
}
