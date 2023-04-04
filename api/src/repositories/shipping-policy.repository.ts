import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { ShippingPolicy, ShippingPolicyRelations } from '../models';

export class ShippingPolicyRepository extends DefaultCrudRepository<
  ShippingPolicy,
  typeof ShippingPolicy.prototype._id,
  ShippingPolicyRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ShippingPolicy, dataSource);
  }
}
