import { AllOptionalExceptFor, BoomUser, RoleKey, TransactionType } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import {
  Count,
  Filter,
  FilterBuilder,
  FilterExcludingWhere,
  repository,
  Where,
  WhereBuilder,
} from '@loopback/repository';
import {
  get,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { Transaction } from '../models';
import { TransactionRepository } from '../repositories';
import {
  GETMerchantWithdrawalByIdSpecification,
  GETMerchantWithdrawalCountSpecification,
  GETMerchantWithdrawalSpecification,
  PATCHMerchantWithdrawalByIdSpecification,
  PATCHMerchantWithdrawalRequestBody,
  POSTMerchantWithdrawalRequestBody,
  POSTMerchantWithdrawalSpecification,
} from '../specifications/withdrawal-specifications';
export class WithdrawalController {
  logger: Logger = getLogger(LoggingCategory.WITHDRAWAL_CONTROLLER);
  constructor(
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Merchant])
  @post('/merchant-withdrawal', POSTMerchantWithdrawalSpecification)
  async create(
    @requestBody(POSTMerchantWithdrawalRequestBody)
    transaction: Omit<
      Transaction,
      | '_id'
      | 'booking'
      | 'cashback'
      | 'commissionCollected'
      | 'createdAt'
      | 'dateReceived'
      | 'purchaseItem'
      | 'updatedAt'
      | 'type'
      | 'title'
      | 'sender'
      | 'shippingOrderId'
      | 'nonce'
      | 'salestax'
      | 'shortId'
      | 'status'
      | 'taxcode'
    >
  ): Promise<Response<Transaction>> {
    try {
      const now: number = moment().utc().unix();
      const data: Transaction = await this.transactionRepository.create({
        ...transaction,
        createdAt: now,
        updatedAt: now,
        type: TransactionType.MERCHANT_WITHDRAWAL,
      });
      if (data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: data,
        });
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/merchant-withdrawal/count', GETMerchantWithdrawalCountSpecification)
  async count(
    @param.where(Transaction) incomingWhere?: Where<Transaction>
  ): Promise<Response<Count>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.NO_PROFILE_FOUND);
      const whereBuilder = new WhereBuilder();
      whereBuilder.eq('receiver.uid', currentUser.uid);
      if (incomingWhere) whereBuilder.impose(incomingWhere);
      const where = whereBuilder.build();
      const data: Count = await this.transactionRepository.count(where);
      if (data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: data,
        });
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/merchant-withdrawal', GETMerchantWithdrawalSpecification)
  async find(
    @param.filter(Transaction) incomingFilter?: Filter<Transaction>
  ): Promise<Response<Transaction[]>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.NO_PROFILE_FOUND);

      const filterBuilder: FilterBuilder<Transaction> = new FilterBuilder<Transaction>(
        incomingFilter
      );
      const whereBuilder = new WhereBuilder();
      const where = whereBuilder.eq('receiver.uid', currentUser.uid).build();

      if (currentUser.roles.includes(RoleKey.Merchant)) {
        filterBuilder.impose(where);
      }
      filterBuilder.impose({ where: { type: TransactionType.MERCHANT_WITHDRAWAL } });
      const filter: Filter<Transaction> = filterBuilder.build();

      const data = await this.transactionRepository.find(filter);
      if (data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: data,
        });
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/merchant-withdrawal/{id}', GETMerchantWithdrawalByIdSpecification)
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Transaction, { exclude: 'where' })
    incomingFilter?: FilterExcludingWhere<Transaction>
  ): Promise<Response<Transaction>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.NO_PROFILE_FOUND);

      const filterBuilder: FilterBuilder<Transaction> = new FilterBuilder<Transaction>(
        incomingFilter
      );
      const whereBuilder = new WhereBuilder();
      const where = whereBuilder.eq('receiver.uid', currentUser.uid).build();

      if (currentUser.roles.includes(RoleKey.Merchant)) {
        filterBuilder.impose(where);
      }
      filterBuilder.impose({ where: { type: TransactionType.MERCHANT_WITHDRAWAL } });
      const filter: Filter<Transaction> = filterBuilder.build();
      console.log(filter);

      const data = await this.transactionRepository.findById(id, filter);
      if (data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: data,
        });
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.SuperAdmin])
  @patch('/merchant-withdrawal/{id}', PATCHMerchantWithdrawalByIdSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHMerchantWithdrawalRequestBody)
    transaction: Transaction
  ): Promise<void> {
    try {
      const now: number = moment().utc().unix();
      await this.transactionRepository.updateById(id, { ...transaction, updatedAt: now });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
