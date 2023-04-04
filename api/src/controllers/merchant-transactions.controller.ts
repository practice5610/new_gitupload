import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { MerchantTransaction } from '../models';
import { MerchantTransactionRepository } from '../repositories';
import { MerchantTransactionService } from '../services';
import { ProfileService } from '../services/profile.service';
import { APIResponse } from '../types';

/**
 * @export
 * @class MerchantTransactionController
 * Controller for Merchant Transaction Operations.
 */
export class MerchantTransactionController {
  logger = getLogger(LoggingCategory.MERCHANT_BILLING);

  constructor(
    @repository(MerchantTransactionRepository)
    public merchantTransactionRepository: MerchantTransactionRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(MerchantTransactionService)
    public merchantTransactionService: MerchantTransactionService,
    @service(ProfileService)
    public profileService: ProfileService
  ) {}

  /**
   * Creates a transaction for inventory orders
   * @param {MerchantTransaction} merchantTransaction
   * @returns {(Promise<MerchantTransaction | Response>)}
   * @memberof MerchantTransactionController
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/merchant-transaction', {
    responses: {
      '200': {
        description: 'Merchant Transaction Repository model instance',
        content: { 'application/json': { schema: { 'x-ts-type': MerchantTransaction } } },
      },
    },
  })
  async create(
    @requestBody() merchantTransaction: MerchantTransaction
  ): Promise<MerchantTransaction | Response> {
    const now: number = moment().utc().unix();

    const newMerchantTransaction: MerchantTransaction = {
      ...merchantTransaction,
      createdAt: now,
      updatedAt: now,
      title: merchantTransaction.purchaseItem.itemName,
    } as MerchantTransaction;

    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

    if (isMerchant && currentUser.uid !== merchantTransaction.merchant.uid) {
      throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
    }

    const result: MerchantTransaction = await this.merchantTransactionRepository.create(
      newMerchantTransaction
    );
    return result;
  }

  /**
   * Update merchant transactions statuses
   * @param {string} id Merchant Transaction id
   * @param {MerchantTransaction} merchantTransaction Merchant Transaction Data
   * @returns {(Promise<void | Response>)}
   * @memberof MerchantTransactionController
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/merchant-transaction/{id}', {
    responses: {
      '204': {
        description: 'Marchant Transaction Item PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() merchantTransaction: MerchantTransaction
  ): Promise<void | Response> {
    try {
      const result: APIResponse = await this.merchantTransactionService.updateMerchantTransaction(
        id,
        merchantTransaction
      );

      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      return this.response.status(500).send({ success: false, message: error }); //TODO: throw error here
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/merchant-transaction', {
    responses: {
      '204': {
        description: 'Bulk merchant transaction order PATCH success',
      },
    },
  })
  async updateList(@requestBody() list: MerchantTransaction[]): Promise<object> {
    try {
      for (const trans of list) {
        const newTrans = {
          status: trans.status,
          type: trans.type,
          updatedAt: moment().utc().unix(),
        } as MerchantTransaction;
        if (trans._id)
          await this.merchantTransactionService.updateMerchantTransaction(trans._id, newTrans);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query for merchant transactions
   * @param {Filter<MerchantTransaction>} [filter]
   * @returns {Promise<MerchantTransaction[]>}
   * @memberof MerchantTransactionController
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/merchant-transaction', {
    responses: {
      '200': {
        description: 'Array of Merchant Transactions model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': MerchantTransaction } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(MerchantTransaction))
    filter?: Filter<MerchantTransaction>
  ): Promise<MerchantTransaction[]> {
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

    if (isMerchant) {
      filter = {
        ...filter,
        where: {
          and: [{ ...filter?.where }, { 'merchant.uid': currentUser.uid }],
        },
      } as Filter<MerchantTransaction>;
    }
    return this.merchantTransactionRepository.find(filter);
  }
}
