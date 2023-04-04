import { jsonToSchemaObject } from '@loopback/openapi-v3';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { GlobalResponseExamplesBuilder, POSTSmsAppResponseExamples } from './examples/responses';

export const POSTSmsAppSpecification = {
  summary: 'Send SMS with links to download Boom mobile app.',
  description: '__Return and API response instance if send sms successful.__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Successful SMS',
      content: {
        'application/json': {
          schema: {
            'x-ts-type': Object,
          },
          [ExampleField.SUCCESS]: {
            success: {
              summary: CommonSummary.SUCCESS,
              value: POSTSmsAppResponseExamples.SUCCESS,
              // TODO: Update to use ResponseAPI
            },
          },
        },
      },
    },
    [ServiceResponseCodes.RECORD_CONFLICT]: GlobalResponseExamplesBuilder.RECORD_CONFLICT({}),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE({
      description: 'Missing or additional properties on data sent',
    }),
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const POSTSmsAppRequestBody = {
  description: 'Object contain re-catchat token and phone number of the user.',
  required: true,
  content: {
    'application/json': {
      schema: jsonToSchemaObject({
        type: 'object',
        properties: {
          token: {
            type: 'string',
          },
          phone: {
            type: 'string',
          },
        },
        required: ['token', 'phone'],
        maxProperties: 2,
        minProperties: 2,
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Request with correct value', // CommonSummary.SUCCESS
          value: {
            token: 'reCapchat token here',
            phone: '+13054443322',
          },
        },
      },
    },
  },
};
