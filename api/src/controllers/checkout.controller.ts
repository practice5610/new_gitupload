import { BookingTypes, isOffer, isProduct, Product, RoleKey } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors, post, requestBody, Response, RestBindings } from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';

import { authorize } from '../authorization';
import {
  CheckOutResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
} from '../constants';
import { Booking, Order, Transaction } from '../models';
import { OfferRepository, ProductRepository } from '../repositories';
import { EmailService } from '../services/email.service';
import { PurchaseService } from '../services/purchase.service';
import { POSTPlaceOrderRequestBody, POSTPlaceOrderSpecification } from '../specifications/';
import { PurchaseResult } from '../types';
import { fromMoney } from '../utils/money';

export class CheckoutController {
  logger: Logger = getLogger(LoggingCategory.PURCHASES_SERVICE);

  constructor(
    @repository(OfferRepository)
    public offerRepository: OfferRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(PurchaseService)
    private purchaseService: PurchaseService,
    @service(EmailService)
    private emailService: EmailService
  ) {}
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/checkout', {
    responses: {
      '200': {
        description: 'Checks out bookings that are provided',
        content: { 'application/json': { schema: { 'x-ts-type': Transaction } } },
      },
    },
  })
  async create(@requestBody() bookings: Booking[]): Promise<Transaction | Response> {
    this.logger.info('\n\n\n===================================================');

    this.logger.debug('Bookings count:', bookings.length);

    if (bookings.length === 0) {
      throw new HttpErrors.BadRequest(CheckOutResponseMessages.BAD_REQUEST_NO_BOOKINGS);
    }
    for (const booking of bookings) {
      if (!booking.item) {
        console.error(
          BookingTypes.OFFER
            ? CheckOutResponseMessages.BAD_REQUEST_MISSING_OFFER
            : CheckOutResponseMessages.BAD_REQUEST_MISSING_PRODUCT
        );
        throw new HttpErrors.BadRequest(
          booking.type === BookingTypes.OFFER
            ? CheckOutResponseMessages.BAD_REQUEST_MISSING_OFFER
            : CheckOutResponseMessages.BAD_REQUEST_MISSING_PRODUCT
        );
      }

      const isAnOffer: boolean = isOffer(booking.item);
      const exists: boolean = isAnOffer
        ? await this.offerRepository.exists(booking.item._id)
        : await this.productRepository.exists(booking.item._id);

      // if (!exists) {
      //   const type: string = isAnOffer ? 'Offer' : 'Product';
      //   const msg: string = isAnOffer
      //     ? CheckOutResponseMessages.DELETED_OFFER
      //     : CheckOutResponseMessages.DELETED_PRODUCT;

      //   console.error(`${type}: ${booking.item._id}, Message: ${msg}`);

      //   return this.response.status(ServiceResponseCodes.SUCCESS).send({
      //     success: false,
      //     customer: null,
      //     customerEmail: null,
      //     failed: [booking],
      //     message: msg,
      //   });
      // }
    }

    this.logger.info('Check out requested by customer ID:', bookings[0].memberUID);

    try {
      const result: PurchaseResult = await this.purchaseService
        .purchase(bookings)
        .then((result) => {
          console.log('cehckkresult133', result);
          return result;
        })
        .catch((err) => {
          console.log('cehckkresulterr12', err);
          return err;
        });

      if (!result.success) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
      }

      this.logger.info('Check out success');

      if (result.checkedOut?.length) {
        this.logger.debug(`At least one item checked out successfully`);
        this.logger.debug(`Will email customer ${result.customer?.uid}`);
        this.logger.debug(`Will email to: ${result.customerEmail}`);

        const items: string = result.checkedOut
          .map(
            (booking: Booking) => `
          booking: ${
            isOffer(booking.item)
              ? booking.item.title
              : isProduct(booking.item)
              ? booking.item.name
              : ''
          } <br>
          price: ${
            isOffer(booking.item)
              ? fromMoney(booking.item.product.price)
              : isProduct(booking.item)
              ? fromMoney(booking.item.price)
              : ''
          } <br>
          ${isOffer(booking.item) ? `cashback: ${booking.item.cashBackPerVisit}` : ''}
          `
          )
          .join('<br>');

        if (result.customerEmail) {
          await this.emailService.sendConfirmationToCustomer({
            customer: result.customer,
            subject: 'Purchase Confirmation',
            customerEmail: result.customerEmail,
            intro: 'You have purchased items!',
            dictionary: { items },
          });
        }
      }

      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ ...result, customer: result?.customer?.uid });
    } catch (error) {
      this.logger.error('Check out error.', error);

      let diagnosticsData: string | null = null;
      let publicMessage: string = error;

      if (error.name === 'PurchaseError') {
        diagnosticsData = error.toJSON();
        publicMessage = error.publicMessage;
      }

      this.logger.debug(`Extra diagnostics data:`, diagnosticsData);

      const bookingsAttempted: string = bookings
        .map(
          (booking: Booking) => `
        bookingID: ${booking._id}  <br>
        itemID: ${booking.item._id}  <br>
        isOffer?: ${isOffer(booking.item)}  <br>
        price: ${
          isOffer(booking.item)
            ? fromMoney(booking.item.product.price)
            : isProduct(booking.item)
            ? fromMoney(booking.item.price)
            : ''
        }  <br>
        cashback: ${isOffer(booking.item) ? fromMoney(booking.item.cashBackPerVisit) : 'n/a'}  <br>
        customerID: ${booking.memberUID}  <br>
        merchantID: ${booking.item.merchantUID}  <br>
        storeID: ${
          isOffer(booking.item)
            ? booking.item.product.store?._id
            : isProduct(booking.item) && booking.item.store
            ? booking.item.store._id
            : ''
        }
        `
        )
        .join('<br>=================================<br>');

      this.logger.info(`Bookings Related to error:`, bookingsAttempted);

      const dictionary: any = {
        customer: bookings[0].memberUID,
        bookingsAttempted,
        diagnosticsData,
      };

      await this.emailService.sendAppError(
        'Checkout Error',
        'A customer had an error while attempting to check out. Related data below:',
        dictionary
      );

      this.logger.info(`Error Email sent`);

      return this.response.status(500).send({ success: false, message: publicMessage });
    }
  }

  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/place-order')
  async placeOrder(@requestBody() order: any): Promise<Response> {
    try {
      console.log('checkworkingpalce', order);
      const purchaseResponse = await this.purchaseService.newPurchase(order);
      if (!purchaseResponse.success) {
        return this.response.status(400).send(purchaseResponse); //TODO: This should throw error
      }
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: purchaseResponse.message });
    } catch (error) {
      console.log('newerrorr', error);
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(GlobalResponseMessages.UNPROCESSABLE_PURCHASE);
    }
  }
}
