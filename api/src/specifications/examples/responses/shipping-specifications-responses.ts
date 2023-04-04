import { APIResponseMessages } from '../../../constants';

// TODO: Use helpers for testing to build the response data here

export const POSTAddressValidationExamples = {
  SUCCESS_MISSING_APT: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      address: {
        object_id: '3b06cb39776644f4919396603f3b3d3e',
        name: 'customer name',
        number: '55',
        street1: 'Weston Rd',
        street2: '',
        city: 'Weston',
        state: 'FL',
        zip: '33326-1169',
        country: 'US',
        is_complete: true,
      },
      is_valid: true,
      messages: [
        {
          source: 'Shippo Address Validator',
          code: 'Default Match',
          type: 'address_warning',
          text: 'More information, such as an apartment or suite number, may give a more specific address.',
        },
      ],
    },
  },
  SUCCESS_NO_SUGGESTIONS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      address: {
        object_id: 'e8069fd877bf47a6a3f1d1bd9d80be1e',
        name: 'customer name',
        number: '55',
        street1: 'Weston Rd Ste 106',
        street2: '',
        city: 'Weston',
        state: 'FL',
        zip: '33326-1112',
        country: 'US',
        is_complete: true,
      },
      is_valid: true,
      messages: null,
    },
  },
};

export const POSTShippingRateExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: [
      {
        shippo_id: 'e85639f2f6c84039a054ad70ac272964',
        attributes: ['BESTVALUE', 'CHEAPEST'],
        amount: {
          amount: 795,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        provider: 'USPS',
        service: 'Parcel Select',
        service_token: 'usps_parcel_select',
        estimated_days: 7,
        duration_terms: 'Delivery in 2 to 8 days.',
      },
      {
        shippo_id: '36c528909afd40bb9eb82ac9b8f36391',
        attributes: [],
        amount: {
          amount: 817,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        provider: 'UPS',
        service: 'Ground',
        service_token: 'ups_ground',
        estimated_days: 1,
        duration_terms: 'Delivery times vary. Delivered usually in 1-5 business days.',
      },
    ],
  },
};

export const POSTPurchaseRateExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: '60536c94e7f194562c8c5749',
  },
};

export const GETShippoTransactionExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: {
      status: 'SUCCESS',
      createdAt: 1616080019,
      updatedAt: 1616080021,
      shippo_id: 'ff06a23be3a84710946f7ad4ee18d15d',
      rate: 'e85639f2f6c84039a054ad70ac272964',
      label_url:
        'https://deliver.goshippo.com/ff06a23be3a84710946f7ad4ee18d15d.pdf?Expires=1647616021&Signature=OWEBcwaNmhclIKxek~B3DpRUYO5SZLlVST~sEYAsA9EFASNTIvskulIfGdRsGedKNPyv8ncciis5t2P3Mnv4vedD1kd1BjHaHtrbsK7cSOloFeLxPmXsx9ZCvGY9Jq6QfDZooEGkrzJak~w6A8m-inBeJtzZNuVcRGIFvatwkWPvRkHv80fJWHF1Hr~jwalSx8l~nlpeEod6qHo9KBHbz7jMty0t~AaGS2zxseK~HCgksgCsqFpAaKaTAI-ZsAXj0daxKYPzEIB3m909O73JO4mjOeeUhBJ5YQuiuyzVNbgVW~36Ea~Q0zGDJUs-z6-5tTYXDCDoAIdhgqoccmW~jg__&Key-Pair-Id=APKAJRICFXQ2S4YUQRSQ',
      eta: null,
      tracking_number: '92612901755477000000000010',
      tracking_status: 'UNKNOWN',
      tracking_url_provider:
        'https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=92612901755477000000000010',
    },
  },
};

export const GETShippingLabelsExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: [
      'https://deliver.goshippo.com/ff06a23be3a84710946f7ad4ee18d15d.pdf?Expires=1647616021&Signature=OWEBcwaNmhclIKxek~B3DpRUYO5SZLlVST~sEYAsA9EFASNTIvskulIfGdRsGedKNPyv8ncciis5t2P3Mnv4vedD1kd1BjHaHtrbsK7cSOloFeLxPmXsx9ZCvGY9Jq6QfDZooEGkrzJak~w6A8m-inBeJtzZNuVcRGIFvatwkWPvRkHv80fJWHF1Hr~jwalSx8l~nlpeEod6qHo9KBHbz7jMty0t~AaGS2zxseK~HCgksgCsqFpAaKaTAI-ZsAXj0daxKYPzEIB3m909O73JO4mjOeeUhBJ5YQuiuyzVNbgVW~36Ea~Q0zGDJUs-z6-5tTYXDCDoAIdhgqoccmW~jg__&Key-Pair-Id=APKAJRICFXQ2S4YUQRSQ',
    ],
  },
};

export const POSTRefundShippingExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: 'ff06a23be3a84710946f7ad4ee18d15d',
  },
};

export const POSTEstimateShippingCostExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: {
      amount: 951,
      precision: 2,
      currency: 'USD',
      symbol: '$',
    },
  },
};

