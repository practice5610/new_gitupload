// TODO: Use helpers for testing to build the response data here

export const POSTGetTaxRequestBodyExamples = {
  DATA_SENT: [
    {
      id: '6062cc8865ff6f102f6d4750',
      toAddress: { address: '445 N Lake st', city: 'Madison', state: 'WI', country: 'USA' },
    },
  ],
};
export const PUTTaxableStatesRequestBodyExamples = {
  DATA_SENT: [
    {
      country: 'US',
      state: 'AL',
    },
    {
      country: 'US',
      state: 'CO',
    },
  ],
};
