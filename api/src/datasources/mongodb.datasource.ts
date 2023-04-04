require('dotenv').config();
import { bind, inject } from '@loopback/core';
import { juggler } from '@loopback/repository';

import * as devConfig from './mongodb.datasource--dev.json';
import * as dockerConfig from './mongodb.datasource--docker.json';
import * as localDevConfig from './mongodb.datasource--local-dev.json';
import * as localProdConfig from './mongodb.datasource--local-production.json';
import * as prodConfig from './mongodb.datasource--prod.json';
import * as qaConfig from './mongodb.datasource--qa.json';

const configMap: { [key: string]: object } = {
  'local-dev': localDevConfig,
  dev: devConfig,
  qa: qaConfig,
  prod: prodConfig,
  'local-prod': localProdConfig,
  docker: dockerConfig,
};

const key: string = process.env.DB_ENV || 'local-dev';

console.log('Will use', key, 'database config');

const config = configMap[key];

@bind({
  tags: ['transactional'],
})
export class MongodbDataSource extends juggler.DataSource {
  static dataSourceName = 'mongodb';

  constructor(
    @inject('datasources.config.mongodb', { optional: true })
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
