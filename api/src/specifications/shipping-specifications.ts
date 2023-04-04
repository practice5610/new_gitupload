import {
  DistanceUnitRegex,
  MassUnitRegex,
  ShipmentMethodsRegex,
  ShippingLabelFileTypeRegex,
} from '@boom-platform/globals';
import { getModelSchemaRef, jsonToSchemaObject, SchemaObject } from '@loopback/openapi-v3';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { ShippingBox, ShippingOrder, ShippingPolicy } from '../models';
import {
  AddressInfoSchemaObject,
  BaseSchema,
  BaseSchemaObject,
  BookingSchema,
  BookingSchemaObject,
} from '../validation/schemas';
import {
  POSTAddressValidationRequestBodyExamples,
  POSTEstimateShippingCostRequestBodyExamples,
  POSTPurchaseRateRequestBodyExamples,
  POSTRefundShippingRequestBodyExamples,
  POSTShippingBoxRequestBodyExamples,
  POSTShippingCheckoutRequestBodyExamples,
  POSTShippingPolicyRequestBodyExamples,
  POSTShippingRateRequestBodyExamples,
} from './examples/requestBody';
import {
  GETShippingLabelsExample,
  GETShippingOrderExample,
  GETShippingPolicyExample,
  GETShippoTransactionExample,
  POSTAddressValidationExamples,
  POSTEstimateShippingCostExample,
  POSTPurchaseRateExample,
  POSTRefundShippingExample,
  POSTShippingBoxExample,
  POSTShippingCheckoutExample,
  POSTShippingPolicyExample,
  POSTShippingRateExamples,
} from './examples/responses';

export const POSTAddressValidationRequestBody = {
  description: 'An AddressInfo Object including the name',
  required: true,
  content: {
    'application/json': {
      //schema: AddressInfoSchemaObject,
      schema: {
        ...AddressInfoSchemaObject,
        required: ['name', 'street1', 'city', 'state', 'zip'],
      },
      examples: {
        formatOne: {
          // [ExampleField.SUCCESS]
          summary: 'Request body with address split between number and street1', // CommonSummary.SUCCESS
          value: POSTAddressValidationRequestBodyExamples.DATA_SENT_FORMAT_1,
        },
        formatTwo: {
          // [ExampleField.SUCCESS]
          summary: 'Request body that does not use "number"', // CommonSummary.SUCCESS
          value: POSTAddressValidationRequestBodyExamples.DATA_SENT_FORMAT_2,
        },
      },
    },
  },
};

export const POSTAddressValidationSpecification = {
  summary: 'Validate a new Address',
  description:
    'Every shipping address saved by Boom needs to be validated here.' +
    ' A unique id (AddressInfo.object_id) for the address will be returned,' +
    ' along with wether or not the address is valid and a list of messages ' +
    'suggesting improvements, like if Shippo thinks the address is missing' +
    ' an apartment number.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description:
        'Returns the AddressInfo with suggested changes as an AddressValidationResponse wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object }, // TODO: Create Schema matching AddressValidationResponse from Globals
          examples: {
            // [ExampleField.SUCCESS]
            successWithSuggestion: {
              summary: 'On success, with suggestion messages', // CommonSummary.SUCCESS
              value: POSTAddressValidationExamples.SUCCESS_MISSING_APT, // TODO: Update once we use APIResponse
            },
            // [ExampleField.SUCCESS]
            successWithNoSuggestion: {
              summary: 'On success, with no messages', // CommonSummary.SUCCESS
              value: POSTAddressValidationExamples.SUCCESS_NO_SUGGESTIONS, // TODO: Update once we use APIResponse
            },
          },
        },
      },
    },
  },
};

