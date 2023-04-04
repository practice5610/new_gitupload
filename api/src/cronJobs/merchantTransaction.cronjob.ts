import { CronJob, cronJob } from '@loopback/cron';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { LoggingCategory } from '../constants';
import { LeaseService } from '../services';

@cronJob()
export class MerchantTransactionCronJob extends CronJob {
  logger: Logger = getLogger(LoggingCategory.CRON_JOB);

  @service(LeaseService)
  private leaseService: LeaseService;

  constructor() {
    super({
      name: 'Monthly Leases',
      onTick: async () => {
        try {
          this.logger.log('Monthly Lease cron job invoked...');
          await this.leaseService.reviewInventoryLeases();
        } catch (error) {
          this.logger.error(error);
        }
      },
      //cronTime: '0 */1 * * * *',
      cronTime: '0 1 0 1 * *', // 00:01 hours every month first day
      start: true,
      timeZone: 'America/New_York',
      //utcOffset:
    });
  }
}
