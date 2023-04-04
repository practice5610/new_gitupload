import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { CustomerBilling, CustomerBillingRelations } from '../models';

export class CustomerBillingRepository extends DefaultCrudRepository<
  CustomerBilling,
  typeof CustomerBilling.prototype._id,
  CustomerBillingRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(CustomerBilling, dataSource);
  }
}
