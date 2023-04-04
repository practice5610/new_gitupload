import {
  AllOptionalExceptFor,
  BoomUser,
  ReturnDispute,
  ReturnPolicy,
  ReturnRequest,
  RoleKey,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import {
  ReturnCostType,
  ReturnMethod,
  ReturnReason,
  Status,
  TransactionTotalParts,
} from '@boom-platform/globals/lib/enums/returns';
import { Filter, FilterBuilder, Options, repository } from '@loopback/repository';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, transactional } from 'loopback4-spring';
import moment from 'moment';

import { LoggingCategory, ReturnResponseMessages, ServiceResponseCodes } from '../constants';
import { ReturnDisputeModel, ReturnPolicyModel, ReturnRequestModel } from '../models';
import {
  ReturnDisputeRepository,
  ReturnPolicyRepository,
  ReturnRequestRepository,
  ShippingOrderRepository,
  TransactionRepository,
} from '../repositories';
import { ServiceResponse } from '../types';

export class ReturnService {
  logger: Logger = getLogger(LoggingCategory.RETURNS);
  constructor(
    @repository(ReturnPolicyRepository)
    public returnPolicyRepository: ReturnPolicyRepository,
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @repository(ShippingOrderRepository)
    public shippingOrderRepository: ShippingOrderRepository,
    @repository(ReturnRequestRepository)
    public returnRequestRepository: ReturnRequestRepository,
    @repository(ReturnDisputeRepository)
    public returnDisputeRepository: ReturnDisputeRepository
  ) {}

