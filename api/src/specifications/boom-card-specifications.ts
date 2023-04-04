import { getModelSchemaRef } from '@loopback/openapi-v3';
import { CountSchema } from '@loopback/repository';

import { ServiceResponseCodes } from '../constants/service-response-codes';
import {
  CommonSummary,
  ExampleField,
  RequestBodyDescriptions,
  ResponseSuccessDescription,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants/specification-constants';
import { BoomCard } from '../models';
import {
  POSTBoomCardsLoginRequestBodyExample,
  POSTBoomCardsMerchantActivateByIdRequestBodyExample,
} from './examples/requestBody';
import {
  GETBoomCardsCountExamples,
  GETBoomCardsExamples,
  GETBoomCardsMerchantByCardNumberExamples,
  POSTBoomCardsExamples,
  POSTBoomCardsLoginExample,
} from './examples/responses/boom-card-specifications-responses';
import { GlobalResponseExamplesBuilder } from './examples/responses/globals-specifications-responses-builder';

export const POSTBoomCardsSpecification = {
  summary: SpecificationSummaries.POSTBoomCardsSpecification,
  description: SpecificationDescriptions.POSTBoomCardsSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.POSTBoomCardsSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: POSTBoomCardsExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const POSTBoomCardsLoginSpecification = {
  summary: SpecificationSummaries.POSTBoomCardsLoginSpecification,
  description: SpecificationDescriptions.POSTBoomCardsLoginSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.POSTBoomCardsLoginSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: POSTBoomCardsLoginExample.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const GETBoomCardsCountSpecification = {
  summary: SpecificationSummaries.GETBoomCardsCountSpecification,
  description: SpecificationDescriptions.GETBoomCardsCountSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETBoomCardsCountSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: CountSchema,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETBoomCardsCountExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
export const GETBoomCardsByIdSpecification = {
  summary: SpecificationSummaries.GETBoomCardsByIdSpecification,
  description: SpecificationDescriptions.GETBoomCardsByIdSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETBoomCardsByIdSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETBoomCardsCountExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const GETBoomCardsSpecification = {
  summary: SpecificationSummaries.GETBoomCardsSpecification,
  description: SpecificationDescriptions.GETBoomCardsSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETBoomCardsByIdSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETBoomCardsExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const GETBoomCardsMerchantByCardNumberSpecification = {
  summary: SpecificationSummaries.GETBoomCardsMerchantByCardNumberSpecification,
  description: SpecificationDescriptions.GETBoomCardsMerchantByCardNumberSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETBoomCardsMerchantByCardNumberSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETBoomCardsMerchantByCardNumberExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const POSTBoomCardsMerchantActivateByIdSpecification = {
  summary: SpecificationSummaries.POSTBoomCardsMerchantActivateByIdSpecification,
  description: SpecificationDescriptions.POSTBoomCardsMerchantActivateByIdSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.POSTBoomCardsMerchantActivateByIdSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': BoomCard },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETBoomCardsMerchantByCardNumberExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const PATCHBoomCardsByIdSpecification = {
  summary: SpecificationSummaries.PATCHBoomCardsByIdSpecification,
  description: SpecificationDescriptions.PATCHBoomCardsByIdSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Boom card instance update success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
export const DELBoomCardsByIdSpecifications = {
  summary: SpecificationSummaries.DELBoomCardsByIdSpecifications,
  description: SpecificationDescriptions.DELBoomCardsByIdSpecifications,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Boom card instance deleted succesful',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const POSTBoomCardsMerchantActivateByIdRequestBody = {
  description: RequestBodyDescriptions.POSTBoomCardsMerchantActivateByIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(BoomCard, {
        partial: true,
        exclude: [
          '_id',
          'createdAt',
          'fromBatchId',
          'status',
          'cardNumber',
          'qrcode',
          'customerID',
          'storeMerchantID',
        ],
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTBoomCardsMerchantActivateByIdRequestBodyExample.DATA_SENT,
        },
      },
    },
  },
};

export const POSTBoomCardsLoginRequestBody = {
  description: RequestBodyDescriptions.POSTBoomCardsLoginRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(BoomCard, {
        partial: true,
        exclude: [
          '_id',
          'createdAt',
          'status',
          'fromBatchId',
          'qrcode',
          'storeID',
          'customerID',
          'boomAccountID',
          'storeMerchantID',
        ],
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTBoomCardsLoginRequestBodyExample.DATA_SENT,
        },
      },
    },
  },
};

export const PATCHBoomCardsByIdRequestBody = {
  description: RequestBodyDescriptions.PATCHBoomCardsByIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(BoomCard, {
        partial: true,
        exclude: ['_id', 'createdAt', 'fromBatchId', 'cardNumber', 'qrcode'],
      }),
    },
  },
};
