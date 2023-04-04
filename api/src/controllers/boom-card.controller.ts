import {
  AllOptionalExceptFor,
  APIResponse,
  BoomAccount,
  BoomCardStatus,
  BoomUser,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Count, Filter, FilterBuilder, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
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
  BoomAccountResponseMessages,
  BoomCardResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
  StoreResponseMessages,
} from '../constants';
import { BoomCard, Store } from '../models';
import { BoomCardRepository, StoreRepository } from '../repositories';
import { BoomAccountService, BoomCardService } from '../services';
import { getProfileOptions, ProfileService } from '../services/profile.service';
import {
  DELBoomCardsByIdSpecifications,
  GETBoomCardsByIdSpecification,
  GETBoomCardsCountSpecification,
  GETBoomCardsMerchantByCardNumberSpecification,
  GETBoomCardsSpecification,
  PATCHBoomCardsByIdRequestBody,
  PATCHBoomCardsByIdSpecification,
  POSTBoomCardsLoginRequestBody,
  POSTBoomCardsLoginSpecification,
  POSTBoomCardsMerchantActivateByIdRequestBody,
  POSTBoomCardsMerchantActivateByIdSpecification,
  POSTBoomCardsSpecification,
} from '../specifications/boom-card-specifications';
import { handleServiceResponseResult } from '../utils';
import { allBoomcardsBelongToUser, boomcardBelongsToUser } from '../utils/boomcard';
import { generateRandomNumber } from '../utils/math';