export const POSTGetRatesRequestBody = {
  description: 'A GetRatesRequest Object',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'object',
        description: 'a request body to get rates for a shipment',
        required: ['shipToAddressId', 'shipFromAddressId', 'parcels'],
        additionalProperties: false,
        properties: {
          shipToAddressId: {
            type: 'string',
            description: 'Shippo id of the address the parcels will be shipped to',
            minLength: 1,
          },
          shipFromAddressId: {
            type: 'string',
            description: 'Shippo id of the address the parcels will be shipped from',
            minLength: 1,
          },
          parcels: {
            type: 'array',
            description: 'an array of parcels to be shipped',
            items: {
              type: 'object',
              description: 'parcel data for a box to be shipped',
              required: ['length', 'width', 'height', 'weight', 'distance_unit', 'mass_unit'],
              properties: {
                length: {
                  type: 'number',
                  minimum: 0,
                },
                width: {
                  type: 'number',
                  minimum: 0,
                },
                height: {
                  type: 'number',
                  minimum: 0,
                },
                weight: {
                  type: 'number',
                  minimum: 0,
                },
                distance_unit: {
                  type: 'string',
                  pattern: DistanceUnitRegex.source,
                },
                mass_unit: {
                  type: 'string',
                  pattern: MassUnitRegex.source,
                },
              },
            },
          },
          extra: {
            type: 'object',
            description: 'Extras object to specify extra shipping services',
          },
          returnAll: {
            type: 'boolean',
            description: 'include true here to get every rate returned',
          },
          shipmentMethods: {
            type: 'array',
            description: 'optional list of shippment methods to get rates for',
            items: {
              type: 'string',
              description: 'ShipmentMethod to include',
              pattern: ShipmentMethodsRegex.source,
            },
          },
        },
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'GetRatesRequest object that includes an optional shipmentMethods list', // CommonSummary.SUCCESS
          value: POSTShippingRateRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTGetRatesSpecification = {
  summary: 'Find rates for a given shipment',
  description:
    'This will try to find rates for the given parcels shipped between the given addresses. See the GetRatesRequest documentation for more info',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a list of rates available to the user, wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: 'On success, with two rates', // CommonSummary.SUCCESS
              value: POSTShippingRateExamples.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const POSTPurchaseRateRequestBody = {
  description: 'A PurchaseRateRequest Object',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'object',
        required: ['shippoRateId', 'purchaserId'],
        additionalProperties: false,
        description: 'purchase rate request body',
        properties: {
          shippoRateId: {
            type: 'string',
            description: 'the shippo id of the chosen rate',
            minLength: 1,
          },
          purchaserId: {
            type: 'string',
            description: 'the uid of the user paying for shipping',
            minLength: 1,
          },
          labelFileType: {
            type: 'string',
            description: 'the format to create the label in. Default is set in shippo settings',
            pattern: ShippingLabelFileTypeRegex.source,
          },
        },
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary:
            'PurchaseRateRequest object with the id of the chosen rate and the uid of the purchaser', // CommonSummary.SUCCESS
          value: POSTPurchaseRateRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTPurchaseRateSpecification = {
  summary: 'Purchase a Shippo rate',
  description:
    'This will purchase the given rate and create a new ShippingOrder with shipping transaction details',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns the _id of the new ShippingOrder, wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTPurchaseRateExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const GETShippoTransactionSpecification = {
  summary: 'Get details of a shippo transaction',
  description:
    'This will get the details of a Shippo transaction. The transaction can be found ' +
    'with the shippo_id of the Shippo transaction OR with the _id of the ShippingOrder ' +
    'that matches the Shippo transaction',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description:
        'Returns the Shippo transaction data wrapped in an APIResponse, including ' +
        'the tracking number and sometimes the eta of the package',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETShippoTransactionExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const GETShippingLabelsSpecification = {
  summary: 'Get urls for the labels of all packages in a given shipment',
  description:
    'This will get a list of urls. Normally there will only be one url in the list but ' +
    'it is possible that there are multiple labels for one shipment',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a list of urls wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETShippingLabelsExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const POSTRefundShippingRequestBody = {
  description: 'The shippo_id of a shipment to cancel',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': String },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'The shippo_id of the shipment to cancel', // CommonSummary.SUCCESS
          value: POSTRefundShippingRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTRefundShippingSpecification = {
  summary: 'Refund a Shippo transaction',
  description:
    "This will try to refund a shipping transaction if the label hasn't been used. If a refund can " +
    'not be immediately processed it is changed to pending and this still returns success.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description:
        'Returns an APIResponse for a refund that was immediately approved and did not have to go to pending',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTRefundShippingExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const POSTEstimateShippingRequestBody = {
  description: 'A EstimateRateRequest Object',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'object',
        description: 'Shipping estimate request body',
        required: ['parcel', 'shipmentMethod', 'to', 'from'],
        additionalProperties: false,
        properties: {
          parcel: {
            type: 'object',
            description: 'parcel data for a box to be shipped',
            required: ['length', 'width', 'height', 'weight', 'distance_unit', 'mass_unit'],
            properties: {
              length: {
                type: 'number',
                minimum: 0,
              },
              width: {
                type: 'number',
                minimum: 0,
              },
              height: {
                type: 'number',
                minimum: 0,
              },
              weight: {
                type: 'number',
                minimum: 0,
              },
              distance_unit: {
                type: 'string',
                pattern: DistanceUnitRegex.source,
              },
              mass_unit: {
                type: 'string',
                pattern: MassUnitRegex.source,
              },
            },
          },
          shipmentMethod: {
            type: 'string',
            description: 'Shipment Method to estimate',
            pattern: ShipmentMethodsRegex.source,
          },
          to: {
            type: 'string',
            description: 'shippo id of destination address',
            minLength: 1,
          },
          from: {
            type: 'string',
            description: 'shippo id of merchant address',
            minLength: 1,
          },
        },
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Estimate request body', // CommonSummary.SUCCESS
          value: POSTEstimateShippingCostRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTEstimateShippingSpecification = {
  summary: 'Estimate the cost of a shipment',
  description:
    'This will get the price to ship a package between any two addresses (using their object_ids) using a specific shipmentMethod',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns the _id of the new ShippingOrder, wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTEstimateShippingCostExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const GETShippingOrderSpecification = {
  summary: 'Get a ShippingOrder',
  description: 'Gets a ShippingOrder',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a ShippingOrder',
      content: {
        'application/json': {
          schema: { 'x-ts-type': ShippingOrder },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETShippingOrderExample.SUCCESS, // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
  },
};

export const POSTShippingPolicyRequestBody = {
  description: 'A ShippingPolicy Object',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': ShippingPolicy },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'The new ShippingPolicy to create', // CommonSummary.SUCCESS
          value: POSTShippingPolicyRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTShippingBoxRequestBody = {
  description: 'A ShippingBox Object',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': ShippingBox },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTShippingBoxRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const GETShippingBoxSpecification = {
  summary: 'Get a list of ShippingBox',
  description: 'Gets a list of ShippingBox',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Get a list ShippingBox',
      content: {
        'application/json': {
          schema: { 'x-ts-type': ShippingBox },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              // value: GETShippingBoxExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const POSTShippingPolicySpecification = {
  summary: 'Create a new ShippingPolicy',
  description: 'Creates a new record containing the given ShippingPolicy',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns the new ShippingPolicy',
      content: {
        'application/json': {
          schema: { 'x-ts-type': ShippingPolicy },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTShippingPolicyExample.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
  },
};

export const POSTShippingBoxSpecification = {
  summary: 'Create a new ShippingBox',
  description: 'Creates a new record containing the given ShippingBox',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns the new ShippingBox',
      content: {
        'application/json': {
          schema: { 'x-ts-type': ShippingBox },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTShippingBoxExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const GETShippingPolicySpecification = {
  summary: 'Get a ShippingPolicy',
  description: 'This gets a ShippingPolicy by _id',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a ShippingPolicy',
      content: {
        'application/json': {
          schema: { 'x-ts-type': ShippingPolicy },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETShippingPolicyExample.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
  },
};
/*
This is not working as expected and doesn't allow to set all required fields correctly
const testSchemaObject: SchemaObject = {
  definitions: getModelSchemaRef(Booking).definitions,
  type: 'object',
  description: 'Shipping checkout request body',
  required: ['bookings', 'shipToAddressId'],
  additionalProperties: false,
  properties: {
    bookings: {
      type: 'array',
      description: 'List of bookings to get shipping for',
      items: { $ref: '#/definitions/Booking' },
      minItems: 1,
    },
    booking: { $ref: '#/definitions/Booking' },
    shipToAddressId: {
      type: 'string',
      description: 'shippo address id that the bookings will be shipped to',
      minLength: 1,
    },
  },
};
*/
const ShippingCheckoutSchemaObject: SchemaObject = {
  type: 'object',
  description: 'Shipping checkout request body',
  properties: {
    bookings: {
      type: 'array',
      description: 'List of bookings to get shipping for',
      items: {
        ...BookingSchemaObject,
        properties: {
          ...BookingSchemaObject.properties,
        },
        required: [
          ...BookingSchema.required,
          '_id',
          'type',
          'item',
          'quantity',
          'status',
          'memberUID',
          'visits',
        ], //TODO: Review if these required values are ok
      },
      minItems: 1,
    },
    shipToAddressId: {
      type: 'string',
      description: 'Shippo address id that the bookings will be shipped to',
      minLength: 2, //TODO: Review if this limit is ok
    },
  },
  required: ['bookings', 'shipToAddressId'],
  additionalProperties: false,
};
export const POSTShippingCheckoutRequestBody = {
  description: 'A ShippingCheckoutRequest Object',
  required: true,
  content: {
    'application/json': {
      //schema: testSchemaObject,
      schema: ShippingCheckoutSchemaObject,
      examples: {
        [ExampleField.SUCCESS]: {
          summary:
            'ShippingCheckoutRequest object with a list of bookings and the uid of the buyer', // CommonSummary.SUCCESS
          value: POSTShippingCheckoutRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTShippingCheckoutSpecification = {
  summary: 'Prices to ship a list of bookings',
  description:
    'This will group bookings into units that can ship together (or that have to be picked up together), ' +
    'then returns each of those groups of bookings along with the available rates for each group',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a list of OrderGroups wrapped in an APIResponse',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object }, //TODO: Create schema for this
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTShippingCheckoutExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};
