import {
  AllOptionalExceptFor,
  BookingStatus,
  BookingTypes,
  BoomAccountStatus,
  BoomCardStatus,
  BoomUser,
  BoomUserPlaidInfo,
  DistanceUnit,
  MassUnit,
  Money,
  PackageDetails,
  ProductStatus,
  RoleKey,
} from '@boom-platform/globals';
import {
  ReturnCostType,
  ReturnMethod,
  ReturnReason,
  Status,
} from '@boom-platform/globals/lib/enums/returns';
import { Count } from '@loopback/repository';
import { nanoid } from 'nanoid';

import {
  BankInfo,
  Booking,
  BoomAccount,
  BoomCard,
  Category,
  CustomerBilling,
  Offer,
  Order,
  Product,
  ReturnDisputeModel,
  ReturnPolicyModel,
  ReturnRequestModel,
  ShippingBox,
  ShippingPolicy,
  Store,
} from '../../models';
import {
  BankInfoRepository,
  BookingRepository,
  BoomAccountRepository,
  BoomCardRepository,
  CategoryRepository,
  ConfigRepository,
  CustomerBillingRepository,
  OfferRepository,
  OrderRepository,
  ProductRepository,
  ReturnDisputeRepository,
  ReturnPolicyRepository,
  ReturnRequestRepository,
  ReviewRepository,
  ShippingBoxRepository,
  ShippingOrderRepository,
  ShippingPolicyRepository,
  StoreRepository,
  TransactionRepository,
} from '../../repositories';
import { testdb } from '../fixtures/datasources/testdb.datasource';

export async function givenEmptyDatabase(): Promise<void> {
  await new ProductRepository(testdb).deleteAll();
  await new CategoryRepository(testdb).deleteAll();
  await new BookingRepository(testdb).deleteAll();
  await new BoomCardRepository(testdb).deleteAll();
  await new BoomAccountRepository(testdb).deleteAll();
  await new OfferRepository(testdb).deleteAll();
  await new ReviewRepository(testdb).deleteAll();
  await new StoreRepository(testdb).deleteAll();
  await new TransactionRepository(testdb).deleteAll();
  await new ConfigRepository(testdb).deleteAll();
  await new BankInfoRepository(testdb).deleteAll();
  await new CustomerBillingRepository(testdb).deleteAll();
  await new ShippingBoxRepository(testdb).deleteAll();
  await new ShippingOrderRepository(testdb).deleteAll();
  await new ShippingPolicyRepository(testdb).deleteAll();
  await new ReturnPolicyRepository(testdb).deleteAll();
  await new ReturnRequestRepository(testdb).deleteAll();
  await new ReturnDisputeRepository(testdb).deleteAll();
}

const _givenPackageDetailsData = (data?: Partial<PackageDetails>): PackageDetails => {
  return {
    weight: 200,
    massUnit: MassUnit.GRAM,
    boxId: nanoid(),
    itemsPerBox: 10,
    shipsFrom: nanoid(),
  };
};

const _givenShippingPolicyData = (data?: Partial<ShippingPolicy>): ShippingPolicy => {
  return {
    _id: nanoid(),
    createdAt: 1574617668,
    updatedAt: 1574617668,
    name: 'Default shipping policy',
    merchantId: nanoid(),
    ...data,
  } as ShippingPolicy;
};

const _givenShippingBoxData = (data?: Partial<ShippingBox>): ShippingBox => {
  return {
    _id: nanoid(),
    createdAt: 1574617668,
    updatedAt: 1574617668,
    name: 'Small box',
    length: 8,
    width: 3,
    height: 3,
    unit: DistanceUnit.INCH,
    merchantId: nanoid(),
    ...data,
  } as ShippingBox;
};

const _givenStoreData = (data?: Partial<Store>) => {
  return {
    _id: nanoid(),
    companyName: 'store name',
    emails: ['store@email.com'],
    phoneNumber: '7774441111',
    number: '111',
    street1: 'N Stetson Ave',
    city: 'Boca Raton',
    state: 'FL',
    zip: '33333',
    country: 'US',
    companyLogoUrl: 'company.com/logo',
    coverImageUrl: 'company.com/coverimage',
    companyType: 'Fake',
    companyDescription: 'test company',
    years: 0,
    fein: 123,
    storeType: 'online',
    ...data,
  } as Store;
};

