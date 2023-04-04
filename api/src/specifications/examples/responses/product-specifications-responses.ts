import { APIResponseMessages } from '../../../constants';

// TODO: Use helpers for testing to build the response data here

export const POSTProductsResponseExamples = {
  SUCCESS: {
    // TODO: Update to use ResponseAPI
    successful: [
      {
        _id: '6048f59a54b3f3af70acd47f',
        objectID: '9kn_HHgBZnvTu_pfZXw8',
        createdAt: 1615394202,
        updatedAt: 1615394202,
        imageUrl: 'http://www.img.url.com',
        merchantUID: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
        category: {
          _id: '5d12bf519eb1641840519334',
          createdAt: 1561509568,
          updatedAt: 1561509568,
          name: 'Apparel, shoes, jewelry',
          commissionRate: 5,
          subCategories: ['Accessories', 'Apparel', 'Jewelry & watches', 'Shoes'],
        },
        name: '>Mens Graphic TeeA',
        description: 'Excellent form fitting graphic tee for men',
        store: {
          _id: '5d27d9af9eb1641840562169',
          companyName: 'iMAGi Print T-SHIRTS & More',
          address: '1315 53rd St STE 3',
          _geoloc: {
            lat: 26.7492,
            lng: -80.0725,
          },
          merchant: {
            uid: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
            firstName: '',
            lastName: '',
          },
        },
        price: {
          amount: 2000,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          sku: '2169049',
          color: 'red',
          'shipping weight': '12lbs',
        },
        _tags: ['t-shirts', 'graphic tees', 'mens shirts'],
      },
      {
        _id: '6048f59b54b3f3af70acd480',
        objectID: '90n_HHgBZnvTu_pfZnys',
        createdAt: 1615394202,
        updatedAt: 1615394202,
        imageUrl: 'http://www.img.url.com',
        merchantUID: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
        category: {
          _id: '5d12bf519eb1641840519334',
          createdAt: 1561509568,
          updatedAt: 1561509568,
          name: 'Apparel, shoes, jewelry',
          commissionRate: 5,
          subCategories: ['Accessories', 'Apparel', 'Jewelry & watches', 'Shoes'],
        },
        name: '>Mens Graphic TeeB',
        description: 'Excellent form fitting graphic tee for men',
        store: {
          _id: '5d27d9af9eb1641840562169',
          companyName: 'iMAGi Print T-SHIRTS & More',
          address: '1315 53rd St STE 3',
          _geoloc: {
            lat: 26.7492,
            lng: -80.0725,
          },
          merchant: {
            uid: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
            firstName: '',
            lastName: '',
          },
        },
        price: {
          amount: 2000,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          sku: '2169049',
          color: 'red',
          'shipping weight': '12lbs',
        },
        _tags: ['t-shirts', 'graphic tees', 'mens shirts'],
      },
      {
        _id: '6048f59b54b3f3af70acd481',
        objectID: '-En_HHgBZnvTu_pfaHw2',
        createdAt: 1615394202,
        updatedAt: 1615394202,
        imageUrl: 'http://www.img.url.com',
        merchantUID: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
        category: {
          _id: '5d12bf519eb1641840519334',
          createdAt: 1561509568,
          updatedAt: 1561509568,
          name: 'Apparel, shoes, jewelry',
          commissionRate: 5,
          subCategories: ['Accessories', 'Apparel', 'Jewelry & watches', 'Shoes'],
        },
        name: '>Mens Graphic TeeC',
        description: 'Excellent form fitting graphic tee for men',
        store: {
          _id: '5d27d9af9eb1641840562169',
          companyName: 'iMAGi Print T-SHIRTS & More',
          address: '1315 53rd St STE 3',
          _geoloc: {
            lat: 26.7492,
            lng: -80.0725,
          },
          merchant: {
            uid: '7COaiEfe0WOwjj5bxXDIfMJuCfX2',
            firstName: '',
            lastName: '',
          },
        },
        price: {
          amount: 2000,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          sku: '2169049',
          color: 'red',
          'shipping weight': '12lbs',
        },
        _tags: ['t-shirts', 'graphic tees', 'mens shirts'],
      },
    ],
    failed: [],
  },
};

export const GETProductsCountExamples = {
  SUCCESS: {
    // TODO: Update to use ResponseAPI
    count: 2,
  },
};
