import {
  AllOptional,
  AllOptionalExceptFor,
  APIResponse,
  BookingTypes,
  BoomUser,
  isArray,
  isOffer,
  isProduct,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Count, Filter, FilterBuilder, Where } from '@loopback/repository';
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
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  BookingResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
  StoreResponseMessages,
} from '../constants';
import { Booking, Product, Store } from '../models';
import { BookingService, StoreService } from '../services';
import {
  DELBookingByIDSpecification,
  GETBookingByIDSpecification,
  GETBookingsCountSpecification,
  GETBookingsSpecification,
  PATCHBookingByIDRequestBody,
  PATCHBookingByIDSpecification,
  PATCHBookingsFilteredSpecification,
  PATCHBookingsRequestBody,
  POSTBookingsSpecification,
} from '../specifications';
import { BookingValidationResult, StoreAddress } from '../types/booking-types';

export class BookingController {
  logger: Logger = getLogger(LoggingCategory.BOOKINGS);
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(BookingService)
    public bookingService: BookingService,
    @service(StoreService)
    public storeService: StoreService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/bookings', POSTBookingsSpecification)
  async create(
    @requestBody.array(
      { schema: getModelSchemaRef(Booking, { exclude: ['_id', 'createdAt', 'updatedAt'] }) },
      {
        description: 'an array of bookings',
        required: true,
      }
    )
    bookings: Booking[]
  ): Promise<Response> {
    try {
      if (!isArray(bookings)) {
        throw new HttpErrors.BadRequest(BookingResponseMessages.EMPTY_ARRAY);
      }

      const result: APIResponse<BookingValidationResult> = await this.bookingService.createBookings(
        bookings
      );
      if (result.success) return this.response.status(ServiceResponseCodes.SUCCESS).send(result);

      //We should add to cart (make the booking) for valid ones, and return fail one with the reason to front end
      return this.response.status(400).send(result);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/bookings/count', GETBookingsCountSpecification)
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Booking))
    where?: Where<Booking>
  ): Promise<Response> {
    try {
      const counter: APIResponse<Count> = await this.bookingService.countBooking(where);
      if (counter) return this.response.status(ServiceResponseCodes.SUCCESS).send(counter);
      throw new HttpErrors.BadRequest(BookingResponseMessages.UNEXPECTED);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/bookings', GETBookingsSpecification)
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Booking))
    filter?: Filter<Booking>
  ): Promise<Response<Booking[]>> {
    try {
      const filterBuilder = new FilterBuilder(filter);
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.Unauthorized(ProfileResponseMessages.MEMBER_NOT_FOUND);
      //Validation if current user is Member this GET only can return Bookings related to this current member.
      if (currentUser.roles.includes(RoleKey.Member)) {
        filterBuilder.impose({ where: { memberUID: currentUser.uid } });
      }
      const allBookingResponse: APIResponse<Booking[]> = await this.bookingService.findBookings(
        filterBuilder.build()
      );
      if (!allBookingResponse?.success || !allBookingResponse?.data)
        throw new HttpErrors.BadRequest(
          allBookingResponse?.message
            ? allBookingResponse.message
            : BookingResponseMessages.UNEXPECTED
        );
      const allBookingByID: Booking[] = allBookingResponse.data;
      const updatedBookings: Booking[] = [];
      for (const booking of allBookingByID) {
        if (!isOffer(booking.item) && !isProduct(booking.item)) {
          this.logger.error(BookingResponseMessages.INVALID_ITEM);
          continue;
        }
        let requestedStoreID: string = '';
        if (
          isProduct(booking.item) &&
          booking.type === BookingTypes.PRODUCT &&
          booking.item.store?._id
        ) {
          requestedStoreID = booking.item.store._id;
        } else if (
          isOffer(booking.item) &&
          booking.type === BookingTypes.OFFER &&
          booking.item.product.store?._id
        ) {
          requestedStoreID = booking.item.product.store._id;
        }
        try {
          const storeResponse: APIResponse<Store> = await this.storeService.findStoreById(
            requestedStoreID
          );

          if (!storeResponse?.success || !storeResponse.data) {
            this.logger.error(StoreResponseMessages.INVALID_DATA);
            continue;
          }
          const storeData: StoreAddress = storeResponse.data; //Todo: use const store: StoreAddress = storeResponse.data
          const store: StoreAddress = {
            _id: storeData._id,
            companyName: storeData.companyName,
            merchant: storeData.merchant,
            country: storeData.country,
            state: storeData.state,
            city: storeData.city,
            zip: storeData.zip,
            number: storeData.number,
            street1: storeData.street1,
            street2: storeData.street2,
            _geoloc: storeData._geoloc,
          };

          const updatedProduct: Product = isProduct(booking.item)
            ? ({ ...booking.item, store: store } as Product) // TODO: https://boomcarding.atlassian.net/browse/BW-1582
            : ({ ...booking.item.product, store: store } as Product); // TODO: https://boomcarding.atlassian.net/browse/BW-1582
          const updateBooking: Booking = isProduct(booking.item)
            ? ({ ...booking, item: updatedProduct } as Booking)
            : ({ ...booking, item: { ...booking.item, product: updatedProduct } } as Booking); // TODO: https://boomcarding.atlassian.net/browse/BW-1582
          updatedBookings.push(updateBooking);
        } catch (error) {
          this.logger.error(error);
          continue;
        }
      }
      return this.response
        .status(200)
        .send({ success: true, message: APIResponseMessages.SUCCESS, data: updatedBookings });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  // WARNING: use this endpoint carefully it update items by bulk.
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/bookings', PATCHBookingsFilteredSpecification)
  async updateAll(
    @requestBody(PATCHBookingsRequestBody) booking: AllOptional<Booking>,
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Booking))
    where?: Where<Booking>
  ): Promise<Response<Count>> {
    try {
      const now = moment().utc().unix();
      const bookingFieldToUpdate: Partial<Booking> = { ...booking, updatedAt: now };
      const result: APIResponse<Count> = await this.bookingService.updateAllBookings(
        bookingFieldToUpdate,
        where
      );
      if (result?.success) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
      }
      throw new HttpErrors.NotFound(BookingResponseMessages.NOT_FOUND);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/bookings/{id}', GETBookingByIDSpecification)
  async findById(@param.path.string('id') id: string): Promise<Response<Booking>> {
    try {
      const bookingResponse: APIResponse<Booking> = await this.bookingService.getBookingById(id);
      if (!bookingResponse?.success || !bookingResponse.data)
        throw new HttpErrors.BadRequest(
          bookingResponse.message ? bookingResponse.message : BookingResponseMessages.UNEXPECTED
        );

      const booking: Booking = bookingResponse.data;
      if (!isOffer(booking.item) && !isProduct(booking.item)) {
        this.logger.error(BookingResponseMessages.INVALID_ITEM);
        throw new HttpErrors.BadRequest();
      }
      let requestedStoreID: string = '';
      if (
        isProduct(booking.item) &&
        booking.type === BookingTypes.PRODUCT &&
        booking.item.store?._id
      ) {
        requestedStoreID = booking.item.store._id;
      } else if (
        isOffer(booking.item) &&
        booking.type === BookingTypes.OFFER &&
        booking.item.product.store?._id
      ) {
        requestedStoreID = booking.item.product.store._id;
      }
      const storeResponse: APIResponse<Store> = await this.storeService.findStoreById(
        requestedStoreID
      );

      if (!storeResponse?.success || !storeResponse.data) {
        this.logger.error(StoreResponseMessages.INVALID_DATA);
        throw new HttpErrors.BadRequest(StoreResponseMessages.INVALID_DATA);
      }

      const storeData: StoreAddress = storeResponse.data;

      const store: StoreAddress = {
        _id: storeData._id,
        companyName: storeData.companyName,
        merchant: storeData.merchant,
        country: storeData.country,
        state: storeData.state,
        city: storeData.city,
        zip: storeData.zip,
        number: storeData.number,
        street1: storeData.street1,
        street2: storeData.street2,
        _geoloc: storeData._geoloc,
      };

      const updatedProduct: Product = isProduct(booking.item)
        ? ({ ...booking.item, store: store } as Product) // TODO: https://boomcarding.atlassian.net/browse/BW-1582
        : ({ ...booking.item.product, store: store } as Product); // TODO: https://boomcarding.atlassian.net/browse/BW-1582
      const updateBooking: Booking = { ...booking, item: updatedProduct } as Booking; // TODO: https://boomcarding.atlassian.net/browse/BW-1582
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'success', data: updateBooking });
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/bookings/{id}', PATCHBookingByIDSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHBookingByIDRequestBody) booking: AllOptional<Booking>
  ): Promise<Response> {
    try {
      booking.updatedAt = moment().utc().unix();
      const response: APIResponse<void> = await this.bookingService.updateBookingById(id, booking);
      if (response?.success) return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
      throw new HttpErrors.BadRequest(response.message);
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/bookings/{id}', DELBookingByIDSpecification)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const response: APIResponse<void> = await this.bookingService.deleteBookingById(id);
      if (response?.success) return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
      else throw new HttpErrors.BadRequest(response.message);
    } catch (error) {
      this.logger.error(error);
      if (error.code) throw new HttpErrors.BadRequest(error.code);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