const _givenOfferData = (data?: Partial<Offer>) => {
  return {
    _id: nanoid(),
    createdAt: 1574617668,
    updatedAt: 1606240106,
    cashBackPerVisit: { amount: 1000, precision: 2, currency: 'USD', symbol: '$' },
    description: 'offer-description',
    maxQuantity: 5,
    maxVisits: 5,
    merchantUID: nanoid(),
    startDate: 1574617668,
    title: 'offer-title',
    expiration: 1921772868,
    ...data,
  } as Offer;
};

const _givenProductData = (data?: Partial<Product>) => {
  return {
    _id: nanoid(),
    objectID: nanoid(),
    createdAt: 1574617668,
    updatedAt: 1606240106,
    imageUrl: 'www.testurl.com',
    price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
    name: 'name',
    description: 'a-product-description',
    merchantUID: nanoid(),
    category: {
      _id: '5d12bf519eb1641840519334',
      name: 'Apparel, shoes, jewelry',
      subCategories: ['Accessories'],
    } as Category,
    attributes: {},
    _tags: ['tag'],
    packageDetails: _givenPackageDetailsData(data?.packageDetails),
    shippingPolicy: nanoid(),
    status: ProductStatus.APPROVED,
    quantity: 1,
    ...data,
  } as Product;
};

const _givenUserData = (
  data?: BoomUser
): AllOptionalExceptFor<
  BoomUser,
  'uid' | 'firstName' | 'lastName' | 'contact' | 'addresses' | 'createdAt' | 'updatedAt' | 'roles'
> => {
  return {
    uid: nanoid(),
    firstName: 'John',
    lastName: 'Doe',
    contact: {
      phoneNumber: '+1 555 555 5555',
      emails: ['john@email.com'],
    },
    addresses: [
      {
        number: '1977',
        street1: 'Main Street',
        city: 'New York',
        state: 'NY',
        zip: '12233',
        country: 'US',
      },
    ],
    createdAt: 0,
    updatedAt: 0,
    roles: [],
    boomAccounts: [],
    ...data,
  };
};

const _givenBookingData = (data?: Partial<Booking>) => {
  return {
    _id: nanoid(),
    createdAt: 1574617668,
    updatedAt: 1606240106,
    type: BookingTypes.OFFER,
    quantity: 5,
    status: BookingStatus.ACTIVE,
    memberUID: nanoid(),
    visits: 0,
    ...data,
  } as Booking;
};

const _givenBankInfoData = (data?: Partial<BankInfo>) => {
  return {
    createdAt: 0,
    updatedAt: 0,
    plaidID: nanoid(),
    accountNumber: nanoid(),
    routingNumber: nanoid(),
    wireRoutingNumber: nanoid(),
    plaidItemID: nanoid(),
    plaidAccessToken: nanoid(),
    name: 'Test Checking Account',
    userID: nanoid(),
    accountOwner: {
      phone: '6505559999',
      names: ['David Byrne'],
      address: '1977 main st',
      city: 'NYC',
      state: 'New York',
      zip: '12233',
      emails: ['david@website.com'],
      gotInfoFromBank: true,
    },
    balances: {
      available: 300,
      current: 300,
      limit: null,
    },
    ...data,
  } as BankInfo;
};

