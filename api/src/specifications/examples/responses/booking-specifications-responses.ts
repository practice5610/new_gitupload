import { APIResponseMessages } from '../../../constants';
/*
  TODO: Seems that these responses are outdated, use testing data here
  _givenStoreData({ ...data, merchant })
  const product: Product = _givenProductData((data?.item as Offer)?.product);
  const offer: Offer = _givenOfferData({ product: product });
  _givenBookingData({ ...data, item: offer, type: BookingTypes.OFFER })
  
*/
export const POSTBookingsResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      valids: [
        {
          _id: '6079c7c62f645c1a3025c986',
          createdAt: 1618593734,
          updatedAt: 1618593734,
          type: 'offer',
          item: {
            _id: '6079a3fa9d144043440185b5',
            createdAt: 1618584570,
            updatedAt: 1618584570,
            cashBackPerVisit: {
              amount: 1000,
              precision: 2,
              currency: 'USD',
              symbol: '$',
            },
            conditions: ['NO RETURNS'],
            description: 'Beautiful printed t-shirt with your favorite superhero!',
            maxQuantity: 2,
            maxVisits: 1,
            startDate: 1561509568,
            title: '$10 cashback on t-shirt',
            product: {
              _id: '6079a3009d144043440185b4',
              createdAt: 1618584320,
              updatedAt: 1618584320,
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
              name: 'Mens Graphic Tee2',
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
              status: 'pending',
              quantity: 1,
            },
            expiration: 1744811113,
          },
          quantity: 1,
          status: 'Active',
          memberUID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
          visits: 1,
        },
      ],
      invalids: [],
    },
  },
};

export const GETBookingsCountResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      count: 41,
    },
  },
};

