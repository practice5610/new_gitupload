import { getModelSchemaRef } from '@loopback/openapi-v3';

import { RequestBodyDescriptions } from '../../../constants/specification-constants';
import { Order } from '../../../models';

export const PATCHORdersByIdRequestBody = {
  description: RequestBodyDescriptions.PATCHORdersByIdRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(Order, {
        partial: true,
        exclude: ['_id', 'createdAt'],
      }),
    },
  },
};
