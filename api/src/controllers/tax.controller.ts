import {
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  isOffer,
  isProduct,
  Money,
  RoleKey,
  toMoney,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { HttpErrors, post, put, requestBody, Response, RestBindings } from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { AuthorizatonBindings, authorize } from '../authorization';
import { ProfileResponseMessages, ServiceResponseCodes } from '../constants';
import { LoggingCategory } from '../constants';
import { Booking } from '../models';
import { BookingService, ProfileService } from '../services';
import { TaxService } from '../services/tax.service';
import {
  POSTGetTaxableProductRequestBody,
  POSTGetTaxableProductSpecification,
  PUTSetTaxableStatesRequestBody,
  PUTSetTaxableStatesSpecification,
} from '../specifications';
import { Nexus, TaxAddress } from '../types';
import { getComposedAddressFromStore, handleServiceResponseResult } from '../utils';
export class TaxController {
  logger: Logger = getLogger(LoggingCategory.TAXES);
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @service(ProfileService)
    public profileService: ProfileService,
    @service(BookingService)
    public bookingService: BookingService,
    @service(TaxService)
    public taxService: TaxService
  ) {}

  /**
   * Get all sales tax per item
   * @param item
   */
  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/getTaxableProduct')
  async getTax(
    @requestBody()
    item: {
      id: string;
      toAddress: TaxAddress;
    }[]
  ): Promise<Response> {
    const result: any = [];

    await Promise.all(
      item.map(async (data) => {
        const targetBookingResponse: APIResponse<Booking> =
          await this.bookingService.getBookingById(data.id);
        if (!targetBookingResponse.success || !targetBookingResponse.data) {
          throw new HttpErrors.NotFound(targetBookingResponse.message);
        }
        const targetBooking: Booking = targetBookingResponse.data;
        const merchantProfile = await this.profileService.getProfile<
          AllOptionalExceptFor<BoomUser, 'contact' | 'addresses' | 'store' | 'taxableNexus'>
        >('SseaCdgh13R1MQWRKP3gXbQrbyl2', {
          requiredFields: ['contact', 'addresses', 'store', 'taxableNexus'],
          messageNoProfileFound: ProfileResponseMessages.MERCHANT_NOT_FOUND,
        });
        // console.log('test2', merchantProfile);

        const merchantProfileData =
          handleServiceResponseResult<typeof merchantProfile.data>(merchantProfile);
        if (!merchantProfileData)
          throw new HttpErrors.NotFound(ProfileResponseMessages.MERCHANT_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us
        // console.log('testcase22', merchantProfileData);
        const fromAddress = {
          address: getComposedAddressFromStore(merchantProfileData.store),
          country: merchantProfileData.store.country,
          zip: merchantProfileData.store.zip,
          state: merchantProfileData.store.state,
          city: merchantProfileData.store.city,
        };

        let amount: Money;
        if (isProduct(targetBooking.item)) {
          amount = targetBooking.item.price;
        } else if (isOffer(targetBooking.item)) {
          amount = targetBooking.item.product?.price ?? toMoney(0);
        } else {
          // If the booking is not an offer or a product we don't try calling the taxjar api
          result.push({ id: data.id, tax: toMoney(0) });
          return;
        }

        if (
          !merchantProfileData.taxableNexus.some(
            (nexus: any) => nexus.state === data.toAddress.state
          )
        ) {
          const tax: Money = toMoney(0);
          result.push({ id: data.id, tax: tax });
          return; //if merchant doesn't have nexus toAddress, tax amount it's set to 0, and return async function to prevent extra call to taxjar API
        }

        const totalTaxesResponse = await this.taxService.getTotalTaxByProduct(
          fromAddress,
          data.toAddress,
          merchantProfileData.taxableNexus,
          amount
        );

        if (!totalTaxesResponse.success || !totalTaxesResponse.data) {
          this.logger.error('error', totalTaxesResponse.message);
          throw new HttpErrors.BadRequest(totalTaxesResponse.message);
        } else {
          const tax: Money = toMoney(totalTaxesResponse.data.tax.amount_to_collect);
          result.push({ id: data.id, tax: tax });
        }
      })
    );
    // console.log('checkkk', result);

    return this.response.status(ServiceResponseCodes.SUCCESS).send({
      data: result,
      success: true,
      message: 'Tax list',
    });
  }

  @authorize([RoleKey.Merchant])
  @put('/setTaxableStates', PUTSetTaxableStatesSpecification)
  async setTaxableStates(@requestBody() nexus: Nexus[]): Promise<void> {
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);
    await this.profileService.updateProfileById(currentUser.uid, {
      taxableNexus: nexus.map(({ country, state }): Nexus => ({ country, state })) as Nexus[],
    } as BoomUser);
  }
}