export const GETBookingsResponseExamples = {
  SUCCESS: [
    {
      _id: '5d9f29ba67b3b66b80bc4c6f',
      createdAt: 1570721235,
      updatedAt: 1613720764,
      type: 'offer',
      item: {
        _id: '5d9d545b9e49d958b61d9c65',
        imageUrl:
          'https://d1k0ppjronk6up.cloudfront.net/products/21/datafeeds_250x250_949a203e_1cc8_4fcc_a6a4_ca2db4c52fcc.jpg',
        merchantUID: 're5OljVl3KObKLopKdxpOQBWPL82',
        category: {
          name: 'Automotive, tool & industrial',
          subCategories: ['Tool'],
        },
        name: 'Vise-Grip 8-Piece GrooveLock/ProPliers Kit Bag Set',
        description:
          'Features and Benefits:      Press and slide button quickly adjusts lower jaw     All purpose jaw grips on round, flat, square and hex shaped     More groove positions provide the optimum hand location for a better grip on the work piece     ProTouchtrade; grips provide extra comfort and reduce hand fatigue     Ratcheting action allows GrooveLock to be adjusted from the open position up to the work piece by pushing the handle up - no need to press the button  Anti-pinch design prevents handles from pinching. Set includes one each: 8quot;, ,  GrooveLock Pliers,  Adjustable Wrench, 8quot; Long Nose Plier, 8quot; Linesmanrsquo;s Plier,  Diagonal Cutter and  Slip Joint Plier.',
        store: {
          _id: '5d2e02329eb1641840578f58',
          companyName: 'Qa',
          merchant: {
            uid: 're5OljVl3KObKLopKdxpOQBWPL82',
            name: '',
            firstName: 'Steve1233',
            lastName: 'Daniels ',
          },
          country: 'US',
          state: 'FL',
          city: 'Miami',
          zip: '33147',
          number: '7900',
          street1: 'NW 27th Ave',
          street2: '',
          _geoloc: {
            lat: 25.8479345,
            lng: -80.24276700000001,
          },
        },
        price: {
          amount: 8840,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          upc: 38548040851,
          product_id: 315618,
          item_id: 518055,
          stock: 'in-stock',
          supplier_id: 21,
          supplier_name: 'Quartz',
          brand_name: 'Vise Grip',
          item_sku: 'VGP2078712',
          ship_weight: 7.35,
          warranty: 'Sets  Kits do not have warranty see individual p',
        },
        _tags: [],
      },
      quantity: 2,
      status: 'Used',
      memberUID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
      visits: 6,
    },
    {
      _id: '5d9f29ba67b3b66b80bc4c70',
      createdAt: 1570721235,
      updatedAt: 1618807948,
      type: 'offer',
      item: {
        _id: '5d9d545b9e49d958b61d9c65',
        imageUrl:
          'https://d1k0ppjronk6up.cloudfront.net/products/21/datafeeds_250x250_949a203e_1cc8_4fcc_a6a4_ca2db4c52fcc.jpg',
        merchantUID: 're5OljVl3KObKLopKdxpOQBWPL82',
        category: {
          name: 'Automotive, tool & industrial',
          subCategories: ['Tool'],
        },
        name: 'Vise-Grip 8-Piece GrooveLockProPliers Kit Bag Set',
        description:
          'Features and Benefits:      Press and slide button quickly adjusts lower jaw     All purpose jaw grips on round, flat, square and hex shaped     More groove positions provide the optimum hand location for a better grip on the work piece     ProTouchtrade; grips provide extra comfort and reduce hand fatigue     Ratcheting action allows GrooveLock to be adjusted from the open position up to the work piece by pushing the handle up - no need to press the button  Anti-pinch design prevents handles from pinching. Set includes one each: 8quot;, ,  GrooveLock Pliers,  Adjustable Wrench, 8quot; Long Nose Plier, 8quot; Linesmanrsquo;s Plier,  Diagonal Cutter and  Slip Joint Plier.',
        store: {
          _id: '5d2e02329eb1641840578f58',
          companyName: 'Qa',
          merchant: {
            uid: 're5OljVl3KObKLopKdxpOQBWPL82',
            name: '',
            firstName: 'Steve1233',
            lastName: 'Daniels ',
          },
          country: 'US',
          state: 'FL',
          city: 'Miami',
          zip: '33147',
          number: '7900',
          street1: 'NW 27th Ave',
          street2: '',
          _geoloc: {
            lat: 25.8479345,
            lng: -80.24276700000001,
          },
        },
        price: {
          amount: 8840,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          upc: 38548040851,
          product_id: 315618,
          item_id: 518055,
          stock: 'in-stock',
          supplier_id: 21,
          supplier_name: 'Quartz',
          brand_name: 'Vise Grip',
          item_sku: 'VGP2078712',
          ship_weight: 7.35,
          warranty: 'Sets  Kits do not have warranty see individual p',
        },
        _tags: [],
      },
      quantity: 2,
      status: 'Used',
      memberUID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
      visits: 6,
    },
    {
      _id: '5d9f29ba67b3b66b80bc4c71',
      createdAt: 1570721235,
      updatedAt: 1613720764,
      type: 'offer',
      item: {
        _id: '5d9d545b9e49d958b61d9c65',
        imageUrl:
          'https://d1k0ppjronk6up.cloudfront.net/products/21/datafeeds_250x250_949a203e_1cc8_4fcc_a6a4_ca2db4c52fcc.jpg',
        merchantUID: 're5OljVl3KObKLopKdxpOQBWPL82',
        category: {
          name: 'Automotive, tool & industrial',
          subCategories: ['Tool'],
        },
        name: 'Vise-Grip 8-Piece GrooveLock/ProPliers Kit Bag Set',
        description:
          'Features and Benefits:      Press and slide button quickly adjusts lower jaw     All purpose jaw grips on round, flat, square and hex shaped     More groove positions provide the optimum hand location for a better grip on the work piece     ProTouchtrade; grips provide extra comfort and reduce hand fatigue     Ratcheting action allows GrooveLock to be adjusted from the open position up to the work piece by pushing the handle up - no need to press the button  Anti-pinch design prevents handles from pinching. Set includes one each: 8quot;, ,  GrooveLock Pliers,  Adjustable Wrench, 8quot; Long Nose Plier, 8quot; Linesmanrsquo;s Plier,  Diagonal Cutter and  Slip Joint Plier.',
        store: {
          _id: '5d2e02329eb1641840578f58',
          companyName: 'Qa',
          merchant: {
            uid: 're5OljVl3KObKLopKdxpOQBWPL82',
            name: '',
            firstName: 'Steve1233',
            lastName: 'Daniels ',
          },
          country: 'US',
          state: 'FL',
          city: 'Miami',
          zip: '33147',
          number: '7900',
          street1: 'NW 27th Ave',
          street2: '',
          _geoloc: {
            lat: 25.8479345,
            lng: -80.24276700000001,
          },
        },
        price: {
          amount: 8840,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        attributes: {
          upc: 38548040851,
          product_id: 315618,
          item_id: 518055,
          stock: 'in-stock',
          supplier_id: 21,
          supplier_name: 'Quartz',
          brand_name: 'Vise Grip',
          item_sku: 'VGP2078712',
          ship_weight: 7.35,
          warranty: 'Sets  Kits do not have warranty/ see individual p',
        },
        _tags: [],
      },
      quantity: 2,
      status: 'Used',
      memberUID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
      visits: 6,
    },
  ],
};

export const PATCHBookingsResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      count: 41,
    },
  },
};

