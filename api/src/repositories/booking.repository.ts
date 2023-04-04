import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';

import { MongodbDataSource } from '../datasources';
import { Booking, BookingRelations } from '../models';

export class BookingRepository extends DefaultCrudRepository<
  Booking,
  typeof Booking.prototype._id,
  BookingRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(Booking, dataSource);
  }
}