  /**
   * Create return policies
   */
  async createReturnPolicy(newReturnPolicy: ReturnPolicy): Promise<ServiceResponse<ReturnPolicy>> {
    const now: number = moment().utc().unix();
    const result: ReturnPolicy = await this.returnPolicyRepository.create({
      ...newReturnPolicy,
      updatedAt: now,
      createdAt: now,
    });
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.POLICY_CREATED,
      data: result,
    };
  }

  /**
   * find policies by id or merchant id
   */
  async getReturnPolicies(id: string): Promise<ServiceResponse<ReturnPolicy[]>> {
    const filterBuilder: FilterBuilder<ReturnPolicyModel> = new FilterBuilder<ReturnPolicyModel>();
    const filter: Filter<ReturnPolicyModel> = filterBuilder
      .where({ or: [{ _id: id }, { merchantID: id }] })
      .build();
    const existingPolicy: ReturnPolicy[] = await this.returnPolicyRepository.find(filter);

    if (!existingPolicy.length) {
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.POLICY_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.POLICY_FOUND,
      data: existingPolicy,
    };
  }

  /**
   * Delete Return Policies
   */
  async deleteById(id: string): Promise<ServiceResponse<ReturnPolicy>> {
    await this.returnPolicyRepository.deleteById(id);
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.POLICY_DELETED,
    };
  }

  /**
   * Create return request
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async createReturnRequest(
    newReturnRequest: ReturnRequest,
    options?: Options
  ): Promise<ServiceResponse<ReturnRequest>> {
    const now: number = moment().utc().unix();
    const newRequest = {
      ...newReturnRequest,
      updatedAt: now,
      createdAt: now,
    };

    const returnPolicy = await this.returnPolicyRepository.findById(
      newRequest.merchantPolicyID,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    const originalTransaction = await this.transactionRepository.findById(
      newRequest.purchaseTransactionID,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    const newTransaction = await this.transactionRepository.create(
      {
        type: TransactionType.RETURN,
        amount: originalTransaction.cashback
          ? {
              ...Dinero(originalTransaction.amount)
                .subtract(Dinero(originalTransaction.cashback))
                .toObject(),
              symbol: originalTransaction.amount.symbol,
            }
          : originalTransaction.amount,
        sender: originalTransaction.receiver,
        salestax: originalTransaction.salestax,
        receiver: originalTransaction.sender,
        status: TransactionStatus.UNPROCESSED,
        commissionCollected: originalTransaction.commissionCollected,
        createdAt: now,
        updatedAt: now,
      },
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    if (
      returnPolicy.transactionTotalPartsToRefund?.includes(TransactionTotalParts.SHIPPING) &&
      originalTransaction.shippingOrderId
    ) {
      const oldShippingOrder = await this.shippingOrderRepository.findById(
        originalTransaction.shippingOrderId,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
      newTransaction.amount = {
        ...Dinero(newTransaction.amount).add(Dinero(oldShippingOrder.price)).toObject(),
        symbol: newTransaction.amount.symbol,
      };
    }

    /**
     * If a return cost is a flat fee we can subtract it now, if return cost includes shipping
     * it will have to be created when label is made
     */
    if (returnPolicy.returnCosts?.length) {
      for (const cost of returnPolicy.returnCosts) {
        if (cost.type === ReturnCostType.FLAT_FEE) {
          newTransaction.amount = {
            ...Dinero(newTransaction.amount).subtract(Dinero(cost.price)).toObject(),
            symbol: newTransaction.amount.symbol,
          };
        }
      }
    }

    newRequest.returnTransactionID = newTransaction._id;

    if (!newRequest.returnReason.includes(ReturnReason.EXTRA_ITEM)) {
      newRequest.refundStatus = Status.REQUESTED;
    }

    newRequest.returnStatus =
      returnPolicy.returnMethod === ReturnMethod.NO_RETURN ? Status.DENIED : Status.REQUESTED;

    await this.transactionRepository.updateById(
      newTransaction._id,
      newTransaction,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    const result: ReturnRequest = await this.returnRequestRepository.create(
      newRequest,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.REQUEST_CREATED,
      data: result,
    };
  }

  /**
   * Find return requeust
   */
  async getReturnRequest(
    filter: Filter<ReturnRequestModel>
  ): Promise<ServiceResponse<ReturnRequest[]>> {
    const existingRequest: ReturnRequest[] = await this.returnRequestRepository.find(filter);

    if (!existingRequest.length) {
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.REQUEST_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.REQUEST_FOUND,
      data: existingRequest,
    };
  }

  /**
   * Update return request
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async updateReturnRequest(
    id: string,
    returnRequest: ReturnRequest,
    currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'>,
    options?: Options
  ): Promise<ServiceResponse<ReturnRequest>> {
    const now: number = moment().utc().unix();
    const found = await this.returnRequestRepository.findById(
      id,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    const currentUserIsMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

    if (currentUserIsMerchant && found.returnStatus === Status.COMPLETE && found._id === id) {
      await this.returnRequestRepository.updateById(
        id,
        found,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.REQUEST_NOT_UPDATED,
      };
    }

    const newReturnRequest: Partial<ReturnRequest> = {
      ...returnRequest,
      updatedAt: now,
    };
    await this.returnRequestRepository.updateById(
      id,
      newReturnRequest,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    return {
      success: true,
      statusCode: ServiceResponseCodes.NO_CONTENT,
      message: ReturnResponseMessages.REQUEST_UPDATED,
    };
  }

  /**
   * Create Return Dispute
   */
  async createDispute(newDispute: ReturnDispute): Promise<ServiceResponse<ReturnDispute>> {
    const now: number = moment().utc().unix();
    const result: ReturnDispute = await this.returnDisputeRepository.create({
      ...newDispute,
      updatedAt: now,
      createdAt: now,
    });
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.DISPUTE_CREATED,
      data: result,
    };
  }

  /**
   * Find Return Dispute by ID
   */
  async getDisputeByID(
    filter: Filter<ReturnDisputeModel>
  ): Promise<ServiceResponse<ReturnDispute[]>> {
    const result: ReturnDispute[] = await this.returnDisputeRepository.find(filter);
    if (!result.length) {
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.DISPUTE_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.DISPUTE_FOUND,
      data: result,
    };
  }

  /**
   * Update Return Dispute
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async updateDispute(
    id: string,
    dispute: ReturnDispute,
    options?: Options
  ): Promise<ServiceResponse<ReturnDispute>> {
    const now: number = moment().utc().unix();
    const found = await this.returnDisputeRepository.findById(
      id,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    if (found._id === id && !found.isOpen) {
      await this.returnDisputeRepository.updateById(
        id,
        found,
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.DISPUTE_NOT_UPDATED,
      };
    }
    const newDispute: Partial<ReturnDispute> = {
      ...dispute,
      updatedAt: now,
    };
    await this.returnDisputeRepository.updateById(
      id,
      newDispute,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: ReturnResponseMessages.DISPUTE_UPDATED,
    };
  }
}
