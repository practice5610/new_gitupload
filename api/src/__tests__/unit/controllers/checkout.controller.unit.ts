import { AllOptionalExceptFor, BoomUser } from '@boom-platform/globals';
import { Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import { SinonStub } from 'sinon';

import { CheckoutController } from '../../../controllers';
import PurchaseError from '../../../errors/purchase-error';
import { Booking } from '../../../models';
import { OfferRepository, ProductRepository } from '../../../repositories';
import { EmailService } from '../../../services/email.service';
import { PurchaseService } from '../../../services/purchase.service';
import { FailedBookingPurchase, PurchaseResult } from '../../../types/transactions';
import { givenBookings, givenCustomer, givenEmptyDatabase } from '../../helpers/database.helpers';

/**
 * These tests can be worked on after BW-950 changes the checkout process
 */
xdescribe('CheckoutController (unit)', () => {
  let response: Partial<Response>;
  let response500: Partial<Response>;
  let responseSend: Partial<Response>;
  let responseSend500: Partial<Response>;
  let send: SinonStub;
  let send500: SinonStub;

  let purchaseService: StubbedInstanceWithSinonAccessor<PurchaseService>;
  let emailService: StubbedInstanceWithSinonAccessor<EmailService>;
  let productRepository: StubbedInstanceWithSinonAccessor<ProductRepository>;
  let offerRepository: StubbedInstanceWithSinonAccessor<OfferRepository>;
  let customer: AllOptionalExceptFor<
    BoomUser,
    'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt'
  >;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenResponse);
  beforeEach(given500Response);
  beforeEach(givenPurchaseService);
  beforeEach(givenEmailer);
  beforeEach(givenProductRepository);
  beforeEach(givenOfferRepository);
  beforeEach(givenCustomerInstance);
  afterEach(restoreStubs);

  describe('Error handling', () => {
    it('returns 200 response, returning purchase service result error', async () => {
      const bookings: Partial<Booking>[] = await givenBookings();
      const controller: CheckoutController = new CheckoutController(
        offerRepository,
        productRepository,
        <Response>response,
        purchaseService,
        emailService
      );

      offerRepository.stubs.exists.resolves(true);
      purchaseService.stubs.purchase.resolves({
        success: false,
        message: 'There was a problem.',
        customer,
        customerEmail: customer.contact.emails?.[0],
      } as PurchaseResult);

      await controller.create(<Booking[]>bookings);

      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: 'There was a problem.',
        customer,
        customerEmail: customer.contact.emails?.[0],
      });
    });

    it('returns 500 response, when purchase service throws a PurchaseError during preparation', async () => {
      const bookings: Partial<Booking>[] = await givenBookings();
      const controller: CheckoutController = new CheckoutController(
        offerRepository,
        productRepository,
        <Response>response500,
        purchaseService,
        emailService
      );

      const failedBookings: FailedBookingPurchase[] = [
        { booking: bookings[0] as Booking, reason: 'Some reason' },
      ];

      const purchaseError: PurchaseError = new PurchaseError('Some error', 'Preparation Error', {
        checkedOut: [],
        failed: failedBookings,
        expired: [],
      });

      offerRepository.stubs.exists.resolves(true);
      purchaseService.stubs.purchase.throws(purchaseError);
      emailService.stubs.sendAppError.resolves();

      await controller.create(<Booking[]>bookings);

      expect(send500.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: 'Preparation Error',
      });
    });
  });

  function givenCustomerInstance() {
    customer = givenCustomer();
  }

  function givenResponse() {
    send = sinon.stub();
    responseSend = {
      send,
    };
    response = {
      status: sinon.stub().returns(responseSend),
    };
  }
  function given500Response() {
    send500 = sinon.stub();
    responseSend500 = {
      send: send500,
    };
    response500 = {
      status: sinon.stub().withArgs(500).returns(responseSend500),
    };
  }
  function givenPurchaseService() {
    purchaseService = createStubInstance(PurchaseService);
  }
  function givenEmailer() {
    emailService = createStubInstance(EmailService);
  }
  function restoreStubs() {}
  function givenProductRepository() {
    productRepository = createStubInstance(ProductRepository);
  }
  function givenOfferRepository() {
    offerRepository = createStubInstance(OfferRepository);
  }
});
