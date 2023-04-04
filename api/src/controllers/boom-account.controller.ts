import {
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  Money,
  RoleKey,
  toMoney,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, HttpErrors, param, Response, RestBindings } from '@loopback/rest';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  BoomAccountResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { BoomAccount } from '../models';
import { BoomAccountRepository } from '../repositories';
import { BoomAccountService, ProfileService } from '../services';
import { GETBalanceByUIDSpecification, GETBoomAccountByIDSpecification } from '../specifications/';
import { handleServiceResponseResult } from '../utils';

export class BoomAccountController {
  logger: Logger = getLogger(LoggingCategory.BOOM_ACCOUNT_CONTROLLER);
  constructor(
    @repository(BoomAccountRepository)
    public boomAccountRepository: BoomAccountRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ProfileService)
    private profileService: ProfileService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'>>,
    @service(BoomAccountService)
    public boomAccountService: BoomAccountService
  ) {}

  /**
   * Finds a boom account by its database ID
   * @param {string} id MongoDB Object ID
   * @returns {Promise<BoomAccount>} Promise BoomAccount
   * @memberof BoomAccountController
   */
  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-account/{id}', GETBoomAccountByIDSpecification)
  async findById(@param.path.string('id') id: string): Promise<APIResponse<BoomAccount>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const isCustomer: boolean = currentUser.roles.includes(RoleKey.Member);
      const boomAccount: BoomAccount = await this.boomAccountRepository.findById(id);

      if (!boomAccount) {
        throw new HttpErrors.NotFound(BoomAccountResponseMessages.NOT_FOUND);
      }

      // Member can only access to account belong to.
      if (isCustomer && boomAccount.customerID !== currentUser.uid) {
        throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      return {
        success: true,
        message: 'Success',
        data: boomAccount,
      };
    } catch (error) {
      switch (error.message) {
        case ProfileResponseMessages.MEMBER_NOT_FOUND:
        case BoomAccountResponseMessages.NOT_FOUND:
        case GlobalResponseMessages.NOT_AUTHORIZED:
          throw error;
        default:
          throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Get the balance from specific user by his UID
   * @param {string} uid Boom user id.
   * @returns {Promise<Response>} Promise BoomAccount
   * @memberof BoomAccountController
   */
  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/boom-account/balance/{uid}', GETBalanceByUIDSpecification)
  async findByUserId(@param.path.string('uid') uid: string): Promise<Response> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();

      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const profile = await this.profileService.getProfile(currentUser.uid);
      const profileData = handleServiceResponseResult<typeof profile.data>(profile);

      if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      if (
        profileData.roles.includes(RoleKey.Member) ||
        profileData.roles.includes(RoleKey.Merchant)
      ) {
        if (!profileData.boomAccounts)
          throw new HttpErrors.NotFound(BoomAccountResponseMessages.NOT_FOUND);
        if (profileData.uid !== uid)
          throw new HttpErrors.Unauthorized(BoomAccountResponseMessages.UNAUTHORIZED);
      }

      const dbAccount: APIResponse<BoomAccount> =
        await this.boomAccountService.verifyExistingAccounts(uid);

      if (!dbAccount.success || !dbAccount.data)
        throw new HttpErrors.NotFound(BoomAccountResponseMessages.NOT_FOUND);

      /* 
        Disabled the pending balance calculation. I don't think this is needed based on my understanding of this requirement.
        
        For customers: 
        
        A pending balance on a transfer doesn't occur 
        on purchases as the amount should be removed from account immediately.

        When funding an account, the balance is also added to the account immediately.

        When sending out a transfer to a friend, the balance should (according to recent requirements) remove the amount from the sender immediately.

        When receiving a transfer, the transfer IS in a pending state but not yet assigned to the receiver. So querying a balance would not include this amount.

        For merchants:

        A merchant transaction could have pending transfers but that is a separate database collection (merchant-transactions) which isn't being checked for here

        const pendingBalance: Money | undefined = handleServiceResponseResult<Money>(
          await this.boomAccountService.pendingBalance(currentUser.uid)
        );

        if (!pendingBalance)
          return this.response.status(ServiceResponseCodes.SUCCESS).send({
            success: true,
            message: APIResponseMessages.SUCCESS,
            data: dbAccount.data.balance,
          });

        const realBalance: Money = toMoney(
          Dinero(dbAccount.data.balance).subtract(Dinero(pendingBalance)).toUnit()
        );
      */

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: dbAccount.data.balance,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
