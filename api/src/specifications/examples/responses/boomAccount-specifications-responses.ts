import { APIResponseMessages } from '../../../constants';

// TODO: Use helpers for testing to build the response data here

export const GETBoomAccountByIDResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '603d094d92c1c9c701241c26',
      createdAt: 1111111111,
      updatedAt: 2222222222,
      status: 'Active',
      balance: {
        amount: 10000,
        currency: 'USD',
        precision: 2,
      },
      customerID: 'TEST_PURPOSE_ONLY',
    },
  },
};

export const GETBalanceByUIDResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      amount: 10000,
      currency: 'USD',
      precision: 2,
    },
  },
};