export class BoomCardController {
  logger: Logger = getLogger(LoggingCategory.BOOM_CARD_CONTROLLER);
  constructor(
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository,
    @repository(StoreRepository)
    public storeRepository: StoreRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(BoomAccountService)
    private boomAccountService: BoomAccountService,
    @service(BoomCardService)
    private boomCardService: BoomCardService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  /**
   * Creates new Boom card records
   * @param {BoomCard[]} boomCards
   * @returns {Promise<BoomCard[]>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/boom-cards', POSTBoomCardsSpecification)
  async create(
    @requestBody.array(
      getModelSchemaRef(BoomCard, {
        // TODO: Review if this Model schema need to be replaced by a custom schema
        exclude: [
          '_id',
          'createdAt',
          'updatedAt',
          'pinNumber',
          'status',
          'boomAccountID',
          'qrcode',
          'storeID',
          'storeMerchantID',
          'customerID',
        ],
      }),
      {
        description: 'an array of boom cards',
        required: true,
      }
    )
    boomCards: BoomCard[]
  ): Promise<Response<APIResponse<BoomCard[]>>> {
    try {
      const data: BoomCard[] | undefined = handleServiceResponseResult<BoomCard[]>(
        await this.boomCardService.createBoomCards(boomCards)
      );
      if (!data)
        throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR); // TODO: this line should be removed on handleServiceResponseResult update to work properly with TS.
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: data,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Gets the count of all stored Boom cards
   * @param {Where<BoomCard>} [where]
   * @returns {Promise<Count>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-cards/count', GETBoomCardsCountSpecification)
  async count(
    @param.query.object('where', getWhereSchemaFor(BoomCard)) where?: Where<BoomCard>
  ): Promise<Response<APIResponse<Count>>> {
    try {
      const data: Count | undefined = handleServiceResponseResult<Count>(
        await this.boomCardService.countBoomCards(where)
      );
      if (!data)
        throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR); // TODO: this line should be removed on handleServiceResponseResult update to work properly with TS.
      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: data,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all Boom cards or by filter
   * @param {Filter<BoomCard>} [filter]
   * @returns {Promise<BoomCard[]>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-cards', GETBoomCardsSpecification)
  async find(
    @param.query.object('filter', getFilterSchemaFor(BoomCard)) filter?: Filter<BoomCard>
  ): Promise<Response<APIResponse<BoomCard[]>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const boomCards: BoomCard[] | undefined = handleServiceResponseResult<BoomCard[]>(
        await this.boomCardService.findBoomCards(filter)
      );

      if (!boomCards) throw new HttpErrors.NotFound(BoomCardResponseMessages.NOT_FOUND); // TODO: this line should be removed on handleServiceResponseResult update to work properly with TS.

      if (currentUser.roles.includes(RoleKey.Member)) {
        const profile = await this.profileService.getProfile(currentUser.uid);

        const profileData = handleServiceResponseResult<typeof profile.data>(profile);

        if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

        const belongs: boolean = allBoomcardsBelongToUser(
          profileData,
          boomCards.map((card) => card._id)
        );

        if (!belongs) throw new HttpErrors.Forbidden(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: boomCards,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Finds a boom card by its database ID
   * @param {string} id
   * @returns {Promise<BoomCard>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-cards/{id}', GETBoomCardsByIdSpecification)
  async findById(@param.path.string('id') id: string): Promise<Response<APIResponse<BoomCard>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const boomCard: BoomCard | undefined = handleServiceResponseResult<BoomCard>(
        await this.boomCardService.findBoomCardById(id)
      );

      if (!boomCard) throw new HttpErrors.NotFound(BoomCardResponseMessages.NOT_FOUND); // TODO: this line should be removed on handleServiceResponseResult update to work properly with TS.

      if (currentUser.roles.includes(RoleKey.Member)) {
        const profile = await this.profileService.getProfile(currentUser.uid);

        const profileData = handleServiceResponseResult<typeof profile.data>(profile);
        if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

        const belongs: boolean = boomcardBelongsToUser(profileData, id);
        if (!belongs) throw new HttpErrors.Forbidden(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: boomCard,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Finds card by the card number
   * @param {string} cardNumber The card number printed on the front of the card
   * @returns {Promise<BoomCard[]>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-cards/merchant/{cardNumber}', GETBoomCardsMerchantByCardNumberSpecification)
  async findByCardNumber(
    @param.path.string('cardNumber') cardNumber: string
  ): Promise<Response<APIResponse<BoomCard[]>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const filterBuilder: FilterBuilder<BoomCard> = new FilterBuilder<BoomCard>();
      const filter: Filter<BoomCard> = filterBuilder.where({ cardNumber }).build();

      if (currentUser.roles.includes(RoleKey.Merchant)) {
        filterBuilder.impose({ where: { storeMerchantID: currentUser.uid } });
      }

      const boomCards: BoomCard[] | undefined = handleServiceResponseResult<BoomCard[]>(
        await this.boomCardService.findBoomCards(filter)
      );
      if (!boomCards) throw new HttpErrors.NotFound(BoomCardResponseMessages.NOT_FOUND); // TODO: this line should be removed on handleServiceResponseResult update to work properly with TS.

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: boomCards,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Assigns a boom card to a particular Boom user
   * @param {string} id The card number printed on the front of the card OR the MongoDB ID of the card record
   * @param {{ pinNumber: number; uid: string }} data The pin number and customer uid
   * @returns {Promise<BoomCard>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/boom-cards/merchant/activate/{id}', POSTBoomCardsMerchantActivateByIdSpecification)
  async activate(
    @param.path.string('id') id: string,
    @requestBody(POSTBoomCardsMerchantActivateByIdRequestBody)
    data: { pinNumber: number; uid: string; boomAccountID: string; storeId: string }
  ): Promise<Response<APIResponse<BoomCard>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const filterBuilder: FilterBuilder<BoomCard> = new FilterBuilder<BoomCard>();
      const filter: Filter<BoomCard> = filterBuilder
        .where({ or: [{ _id: id }, { cardNumber: id }] })
        .build();

      const boomCard: BoomCard | null = await this.boomCardRepository.findOne(filter);

      if (!data.uid) {
        throw new HttpErrors.BadRequest(BoomCardResponseMessages.UID_REQUIRED);
      }
      if (!data.boomAccountID) {
        throw new HttpErrors.BadRequest(BoomCardResponseMessages.BOOM_ACCOUNT_REQUIRED);
      }
      if (!boomCard) {
        throw new HttpErrors.NotFound(BoomCardResponseMessages.NOT_FOUND);
      }
      if (boomCard.status === BoomCardStatus.ACTIVE) {
        throw new HttpErrors.Unauthorized(BoomCardResponseMessages.BOOM_CARD_ALREADY_ACTIVE);
      }
      if (boomCard.status === BoomCardStatus.BLOCKED) {
        throw new HttpErrors.Unauthorized(BoomCardResponseMessages.BLOCKED);
      }

      let customer = await this.profileService.getProfile(data.uid, {
        messageNoProfileFound: ProfileResponseMessages.CUSTOMER_NOT_FOUND,
      });
      let customerData = handleServiceResponseResult<typeof customer.data>(customer);
      if (!customerData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      if (!customerData.roles?.includes(RoleKey.Member)) {
        throw new HttpErrors.Unauthorized(APIResponseMessages.UNAUTHORIZED);
      }

      let newBoomAccount: BoomAccount | undefined = undefined;
      if (!customerData.boomAccounts) {
        const response = await this.boomAccountService.create(customerData.uid);
        if (!response?.success || !response) {
          throw new HttpErrors.BadRequest(BoomAccountResponseMessages.CREATE_ERROR);
        }
        newBoomAccount = response.data;
        customer = await this.profileService.getProfile(data.uid, {
          messageNoProfileFound: ProfileResponseMessages.CUSTOMER_NOT_FOUND,
        });
        customerData = handleServiceResponseResult<typeof customer.data>(customer);
        if (!customerData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us
      }

      if (!customerData.boomAccounts?.includes(data.boomAccountID)) {
        throw new HttpErrors.BadRequest(BoomAccountResponseMessages.UNAUTHORIZED);
      }

      await this.profileService.updateProfileById(data.uid, {
        cards: [boomCard._id, ...(customerData.cards ?? [])],
        hasCards: true,
      });

      const pinNumber = data.pinNumber || boomCard.pinNumber || generateRandomNumber(1000, 9999);

      const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

      let fullCurrentUser;

      if (isMerchant) {
        fullCurrentUser = await this.profileService.getProfile(currentUser.uid);
      }

      if (isMerchant && (!fullCurrentUser?.success || !fullCurrentUser?.data)) {
        throw new HttpErrors.NotFound(ProfileResponseMessages.MERCHANT_NOT_FOUND);
      }

      if (!fullCurrentUser?.data?.store?._id) {
        throw new HttpErrors.NotFound(StoreResponseMessages.NOT_FOUND);
      }

      const storeID: string | undefined = isMerchant
        ? fullCurrentUser.data.store._id
        : data.storeId;

      if (!storeID) {
        throw new HttpErrors.NotFound(StoreResponseMessages.NOT_FOUND);
      }

      const storeFilterBuilder: FilterBuilder<Store> = new FilterBuilder<Store>();
      const storeFilter: Filter<Store> = storeFilterBuilder.where({ _id: storeID }).build();

      const store: Store | null = await this.storeRepository.findOne(storeFilter);

      if (!store) {
        throw new HttpErrors.NotFound(StoreResponseMessages.NOT_FOUND);
      }

      if (!newBoomAccount || !newBoomAccount._id) {
        throw new HttpErrors.NotFound(BoomAccountResponseMessages.NOT_FOUND);
      }

      const updateBoomCard: Partial<BoomCard> = {
        status: BoomCardStatus.ACTIVE,
        pinNumber,
        boomAccountID: newBoomAccount._id,
        customerID: data.uid,
        storeID: storeID, //loopback does not recognize ObjectId type, here we are assuring that storeId stores a string into the DB
        storeMerchantID: store ? store.merchant?.uid : '',
      };

      await this.boomCardRepository.updateById(boomCard._id, updateBoomCard);

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: { ...boomCard, ...updateBoomCard },
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Updates a Boom card
   * @param {string} id
   * @param {BoomCard} boomCard
   * @returns {Promise<void>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/boom-cards/{id}', PATCHBoomCardsByIdSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHBoomCardsByIdRequestBody) boomCard: BoomCard
  ): Promise<Response> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const profile = await this.profileService.getProfile(currentUser.uid);
      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      const isCustomer: boolean = currentUser.roles.includes(RoleKey.Member);

      if (!isCustomer) {
        await this.boomCardRepository.updateById(id, boomCard);
      }

      const belongs: boolean = boomcardBelongsToUser(profileData, id);

      if (!belongs) throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);

      // Customer can't modify these
      if (
        boomCard.boomAccountID ||
        boomCard.status === BoomCardStatus.ACTIVE ||
        boomCard.status === BoomCardStatus.INACTIVE ||
        boomCard.status === BoomCardStatus.INACTIVE_ISSUED
      )
        throw new HttpErrors.Unauthorized(BoomCardResponseMessages.UNAUTHORIZED_BOOMCARD_UPDATE);

      if (boomCard.status === BoomCardStatus.BLOCKED && !boomCard.pinNumber)
        throw new HttpErrors.BadRequest(BoomCardResponseMessages.PIN_REQUIRED);

      if (boomCard.status === BoomCardStatus.BLOCKED && boomCard.pinNumber) {
        const targetBoomcard: BoomCard = await this.boomCardRepository.findById(id);
        if (targetBoomcard.status !== BoomCardStatus.ACTIVE)
          throw new HttpErrors.BadRequest(BoomCardResponseMessages.UNACTIVE_TO_BLOCK);

        if (targetBoomcard.pinNumber !== boomCard.pinNumber)
          throw new HttpErrors.BadRequest(BoomCardResponseMessages.PIN_INCORRECT);
      }

      await this.boomCardRepository.updateById(id, boomCard);

      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /** // TODO: review this endpoint about Boom Business Logic, i don't see any reason to delete a boomcard instance, also the record is not removed from Firestore user profile.
   * Deletes a Boom card
   * @param {string} id
   * @returns {Promise<void>}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/boom-cards/{id}', DELBoomCardsByIdSpecifications)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      await this.boomCardRepository.deleteById(id);
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Login endpoint for Boom cards. Will return a firebase token that can be used to authenticate with the API
   * @param {{ cardNumber: string; pinNumber: string }} data The Boom card number and pin
   * @returns {(Promise<string | Response>)}
   * @memberof BoomCardController
   */
  @authorize([RoleKey.All])
  @post('/boom-cards/login', POSTBoomCardsLoginSpecification)
  async login(
    @requestBody(POSTBoomCardsLoginRequestBody) data: { cardNumber: string; pinNumber: number }
  ): Promise<Response<APIResponse<string>>> {
    try {
      let token = '';
      const filterBuilder: FilterBuilder<BoomCard> = new FilterBuilder<BoomCard>();
      const filter: Filter<BoomCard> = filterBuilder
        .where({ and: [{ cardNumber: data.cardNumber }, { pinNumber: data.pinNumber }] })
        .build();
      const boomCards: BoomCard[] = await this.boomCardRepository.find(filter);

      if (!boomCards.length) {
        throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND);
      }

      const boomCard: BoomCard = boomCards[0];

      if (boomCard.status === BoomCardStatus.BLOCKED)
        throw new HttpErrors.Unauthorized(BoomCardResponseMessages.BLOCKED);

      const profile = await this.profileService.getProfile(boomCard._id, {
        method: getProfileOptions.BY_CARD,
      });

      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      token = await this.profileService.generateCustomToken(profileData.uid, { roles: ['member'] }); // Should we send the role of the user ??

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: token,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
