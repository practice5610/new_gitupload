import { APIResponseMessages } from '../../../constants';

// TODO: Use helpers for testing to build the response data here

export const POSTGetTaxExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS, // TODO: Review if this value is sent or a custom one
    data: [
      {
        id: '6062cc8865ff6f102f6d4750',
        tax: {
          amount: 100,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
      },
    ],
  },
};
