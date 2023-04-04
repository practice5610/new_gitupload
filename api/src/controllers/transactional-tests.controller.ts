import { RoleKey } from '@boom-platform/globals';
import { patch } from '@loopback/rest';
import { service } from 'loopback4-spring';

import { authorize } from '../authorization';
import { TransactionalTestService } from '../services';

export class TransactionalTestsController {
  constructor(
    @service(TransactionalTestService)
    public transactionalTestService: TransactionalTestService
  ) {}

  @authorize([RoleKey.All])
  @patch('/transactional-test', {
    responses: {
      '200': {
        description:
          'Test route for producing a transactional write operation that fails. Intended for testing rolling back of data on a transactional function.',
      },
    },
  })
  async patch(): Promise<void> {
    await this.transactionalTestService.test();
  }
}
