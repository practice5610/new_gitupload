import {
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  ReturnDispute,
  ReturnPolicy,
  ReturnRequest,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, FilterBuilder } from '@loopback/repository';
import {
  del,
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
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { ReturnDisputeModel, ReturnRequestModel } from '../models';
import { ReturnService } from '../services/returns.service';
import * as Specification from '../specifications';
import { handleServiceResponseResult } from '../utils';

export class ReturnsController {
  logger: Logger = getLogger(LoggingCategory.RETURNS);
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ReturnService)
    public returnService: ReturnService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  /**
   * POST a new Return Policy
   * @param policy new policy to add to database
   */
  @authorize([RoleKey.Admin, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/return/policy', Specification.POSTReturnPolicySpecifications)
  async createPolicy(
    @requestBody(Specification.POSTReturnPolicyRequestBody) policy: ReturnPolicy
  ): Promise<Response<APIResponse<ReturnPolicy>>> {
    try {
      const response = await this.returnService.createReturnPolicy(policy);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET all the policies a merchant has or a specific policy by id
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Member])
  @get('/return/policy/{id}', Specification.GETPolicySpecification)
  async getReturnPolicies(
    @param.path.string('id') id: string
  ): Promise<Response<APIResponse<ReturnPolicy>>> {
    try {
      const response = await this.returnService.getReturnPolicies(id);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * DELETE Policy by ID
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('return/policy/{id}', Specification.DELPolicyByIDSpecification)
  async deleteById(
    @param.path.string('id') id: string
  ): Promise<Response<APIResponse<ReturnPolicy>>> {
    try {
      const response = await this.returnService.deleteById(id);
      if (response.success) return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
      handleServiceResponseResult(response);
      throw new HttpErrors.BadRequest(response.message);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST new Return Request
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.SuperAdmin])
  @post('/return/requests', Specification.POSTReturnRequestSpecifications)
  async createReturnRequest(
    @requestBody(Specification.POSTReturnRequestBody) returnRequest: ReturnRequest
  ): Promise<Response<APIResponse<ReturnRequest>>> {
    console.log('Made it to body');
    try {
      const response = await this.returnService.createReturnRequest(returnRequest);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET Return Requests by ID
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Member])
  @get('/return/requests', Specification.GETReturnRequestSpecification)
  async getReturnRequest(
    //@ts-ignore
    @param.filter(ReturnRequestModel) requestFilter?: Filter<ReturnRequestModel>
  ): Promise<Response<APIResponse<ReturnRequest[]>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const currentUserIsMember: boolean = currentUser.roles.includes(RoleKey.Member);
      const currentUserIsMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);
      const filterBuilder: FilterBuilder<ReturnRequestModel> =
        new FilterBuilder<ReturnRequestModel>(requestFilter);

      if (currentUserIsMember) {
        filterBuilder.impose({ customerID: currentUser.uid });
      } else if (currentUserIsMerchant) {
        filterBuilder.impose({ merchantID: currentUser.store?._id });
      }

      const filter: Filter<ReturnRequestModel> = filterBuilder.build();

      const response = await this.returnService.getReturnRequest(filter);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PATCH Return Request
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Merchant])
  @patch('/return/requests/{id}', Specification.PATCHReturnRequestSpecification)
  async updateRequestById(
    @param.path.string('id') id: string,
    @requestBody(Specification.PATCHReturnRequestBody) returnRequest: ReturnRequest
  ): Promise<Response<APIResponse<ReturnRequest>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const result = await this.returnService.updateReturnRequest(id, returnRequest, currentUser);
      if (result.success) return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
      handleServiceResponseResult(result);
      throw new HttpErrors.BadRequest(result.message);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST Dispute
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Merchant, RoleKey.Member])
  @post('return/disputes', Specification.POSTDisputeSpecifications)
  async createDispute(
    @requestBody(Specification.POSTDisputeRequestBody) dispute: ReturnDispute
  ): Promise<Response<APIResponse<ReturnDispute>>> {
    try {
      const response = await this.returnService.createDispute(dispute);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET Dispute by ID
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin, RoleKey.Merchant, RoleKey.Member])
  @get('return/disputes/{id}', Specification.GETDisputeSpecification)
  async getDisputeByID(
    @param.path.string('id') id: string
  ): Promise<Response<APIResponse<ReturnDispute>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const currentUserIsAdmin: boolean =
        currentUser.roles.includes(RoleKey.SuperAdmin) || currentUser.roles.includes(RoleKey.Admin);
      const currentUserIsMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

      let filterValues = {};
      if (currentUserIsAdmin) {
        filterValues = {
          or: [{ _id: id }, { 'returnRequest.merchantID': id }, { 'returnRequest.customerID': id }],
        };
      } else if (currentUserIsMerchant) {
        filterValues = {
          or: [{ 'returnRequest.merchantID': id }],
        };
      } else {
        filterValues = {
          or: [{ 'returnRequest.customerID': id }],
        };
      }

      const filterBuilder: FilterBuilder<ReturnDisputeModel> =
        new FilterBuilder<ReturnDisputeModel>();
      const filter: Filter<ReturnDisputeModel> = filterBuilder.where(filterValues).build();
      const response = await this.returnService.getDisputeByID(filter);
      const resultData = handleServiceResponseResult<typeof response.data>(response);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PATCH Dispute
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('return/disputes/{id}', Specification.PATCHDisputeSpecification)
  async updateDisputeByID(
    @param.path.string('id') id: string,
    @requestBody(Specification.PATCHDisputeRequestBody) dispute: ReturnDispute
  ): Promise<Response<APIResponse<ReturnDispute>>> {
    try {
      const result = await this.returnService.updateDispute(id, dispute);
      if (result.success) return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
      handleServiceResponseResult(result);
      throw new HttpErrors.BadRequest(result.message);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
