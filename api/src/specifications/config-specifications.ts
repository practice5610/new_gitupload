import { SchemaObject } from '@loopback/openapi-v3';

import {
  CommonSummary,
  ExampleField,
  GlobalResponseMessages,
  ProfileResponseMessages,
  RequestBodyDescriptions,
  ServiceResponseCodes,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants';
import { ConfigSchema, ConfigSchemaObject } from '../validation/schemas';
import {
  PATCHConfigRequestBodyExamples,
  POSTConfigRequestBodyExamples,
} from './examples/requestBody';
import {
  GETConfigSpecificationExamples,
  GlobalResponseExamplesBuilder,
  POSTConfigExamples,
} from './examples/responses';

export const POSTConfigSpecification = {
  summary: SpecificationSummaries.POSTConfigSpecification,
  description: SpecificationDescriptions.POSTConfigSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Config instance',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: ConfigSchemaObject,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTConfigExamples.SUCCESS,
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

const { _id, createdAt, updatedAt, ...ConfigSchemaPartialProperties } = ConfigSchema.properties;
const ConfigSchemaObjectPartial: SchemaObject = {
  ...ConfigSchemaObject,
  properties: {
    ...ConfigSchemaPartialProperties,
    type: { ...ConfigSchema.properties.type, enum: [...ConfigSchema.properties.type.enum] },
  },
  required: [...ConfigSchema.required, 'type', 'value'],
};

export const POSTConfigRequestBody = {
  description: RequestBodyDescriptions.POSTConfigRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: ConfigSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTConfigRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const GETConfigSpecification = {
  summary: SpecificationSummaries.GETConfigSpecification,
  description: SpecificationDescriptions.GETConfigSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Array of Config instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: ConfigSchemaObject },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETConfigSpecificationExamples.SUCCESS,
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
export const PATCHConfigSpecification = {
  summary: SpecificationSummaries.PATCHConfigSpecification,
  description: SpecificationDescriptions.PATCHConfigSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Config instance PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
export const PATCHConfigRequestBody = {
  description: RequestBodyDescriptions.PATCHCategoriesIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: ConfigSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: PATCHConfigRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
export const DELConfigIdSpecifications = {
  summary: SpecificationSummaries.DELConfigIdSpecifications,
  description: SpecificationDescriptions.DELConfigIdSpecifications,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Config instance DELETE success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    //[ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(), // Schema Validator Error
    //[ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(), // Default for all controllers
  },
};
