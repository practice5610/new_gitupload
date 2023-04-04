import { inject } from '@loopback/core';
import { juggler } from '@loopback/service-proxy';

import * as config from './storage.datasource.json';
const finalConfig = { ...config };
export class StorageDataSource extends juggler.DataSource {
  static dataSourceName = 'Storage';

  constructor(
    @inject('datasources.config.Storage', { optional: true })
    dsConfig: object = finalConfig
  ) {
    super(dsConfig);
  }
}
