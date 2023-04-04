import {
  APIResponse,
  BookingStatus,
  BookingTypes,
  isOffer,
  isProduct,
} from '@boom-platform/globals';
import {
  Count,
  DataObject,
  Filter,
  FilterBuilder,
  Options,
  repository,
  Where,
} from '@loopback/repository';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';
import moment from 'moment';

import {
  BookingResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProductResponseMessages,
} from '../constants';
import { Booking, Offer, Product } from '../models';
import { BookingRepository, OfferRepository, ProductRepository } from '../repositories';
import { BookingValidationResult, InvalidBookingBundle } from '../types';
import { APIResponseFalseOutput } from '../utils';
import { OfferService } from './offer.service';
import { ProductService } from './product.service';

export class BookingService {
  logger: Logger = getLogger(LoggingCategory.BOOKINGS);
  constructor(
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(OfferRepository)
    public offerRepository: OfferRepository,
    @service(ProductService)
    public productService: ProductService,
    @service(OfferService)
    public offerService: OfferService
  ) {}

  /**
   * Creates bookings,
   * @param {(Booking[] | null)} bookings bookings contain booking information
   * @param {Options} [options] This is a param auto-filled by the transactional decorator. It should not be passed when calling this method.
   * @returns {Promise<BookingResult>}
   * @memberof BookingService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async createBookings(
    bookings: Booking[],
    options?: Options
  ): Promise<APIResponse<BookingValidationResult>> {
    try {
      this.logger.info('Starting bookings create request');
      // empty booking array or not existing verification.
      if (!bookings?.length) return APIResponseFalseOutput(BookingResponseMessages.EMPTY_ARRAY);
      // variables.
      const newBookings: Booking[] = [];
      const updatedBookings: Booking[] = [];
      const invalidsBookings: InvalidBookingBundle[] = [];
      // loop to each booking intended to create.
      for (const booking of bookings) {
        const itemIsOffer: boolean = isOffer(booking.item);
        const itemIsProduct: boolean = isProduct(booking.item);

        if (!itemIsOffer && !itemIsProduct)
          return APIResponseFalseOutput(BookingResponseMessages.INVALID_ITEM);

        if (isOffer(booking.item)) {
          if (booking.type !== BookingTypes.OFFER)
            return APIResponseFalseOutput(BookingResponseMessages.INVALID_OFFER_TYPE);
          const offerValidationResponse: APIResponse<Offer> = await this.offerService.validateOffer(
            booking.item as Offer
          );
          if (!offerValidationResponse.success)
            return APIResponseFalseOutput(offerValidationResponse.message);
        }

        if (isProduct(booking.item)) {
          if (booking.type !== BookingTypes.PRODUCT)
            return APIResponseFalseOutput(BookingResponseMessages.INVALID_PRODUCT_TYPE);
          const productValidationResponse: APIResponse<Product> =
            await this.productService.validateProduct(booking.item as Product);
          if (!productValidationResponse.success)
            return APIResponseFalseOutput(productValidationResponse.message);
        }
        const newBooking: Booking = { ...booking } as Booking;
        let newVisitCount: number;
        const now: number = moment().utc().unix();
        let offer: Offer | undefined = undefined;
        let product: Product;
        let itemSearchId: string | undefined;

        if (isOffer(booking.item)) {
          offer = await this.offerRepository.findById(booking.item._id);
          itemSearchId = offer._id;

          const expiration: number = offer.expiration;

          if (now > expiration) {
            this.logger.error(BookingResponseMessages.OFFER_EXPIRED);
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.OFFER_EXPIRED,
            });
            continue;
          }
          if (booking.quantity > offer.maxQuantity) {
            this.logger.error(BookingResponseMessages.OFFER_EXCEEDED);
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.OFFER_EXCEEDED,
            });
            continue;
          }
          product = await this.productRepository.findById(booking.item.product._id);
        } else {
          product = await this.productRepository.findById(booking.item._id);
          itemSearchId = product._id;
        }

        const filterBuilder: FilterBuilder = new FilterBuilder();
        const filter = filterBuilder
          .where({
            and: [
              { memberUID: booking.memberUID },
              { 'item._id': itemSearchId },
              { status: BookingStatus.ACTIVE },
            ],
          })
          .limit(1)
          .build();

        const preExistingBookings: Booking[] = await this.bookingRepository.find(
          filter as Filter<Booking>
        );
        this.logger.debug('Found pre existing bookings:', preExistingBookings);
        if (preExistingBookings.length) {
          // update
          const preExistingBooking: Booking = preExistingBookings[0];
          const updatedPreExistingBooking = { ...preExistingBooking } as Booking;

          if (updatedPreExistingBooking.status === BookingStatus.ACTIVE) {
            updatedPreExistingBooking.quantity += booking.quantity;
          } else {
            updatedPreExistingBooking.quantity = booking.quantity;
          }

          if (isOffer(booking.item)) {
            newVisitCount = (preExistingBooking.visits || 0) + 1;
            if (offer?.maxVisits !== undefined && newVisitCount > offer.maxVisits) {
              this.logger.debug(BookingResponseMessages.VISITS_EXCEEDED);
              invalidsBookings.push({
                booking: booking,
                reason: BookingResponseMessages.VISITS_EXCEEDED,
              });
              continue;
            }
            updatedPreExistingBooking.visits = newVisitCount;
          }

          if (
            product.quantity !== undefined &&
            updatedPreExistingBooking.quantity > product.quantity
          ) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.PRODUCT_EXCEEDED,
            });
            continue;
          }

          updatedPreExistingBooking.createdAt = now;
          updatedPreExistingBooking.updatedAt = now;
          updatedPreExistingBooking.status = BookingStatus.ACTIVE;

          updatedBookings.push(updatedPreExistingBooking);
        } else {
          // create

          if (product.quantity !== undefined && newBooking.quantity > product.quantity) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.PRODUCT_EXCEEDED,
            });
            continue;
          }
          newBooking.createdAt = now;
          newBooking.updatedAt = now;
          newBooking.visits = 1;
          newBooking.status = BookingStatus.ACTIVE;

          newBookings.push(newBooking);
        }
      }
      let createdBookings: Booking[] = [];
      if (newBookings.length) {
        createdBookings = await this.bookingRepository.createAll(
          newBookings,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        );
      }
      for (const updated of updatedBookings) {
        await this.bookingRepository.updateById(
          updated._id,
          updated,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        );
      }

      return {
        success: true,
        message: BookingResponseMessages.SUCCESS,
        data: { valids: [...createdBookings, ...updatedBookings], invalids: [...invalidsBookings] },
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  /**
   * Get Booking By Id,
   * @param {string} booking_id Booking ID related to MongoDB ObjectID
   * @returns {Promise<Booking>} Return a Booking entity by id, or rejected promise if not found.
   * @memberof BookingService
   */
  async getBookingById(booking_id: string): Promise<APIResponse<Booking>> {
    try {
      const bookingData = await this.bookingRepository
        .findById(booking_id)
        .then((result) => {
          console.log('result', result);
          return result;
        })
        .catch((err) => {
          console.log('err1', err);
          return err;
        });
      if (bookingData) return { success: true, message: 'Success', data: bookingData };
      else return APIResponseFalseOutput(BookingResponseMessages.UNEXPECTED);
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  async findBookings(filter: Filter<Booking>): Promise<APIResponse<Booking[]>> {
    try {
      const allBookings: Booking[] = await this.bookingRepository.find(filter);
      if (allBookings) {
        return { success: true, message: 'Success', data: allBookings };
      } else {
        return APIResponseFalseOutput(BookingResponseMessages.UNEXPECTED);
      }
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  async updateAllBookings(
    data: DataObject<Booking>,
    where?: Where<Booking> | undefined
  ): Promise<APIResponse<Count>> {
    try {
      const response: Count = await this.bookingRepository.updateAll(data, where);
      if (response.count > 0) return { success: true, message: 'Success', data: response };
      else return APIResponseFalseOutput();
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  async updateBookingById(id: string, data: DataObject<Booking>): Promise<APIResponse<void>> {
    try {
      await this.bookingRepository.updateById(id, data);
      return { success: true, message: 'Success' };
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  async deleteBookingById(id: string): Promise<APIResponse<void>> {
    try {
      await this.bookingRepository.deleteById(id);
      return { success: true, message: 'Success' };
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  async countBooking(where?: Where<Booking>): Promise<APIResponse<Count>> {
    try {
      const counter = await this.bookingRepository.count(where);
      if (counter) return { success: true, message: 'Success', data: counter };
      else return APIResponseFalseOutput(BookingResponseMessages.UNEXPECTED);
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }

  /**
   * Validate Booking list
   * @param {Booking[]} bookingList an array of bookings
   * @return BookingValidationResult which contain two arrays for valids and invalids bookings.
   */
  async validateBookings(bookingList: Booking[]): Promise<APIResponse<BookingValidationResult>> {
    try {
      const validsBookings: Booking[] = [];
      const invalidsBookings: InvalidBookingBundle[] = [];
      // Empty booking list validation.
      if (!bookingList?.length) {
        return APIResponseFalseOutput(BookingResponseMessages.EMPTY_ARRAY);
      }
      // Loop booking list to validate each one.
      for (const booking of bookingList) {
        try {
          // Ensure booking id validation.
          if (!booking._id) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.MISSING_ID,
            });
            continue;
          }
          // Query booking from db by id.
          const dbBooking: Booking = await this.bookingRepository.findById(booking._id);
          // Booking existence validation.
          if (!dbBooking) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.NOT_FOUND,
            });
            continue;
          }
          // Booking item existence validation.
          if (!dbBooking.item) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.ITEM_NOT_FOUND,
            });
            continue;
          }
          // Booking active validation.
          if (dbBooking.status && dbBooking.status !== BookingStatus.ACTIVE) {
            invalidsBookings.push({
              booking: booking,
              reason: `Booking status ${dbBooking.status}`,
            });
            continue;
          }
          // Double check type of booking.
          const itemIsAnOffer: boolean = isOffer(dbBooking.item);
          if (itemIsAnOffer) {
            const currentOffer: Offer = dbBooking.item as Offer;
            // Valid Offer validation.
            const isValidOffer: APIResponse<Offer> = await this.offerService.validateOffer(
              currentOffer
            );
            // Invalid offer catch.
            if (!isValidOffer.success) {
              invalidsBookings.push({
                booking: booking,
                reason: isValidOffer.message,
              });
              continue;
            }
            const dbProduct: Product = await this.productRepository.findById(
              currentOffer.product._id
            );
            if (
              dbBooking.quantity &&
              dbProduct.quantity &&
              dbProduct.quantity < dbBooking.quantity
            ) {
              invalidsBookings.push({
                booking: booking,
                reason: BookingResponseMessages.PRODUCT_EXCEEDED,
              });
              continue;
            }
          }
          // If is not an offer then is a product, product validation.
          const isValidProduct: APIResponse<Product> = await this.productService.validateProduct(
            dbBooking.item as Product
          );
          if (!isValidProduct.success) {
            invalidsBookings.push({
              booking: booking,
              reason: isValidProduct.message,
            });
            continue;
          }
          const dbProduct: Product = await this.productRepository.findById(dbBooking.item._id);
          if (!dbProduct) {
            invalidsBookings.push({
              booking: booking,
              reason: ProductResponseMessages.INVALID,
            });
            continue;
          }
          if (dbBooking.quantity && dbProduct.quantity && dbProduct.quantity < dbBooking.quantity) {
            invalidsBookings.push({
              booking: booking,
              reason: BookingResponseMessages.PRODUCT_EXCEEDED,
            });
            continue;
          }
          // At this point the booking is valid.
          validsBookings.push(booking);
        } catch (error) {
          invalidsBookings.push({
            booking: booking,
            reason: GlobalResponseMessages.UNEXPECTED,
          });
          continue;
        }
      }

      return {
        success: true,
        message: BookingResponseMessages.VALIDATION_SUCCESS,
        data: {
          valids: validsBookings,
          invalids: invalidsBookings,
        },
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }
}
