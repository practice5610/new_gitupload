/**
 * TODO: Use helpers for testing to build the response data here
 */

import { APIResponseMessages } from '../../../constants';

export const POSTReturnPolicyResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '609ae7d8f18dea46b0c96159',
      createdAt: 1620764632,
      updatedAt: 1620764632,
      merchantID: 're5OljVl3KObKLopKdxpOQBWPL82',
      name: 'Test name return policy',
      description: 'Test description return policy',
      refundsAccepted: false,
      autoApprove: false,
      costsImposed: [
        {
          name: 'name cost impose test',
          description: 'description cost impose test',
          price: {
            amount: 2000,
            precision: 2,
            currency: 'USD',
            symbol: '$',
          },
        },
      ],
      daysToReturn: 30,
      returnMethod: 'Ship to merchant',
      returnCosts: [
        {
          type: 'Shipping fee',
          name: 'returnCosts name cost impose test',
          description: 'returnCosts description cost impose test',
          price: {
            amount: 1000,
            precision: 2,
            currency: 'USD',
            symbol: '$',
          },
        },
      ],
    },
  },
};

export const POSTReturnRequestResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '60bfa87313def8b64ea9e20e',
      createdAt: 1623173235,
      updatedAt: 1623173235,
      customerID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
      merchantID: '1010101',
      refundStatus: 'Requested',
      returnStatus: 'Requested',
      merchantPolicyID: '60b805f41be85cc178a729a9',
      returnReason: ['Wrong item was delivered'],
      customReason: 'I would like to ship back for correct item. No refund',
      returnMethod: 'Ship to merchant',
      purchaseTransactionID: '5d7fa0e49d55bd19328b450d',
      returnTransactionID: '001',
    },
  },
};

export const POSTDisputeResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '60c12745d62f2f8f1ddaf881',
      createdAt: 1623271237,
      updatedAt: 1623271362,
      returnRequest: {
        _id: '60c126411d70168ca1b52b15',
        createdAt: 1623270977,
        updatedAt: 1623270977,
        customerID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
        merchantID: '1010101',
        refundStatus: 'Requested',
        returnStatus: 'Requested',
        merchantPolicyID: '60c0f92dc86c4fd3bc5c012c',
        returnReason: ['Wrong item was delivered'],
        customReason: 'Wrong item was sent. Please replace for correct item',
        returnMethod: 'Ship to merchant',
        purchaseTransactionID: '5d7fa0e49d55bd19328b450d',
        returnTransactionID: '005',
      },
      isOpen: true,
      comment:
        'Wrong item was delivered and Merchant is refusing to replace for correct item or refund',
    },
  },
};

export const PATCHReturnRequestResponseExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      returnStatus: 'Processing',
    },
  },
};

export const PATCHDisputeResponseExample = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      isOpen: false,
      comment: 'Merchant offered replacement item',
    },
  },
};
