import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { Config, ConfigRelations } from '../models';

export class ConfigRepository extends DefaultCrudRepository<
  Config,
  typeof Config.prototype._id,
  ConfigRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(Config, dataSource);
  }
}
