import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  HttpErrors,
  param,
  patch,
  put,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import { ProfileResponseMessages } from '../constants';
import { ShippingOrder, Transaction } from '../models';
import {
  BoomCardRepository,
  ShippingOrderRepository,
  TransactionRepository,
} from '../repositories';

export class TransactionController {
  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @repository(ShippingOrderRepository)
    public shippingOrderRepository: ShippingOrderRepository,
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/transactions', {
    responses: {
      '200': {
        description: 'Array of Transaction model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Transaction } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Transaction)) filter?: Filter<Transaction>
  ): Promise<Transaction[]> {
    // fetch only those transactions in which the logged in user is either receiver or sender of a transaction
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    if (!filter) {
      filter =
        currentUser.roles.includes(RoleKey.SuperAdmin) || currentUser.roles.includes(RoleKey.Admin)
          ? {}
          : ({
              where: {
                or: [
                  { 'sender.uid': currentUser.uid },
                  { 'receiver.uid': currentUser.uid },
                  { 'purchaseItem.merchantUID': currentUser.uid },
                ],
              },
            } as Filter<Transaction>);
    } else {
      filter =
        currentUser.roles.includes(RoleKey.SuperAdmin) || currentUser.roles.includes(RoleKey.Admin)
          ? filter
          : ({
              ...filter,
              where: {
                and: [
                  { ...filter.where },
                  {
                    or: [
                      { 'sender.uid': currentUser.uid },
                      { 'receiver.uid': currentUser.uid },
                      { 'purchaseItem.merchantUID': currentUser.uid },
                    ],
                  },
                ],
              },
            } as Filter<Transaction>);
    }

    return this.transactionRepository
      .find()
      .then((result) => {
        console.log('thismodule working', result);
        return result;
      })
      .catch((err) => {
        console.log('transerror', err);
        return err;
      });
  }

  @authorize([RoleKey.SuperAdmin])
  @put('/transactions/{id}', {
    responses: {
      '204': {
        description: 'Transaction PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() transaction: Transaction
  ): Promise<void> {
    const now: number = moment().utc().unix();
    transaction.updatedAt = now;
    await this.transactionRepository.replaceById(id, transaction);
  }

  @authorize([RoleKey.SuperAdmin])
  @del('/transactions/{id}', {
    responses: {
      '204': {
        description: 'Transaction DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.transactionRepository.deleteById(id);
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/admin/transactions', {
    responses: {
      '200': {
        description: 'Array of Transaction model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Transaction } },
          },
        },
      },
    },
  })
  async findAll(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Transaction)) filter?: Filter<Transaction>
  ): Promise<Transaction[]> {
    return this.transactionRepository.find(filter);
  }

  /**
   * This used to add tracking onto a transaction but now it adds tracking to a shipping order
   * @param id _id of the transaction to add shipping info to
   * @param transactionItem the tracking link and/or the tracking number to be added
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Merchant])
  @patch('/transactions/{id}', {
    responses: {
      '200': {
        description: 'Tracking information added succesfully',
        content: { 'application/json': { schema: { 'x-ts-type': Transaction } } },
      },
    },
  })
  async addTracking(
    @param.path.string('id') id: string,
    @requestBody() trackingInfo: { trackingNumber?: string; trackingLink?: string }
  ): Promise<void> {
    try {
      const transaction = await this.transactionRepository.findById(id);

      let newShippingOrder = await this.shippingOrderRepository.findById(
        transaction.shippingOrderId
      );

      newShippingOrder = {
        ...newShippingOrder,
        ...(trackingInfo.trackingNumber && { trackingNumber: trackingInfo.trackingNumber }),
        ...(trackingInfo.trackingLink && { trackingLink: trackingInfo.trackingLink }),
        updatedAt: moment().utc().unix(),
      } as ShippingOrder;

      await this.shippingOrderRepository.updateById(newShippingOrder._id, newShippingOrder);
    } catch (error) {
      if (HttpErrors.isHttpError(error)) {
        this.response.status(error.status).send({ success: false, error });
      }
    }
  }
}