export const GETBookingByIDResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: {
      _id: '5fe9f9be5d4f0b1945cc47a3',
      createdAt: 1609170288,
      updatedAt: 1618858213,
      type: 'product',
      item: {
        _id: '5ea9d5ba22ef39269403f522',
        _tags: [],
        imageUrl:
          'https://d1k0ppjronk6up.cloudfront.net/products/4030/nmcpics_095_095046PK_IT_IM.jpg',
        merchantUID: 're5OljVl3KObKLopKdxpOQBWPL82',
        name: 'Dump & Bake Desserts (One Pan. Dump. Stir. Bake)-',
        description:
          'CQ Products-Dump & Bake Desserts. Grab a baking pan, add your ingredients, stir and bake! It is that easy! Create tarts, pies, cookies, bards, cakes and more. This book contains thirty dessert recipes. Spiral-bound; 64 pages. Published year: 2014. ISBN 978-1- 56383-494-3. Made in USA.',
        price: {
          amount: 696,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        category: {
          _id: '5d12c0c89eb1641840519363',
          createdAt: 1561509568,
          updatedAt: 1602873591,
          name: 'Books',
          subCategories: [
            'Accessories',
            'Art',
            'Blank book/journal/diary',
            'Calendar',
            'Computers',
            'Cooking',
            'Crafts & hobbies',
            'Education',
            'Games',
            'Gardening',
            'Juvenile diary, blank book, journal',
            'Magazines',
            'Mathematics',
            'Non-classifiable',
            'Reference',
            'Self-help',
            'Sports & recreation',
            'Technology',
          ],
        },
        packageDetails: {
          weight: 2,
          massUnit: 'lb',
          boxId: '603683fd73ce18ebc20bd24a',
          itemsPerBox: 10,
          shipsFrom: '927d9eb639094d4e86b118e769ba8def',
        },
        shippingPolicy: '60368264592e1b3abc69afe5',
        status: 'approved',
        store: {
          _id: '5d2e02329eb1641840578f58',
          companyName: 'Qa',
          merchant: {
            uid: 're5OljVl3KObKLopKdxpOQBWPL82',
            name: '',
            firstName: 'Steve1233',
            lastName: 'Daniels ',
          },
          country: 'US',
          state: 'FL',
          city: 'Miami',
          zip: '33147',
          number: '7900',
          street1: 'NW 27th Ave',
          street2: '',
          _geoloc: {
            lat: 25.8479345,
            lng: -80.24276700000001,
          },
        },
      },
      quantity: 2,
      status: 'Used',
      memberUID: 'Rj7Q4ZQpzUfg19k7lD91XqFCIWI2',
      visits: 1,
    },
  },
  NOT_FOUND: {
    // TODO: Maybe this is no needed, check comment on api\src\specifications\booking-specifications.ts
    error: {
      statusCode: 400,
      name: 'BadRequestError',
      message: {
        code: 'ENTITY_NOT_FOUND',
        entityName: 'bookings',
        entityId: '5fe9f9be5d4f0b1945cc47a',
      },
    },
  },
};
