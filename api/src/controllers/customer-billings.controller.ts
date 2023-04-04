import { AllOptionalExceptFor, RoleKey } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  param,
  patch,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger } from 'log4js';

import { authorize } from '../authorization';
import { LoggingCategory } from '../constants';
import { CustomerBilling, Transaction } from '../models';
import { CustomerBillingRepository, TransactionRepository } from '../repositories';

/**
 * Controller for managing of customer related billing queries
 */
export class CustomerBillingsController {
  logger = getLogger(LoggingCategory.CUSTOMER_BILLING);

  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @repository(CustomerBillingRepository)
    public customerBillingRepository: CustomerBillingRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  /**
   * Gets the customer billing info with optional filter.
   * Customer billings tell the Boom admin what checks have been paid and which are pending creation.
   * @param filter
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/customer-billings', {
    responses: {
      '200': {
        description: 'Billing data for customers',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Object } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(CustomerBilling))
    filter?: Filter<CustomerBilling>
  ): Promise<object> {
    return this.customerBillingRepository.find(filter);
  }

  /**
   * Updates the customer billing transaction state
   * @param billings
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/customer-billings', {
    responses: {
      '200': {
        description: 'update transaction object',
        content: { 'application/json': { schema: Object } },
      },
    },
  })
  async updateBillings(
    @requestBody() billings: AllOptionalExceptFor<CustomerBilling, 'transaction'>[]
  ): Promise<object> {
    try {
      this.logger.info('Customer billing update requested');
      this.logger.debug('Billings count:', billings.length);

      for (const billing of billings) {
        this.logger.debug('Customer Billing:', billing);
        this.logger.debug('Will update billing transaction with this data:', billing.transaction);

        await this.transactionRepository.updateById(
          billing.transaction._id,
          billing.transaction as Transaction
        );

        this.logger.debug('Finding customer billing with ID of:', billing._id);
        const oldTransaction = (await this.customerBillingRepository.findById(billing._id))
          .transaction;
        this.logger.debug('Customer billing found with transaction:', oldTransaction);

        billing.transaction = {
          ...oldTransaction,
          ...billing.transaction,
        };
        this.logger.debug(
          'Will update customer billing record with new transaction data',
          billing.transaction
        );
        await this.customerBillingRepository.updateById(billing._id, billing);
        this.logger.info('Customer billing udpated.');
      }
      return this.response.json({ success: true });
    } catch (err) {
      this.logger.error(err.message);
      return this.response.json({ success: false, message: err.message });
    }
  }
}
