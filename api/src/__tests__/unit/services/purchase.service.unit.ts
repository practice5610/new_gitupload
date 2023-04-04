import {
  AllOptionalExceptFor,
  BookingStatus,
  BookingTypes,
  BoomUser,
  ProfileImage,
  toMoney,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { createStubInstance, expect, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';
import moment from 'moment';
import sinon from 'sinon';

import {
  CheckOutResponseMessages,
  GlobalResponseMessages,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../../../constants';
import { Booking, BoomAccount, Config, Offer, Product, Store, Transaction } from '../../../models';
import {
  BookingRepository,
  CategoryRepository,
  ConfigRepository,
  TransactionRepository,
} from '../../../repositories';
import {
  BookingService,
  BoomAccountService,
  OrderService,
  ProfileService,
  PurchaseService,
  ShippingService,
  TaxService,
} from '../../../services';
import { FailedBookingPurchase } from '../../../types';
import {} from '../../../utils/money';
import {
  givenBookings,
  givenBoomAccount,
  givenBoomAccountVerifyResponse,
  givenCategory,
  givenCustomer,
  givenEmptyDatabase,
  givenMerchant,
  givenProduct,
  givenStore,
  givenTaxResponse,
} from '../../helpers/database.helpers';

//TODO: Update this after BW-950 updates purchase service
xdescribe('PurchaseService (unit)', () => {
  let configRepository: StubbedInstanceWithSinonAccessor<ConfigRepository>;
  let categoryRepository: StubbedInstanceWithSinonAccessor<CategoryRepository>;
  let transactionRepository: StubbedInstanceWithSinonAccessor<TransactionRepository>;
  let bookingRepository: StubbedInstanceWithSinonAccessor<BookingRepository>;
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let taxService: StubbedInstanceWithSinonAccessor<TaxService>;
  let boomAccountService: StubbedInstanceWithSinonAccessor<BoomAccountService>;
  let bookingService: StubbedInstanceWithSinonAccessor<BookingService>;
  let shippingService: StubbedInstanceWithSinonAccessor<ShippingService>;
  let orderService: StubbedInstanceWithSinonAccessor<OrderService>;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenProfileService);
  beforeEach(givenConfigRepository);
  beforeEach(givenTransactionRepository);
  beforeEach(givenBookingRepository);
  beforeEach(givenCategoryRepository);
  beforeEach(givenTaxService);
  beforeEach(givenBoomAccountService);
  beforeEach(givenShippingService);
  beforeEach(givenOrderService);

  describe('Validation', () => {
    it('returns failed bookings list for a customer profile not found in firebase', async () => {
      const bookings: Partial<Booking>[] = await givenBookings();
      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      const result = await service.purchase(<Booking[]>bookings);
      const failedList: FailedBookingPurchase[] = [];

      bookings.forEach((booking) => {
        failedList.push({
          booking: booking as Booking,
          reason: ProfileResponseMessages.MERCHANT_NOT_FOUND,
        });
      });
      expect(result).to.deepEqual({
        success: true,
        customer: null,
        customerEmail: null,
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failedList,
      });
    });

    it('returns used bookings as failed', async () => {
      const bookings: Partial<Booking>[] = await givenBookings([
        { status: BookingStatus.USED } as Partial<Booking>,
        { status: BookingStatus.USED } as Partial<Booking>,
      ]);

      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer();

      profileService.stubs.getProfile.resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      const failedList: FailedBookingPurchase[] = [];
      failedList.push({
        booking: bookings[0] as Booking,
        reason: CheckOutResponseMessages.BOOKING_INACTIVE,
      });
      failedList.push({
        booking: bookings[1] as Booking,
        reason: CheckOutResponseMessages.BOOKING_INACTIVE,
      });

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: customer,
        customerEmail: customer.contact?.emails?.[0],
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failedList,
      });
    });

    it('returns valid bookings as successful', async () => {
      // givenBookings creates a list of offer bookins so I change one to a product here
      // to test offers and bookings
      const bookings: Partial<Booking>[] = await givenBookings([{} as Booking, {} as Booking]);
      bookings[1].type = BookingTypes.PRODUCT;
      bookings[1].item = await givenProduct();

      // we get standard user info and set the bookings to match the new uid
      let customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
        | 'addresses'
      > = givenCustomer({ cards: ['card id'] } as BoomUser);
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });
      bookings[0].memberUID = customer.uid;
      bookings[1].memberUID = customer.uid;

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      const boomAccount: BoomAccount = await givenBoomAccount({ customerID: customer.uid });
      customer = { ...customer, boomAccounts: [boomAccount._id] };

      // the service gets a merchant twice and a customer only once because we set the customer uid above
      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });

      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });
      profileService.stubs.getProfile.onThirdCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });

      // make all the repos and stubs return good stuff
      categoryRepository.stubs.find.resolves([givenCategory()]);
      categoryRepository.stubs.findById.resolves(givenCategory());
      taxService.stubs.getTotalTaxByProduct.resolves(givenTaxResponse());
      boomAccountService.stubs.verifyExistingAccounts.resolves(
        givenBoomAccountVerifyResponse(boomAccount)
      );
      boomAccountService.stubs.charge.resolves({
        success: true,
        message: 'Boom account update sucessfully.',
      });
      transactionRepository.stubs.createAll.resolves([]);
      configRepository.stubs.findOne.resolves({ value: 1 } as Config);

      // create a list of used bookings that the service should return
      const checkedOut: Booking[] = [];
      checkedOut.push({
        ...bookings[0],
        status: BookingStatus.USED,
      } as Booking);
      checkedOut.push({
        ...bookings[1],
        status: BookingStatus.USED,
      } as Booking);

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: customer,
        customerEmail: customer.contact?.emails?.[0],
        checkedOut: checkedOut,
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: [],
      });
    });

    /**
     * This test makes sure the transactions being passed to the transaction repo are correct
     */

    it('correct transactions are created on successful bookings', async () => {
      // make an offer and a product. extract the offer and product so we can access the
      // properties later
      const bookings: Partial<Booking>[] = await givenBookings([{} as Booking, {} as Booking]);
      bookings[1].type = BookingTypes.PRODUCT;
      bookings[1].item = await givenProduct();
      const offer = bookings[0]?.item as Offer;
      const product = bookings[1]?.item as Product;

      let customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'], profileImg: { imgUrl: undefined } as ProfileImage });
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });
      bookings[0].memberUID = customer.uid;
      bookings[1].memberUID = customer.uid;

      // stub moment so we can predict the created date on the new transactions
      moment.now = sinon.stub().returns(moment.unix(1));
      const transactionSender: BoomUser = {
        uid: customer.uid,
        firstName: customer.firstName,
        lastName: customer.lastName,
        roles: customer.roles,
        contact: customer.contact,
        profileImg: { imgUrl: customer.profileImg?.imgUrl },
      } as BoomUser;

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      const boomAccount: BoomAccount = await givenBoomAccount({ customerID: customer.uid });
      customer = { ...customer, boomAccounts: [boomAccount._id] };

      // first booking
      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      // second booking
      profileService.stubs.getProfile.onCall(2).resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onCall(3).resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      // all of the services and repos work as intended in this test
      const taxResponse = givenTaxResponse();
      const category = givenCategory();

      categoryRepository.stubs.find.resolves([category]);
      categoryRepository.stubs.findById.resolves(category);
      taxService.stubs.getTotalTaxByProduct.resolves(taxResponse);
      boomAccountService.stubs.verifyExistingAccounts.resolves(
        givenBoomAccountVerifyResponse(boomAccount)
      );
      boomAccountService.stubs.charge.resolves({
        success: true,
        message: 'Boom account update sucessfully.',
      });
      transactionRepository.stubs.createAll.resolves([]);
      configRepository.stubs.findOne.resolves({ value: 1 } as Config);

      await service.purchase(<Booking[]>bookings);

      // this is how the bookings in the transactions are changes so we do the same here
      const finalBookings = [{ ...bookings[0] }, { ...bookings[1] }] as Booking[];
      //@ts-ignore
      delete finalBookings[0].memberUID;
      //@ts-ignore
      delete finalBookings[0].item;
      //@ts-ignore
      delete finalBookings[1].memberUID;
      //@ts-ignore
      delete finalBookings[1].item;

      //fill this array with the expected transactions
      const finalTransactions: Transaction[] = [];
      finalTransactions.push({
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        createdAt: moment().utc().unix(),
        amount: offer.product.price,
        cashback: offer.cashBackPerVisit,
        sender: transactionSender,
        receiver: {
          _id: offer.product.store._id,
          companyName: offer.product.store.companyName,
          //number: offer.product.store.number, // TODO: Need to implement the new AddressInfo Interface here
          //street1: offer.product.store.street1,
          //street2: offer.product.store.street2,
          city: offer.product.store.city,
        } as Store,
        purchaseItem: offer,
        boomAccountID: boomAccount._id,
        booking: finalBookings[0],
        salestax: toMoney(taxResponse.tax.amount_to_collect),
        taxcode: taxResponse.tax.jurisdictions,
      } as Transaction);

      finalTransactions.push({
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        createdAt: moment().utc().unix(),
        amount: product.price,
        sender: transactionSender,
        receiver: {
          _id: product.store._id,
          companyName: product.store.companyName,
          //number: product.store.number, // TODO: Need to implement the new AddressInfo Interface here
          //street1: product.store.street1,
          //street2: product.store.street2,
          city: product.store.city,
        } as Store,
        purchaseItem: product,
        boomAccountID: boomAccount._id,
        booking: finalBookings[1],
        salestax: toMoney(taxResponse.tax.amount_to_collect),
        taxcode: taxResponse.tax.jurisdictions,
      } as Transaction);

      expect(transactionRepository.stubs.createAll.args[0][0]).deepEqual(finalTransactions);

      // reset moment in case something else depends on it
      moment.now = function () {
        return +new Date();
      };
    });

    it('returns failed when taxService fails', async () => {
      // this is the basic setup, see previous tests for explanation
      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'] });
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });

      const bookings: Partial<Booking>[] = await givenBookings([
        { memberUID: customer.uid } as Booking,
      ]);

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      categoryRepository.stubs.find.resolves([givenCategory()]);
      categoryRepository.stubs.findById.resolves(givenCategory());
      // the tax service returns success: false when it fails
      taxService.stubs.getTotalTaxByProduct.resolves({ success: false, message: '' });

      // when tax service fails it should add a booking to a list like this
      const failed: FailedBookingPurchase[] = [];
      failed.push({
        booking: bookings[0],
        reason: CheckOutResponseMessages.TAX_ERROR,
      } as FailedBookingPurchase);

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: customer,
        customerEmail: customer.contact?.emails?.[0],
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failed,
      });
    });

    it('returns failed when offer has no category', async () => {
      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'] });
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });

      const bookings: Partial<Booking>[] = await givenBookings([
        { memberUID: customer.uid } as Booking,
      ]);

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      categoryRepository.stubs.find.resolves([]);
      // categoryRepo returns undefined when a category is not found
      categoryRepository.stubs.findById.resolves(undefined);

      const failed: FailedBookingPurchase[] = [];
      failed.push({
        booking: bookings[0],
        reason: GlobalResponseMessages.NO_CATEGORY,
      } as FailedBookingPurchase);

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: customer,
        customerEmail: customer.contact?.emails?.[0],
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failed,
      });
    });

    it('returns failed when configRepo can not find commission rate for a product', async () => {
      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'] });
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });

      const bookings: Partial<Booking>[] = await givenBookings([
        { memberUID: customer.uid } as Booking,
      ]);
      bookings[0].type = BookingTypes.PRODUCT;
      bookings[0].item = await givenProduct();

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      categoryRepository.stubs.find.resolves([]);
      categoryRepository.stubs.findById.resolves(givenCategory());

      // same as previous test but for configRepo, as it is called when a booking is a product
      configRepository.stubs.findOne.resolves(null);

      const failed: FailedBookingPurchase[] = [];
      failed.push({
        booking: bookings[0],
        reason: CheckOutResponseMessages.INVALID_CATEGORY,
      } as FailedBookingPurchase);

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: customer,
        customerEmail: customer.contact?.emails?.[0],
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failed,
      });
    });

    it('returns failed when merchant can not be found', async () => {
      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'] });

      const bookings: Partial<Booking>[] = await givenBookings([
        { memberUID: customer.uid } as Booking,
      ]);

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      profileService.stubs.getProfile.onFirstCall().resolves({
        success: false,
        statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      categoryRepository.stubs.find.resolves([]);
      categoryRepository.stubs.findById.resolves(undefined);

      const failed: FailedBookingPurchase[] = [];
      failed.push({
        booking: bookings[0],
        reason: ProfileResponseMessages.MERCHANT_NOT_FOUND,
      } as FailedBookingPurchase);

      const result = await service.purchase(<Booking[]>bookings);

      expect(result).to.deepEqual({
        success: true,
        customer: null,
        customerEmail: null,
        checkedOut: [],
        expired: [],
        message: CheckOutResponseMessages.SUCCESS,
        failed: failed,
      });
    });

    it('returns failed when offer is expired', async () => {
      const customer: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({ cards: ['card id'] });
      const store = await givenStore();
      const merchant: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenMerchant({ store: store });

      const bookings: Partial<Booking>[] = await givenBookings([
        { memberUID: customer.uid } as Booking,
      ]);
      moment.now = sinon.stub().returns(moment.unix(2));
      // give the booking an expiration date of unix time 1
      bookings[0].item = { ...bookings[0].item, expiration: 1 } as Offer;

      const service: PurchaseService = new PurchaseService(
        bookingRepository,
        categoryRepository,
        configRepository,
        transactionRepository,
        profileService,
        taxService,
        boomAccountService,
        bookingService,
        shippingService,
        orderService
      );

      profileService.stubs.getProfile.onFirstCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: merchant,
      });
      profileService.stubs.getProfile.onSecondCall().resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      categoryRepository.stubs.find.resolves([givenCategory()]);
      categoryRepository.stubs.findById.resolves(givenCategory());
      taxService.stubs.getTotalTaxByProduct.resolves(givenTaxResponse());
      transactionRepository.stubs.createAll.resolves([]);
      configRepository.stubs.findOne.resolves({ value: 1 } as Config);

      const result = await service.purchase(<Booking[]>bookings);

      // the booking should be denied as expired
      expect(result).to.deepEqual({
        success: true,
        customer: null,
        customerEmail: null,
        checkedOut: [],
        expired: bookings,
        message: CheckOutResponseMessages.SUCCESS,
        failed: [],
      });
      // reset moment in case something else depends on it
      moment.now = function () {
        return +new Date();
      };
    });

    describe('Money Transfers', () => {
      it('returns failed when member does not have enough money', async () => {
        let customer: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
          | 'addresses'
        > = givenCustomer();
        const store = await givenStore();
        const merchant: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'addresses'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
        > = givenMerchant({ store: store });

        const bookings: Partial<Booking>[] = await givenBookings([
          { memberUID: customer.uid } as Booking,
        ]);

        const service: PurchaseService = new PurchaseService(
          bookingRepository,
          categoryRepository,
          configRepository,
          transactionRepository,
          profileService,
          taxService,
          boomAccountService,
          bookingService,
          shippingService,
          orderService
        );

        const boomAccount: BoomAccount = await givenBoomAccount({ customerID: customer.uid });
        customer = { ...customer, boomAccounts: [boomAccount._id] };

        profileService.stubs.getProfile.onFirstCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: merchant,
        });
        profileService.stubs.getProfile.onSecondCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: customer,
        });

        categoryRepository.stubs.find.resolves([givenCategory()]);
        categoryRepository.stubs.findById.resolves(givenCategory());
        taxService.stubs.getTotalTaxByProduct.resolves(givenTaxResponse());
        boomAccountService.stubs.verifyExistingAccounts.resolves(
          givenBoomAccountVerifyResponse(boomAccount)
        );
        boomAccountService.stubs.charge.resolves({
          success: false,
          message: `Not enough funds.`,
        });
        transactionRepository.stubs.createAll.resolves([]);
        configRepository.stubs.findOne.resolves({ value: 1 } as Config);

        const result = await service.purchase(<Booking[]>bookings);

        expect(result).to.deepEqual({
          success: true,
          customer: customer,
          customerEmail: customer.contact?.emails?.[0],
          checkedOut: [],
          expired: [],
          message: CheckOutResponseMessages.SUCCESS,
          failed: [{ booking: bookings[0], reason: `Not enough funds.` }],
        });
      });

      it('correctly updates merchant funds when successful', async () => {
        let customer: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
          | 'addresses'
        > = givenCustomer();
        const store = await givenStore();
        const merchant: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'addresses'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
        > = givenMerchant({ store: store });

        const bookings: Partial<Booking>[] = await givenBookings([
          {
            memberUID: customer.uid,
          },
        ]);
        const product = (bookings[0].item as Offer).product;
        // the booking costs 10 and had 5 cashback
        bookings[0] = {
          ...bookings[0],
          item: {
            ...bookings[0].item,
            cashBackPerVisit: { amount: 500, precision: 2, currency: 'USD' },
            product: { ...product, price: { amount: 1000, precision: 2, currency: 'USD' } },
            merchantUID: merchant.uid,
          },
        } as Booking;

        const boomAccount: BoomAccount = await givenBoomAccount({ customerID: customer.uid });
        customer = { ...customer, boomAccounts: [boomAccount._id] };

        const service: PurchaseService = new PurchaseService(
          bookingRepository,
          categoryRepository,
          configRepository,
          transactionRepository,
          profileService,
          taxService,
          boomAccountService,
          bookingService,
          shippingService,
          orderService
        );

        profileService.stubs.getProfile.onFirstCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: merchant,
        });
        profileService.stubs.getProfile.onSecondCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: customer,
        });

        categoryRepository.stubs.find.resolves([givenCategory()]);
        categoryRepository.stubs.findById.resolves(givenCategory());
        taxService.stubs.getTotalTaxByProduct.resolves(givenTaxResponse());
        boomAccountService.stubs.verifyExistingAccounts.resolves(
          givenBoomAccountVerifyResponse(boomAccount)
        );
        boomAccountService.stubs.charge.resolves({
          success: true,
          message: 'Boom account update sucessfully.',
        });
        transactionRepository.stubs.createAll.resolves([]);

        // the commission rate is 1%
        configRepository.stubs.findOne.resolves({ value: 1 } as Config);

        await service.purchase(<Booking[]>bookings);

        // the merchant should have the booking price ($10) - cashback ($5) - commission (10*.01 = $.10) = $4.90
        expect(profileService.stubs.updateManyProfilesById.args[0][0][0]).deepEqual({
          uid: bookings[0].item?.merchantUID,
          grossEarningsPendingWithdrawal: { amount: 1500, precision: 2, currency: 'USD' },
          netEarningsPendingWithdrawal: { amount: 1490, precision: 2, currency: 'USD' },
        });
      });

      it('does not change merchant funds on failure', async () => {
        let customer: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
          | 'addresses'
        > = givenCustomer();
        const store = await givenStore();
        const merchant: AllOptionalExceptFor<
          BoomUser,
          | 'uid'
          | 'firstName'
          | 'lastName'
          | 'contact'
          | 'addresses'
          | 'createdAt'
          | 'updatedAt'
          | 'roles'
        > = givenMerchant({ store: store });

        const boomAccount: BoomAccount = await givenBoomAccount({ customerID: customer.uid });
        customer = { ...customer, boomAccounts: [boomAccount._id] };

        const bookings: Partial<Booking>[] = await givenBookings([
          {
            memberUID: customer.uid,
          },
        ]);
        const product = (bookings[0].item as Offer).product;
        bookings[0] = {
          ...bookings[0],
          item: {
            ...bookings[0].item,
            cashBackPerVisit: { amount: 500, precision: 2, currency: 'USD' },
            product: { ...product, price: { amount: 1000, precision: 2, currency: 'USD' } },
          },
        } as Booking;

        const service: PurchaseService = new PurchaseService(
          bookingRepository,
          categoryRepository,
          configRepository,
          transactionRepository,
          profileService,
          taxService,
          boomAccountService,
          bookingService,
          shippingService,
          orderService
        );

        profileService.stubs.getProfile.onFirstCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: merchant,
        });
        profileService.stubs.getProfile.onSecondCall().resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: customer,
        });

        categoryRepository.stubs.find.resolves([givenCategory()]);
        categoryRepository.stubs.findById.resolves(givenCategory());
        taxService.stubs.getTotalTaxByProduct.resolves(givenTaxResponse());
        boomAccountService.stubs.verifyExistingAccounts.resolves(
          givenBoomAccountVerifyResponse(boomAccount)
        );
        boomAccountService.stubs.charge.resolves({
          success: false,
          message: `Not enough funds.`,
        });
        transactionRepository.stubs.createAll.resolves([]);
        configRepository.stubs.findOne.resolves({ value: 1 } as Config);

        await service.purchase(<Booking[]>bookings);

        expect(profileService.stubs.updateManyProfilesById.notCalled).equal(true);
      });
    });
  });

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }
  function givenConfigRepository() {
    configRepository = createStubInstance(ConfigRepository);
  }
  function givenTransactionRepository() {
    transactionRepository = createStubInstance(TransactionRepository);
  }
  function givenBoomAccountService() {
    boomAccountService = createStubInstance(BoomAccountService);
  }
  function givenBookingRepository() {
    bookingRepository = createStubInstance(BookingRepository);
  }
  function givenCategoryRepository() {
    categoryRepository = createStubInstance(CategoryRepository);
  }
  function givenTaxService() {
    taxService = createStubInstance(TaxService);
  }
  function givenShippingService() {
    shippingService = createStubInstance(ShippingService);
  }
  function givenOrderService() {
    orderService = createStubInstance(OrderService);
  }
});
