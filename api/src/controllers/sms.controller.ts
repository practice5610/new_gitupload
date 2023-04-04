import { RoleKey } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors, post, requestBody, Response, RestBindings } from '@loopback/rest';
import axios from 'axios';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { authorize } from '../authorization';
import { APIResponseMessages, LoggingCategory, ServiceResponseCodes } from '../constants';
import { BoomCardRepository } from '../repositories';
import { SNSService } from '../services/sns.service';
import { POSTSmsAppRequestBody, POSTSmsAppSpecification } from '../specifications';

export class SMS {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);
  constructor(
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository,
    @service(SNSService)
    private snsService: SNSService,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.All])
  @post('/sms/app', POSTSmsAppSpecification)
  async create(
    @requestBody(POSTSmsAppRequestBody) body: { token: string; phone: string }
  ): Promise<Response> {
    try {
      const { token, phone } = body;

      if (!token || !phone) {
        throw new HttpErrors.BadRequest('Missing token or phone');
      }
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RE_CAPTCHA_SECRET_KEY}&response=${token}`,
        {},
        {}
      );

      if (!response.data.success) throw new HttpErrors.Conflict(response.data['error-codes']);

      const result = await this.snsService.sendSMS({
        Message: `Thanks for visiting Boomcarding, here is a link to download our mobile app.
        \nFor IOS : https://www.apple.com/ios/app-store
        \nFor Android : https://play.google.com/store`,
        PhoneNumber: phone,
      });

      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      if (HttpErrors.isHttpError(error)) {
        throw error;
      }
      this.logger.error(error.message);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
