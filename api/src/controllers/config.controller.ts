import {
  AdminConfigType,
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  Config,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, FilterBuilder, repository } from '@loopback/repository';
import {
  del,
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
import { getLogger, Logger } from 'log4js';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  ConfigResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { Config as ConfigModel } from '../models';
import { ConfigRepository } from '../repositories';
import {
  DELConfigIdSpecifications,
  GETConfigSpecification,
  PATCHConfigRequestBody,
  PATCHConfigSpecification,
  POSTConfigRequestBody,
  POSTConfigSpecification,
} from '../specifications';

const validateInventoryItemTypeValue = (config: Config) => {
  if (config.type === AdminConfigType.INVENTORY_TYPES) {
    Object.values(config.value).forEach((item) => {
      if (isNaN(item.count) || !item.count) {
        throw new HttpErrors.BadRequest(ConfigResponseMessages.ERROR_COUNT_INVENTORY);
      }
    });
  }
  return true;
};

/**
 * @export
 * @class ConfigController
 * Controller for global configuration updates.
 */
export class ConfigController {
  logger: Logger = getLogger(LoggingCategory.CONFIG_CONTROLLER);
  constructor(
    @repository(ConfigRepository)
    public configRepository: ConfigRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/config', POSTConfigSpecification)
  async create(
    @requestBody(POSTConfigRequestBody)
    config: Omit<Required<Config>, 'createdAt' | 'updatedAt' | '_id'>
  ): Promise<Response<APIResponse<Config>>> {
    try {
      const filterBuilder2 = new FilterBuilder<ConfigModel>();
      const configFilter = filterBuilder2.where({ type: config.type }).build();

      const existingConfig = await this.configRepository.findOne(configFilter); // TODO: Review this filter, we can only have two items on the collection

      if (existingConfig) {
        throw new HttpErrors.BadRequest(GlobalResponseMessages.CANNOT_CREATE_ALREADY_EXISTS);
      }

      validateInventoryItemTypeValue(config);

      const now: number = moment().utc().unix();
      const result = await this.configRepository.create({
        ...config,
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

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/config', GETConfigSpecification)
  async find(
    @param.query.object('filter', getFilterSchemaFor(ConfigModel)) // TODO: review this getFilterSchemaFor
    filter?: Filter<ConfigModel>
  ): Promise<Response<APIResponse<Config>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

      let result: ConfigModel[];

      if (isMerchant) {
        const filterBuilder2 = new FilterBuilder<ConfigModel>(filter);
        const configFilter = filterBuilder2
          .where({
            and: [{ ...(filter && filter.where) }, { type: AdminConfigType.INVENTORY_TYPES }],
          })
          .build();
        result = await this.configRepository.find(configFilter);
      } else {
        result = await this.configRepository.find(filter);
      }

      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: result });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/config/{id}', PATCHConfigSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHConfigRequestBody) config: Omit<Config, 'createdAt' | 'updatedAt' | '_id'>
  ): Promise<Response> {
    try {
      validateInventoryItemTypeValue(config);
      const now: number = moment().utc().unix();
      await this.configRepository.updateById(id, { ...config, updatedAt: now });
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT); // TODO: Review if this is ok
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/config/{id}', DELConfigIdSpecifications)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const result = await this.configRepository.deleteById(id);
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
