import { CountSchema } from '@loopback/repository';
import { getModelSchemaRef } from '@loopback/rest';

import {
  CommonSummary,
  ExampleField,
  ProfileResponseMessages,
  ResponseSuccessDescription,
  ServiceResponseCodes,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants';
import { Transaction } from '../models';
import { GlobalResponseExamplesBuilder } from './examples/responses';

export const POSTMerchantWithdrawalSpecification = {
  summary: 'Create new merchant withdrawal transaction',
  description:
    'This endpoint should be use, to create a new merchant withdrawal transaction in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Return the merchant withdrawal transaction from database record.',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Transaction),
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              //   value: POSTStoreResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const POSTMerchantWithdrawalRequestBody = {
  description: 'Require a partial transaction object for withdrawal',
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(Transaction, {
        exclude: [
          '_id',
          'booking',
          'cashback',
          'commissionCollected',
          'createdAt',
          'dateReceived',
          'purchaseItem',
          'updatedAt',
          'type',
          'title',
          'sender',
          'shippingOrderId',
          'nonce',
          'salestax',
          'shortId',
          'status',
          'taxcode',
        ],
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'request body',
          //   value: POSTStoreRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const GETMerchantWithdrawalCountSpecification = {
  summary: SpecificationSummaries.GETMerchantWithdrawalCountSpecification,
  description: SpecificationDescriptions.GETMerchantWithdrawalCountSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description:
        'APIResponse with the count of merchant withdrawal transaction instances matching with where condition',
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
                // value: GETOrdersCountResponseExamples.SUCCESS,
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

export const GETMerchantWithdrawalSpecification = {
  summary: SpecificationSummaries.GETMerchantWithdrawalSpecification,
  description: SpecificationDescriptions.GETMerchantWithdrawalSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETMerchantWithdrawalSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'array',
                items: getModelSchemaRef(Transaction, { includeRelations: true }),
              },
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                // value: GETOrdersResponseExamples.SUCCESS,
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
    // [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
    //   message: OrderResponseMessages.NOT_FOUND,
    // }),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const GETMerchantWithdrawalByIdSpecification = {
  summary: SpecificationSummaries.GETMerchantWithdrawalByIdSpecification,
  description: SpecificationDescriptions.GETMerchantWithdrawalByIdSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: ResponseSuccessDescription.GETMerchantWithdrawalByIdSpecification,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: getModelSchemaRef(Transaction, { includeRelations: true }),
            },
            examples: {
              [ExampleField.SUCCESS]: {
                summary: CommonSummary.SUCCESS,
                // value: GETOrdersByIdResponseExamples.SUCCESS,
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
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const PATCHMerchantWithdrawalByIdSpecification = {
  summary: SpecificationSummaries.PATCHMerchantWithdrawalByIdSpecification,
  description: SpecificationDescriptions.PATCHMerchantWithdrawalByIdSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: ResponseSuccessDescription.PATCHMerchantWithdrawalByIdSpecification,
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
  },
};

export const PATCHMerchantWithdrawalRequestBody = {
  description: 'Require a partial transaction object for withdrawal',
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(Transaction, {
        partial: true,
        title: 'Merchant Withdrawal Transaction',
        exclude: [
          '_id',
          'booking',
          'cashback',
          'commissionCollected',
          'createdAt',
          'dateReceived',
          'purchaseItem',
          'updatedAt',
          'type',
          'title',
          'sender',
          'shippingOrderId',
          'nonce',
          'salestax',
          'shortId',
          'status',
          'taxcode',
        ],
      }),
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'request body',
          //   value: POSTStoreRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
