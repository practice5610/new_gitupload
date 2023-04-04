import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { BoomAccount } from '../models';
import {
  GETBalanceByUIDResponseExamples,
  GETBoomAccountByIDResponseExamples,
  GlobalResponseExamplesBuilder,
} from './examples/responses';

export const GETBoomAccountByIDSpecification = {
  summary: 'get a boom account instance, requested by ID',
  description:
    '__Return and API response instance with a single boom account in data field.__ - Try out with: __603d094d92c1c9c701241c26__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ['BoomAccount model instance'],
      content: {
        'application/json': {
          schema: {
            'x-ts-type': BoomAccount,
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETBoomAccountByIDResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const GETBalanceByUIDSpecification = {
  summary: 'get Balance from a boom account instance, requested by User UID',
  description:
    '__Return and API response instance with the balance in data field.__ - Try out with: __lZz4ZtR4ycUvIXZt0bMlWm4ClOf2__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ['Boom account'],
      content: {
        'application/json': {
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETBalanceByUIDResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
  },
};
