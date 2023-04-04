import { AllOptionalExceptFor, APIResponse, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { get, HttpErrors, param, post, requestBody, Response, RestBindings } from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { getProfileOptions, ProfileService } from '../services/profile.service';
import {
  GETAdminUserSpecification,
  GETAdminUsersSpecification,
  GETTransferReceiverProfileSpecification,
  POSTAdminUserRequestBody,
  POSTAdminUserSpecification,
  POSTUsersVerifyPhoneNumberRequestBody,
  POSTUsersVerifyPhoneNumberSpecification,
} from '../specifications';
import { handleServiceResponseResult } from '../utils';
import {
  CreateUserType,
  FilterAdminUsersSchemaObject,
  FilterAdminUsersType,
  VerifyPhoneNumberType,
} from '../validation/schemas';

export class UsersController {
  logger: Logger = getLogger(LoggingCategory.USERS);
  constructor(
    @service(ProfileService)
    private profileService: ProfileService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/admin/users', GETAdminUsersSpecification)
  async findAll(
    @param.query.object('filter', FilterAdminUsersSchemaObject)
    filter: FilterAdminUsersType
  ): Promise<Response<APIResponse<BoomUser[]>>> {
    try {
      const result = await this.profileService.getFilteredProfiles(filter);
      const resultData = handleServiceResponseResult<typeof result.data>(result);
      // we can change this so we sent empty arrays but due to the error codes are forward same as the messages we can provide better feedback
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: resultData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/admin/user/{uid}', GETAdminUserSpecification)
  async getUserById(@param.path.string('uid') uid: string): Promise<Response<APIResponse<any>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const currentUserIsSuperAdmin: boolean = currentUser.roles.includes(RoleKey.SuperAdmin);

      const profile = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'contact'>
      >(uid, {
        requiredFields: ['contact'],
      });

      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      if (profileData?.roles?.includes(RoleKey.SuperAdmin) && !currentUserIsSuperAdmin) {
        throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: profileData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * When a user tries to send funds, verify is supposed to:
   * - warn the sender if the receiver isn’t a boom user (if the number doesn’t exist)
   * - warn the user if the account exists but the name they provided doesn’t match our record
   * - confirm that the info they entered is what we have on record for the given phone number
   * @returns
   */
  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/users/verifyPhoneNumber', POSTUsersVerifyPhoneNumberSpecification)
  async verifyPhoneNumber(
    @requestBody(POSTUsersVerifyPhoneNumberRequestBody)
    req: VerifyPhoneNumberType
  ): Promise<Response<APIResponse<any>>> {
    try {
      const { firstName, lastName } = req;
      let { phone } = req;

      // This part is only used for unit testing, specifications already supports this validation
      if (!firstName || !lastName || !phone) {
        throw new HttpErrors.InternalServerError(
          ProfileResponseMessages.MISSING_PROFILE_PARAMETERS
        );
      }
      if (phone.length === 10) {
        // TODO: on ticket BW-1528 we should remove this validation the controller endpoint should check we get a number and verify that the +1 is present (Check line 141 api\src\services\profile.service.ts )
        phone = '+1' + phone;
      }

      const profile = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'firstName' | 'lastName'>
      >(phone, {
        requiredFields: ['firstName', 'lastName'],
        method: getProfileOptions.BY_PHONE,
      });

      if (!profile.success) {
        switch (profile.statusCode) {
          case ServiceResponseCodes.RECORD_NOT_FOUND:
            throw new HttpErrors.NotFound(ProfileResponseMessages.PHONE_NUMBER_WITHOUT_ACCOUNT);
          case ServiceResponseCodes.RECORD_CONFLICT:
            throw new HttpErrors.Conflict(APIResponseMessages.RECORD_CONFLICT);
          default:
            throw new HttpErrors.InternalServerError(
              ProfileResponseMessages.ACCOUNT_NAME_CANNOT_BE_CONFIRMED
            );
        }
      }

      if (
        profile.data?.firstName.toLowerCase() !== firstName.toLowerCase() ||
        profile.data?.lastName.toLowerCase() !== lastName.toLowerCase()
      ) {
        throw new HttpErrors.BadRequest(ProfileResponseMessages.NAME_DOESNT_MATCH);
      }

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.VERIFIED,
        data: { foundAccount: true },
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * This new route allow our app to show up name and profileImg from a receiver in transactions operation.
   * this should NOT be a public endpoint and should be called with a current member logged in the app for security.
   * @param uid Receiver BoomUser id from firebase
   * @returns Response with an specific field allowed to be showed in the front end.
   */
  @authorize([RoleKey.Member, RoleKey.SuperAdmin])
  @get('/users/transfer-receiver-profile/{uid}', GETTransferReceiverProfileSpecification)
  async getReceiverProfile(@param.path.string('uid') uid: string): Promise<Response> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const profile = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'firstName' | 'lastName' | 'profileImg'>
      >(uid, {
        requiredFields: ['firstName', 'lastName', 'profileImg'],
      });
      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      const profileWithFieldAllowed: AllOptionalExceptFor<
        BoomUser,
        'firstName' | 'lastName' | 'profileImg'
      > = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profileImg: profileData.profileImg,
      };

      return this.response.status(ServiceResponseCodes.SUCCESS).send({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: profileWithFieldAllowed,
      });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/admin/user', POSTAdminUserSpecification)
  async createUser(
    @requestBody(POSTAdminUserRequestBody)
    user: CreateUserType
  ): Promise<Response<APIResponse<any>>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const currentUserIsSuperAdmin: boolean = currentUser.roles.includes(RoleKey.SuperAdmin);
      if (
        (user.roles.includes(RoleKey.SuperAdmin) || user.roles.includes(RoleKey.Admin)) &&
        !currentUserIsSuperAdmin
      ) {
        throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);
      }

      if (user.roles.length === 0) {
        throw new HttpErrors.BadRequest(GlobalResponseMessages.INVALID_ROLE);
      }

      const profile = await this.profileService.createUser(user);
      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: profileData });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
