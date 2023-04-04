import { getModelSchemaRef, SchemaObject } from '@loopback/openapi-v3';
import { CountSchema } from '@loopback/repository';

import {
  CommonSummary,
  ExampleField,
  RequestBodyDescriptions,
  ServiceResponseCodes,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants';
import { Category as CategoryModel } from '../models';
import { CategorySchema, CategorySchemaObject } from '../validation/schemas';
import {
  PATCHCategoriesIdRequestBodyExamples,
  POSTCategoriesRequestBodyExamples,
  PUTCategoriesIdRequestBodyExamples,
} from './examples/requestBody';
import {
  GETCategoriesIdSpecificationResponseExamples,
  GETCategoriesSpecificationResponseExamples,
  GETCategoryCountResponseExamples,
  GlobalResponseExamplesBuilder,
  POSTCategoriesResponseExamples,
} from './examples/responses';

export const POSTCategoriesSpecification = {
  summary: SpecificationSummaries.POSTCategoriesSpecification,
  description: SpecificationDescriptions.POSTCategoriesSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Successful category Creation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              //data: CategorySchemaObject,
              data: { 'x-ts-type': CategoryModel },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTCategoriesResponseExamples.SUCCESS,
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

const { _id, createdAt, updatedAt, ...CategorySchemaPartialProperties } = CategorySchema.properties;
const CategorySchemaObjectPartial: SchemaObject = {
  ...CategorySchemaObject,
  properties: { ...CategorySchemaPartialProperties },
  required: ['name', 'commissionRate', 'subCategories'],
};
export const POSTCategoriesRequestBody = {
  description: RequestBodyDescriptions.POSTCategoriesRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: CategorySchemaObjectPartial,
      /*schema: getModelSchemaRef(Category, {
        partial: false, // Setting this to true or false makes no effect, all the time all properties are optional and here we need all of them as required
        exclude: ['_id', 'createdAt', 'updatedAt'],
      }),*/
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTCategoriesRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const GETCategoryCountSpecification = {
  summary: SpecificationSummaries.GETCategoryCountSpecification,
  description: SpecificationDescriptions.GETCategoryCountSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Category Instances',
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
              summary: CommonSummary.SUCCESS,
              value: GETCategoryCountResponseExamples.SUCCESS, // TODO: Missing examples
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
export const GETCategoriesSpecification = {
  summary: SpecificationSummaries.GETCategoriesSpecification,
  description: SpecificationDescriptions.GETCategoriesSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Category Instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              //data: { type: 'array', items: CategorySchemaObject },
              data: { type: 'array', items: { 'x-ts-type': CategoryModel } },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETCategoriesSpecificationResponseExamples.SUCCESS,
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

export const GETCategoriesIdSpecification = {
  summary: SpecificationSummaries.GETCategoriesIdSpecification,
  description: SpecificationDescriptions.GETCategoriesIdSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Category Instance',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              //data: CategorySchemaObject,
              data: { 'x-ts-type': CategoryModel },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETCategoriesIdSpecificationResponseExamples.SUCCESS, // TODO: Missing examples
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

export const PATCHCategoriesSpecification = {
  summary: SpecificationSummaries.PATCHCategoriesSpecification,
  description: SpecificationDescriptions.PATCHCategoriesSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Category instances PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};

export const PATCHCategoriesRequestBody = {
  description: RequestBodyDescriptions.POSTCategoriesRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: CategorySchemaObject,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTCategoriesRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const PATCHCategoriesIdSpecification = {
  summary: SpecificationSummaries.PATCHCategoriesIdSpecification,
  description: SpecificationDescriptions.PATCHCategoriesIdSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Category instance PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
export const PATCHCategoriesIdRequestBody = {
  description: RequestBodyDescriptions.PATCHCategoriesIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: CategorySchemaObject,
      /*schema: getModelSchemaRef(Category, {
            partial: false, // Setting this to true or false makes no effect, all the time all properties are optional and here we need all of them as required
            exclude: ['_id', 'createdAt', 'updatedAt'],
          }),*/
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: PATCHCategoriesIdRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const PUTCategoriesIdSpecifications = {
  summary: SpecificationSummaries.PUTCategoriesIdSpecifications,
  description: SpecificationDescriptions.PUTCategoriesIdSpecifications,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Category instance PUT success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
export const PUTCategoriesIdRequestBody = {
  description: RequestBodyDescriptions.PUTCategoriesIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: CategorySchemaObjectPartial,
      /*schema: getModelSchemaRef(Category, {
              partial: false, // Setting this to true or false makes no effect, all the time all properties are optional and here we need all of them as required
              exclude: ['_id', 'createdAt', 'updatedAt'],
            }),*/
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: PUTCategoriesIdRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const DELCategoriesIdSpecifications = {
  summary: SpecificationSummaries.DELCategoriesIdSpecifications,
  description: SpecificationDescriptions.DELCategoriesIdSpecifications,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Category instance DELETE success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    //[ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    //[ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
