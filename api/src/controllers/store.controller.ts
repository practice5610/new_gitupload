import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, FilterBuilder, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  HttpErrors,
  param,
  post,
  put,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { authorize } from '../authorization';
import { AuthorizatonBindings } from '../authorization';
import {
  APIResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
  StoreResponseMessages,
} from '../constants';
import { Store } from '../models';
import {
  OfferRepository,
  ProductRepository,
  ReviewRepository,
  StoreRepository,
} from '../repositories';
import { ProfileService, SearchEngineService } from '../services';
import {
  DELStoresByIDSpecification,
  GETStoreByIDSpecification,
  GETStoresCountSpecification,
  GETStoresSpecification,
  POSTStoreRequestBody,
  POSTStoreSpecification,
  PUTStoreByIDRequestBody,
  PUTStoreByIDSpecification,
} from '../specifications/';
import { APIResponse } from '../types';
import { handleServiceResponseResult } from '../utils';
export class StoreController {
  logger = getLogger(LoggingCategory.STORE_CONTROLLER);
  constructor(
    @repository(StoreRepository)
    public storeRepository: StoreRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(OfferRepository)
    public offerRepository: OfferRepository,
    @repository(ReviewRepository)
    public reviewRepository: ReviewRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(SearchEngineService)
    public searchEngineService: SearchEngineService,
    @service(ProfileService)
    public profileService: ProfileService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/stores', POSTStoreSpecification)
  async create(@requestBody(POSTStoreRequestBody) store: Store): Promise<Response> {
    try {
      // THIS VALIDATION RESTRICT MERCHANTS TO ONLY 1 STORE. THIS LOGIC NEED TO BE CHANGE.
      const filterBuilder: FilterBuilder = new FilterBuilder();
      const filter: Filter<Store> = filterBuilder
        .where({ 'merchant.uid': store.merchant?.uid })
        .limit(1)
        .build() as Filter<Store>;
      const existingStore: Store[] = await this.storeRepository.find(filter);

      if (existingStore.length) {
        throw new HttpErrors.NotAcceptable(StoreResponseMessages.CURRENT_MERCHANT_HAS_STORE);
      }

      const now: number = moment().utc().unix();
      const newStore: Store = { ...store, createdAt: now, updatedAt: now } as Store;
      const result: Store = await this.storeRepository.create(newStore);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      if (Object.values(StoreResponseMessages).includes(error.message)) {
        throw error;
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All])
  @get('/stores/count', GETStoresCountSpecification)
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Store)) where?: Where<Store>
  ): Promise<Response> {
    try {
      const count = await this.storeRepository.count(where);
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: 'Stores has been count successfully',
        data: count,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All])
  @get('/stores', GETStoresSpecification)
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Store)) filter?: Filter<Store>
  ): Promise<Response> {
    try {
      const filterBuilder: FilterBuilder = new FilterBuilder();
      const fieldsFilter: Filter<Store> = filterBuilder
        .fields({ pin: false })
        .build() as Filter<Store>;
      const result: Store[] = await this.storeRepository.find({ ...filter, ...fieldsFilter });
      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All])
  @get('/stores/{id}', GETStoreByIDSpecification)
  async findById(@param.path.string('id') id: string): Promise<Response> {
    try {
      let returnPin = false;
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (currentUser) {
        try {
          if (currentUser.roles.includes(RoleKey.Merchant)) {
            const profile = await this.profileService.getProfile<
              AllOptionalExceptFor<BoomUser, 'store'>
            >(currentUser.uid, {
              requiredFields: ['store'],
            });

            const profileData = handleServiceResponseResult<typeof profile.data>(profile);
            if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

            returnPin = profileData.store._id === id;
          }
        } catch (error) {
          this.logger.warn(
            'No matching merchant user found on stores request. Will not return pin with result'
          );
        }
      }
      const filterBuilder: FilterBuilder = new FilterBuilder();
      const fieldsFilter: Filter<Store> = filterBuilder
        .fields({ pin: false })
        .build() as Filter<Store>;
      const result: Store = await this.storeRepository.findById(
        id,
        returnPin ? undefined : fieldsFilter
      );
      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/stores/{id}', DELStoresByIDSpecification)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const existingStore: Store = await this.storeRepository.findById(id);
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      // If current user is a Merchant, then he only can delete his own Stores.
      if (
        currentUser.roles.includes(RoleKey.Merchant) &&
        existingStore?.merchant?.uid !== currentUser.uid
      ) {
        throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
      }
      if (existingStore.objectID) {
        const indexResult: APIResponse = await this.searchEngineService.delete(
          existingStore.objectID
        );
        if (!indexResult.success) {
          throw new HttpErrors.BadRequest(indexResult.message);
        }
      }
      await this.storeRepository.deleteById(id);
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      if (
        Object.values(GlobalResponseMessages).includes(error.message) ||
        Object.values(ProfileResponseMessages).includes(error.message)
      ) {
        throw error;
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @put('/store/{id}', PUTStoreByIDSpecification)
  async updateStoreById(
    @requestBody(PUTStoreByIDRequestBody) incomingStore: Store,
    @param.path.string('id') id: string
  ): Promise<void | Response> {
    try {
      const now = moment().utc().unix();

      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const currentStore: Store = await this.storeRepository.findById(id);

      // If current user is a Merchant, then he only can update his own Stores.
      if (
        currentUser.roles.includes(RoleKey.Merchant) &&
        currentStore?.merchant?.uid !== currentUser.uid
      ) {
        throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      if (currentUser.uid) {
        currentUser.firstName = incomingStore.merchant.firstName || '';
        currentUser.lastName = incomingStore.merchant.lastName;
        currentUser.updatedAt = now;
        currentUser.store = {
          _id: incomingStore._id,
          companyName: incomingStore.companyName,
          number: incomingStore.number, // TODO: Review if this change to address is correct - AddressInfo
          street1: incomingStore.street1,
          street2: incomingStore.street2 ? incomingStore.street2 : '',
          city: incomingStore.city,
          state: incomingStore.state,
          zip: incomingStore.zip,
          country: incomingStore.country,
        } as Store;

        await this.profileService.updateProfileById(currentUser.uid, currentUser);
      }
      // END FIREBASE UPDATE END

      // DB UPDATE START

      const storeForDB: Store = { ...incomingStore, updatedAt: now } as Store;
      //@ts-ignore
      delete storeForDB._id;
      delete storeForDB.objectID;

      console.log(storeForDB);

      // update store itself
      await this.storeRepository.replaceById(id, storeForDB);

      // DB UPDATE END

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: 'Store has been updated successfully',
        result: { ...storeForDB, _id: id },
      });
    } catch (error) {
      this.logger.error(error);
      if (
        Object.values(GlobalResponseMessages).includes(error.message) ||
        Object.values(ProfileResponseMessages).includes(error.message)
      ) {
        throw error;
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
