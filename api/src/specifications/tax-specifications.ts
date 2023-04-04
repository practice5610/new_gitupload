import { TaxCountriesRegex, TaxRegionsRegex } from '@boom-platform/globals';
import { jsonToSchemaObject } from '@loopback/openapi-v3';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import {
  POSTGetTaxRequestBodyExamples,
  PUTTaxableStatesRequestBodyExamples,
} from './examples/requestBody';
import { POSTGetTaxExample } from './examples/responses';

export const POSTGetTaxableProductSpecification = {
  summary: 'get taxes for a list of bookings',
  description: 'MISSING DESCRIPTION', // TODO: Complete
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Returns a list of taxes',
      context: {
        'application/json': {
          schema: { type: 'array', items: { 'x-ts-type': Object } },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTGetTaxExample.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const PUTSetTaxableStatesSpecification = {
  summary: 'MISSING SUMMARY', // TODO: Complete
  description: 'MISSING DESCRIPTION', // TODO: Complete
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Taxable States PUT success', // TODO: Missing context
    },
  },
};

export const POSTGetTaxableProductRequestBody = {
  description:
    'An array of items to calculate taxes for. Includes a booking id, to address, from address, and cost',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'toAddress'],
          properties: {
            id: {
              type: 'string',
              description: 'The id of a booking',
              minLength: 1,
            },
            toAddress: {
              type: 'object',
              required: ['address', 'city', 'state', 'country'],
              description: 'Address of the purchaser',
              properties: {
                address: {
                  type: 'string',
                  description: 'street address',
                  minLength: 1,
                },
                city: {
                  type: 'string',
                  description: 'city',
                  minLength: 1,
                },
                state: {
                  type: 'string',
                  description: 'state',
                  pattern: TaxRegionsRegex.source,
                },
                country: {
                  type: 'string',
                  description: 'country',
                  minLength: 1,
                },
              },
            },
          },
        },
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Request with one item', // CommonSummary.SUCCESS
          value: POSTGetTaxRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const PUTSetTaxableStatesRequestBody = {
  description:
    'An array of tax nexus (locations) that the user calling this endpoint pays taxes in',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'array',
        description: 'A tax nexus array',
        items: {
          required: ['country', 'state'],
          properties: {
            country: {
              type: 'string',
              description: 'Two-letter ISO country code for nexus region',
              pattern: TaxCountriesRegex.source,
            },
            state: {
              type: 'string',
              description: 'Two-letter ISO region code for nexus region',
              pattern: TaxRegionsRegex.source,
            },
          },
        },
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Request with two states', // CommonSummary.SUCCESS
          value: PUTTaxableStatesRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
