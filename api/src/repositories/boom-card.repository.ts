import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { BoomCard, BoomCardRelations } from '../models';

export class BoomCardRepository extends DefaultCrudRepository<
  BoomCard,
  typeof BoomCard.prototype._id,
  BoomCardRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(BoomCard, dataSource);
  }
}
