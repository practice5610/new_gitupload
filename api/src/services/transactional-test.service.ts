import { Options, repository } from '@loopback/repository';
import { IsolationLevel, transactional } from 'loopback4-spring';

import { Transaction } from '../models';
import { TransactionRepository } from '../repositories';

export class TransactionalTestService {
  constructor(
    @repository(TransactionRepository)
    private transactionRepository: TransactionRepository
  ) {}

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async test(options?: Options): Promise<void> {
    const transaction = {
      createdAt: 0,
      updatedAt: 0,
      amount: { amount: 0, precision: 2, currency: 'USD', symbol: '$' },
      title: 'Test rollback transaction.',
    } as Transaction;

    await this.transactionRepository.create(transaction, options);

    throw new Error('Transaction test error thrown.');
  }
}
