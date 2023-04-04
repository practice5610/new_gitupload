import {
  AccountInfoQueryTypes,
  AllOptionalExceptFor,
  BoomUser,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors, post, requestBody, Response, RestBindings } from '@loopback/rest';
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
import { BoomCard } from '../models';
import { BoomCardRepository } from '../repositories';
import { getProfileOptions, ProfileService } from '../services';
import { EmailService } from '../services/email.service';
import { SNSService } from '../services/sns.service';
import { handleServiceResponseResult } from '../utils';

export class AccountController {
  logger: Logger = getLogger(LoggingCategory.ACCOUNT);
  constructor(
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository,
    @service(SNSService)
    private snsService: SNSService,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(EmailService)
    private emailService: EmailService
  ) {}

  @authorize([RoleKey.Member])
  @post('/account-info/customer/sms', {
    responses: {
      '200': {
        description: 'Account info sent response',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async sendAccountInfoViaSMS(
    @requestBody() body: { type: AccountInfoQueryTypes; id: string }
  ): Promise<Response> {
    try {
      const { type, id } = body;
      this.logger.debug('Requesting account info via SMS...', { type, id });

      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const isCustomer: boolean = currentUser.roles.includes(RoleKey.Member);

      let message = '';
      let phone = '';

      if (!isCustomer) throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);

      this.logger.debug('User is a customer. Proceeding...');

      if (type === AccountInfoQueryTypes.BoomcardPin) {
        this.logger.debug(
          `Customer requests for a boomcad pin. Will query profile by boomcard id ${id}`
        );

        const profile = await this.profileService.getProfile<
          AllOptionalExceptFor<BoomUser, 'contact'>
        >(id, {
          requiredFields: ['contact'],
          method: getProfileOptions.BY_CARD,
        });

        const profileData = handleServiceResponseResult<typeof profile.data>(profile);
        if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

        this.logger.debug(
          `Profile vs current user IDs match? ${profileData.uid === currentUser.uid}`
        );

        if (profileData.uid !== currentUser.uid)
          throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);

        const boomCard: BoomCard = await this.boomCardRepository.findById(id);

        this.logger.debug(`Found requested Boom card`, boomCard);

        message = `Your Boom card pin number is ${boomCard.pinNumber}`;
        phone = profileData.contact.phoneNumber ?? '';
      }

      this.logger.debug(`Will send SMS with message:`, message, 'and number: ', phone);

      const result = await this.snsService.sendSMS({
        Message: message,
        PhoneNumber: phone,
      });

      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member])
  @post('/account-info/customer/email', {
    responses: {
      '200': {
        description: 'Account info sent response',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async sendAccountInfoViaEmail(
    @requestBody() body: { type: AccountInfoQueryTypes; id: string }
  ): Promise<Response> {
    try {
      const { type, id } = body;
      this.logger.debug('Requesting account info via Email...', { type, id });

      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      const isCustomer: boolean = currentUser.roles.includes(RoleKey.Member);

      let message = '';

      if (!isCustomer) throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);

      this.logger.debug('User is a customer. Proceeding...');

      if (type === AccountInfoQueryTypes.BoomcardPin) {
        this.logger.debug(
          `Customer requests for a boomcad pin. Will query profile by boomcard id ${id}`
        );

        const profile = await this.profileService.getProfile<
          AllOptionalExceptFor<BoomUser, 'contact'>
        >(id, {
          requiredFields: ['contact'],
          method: getProfileOptions.BY_CARD,
        });

        const profileData = handleServiceResponseResult<typeof profile.data>(profile);
        if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

        this.logger.debug(
          `Profile vs current user IDs match? ${profileData.uid === currentUser.uid}`
        );

        if (profileData.uid !== currentUser.uid)
          throw new HttpErrors.Unauthorized(GlobalResponseMessages.NOT_AUTHORIZED);

        if (!profileData.contact.emails?.length)
          throw new HttpErrors.NotFound(GlobalResponseMessages.NO_EMAIL);

        const boomCard: BoomCard = await this.boomCardRepository.findById(id);

        this.logger.debug(`Found requested Boom card`, boomCard);

        message = `Your Boom card pin number is ${boomCard.pinNumber}`;

        this.logger.debug(
          `Will send email with mesage:`,
          message,
          'and email: ',
          profileData.contact.emails[0]
        );

        await this.emailService.sendAccountInfoToUser({
          user: profileData,
          pin: boomCard.pinNumber,
          type,
        });
      } else {
        throw new HttpErrors.BadRequest(
          `The account type requested of ${type} is not supported. Only ${AccountInfoQueryTypes.BoomcardPin} is allowed at this point.`
        );
      }

      return this.response.status(ServiceResponseCodes.SUCCESS).send({ success: true });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
