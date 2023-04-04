import { CountSchema } from '@loopback/repository';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { Store } from '../models';
import { GlobalResponseExamplesBuilder } from '../specifications/examples/responses';
import {
  POSTStoreRequestBodyExamples,
  PUTStoreByIDRequestBodyExamples,
} from './examples/requestBody';
import {
  GETStoreByIDResponseExamples,
  GETStoresCountResponseExamples,
  GETStoresResponseExamples,
  POSTStoreResponseExamples,
  PUTStoreByIDResponseExamples,
} from './examples/responses';

export const POSTStoreRequestBody = {
  description: 'Require a partial Store object',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': Store },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'request body', // CommonSummary.SUCCESS
          value: POSTStoreRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const POSTStoreSpecification = {
  summary: 'Create new Store instance',
  description: 'This endpoint should be use, to create a new instance of Store in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return a Store instance result from database record.',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Store },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTStoreResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
    [ServiceResponseCodes.NOT_ACCEPTABLE]: GlobalResponseExamplesBuilder.NOT_ACCEPTABLE({
      message: 'Merchant has store.',
    }),
  },
};

export const GETStoresCountSpecification = {
  summary: 'Count Stores instances',
  description:
    'This endpoint can be used to count Store records in Database, optional you can use param KEY=where VALUE={ "key": "value"}',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Store model count',
      content: {
        'application/json': {
          schema: CountSchema,
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETStoresCountResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
  },
};

export const GETStoresSpecification = {
  summary: 'Get a list of Stores instances.',
  description:
    'This endpoint should be used to request a list of Store instances, optional you can use Filter as a param. KEY=filter VALUE={ "where" : { "key" : "value" } }',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return an __array__ of __Store__ instances from database.',
      content: {
        'application/json': {
          schema: { type: 'array', items: { 'x-ts-type': Store } },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETStoresResponseExamples.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
  },
};

export const GETStoreByIDSpecification = {
  summary: 'Get a Store instance by ID.',
  description:
    'This endpoint should be used to __request__ any __Store__ instance by his MongoDB unique identifier string. - try out with __603e712662c87e5e629220d4__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Store model instance',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Store },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETStoreByIDResponseExamples.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
  },
};

export const DELStoresByIDSpecification = {
  summary: 'Delete a Store intance by ID.',
  description:
    '__Warning!__ This endpoint should be used to __delete__ a __Store instance__ from database record.',
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'No content success.',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PUTStoreByIDSpecification = {
  summary: 'Update the whole Store instance by ID.',
  description:
    'This endpoint should be used to __UPDATE__ a __WHOLE__ Store instance. Try out with __603e712662c87e5e629220d4__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return a APIResponse object, with the Store instance updated.',
      content: {
        'application/json': {
          schema: Store,
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: PUTStoreByIDResponseExamples.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
    //[ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), //TODO: Use this one once Store is updated to use APIResponse
    [ServiceResponseCodes.FORBIDDEN]: {
      description: 'Return a object with an error object.',
      content: {
        'application/json': {
          examples: {
            [ExampleField.FORBIDDEN]: {
              summary: CommonSummary.FORBIDDEN,
              value: GlobalResponseExamplesBuilder.FORBIDDEN(),
            },
          },
        },
      },
    },
  },
};

export const PUTStoreByIDRequestBody = {
  description: 'Require an entire Store object to be updated.',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': Store },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'request body', // CommonSummary.SUCCESS
          value: PUTStoreByIDRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