const _givenReturnPolicyData = (data?: Partial<ReturnPolicyModel>) => {
  return {
    _id: nanoid(),
    createdAt: 0,
    updatedAt: 0,
    merchantID: nanoid(),
    name: 'Test Policy',
    description: 'Test Policy Description',
    refundsAccepted: false,
    autoApprove: false,
    daysToReturn: 30,
    returnMethod: ReturnMethod.SHIP,
    returnCosts: [
      {
        name: 'Shipping Fee',
        description: 'Fee for shipping label',
        price: {
          amount: 2000,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        type: ReturnCostType.SHIPPING,
      },
    ],
    ...data,
  } as ReturnPolicyModel;
};

const _givenReturnRequestData = (data?: Partial<ReturnRequestModel>) => {
  return {
    _id: nanoid(),
    createdAt: 0,
    updatedAt: 0,
    merchantID: nanoid(),
    customerID: nanoid(),
    returnStatus: Status.REQUESTED,
    merchantPolicyID: nanoid(),
    returnReason: [ReturnReason.WRONG_ITEM],
    returnMethod: ReturnMethod.SHIP,
    purchaseTransactionID: nanoid(),
    returnTransactionID: '001',
    ...data,
  } as ReturnRequestModel;
};

const _givenReturnDisputeData = (data?: Partial<ReturnDisputeModel>) => {
  return {
    _id: nanoid(),
    createdAt: 0,
    updatedAt: 0,
    returnRequest: {
      _id: nanoid(),
      createdAt: 0,
      updatedAt: 0,
      merchantID: nanoid(),
      customerID: nanoid(),
      returnStatus: Status.REQUESTED,
      merchantPolicyID: nanoid(),
      returnReason: [ReturnReason.WRONG_ITEM],
      returnMethod: ReturnMethod.SHIP,
      purchaseTransactionID: nanoid(),
      returnTransactionID: '001',
    },
    isOpen: true,
    comment: 'Wrong item sent, merchant refuses to replace for correct item or return/refund',
    ...data,
  } as ReturnDisputeModel;
};

export const givenOffer = async (data?: Partial<Offer>): Promise<Offer> => {
  const product: Product = await givenProduct();
  const offer: Offer = _givenOfferData(<Offer>{ product, ...data });
  return new OfferRepository(testdb).create(offer);
};

export const givenProduct = async (data?: Partial<Product>): Promise<Product> => {
  const store: Store = await givenStore();
  return new ProductRepository(testdb).create(_givenProductData({ ...data, store }));
};

export const givenShippingPolicy = async (
  data?: Partial<ShippingPolicy>
): Promise<ShippingPolicy> => {
  return new ShippingPolicyRepository(testdb).create(_givenShippingPolicyData(data));
};

export const givenShippingBox = async (data?: Partial<ShippingBox>): Promise<ShippingBox> => {
  return new ShippingBoxRepository(testdb).create(_givenShippingBoxData(data));
};

export const givenPackageDetails = (data?: Partial<PackageDetails>): PackageDetails => {
  return {
    weight: 5,
    massUnit: MassUnit.OUNCE,
    boxId: nanoid(),
    itemsPerBox: 5,
    shipsFrom: nanoid(),
    ...data,
  } as PackageDetails;
};

export const givenStore = async (data?: Partial<Store>): Promise<Store> => {
  const merchant: AllOptionalExceptFor<
    BoomUser,
    'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
  > = givenMerchant();
  return new StoreRepository(testdb).create(_givenStoreData({ ...data, merchant }));
};

export const givenMerchant = (
  data?: BoomUser
): AllOptionalExceptFor<
  BoomUser,
  'uid' | 'firstName' | 'lastName' | 'contact' | 'addresses' | 'createdAt' | 'updatedAt' | 'roles'
> => {
  return _givenUserData({ ...data, roles: [RoleKey.Merchant] });
};

export const givenCustomer = (
  data?: BoomUser
): AllOptionalExceptFor<
  BoomUser,
  'uid' | 'firstName' | 'lastName' | 'contact' | 'addresses' | 'createdAt' | 'updatedAt' | 'roles'
> => {
  return _givenUserData({ ...data, roles: [RoleKey.Member] });
};

export const givenAdmin = (
  data?: BoomUser
): AllOptionalExceptFor<
  BoomUser,
  'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
> => {
  return _givenUserData({ ...data, roles: [RoleKey.Admin] });
};

export const givenSuperAdmin = (
  data?: BoomUser
): AllOptionalExceptFor<
  BoomUser,
  'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
> => {
  return _givenUserData({ ...data, roles: [RoleKey.SuperAdmin] });
};

export const givenProductBooking = async (data?: Partial<Booking>): Promise<Booking> => {
  const product: Product = _givenProductData(data?.item as Product);
  return new BookingRepository(testdb).create(
    _givenBookingData({ ...data, item: product, type: BookingTypes.PRODUCT })
  );
};

export const givenOfferBooking = async (data?: Partial<Booking>): Promise<Booking> => {
  const product: Product = _givenProductData((data?.item as Offer)?.product);
  const offer: Offer = _givenOfferData({ product: product });
  return new BookingRepository(testdb).create(
    _givenBookingData({ ...data, item: offer, type: BookingTypes.OFFER })
  );
};

export const givenBookings = async (bookings?: Partial<Booking>[]): Promise<Booking[]> => {
  let bookingsData: Booking[] = [];

  if (bookings) {
    for (const booking of bookings) {
      const offer: Offer = await givenOffer();
      const newBooking: Booking = await new BookingRepository(testdb).create(
        _givenBookingData({ ...booking, item: offer })
      );
      bookingsData.push(newBooking);
    }
  } else {
    const offer1: Offer = await givenOffer();
    const offer2: Offer = await givenOffer();
    const offer3: Offer = await givenOffer();
    const offer4: Offer = await givenOffer();
    const booking1: Booking = await new BookingRepository(testdb).create(
      _givenBookingData({ item: offer1 })
    );
    const booking2: Booking = await new BookingRepository(testdb).create(
      _givenBookingData({ item: offer2 })
    );
    const booking3: Booking = await new BookingRepository(testdb).create(
      _givenBookingData({ item: offer3 })
    );
    const booking4: Booking = await new BookingRepository(testdb).create(
      _givenBookingData({ item: offer4 })
    );
    bookingsData = [booking1, booking2, booking3, booking4];
  }

  return bookingsData;
};

/**
 * Represents a plaid entry from a user's firebase document
 */
export const givenPlaidEntry = (): BoomUserPlaidInfo => {
  return {
    accounts: [
      {
        id: nanoid(),
        mask: '0000',
        name: 'Plaid Checking',
        subtype: 'Checking',
        type: 'depository',
      },
    ],
    institution: {
      institution_id: 'institution_id',
      name: 'Wells Fargo',
    },
    item: {
      accessToken: nanoid(),
      itemId: nanoid(),
    },
  } as BoomUserPlaidInfo;
};

export const givenMoney = (dollarAmmount?: number): Money => {
  if (!dollarAmmount) {
    dollarAmmount = 5;
  }
  return { amount: dollarAmmount * 100, precision: 2, symbol: '$', currency: 'USD' } as Money;
};

export const givenBankInfo = (data?: Partial<BankInfo>): Promise<BankInfo> => {
  return new BankInfoRepository(testdb).create(_givenBankInfoData(data));
};

export const givenCategory = (data?: Partial<Category>): Category => {
  return { _id: nanoid(), name: 'test_category', commissionRate: 1, ...data } as Category;
};

export const givenTaxResponse = (): any => {
  const tax = {
    tax: {
      amount_to_collect: 5,
      jurisdictions: { country: 'usa', state: 'FL', county: 'Dade', city: 'Miami' },
    },
  };
  return { ...tax, success: true };
};

export const givenCount = (): Count => {
  return {
    count: 10,
  };
};

export const givenBoomAccountVerifyResponse = (data?: Partial<BoomAccount>): any => {
  const res = {
    success: true,
    message: 'Success',
    data: data,
  };
  return { ...res, success: true };
};

export const givenBoomCard = (data?: Partial<BoomCard>): Promise<BoomCard> => {
  return new BoomCardRepository(testdb).create({
    _id: nanoid(),
    status: BoomCardStatus.ACTIVE,
    boomAccountID: nanoid(),
    cardNumber: nanoid(),
    ...data,
  } as BoomCard);
};

export const givenBoomAccount = (data?: Partial<BoomAccount>): Promise<BoomAccount> => {
  return new BoomAccountRepository(testdb).create({
    _id: nanoid(),
    status: BoomAccountStatus.ACTIVE,
    balance: givenMoney(10000),
    ...data,
  } as BoomAccount);
};

export const givenCustomerBilling = (data?: Partial<CustomerBilling>): Promise<CustomerBilling> => {
  return new CustomerBillingRepository(testdb).create({
    _id: nanoid(),
    ...data,
  } as CustomerBilling);
};

export const givenTransferReceiverProfileData = (): BoomUser => {
  const profileAllowedField = {
    firstName: 'Danee',
    lastName: 'Smith T',
    profileImg: {
      imgUrl:
        'https://apiqa.boomcard.net/api/v1/images/Rj7Q4ZQpzUfg19k7lD91XqFCIWI2_IMG_0003.JPG?override=true',
    },
  };
  return profileAllowedField;
};

export const givenReturnPolicy = (
  data?: Partial<ReturnPolicyModel>
): Promise<ReturnPolicyModel> => {
  return new ReturnPolicyRepository(testdb).create(_givenReturnPolicyData(data));
};

export const givenReturnRequest = (
  data?: Partial<ReturnRequestModel>
): Promise<ReturnRequestModel> => {
  return new ReturnRequestRepository(testdb).create(_givenReturnRequestData(data));
};

export const givenReturnDispute = (
  data?: Partial<ReturnDisputeModel>
): Promise<ReturnDisputeModel> => {
  return new ReturnDisputeRepository(testdb).create(_givenReturnDisputeData(data));
};
