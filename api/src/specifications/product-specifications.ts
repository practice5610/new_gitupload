import { CountSchema } from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { Product } from '../models';
import {
  GETProductsCountExamples,
  GlobalResponseExamplesBuilder,
  POSTProductsResponseExamples,
} from './examples/responses';

export const POSTProductSourceDobaSpecification = {
  summary: 'Converts Doba product xml into smaller json files of 1,000 products each.',
  description: 'This endpoint should be used, __ONLY__ to upload __DOBA PRODUCT CATALOG__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Product model instance',
      content: { 'application/json': { schema: { 'x-ts-type': Object } } }, // TODO: Missing examples
    },
  },
};

export const POSTProductSourceDobaResumeSpecification = {
  summary: 'Converts Doba product xml into smaller json files of 1,000 products each.',
  description: 'This endpoint should be used, __ONLY__ to upload __DOBA PRODUCT CATALOG__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Product model instance',
      content: { 'application/json': { schema: { 'x-ts-type': Object } } }, // TODO: Missing examples
    },
  },
};

export const POSTProductsSpecification = {
  summary: 'Create new Products instances',
  description: 'This endpoint should be use, to create a new instances of Products in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Product model instance',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              'x-ts-type': Product,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTProductsResponseExamples.SUCCESS, // TODO: Update once we use APIResponse
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const POSTProductsRequestBody = {
  description: 'Require an array of products instances.',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        items: {
          'x-ts-type': Product,
        },
        example: ['str1', 'str2', 'str3'],
      }, // TODO: Missing examples
    },
  },
};

export const GETProductsCountSpecification = {
  summary: 'Get a count of products.',
  description:
    'This endpoint should be use, to __request__ a __Count of Products__ instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return a CountSchema with the count of products requested.',
      content: {
        'application/json': {
          schema: CountSchema,
          [ExampleField.SUCCESS]: {
            success: {
              summary: CommonSummary.SUCCESS,
              value: GETProductsCountExamples.SUCCESS, // TODO: Update once we use APIResponse
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const GETProductsSpecification = {
  summary: 'Get a list of products.',
  description:
    'This endpoint should be use, to __request__ an __array of products__ instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Array of Product model instances',
      content: {
        'application/json': {
          schema: { type: 'array', items: { 'x-ts-type': Product } }, // TODO: Missing examples
        },
      },
    },
  },
};

export const GETProductByIDSpecification = {
  summary: 'Get a single product instance by ID.',
  description:
    'This endpoint should be use, to __request__ a __single product__ instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Product model instance',
      content: { 'application/json': { schema: { 'x-ts-type': Product } } }, // TODO: Missing examples
    },
  },
};

export const PATCHProductByIDSpecification = {
  summary: 'Update a single product instance by ID.',
  description:
    'This endpoint should be use, to __update__ a __single product__ instances in database.',
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Product PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PATCHProductByIDRequestBody = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(Product, {
        partial: true,
        exclude: ['_id', 'objectID', 'createdAt', 'merchantUID'],
      }),
    }, // TODO: Missing examples
  },
};

export const DELProductByIDSpecification = {
  summary: 'Delete a single product instance by ID.',
  description:
    'This endpoint should be use, to __DELETE__ a __single product__ instances in database.',
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Product DELETE success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};
