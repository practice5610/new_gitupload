import { APIResponseMessages } from '../../../constants';

// TODO: Use helpers for testing to build the response data here

export const POSTConfigExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '60b2c01e4a52705e241eae62',
      createdAt: 1622327326,
      updatedAt: 1622327326,
      type: 'default-processing-rate',
      label: 'Inventory Item Types',
      value: {
        key1: 'Tablet',
        key2: 'Large Tablet Stand',
      },
    },
  },
};
export const GETConfigSpecificationExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: [
      {
        _id: '5f31c455e5d80240a85b267d',
        createdAt: 1596907920,
        updatedAt: 1597097231,
        type: 'inventory-type',
        label: 'Inventory Item Types',
        value: {
          b7Y8uNIbpInpei3vfV0QJ: {
            purchasePrice: {
              amount: 17999,
              precision: 2,
              currency: 'USD',
              symbol: '$',
            },
            label: 'Tablet Small',
            name: 'Samsung 6"',
          },
          'tAQv5T-L3qjEgEAQQjSIV': {
            purchasePrice: {
              amount: 44000,
              precision: 2,
              currency: 'USD',
              symbol: '$',
            },
            label: 'Large Tablet',
            name: 'Samsung Tablet A',
          },
          oPAmLRahdC7203Z1fKCBo: {
            purchasePrice: {
              amount: 12000,
              precision: 2,
              currency: 'USD',
              symbol: '$',
            },
            label: 'Card Reader',
          },
          ['DNR_iN0--1uSi_krur5IO']: {
            purchasePrice: {
              amount: 22050,
              precision: 2,
              currency: 'USD',
              symbol: '$',
            },
            label: 'Tablet',
          },
        },
      },
    ],
  },
};