export const GETShippingOrderExample = {
  // TODO: Update to use ResponseAPI
  SUCCESS: {
    _id: '60536c94e7f194562c8c5749',
    createdAt: 1616080020,
    updatedAt: 1616080711,
    shippo_id: 'ff06a23be3a84710946f7ad4ee18d15d',
    trackingNumber: '92612901755477000000000010',
    trackingLink: null,
    price: {
      amount: 795,
      precision: 2,
      currency: 'USD',
      symbol: '$',
    },
    purchaser: 'test_uid',
    status: 'refunded',
  },
};

export const POSTShippingPolicyExample = {
  // TODO: Update to use ResponseAPI
  SUCCESS: {
    _id: '60538b0dcd4f425104999599',
    createdAt: 1616087821,
    updatedAt: 1616087821,
    name: 'Standard Boom Shipping',
    merchantId: 're5OljVl3KObKLopKdxpOQBWPL82',
    freeShippingThresholds: [],
  },
};

export const POSTShippingBoxExample = {
  SUCCESS: {
    success: true,
    message: 'success',
    data: {
      _id: '603683fd73ce18ebc20bd24a',
      createdAt: 1614185060,
      updatedAt: 1614185060,
      name: 'Small square box',
      merchantId: 'test_merchant_1',
      unit: 'in',
      length: 4,
      width: 4,
      height: 4,
    },
  },
};

export const GETShippingPolicyExample = {
  // TODO: Update to use ResponseAPI
  SUCCESS: {
    _id: '60538b0dcd4f425104999599',
    createdAt: 1616087821,
    updatedAt: 1616087821,
    name: 'Standard Boom Shipping',
    merchantId: 're5OljVl3KObKLopKdxpOQBWPL82',
    freeShippingThresholds: [],
  },
};

export const POSTShippingCheckoutExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: {
      orderGroups: [
        {
          store: 'Test Store 1',
          rates: [
            {
              shippo_id: '1905a91544214131b5201bbb9a179bee',
              attributes: ['BESTVALUE', 'CHEAPEST'],
              amount: {
                amount: 732,
                precision: 2,
                currency: 'USD',
                symbol: '$',
              },
              provider: 'USPS',
              service: 'Priority Mail',
              service_token: 'usps_priority',
              estimated_days: 1,
              duration_terms:
                'Delivery within 1, 2, or 3 days based on where your package started and where it’s being sent.',
            },
            {
              shippo_id: '748f813a11884656b3ba25da4077693f',
              attributes: [],
              amount: {
                amount: 772,
                precision: 2,
                currency: 'USD',
                symbol: '$',
              },
              provider: 'UPS',
              service: 'Ground',
              service_token: 'ups_ground',
              estimated_days: 1,
              duration_terms: 'Delivery times vary. Delivered usually in 1-5 business days.',
            },
            {
              shippo_id: 'e3d78b716d7e487e8c8e3f47d31e935c',
              attributes: [],
              amount: {
                amount: 1209,
                precision: 2,
                currency: 'USD',
                symbol: '$',
              },
              provider: 'UPS',
              service: 'Next Day Air Saver®',
              service_token: 'ups_next_day_air_saver',
              estimated_days: 1,
              duration_terms:
                'Next business day delivery by 3:00 or 4:30 p.m. for commercial destinations and by end of day for residentail destinations.',
            },
          ],
          bookings: [
            {
              _id: '60539674b660181020a2a380',
              createdAt: 1616090740,
              updatedAt: 1616090740,
              type: 'product',
              item: {
                _id: '604275ef73ce18ebc21023cd',
                createdAt: 1600451437,
                updatedAt: 1600451437,
                imageUrl: 'https://via.placeholder.com/150/0000FF/808080?Text=Product_1',
                merchantUID: 'test_merchant_1',
                category: {
                  name: 'Books',
                  subCategories: ['Blank book/journal/diary'],
                },
                name: 'Product 1',
                description:
                  'description for product 1. ships from weston, small box, 10 items per box, free shipping over $100',
                store: {
                  _id: 'shippo_test',
                  companyName: 'Test Store 1',
                  address: '1315 53rd St STE 3',
                  _geoloc: {
                    lng: -80.0725,
                    lat: 26.7492,
                  },
                  merchant: {
                    uid: 'test_merchant_1',
                    firstName: 'firstName',
                    lastName: 'lastName',
                  },
                },
                price: {
                  amount: 2200,
                  precision: 2,
                  currency: 'USD',
                  symbol: '$',
                },
                attributes: {},
                _tags: [],
                objectID: '',
                packageDetails: {
                  weight: 2,
                  massUnit: 'lb',
                  boxId: '603683fd73ce18ebc20bd24a',
                  itemsPerBox: 10,
                  shipsFrom: '11c1edc8e86c41d4b73ee2c5ce821fe9',
                },
                shippingPolicy: '60368264592e1b3abc69afe5',
                status: 'approved',
              },
              quantity: 1,
              status: 'Active',
              memberUID: 'shippo_test_member',
              visits: 1,
            },
          ],
          shippable: true,
        },
      ],
      failedBookings: [],
    },
  },
};
