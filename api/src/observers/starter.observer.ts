import {
  Application,
  CoreBindings,
  createBindingFromClass,
  inject,
  LifeCycleObserver, // The interface
  lifeCycleObserver, // The decorator
} from '@loopback/core';
import * as admin from 'firebase-admin';
import { getLogger, Logger } from 'log4js';
import { configure } from 'log4js';

import { LoggingCategory } from '../constants';
import { MerchantTransactionCronJob } from '../cronJobs/merchantTransaction.cronjob';

const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '');
/**
 * This class will be bound to the application as a `LifeCycleObserver` during
 * `boot`
 */
@lifeCycleObserver()
export class StarterObserver implements LifeCycleObserver {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);

  @inject(CoreBindings.APPLICATION_INSTANCE)
  private app: Application;
  constructor() {}

  /**
   * This method will be invoked when the application starts
   */
  async start(): Promise<void> {
    configure({
      appenders: {
        console: { type: 'console', layout: { type: 'colored' } },
        // alerts: {
        //   type: '@log4js-node/slack',
        //   token: 'bkS2uOvBgunVNcBD3kiGjUTX',
        //   channel_id: 'Daniel Montano', // eslint-disable-line
        //   username: 'boom'
        // }
      },
      categories: {
        [LoggingCategory.PURCHASES_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.PROFILE_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.BANK_INFO_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.PAYMENT_PROCESSING]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.CUSTOMER_BILLING]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.MERCHANT_BILLING]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.MERCHANT_PAYOUTS]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.INVENTORY_ORDERS]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.DEFAULT]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.TAXES]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.CRON_JOB]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.SHIPPING]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.PRODUCTS_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.PRODUCTS_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.STORE_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.STORE_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.TRANSACTION_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.INVENTORY_ORDERS]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.ACCOUNT]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.BOOKINGS]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.PROFILES]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.USERS]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.ORDER_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.ORDER_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.BOOM_ACCOUNT_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.CONFIG_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.BOOM_ACCOUNT_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.WITHDRAWAL_SERVICE]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        [LoggingCategory.WITHDRAWAL_CONTROLLER]: {
          appenders: ['console'],
          level: process.env.LOG_LEVEL || 'all',
        },
        //[LoggingCategory.ALERTS]: { appenders: ['alerts'], level: 'error' }
      },
    });

    this.logger.info(`APP STARTED`);

    const merchantTransactionCronJob = createBindingFromClass(MerchantTransactionCronJob);
    this.app.add(merchantTransactionCronJob);

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  /**
   * This method will be invoked when the application stops
   */
  async stop(): Promise<void> {
    // Add your logic for stop
    this.logger.info(`APP STOPPED`);
  }
}
