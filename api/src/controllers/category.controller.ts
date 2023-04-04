import {
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  Category,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Count, Filter, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
} from '../constants';
import { ratelimit } from '../loopback4-ratelimiter';
import { Category as CategoryModel } from '../models';
import { CategoryRepository } from '../repositories';
import {
  DELCategoriesIdSpecifications,
  GETCategoriesIdSpecification,
  GETCategoriesSpecification,
  GETCategoryCountSpecification,
  PATCHCategoriesIdRequestBody,
  PATCHCategoriesIdSpecification,
  PATCHCategoriesRequestBody,
  PATCHCategoriesSpecification,
  POSTCategoriesRequestBody,
  POSTCategoriesSpecification,
  PUTCategoriesIdRequestBody,
  PUTCategoriesIdSpecifications,
} from '../specifications';

export class CategoryController {
  logger: Logger = getLogger(LoggingCategory.ACCOUNT);
  constructor(
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/categories', POSTCategoriesSpecification) // TODO: should be changed to /category ??
  async createCategory(
    @requestBody(POSTCategoriesRequestBody)
    category: Omit<Required<Category>, 'createdAt' | 'updatedAt' | '_id'>
  ): Promise<Response<APIResponse<Category>>> {
    try {
      const now: number = moment().utc().unix();
      const result = await this.categoryRepository.create({
        ...category,
        createdAt: now,
        updatedAt: now,
      });
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: result });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All])
  @get('/categories/count', GETCategoryCountSpecification)
  async countCategories(
    @param.query.object('where', getWhereSchemaFor(CategoryModel)) // TODO: review this getWhereSchemaFor
    where?: Where<CategoryModel>
  ): Promise<Response<APIResponse<Count>>> {
    try {
      const result = await this.categoryRepository.count(where);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: result });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @ratelimit(false)
  @authorize([RoleKey.All, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/categories', GETCategoriesSpecification)
  async find(
    @param.query.object('filter', getFilterSchemaFor(CategoryModel)) // TODO: review this getFilterSchemaFor
    filter?: Filter<CategoryModel>
  ): Promise<Response<APIResponse<Category>>> {
    try {
      let currentUserIsAdminOrSuperAdmin: boolean = false;

      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) {
        this.logger.debug(GlobalResponseMessages.NO_CURRENT_USER_PUBLIC_PATH);
      } else if (
        currentUser.roles.includes(RoleKey.Admin) ||
        currentUser.roles.includes(RoleKey.SuperAdmin)
      ) {
        currentUserIsAdminOrSuperAdmin = true;
      }

      const result = await this.categoryRepository.find(filter);
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: result.map((item) => {
          const { commissionRate, ...values } = item;
          return {
            ...values,
            ...(currentUserIsAdminOrSuperAdmin && { commissionRate }),
          };
        }),
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/categories/{id}', GETCategoriesIdSpecification)
  async findById(@param.path.string('id') id: string): Promise<Response<APIResponse<Category>>> {
    try {
      let currentUserIsAdminOrSuperAdmin: boolean = false;
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      if (!currentUser) {
        this.logger.debug(GlobalResponseMessages.NO_CURRENT_USER_PUBLIC_PATH);
      } else if (
        currentUser.roles.includes(RoleKey.Admin) ||
        currentUser.roles.includes(RoleKey.SuperAdmin)
      ) {
        currentUserIsAdminOrSuperAdmin = true;
      }
      const result = await this.categoryRepository.findById(id);
      const { commissionRate, ...values } = result;
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: {
          ...values,
          ...(currentUserIsAdminOrSuperAdmin && { commissionRate }),
        },
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  // TODO: This route seems to be no needed, why to update many items at once?
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/categories', PATCHCategoriesSpecification)
  async updateAll(
    @requestBody(PATCHCategoriesRequestBody)
    category: Omit<Required<Category>, 'createdAt' | 'updatedAt' | '_id'>,
    @param.query.object('where', getWhereSchemaFor(CategoryModel)) // TODO: review this getWhereSchemaFor
    where: Where<CategoryModel>
    //): Promise<Response<APIResponse<Count>>> { // For .status(ServiceResponseCodes.SUCCESS)
  ): Promise<Response> {
    try {
      const now: number = moment().utc().unix();
      const result = await this.categoryRepository.updateAll(
        {
          ...category,
          updatedAt: now,
        },
        where
      );
      /*return (
        this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: true, message: APIResponseMessages.SUCCESS, data: result })
      );*/
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT); // TODO: Review if this is ok
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/categories/{id}', PATCHCategoriesIdSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHCategoriesIdRequestBody)
    category: Omit<Category, 'createdAt' | 'updatedAt' | '_id'>
  ): Promise<Response> {
    try {
      const now: number = moment().utc().unix();
      const result = await this.categoryRepository.updateById(id, {
        ...category,
        updatedAt: now,
      });
      /*return (
        this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: true, message: APIResponseMessages.SUCCESS, data: result })
      );*/
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT); // TODO: Review if this is ok
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  // TODO: This route seems to be no needed, we can use the path method for the same thing
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @put('/categories/{id}', PUTCategoriesIdSpecifications)
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody(PUTCategoriesIdRequestBody)
    category: Omit<Required<Category>, 'createdAt' | 'updatedAt' | '_id'>
  ): Promise<Response> {
    try {
      const now: number = moment().utc().unix();
      const result = await this.categoryRepository.replaceById(id, {
        ...category,
        updatedAt: now,
      });
      /*return (
        this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: true, message: APIResponseMessages.SUCCESS, data: result })
      );*/
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT); // TODO: Review if this is ok
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/categories/{id}', DELCategoriesIdSpecifications)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const result = await this.categoryRepository.deleteById(id);

      /*return (
        this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: true, message: APIResponseMessages.SUCCESS, data: result })
      );*/
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT); // TODO: Review if this is ok
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
