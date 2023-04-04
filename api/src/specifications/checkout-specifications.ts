import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { Order } from '../models';
import { POSTPlaceOrderRequestBodyExamples } from './examples/requestBody';

export const POSTPlaceOrderSpecification = {
  summary: 'Place an order when checkout complete.',
  description: '__Return and API response instance when checkout process end.__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Checks out bookings that are provided',
      content: { 'application/json': { schema: { 'x-ts-type': Object } } },
    },
  },
};

export const POSTPlaceOrderRequestBody = {
  description: 'Require an Order Type object to be placed.',
  required: true,
  content: {
    'application/json': {
      schema: { 'x-ts-type': Order },
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTPlaceOrderRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
