import { Filter, repository } from '@loopback/repository';
import { Options } from '@loopback/repository';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  FulfillmentStatus,
  LoggingCategory,
  MerchantTransactionStatus,
  MerchantTransactionType,
} from '../constants';
import { InventoryItem, InventoryLease, MerchantTransaction } from '../models';
import {
  InventoryItemRepository,
  InventoryLeaseRepository,
  MerchantTransactionRepository,
} from '../repositories';
import { EmailService } from '../services';
import { MerchantTransactionService } from '../services';

const boomAdminEmail: string = process.env.BOOM_TECHNICAL_ADMIN_EMAIL || 'noel@boomcarding.com';

export class LeaseService {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);

  constructor(
    @repository(InventoryLeaseRepository)
    public inventoryLeaseRepository: InventoryLeaseRepository,
    @repository(InventoryItemRepository)
    public inventoryItemRepository: InventoryItemRepository,
    @repository(MerchantTransactionRepository)
    public merchantTransactionRepository: MerchantTransactionRepository,
    @service(EmailService)
    private emailService: EmailService,
    @service(MerchantTransactionService)
    public merchantTransactionService: MerchantTransactionService
  ) {}

  /**
   * Called by a cron function to create the transactions remaining for each Lease
   * @param {Options} [options]
   * @return {*}  {Promise<any>}
   * @memberof LeaseService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async reviewInventoryLeases(options?: Options): Promise<any> {
    let now: number = moment().utc().unix();
    //console.log('subtract', moment().subtract(2, 'month').utc().unix());
    try {
      const filter: Filter<InventoryLease> = {
        where: {
          and: [{ fulfillmentStatus: FulfillmentStatus.ACTIVE }],
        },
      };

      const result: InventoryLease[] = await this.inventoryLeaseRepository.find(filter);

      const merchantTransactions: MerchantTransaction[] = [];
      const inventoryLeases: object[] = [];

      for (const item of result) {
        console.log('time', moment.unix(item.createdAt));
        console.log(
          'Months since creation :',
          moment.unix(now).diff(moment.unix(item.createdAt), 'months')
        );
        console.log(
          'Last charged was in current month :',
          moment.unix(item.lastChargedAt),
          ' : ',
          moment.unix(now).isSame(moment.unix(item.lastChargedAt), 'month')
        );

        //Checks if more than 1 month has passed since the lease creation
        if (
          moment.unix(now).diff(moment.unix(item.createdAt), 'months') > 1 &&
          !moment.unix(now).isSame(moment.unix(item.lastChargedAt), 'month')
        ) {
          now = moment().utc().unix();
          const merchantTransaction: MerchantTransaction = {
            createdAt: now,
            updatedAt: now,
            status: MerchantTransactionStatus.PENDING,
            type: MerchantTransactionType.RECURRING,
            amount: item.leaseAmount,
            merchant: item.merchant,
            store: item.store,
            purchaseItem: item.inventoryItem,
            inventoryLease: item,
          } as MerchantTransaction;

          merchantTransactions.push(merchantTransaction);

          inventoryLeases.push({ _id: item._id });
          /*await this.inventoryLeaseRepository.updateById(
            item._id,
            {
              lastChargedAt: now,
              updatedAt: now,
            },
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );*/
        }
      }

      if (inventoryLeases.length > 0) {
        await this.inventoryLeaseRepository.updateAll(
          {
            lastChargedAt: now,
            updatedAt: now,
          },
          { or: inventoryLeases },
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        );
        this.logger.debug(`update inventory leases count is ${inventoryLeases.length}`);
      }

      await this.merchantTransactionService.createMerchantTransactions(
        merchantTransactions,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );

      console.log('boomAdminEmail', boomAdminEmail);
      await this.emailService.send({
        to: boomAdminEmail,
        from: 'Boom Rewards <noreply@boomcarding.com>',
        subject: 'Inventory lease successfully completed',
        html: this.emailService.mailGenerator.generate({
          body: {
            name: 'Boom',
            intro: `Inventory lease billing cron job successfully completed`,
          },
        }),
      });
    } catch (error) {
      this.logger.error(error);
      const dictionary: any = {
        diagnosticsData: error.toJSON(),
      };
      await this.emailService.sendAppError(
        'Inventory lease failed',
        'Inventory lease billing cron job failed with errors',
        dictionary
      );
      throw new Error(error);
    }
  }

  async swapItems(
    oldItem: InventoryItem,
    newItem: InventoryItem,
    newLease: InventoryLease
  ): Promise<void> {
    if (!newLease.inventoryItem._id) return;
    await this.inventoryItemRepository.updateById(oldItem._id, oldItem);
    await this.inventoryItemRepository.updateById(
      newLease.inventoryItem._id,
      newLease.inventoryItem
    );
    await this.inventoryLeaseRepository.updateById(newLease._id, newLease);
  }
}
