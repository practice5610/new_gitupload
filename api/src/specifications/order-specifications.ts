import { CountSchema } from '@loopback/repository';

import {
  CommonSummary,
  ExampleField,
  OrderResponseMessages,
  ProfileResponseMessages,
  ResponseSuccessDescription,
  ServiceResponseCodes,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants';
import { Order } from '../models';
import { GlobalResponseExamplesBuilder } from './examples/responses';
import {
  GETOrdersByIdResponseExamples,
  GETOrdersCountResponseExamples,
  GETOrdersResponseExamples,
} from './examples/responses/order-specifications-responses';

export const GETOrdersCountSpecification = {
  summary: SpecificationSummaries.GETOrdersCountSpecification,
  description: SpecificationDescriptions.GETOrdersCountSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'APIResponse with the count of orders instances matching with where condition',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: CountSchema,
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                value: GETOrdersCountResponseExamples.SUCCESS,
              },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const GETOrdersSpecification = {
  summary: SpecificationSummaries.GETOrdersSpecification,
  description: SpecificationDescriptions.GETOrdersSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETOrdersSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: { 'x-ts-type': Order } },
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                value: GETOrdersResponseExamples.SUCCESS,
              },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.UNAUTHORIZED]: GlobalResponseExamplesBuilder.UNAUTHORIZED(),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.NO_PROFILE_FOUND,
    }),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: OrderResponseMessages.NOT_FOUND,
    }),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const GETOrdersByIdSpecification = {
  summary: SpecificationSummaries.GETOrdersByIdSpecification,
  description: SpecificationDescriptions.GETOrdersByIdSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETOrdersByIdSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { 'x-ts-type': Order },
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                value: GETOrdersByIdResponseExamples.SUCCESS,
              },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.UNAUTHORIZED]: GlobalResponseExamplesBuilder.UNAUTHORIZED(),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.NO_PROFILE_FOUND,
    }),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: OrderResponseMessages.NOT_FOUND,
    }),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const PATCHOrdersByIdSpecification = {
  summary: SpecificationSummaries.PATCHOrdersByIdSpecification,
  description: SpecificationDescriptions.PATCHOrdersByIdSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: ResponseSuccessDescription.PATCHOrdersByIdSpecification,
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: OrderResponseMessages.NOT_FOUND,
    }),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};
