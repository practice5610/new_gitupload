import { CountSchema } from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';

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
import { InventoryOrder } from '../models';
import { GlobalResponseExamplesBuilder } from './examples/responses';
import { GETInventoryOrdersResponseExamples } from './examples/responses/inventory-order-specifications-responses';
import { GETOrdersResponseExamples } from './examples/responses/order-specifications-responses';

export const GETInventoryOrderCountSpecification = {
  summary: 'Get a count of inventory orders.',
  description:
    'This endpoint should be use, to __request__ a __Count of Inventory_Orders__ instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return a CountSchema with the count of inventory orders requested.',
      content: {
        'application/json': {
          schema: CountSchema,
          [ExampleField.SUCCESS]: {
            success: {
              summary: CommonSummary.SUCCESS,
              value: GETInventoryOrdersResponseExamples.SUCCESS, // TODO: Update once we use APIResponse
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const GETInventoryOrdersSpecification = {
  summary: SpecificationSummaries.GETInventoryOrdersSpecification,
  description: SpecificationDescriptions.GETInventoryOrdersSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETInventoryOrdersSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: { 'x-ts-type': InventoryOrder } },
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                value: GETInventoryOrdersResponseExamples.SUCCESS,
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
