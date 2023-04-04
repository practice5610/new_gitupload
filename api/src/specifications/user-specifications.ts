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
import {
  CreateUserSchemaObject,
  ProfileSchema,
  VerifyPhoneNumberSchemaObject,
} from '../validation/schemas';
import {
  POSTAdminUserRequestBodyExamples,
  POSTUsersVerifyPhoneNumberRequestBodyExamples,
} from './examples/requestBody';
import {
  GETAdminUserResponseExamples,
  GETAdminUsersResponseExamples,
  GETUserTransferReceiverProfileExamples,
  GlobalResponseExamplesBuilder,
  POSTAdminUserExamples,
  POSTUsersVerifyPhoneNumberExamples,
} from './examples/responses';

export const GETAdminUsersSpecification = {
  summary: SpecificationSummaries.GETAdminUsersSpecification,
  description: SpecificationDescriptions.GETAdminUsersSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Array of users instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: ProfileSchema },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETAdminUsersResponseExamples.SUCCESS,
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

export const GETAdminUserSpecification = {
  summary: SpecificationSummaries.GETAdminUserSpecification,
  description: SpecificationDescriptions.GETAdminUserSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'BoomUser instance',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: ProfileSchema,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETAdminUserResponseExamples.SUCCESS,
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

    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.NO_PROFILE_FOUND,
    }),
    [ServiceResponseCodes.RECORD_CONFLICT]: GlobalResponseExamplesBuilder.RECORD_CONFLICT({
      message: ProfileResponseMessages.MISSING_PROFILE_PARAMETERS,
    }),
  },
};

export const POSTUsersVerifyPhoneNumberSpecification = {
  summary: SpecificationSummaries.POSTUsersVerifyPhoneNumberSpecification,
  description: SpecificationDescriptions.POSTUsersVerifyPhoneNumberSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'BoomUser instance',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: ProfileSchema,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTUsersVerifyPhoneNumberExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST({
      // Schema Validator Error and from the controller
      message: ProfileResponseMessages.NAME_DOESNT_MATCH,
    }),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR({
        message: ProfileResponseMessages.ACCOUNT_NAME_CANNOT_BE_CONFIRMED,
      }), // Default for all controllers

    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.PHONE_NUMBER_WITHOUT_ACCOUNT,
    }),
    [ServiceResponseCodes.RECORD_CONFLICT]: GlobalResponseExamplesBuilder.RECORD_CONFLICT({
      message: ProfileResponseMessages.MISSING_PROFILE_PARAMETERS,
    }),
  },
};

export const POSTUsersVerifyPhoneNumberRequestBody = {
  description: RequestBodyDescriptions.POSTUsersVerifyPhoneNumberRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: VerifyPhoneNumberSchemaObject,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Request with correct value', // CommonSummary.SUCCESS
          value: POSTUsersVerifyPhoneNumberRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};

export const GETTransferReceiverProfileSpecification = {
  summary: SpecificationSummaries.GETTransferReceiverProfileSpecification,
  description: SpecificationDescriptions.GETTransferReceiverProfileSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: '"name" and "profileImg" from receiver user instance.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  firstName: ProfileSchema.properties.firstName,
                  lastName: ProfileSchema.properties.lastName,
                  profileImg: ProfileSchema.properties.profileImg,
                },
                additionalProperties: false,
              },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: [CommonSummary.SUCCESS],
              value: GETUserTransferReceiverProfileExamples.SUCCESS,
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

    [ServiceResponseCodes.UNAUTHORIZED]: GlobalResponseExamplesBuilder.UNAUTHORIZED(),
    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.MEMBER_NOT_FOUND,
    }),
  },
};

export const POSTAdminUserSpecification = {
  summary: SpecificationSummaries.POSTAdminUserSpecification,
  description: SpecificationDescriptions.POSTAdminUserSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'userRecord',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object', description: "User's object provided by Firebase" },
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTAdminUserExamples.SUCCESS,
            },
          },
        },
      },
    },

    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(), // Schema Validator Error
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST({
      // Schema Validator Error and from the controller
      message: GlobalResponseMessages.INVALID_ROLE,
    }),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(), // Schema Validator Error
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR({
        message: '<Messages returned by Firebase>',
      }),

    [ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND({
      message: ProfileResponseMessages.MEMBER_NOT_FOUND,
    }),
  },
};
export const POSTAdminUserRequestBody = {
  description: RequestBodyDescriptions.POSTAdminUserRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: CreateUserSchemaObject,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: 'Request with correct value', // CommonSummary.SUCCESS
          value: POSTAdminUserRequestBodyExamples.DATA_SENT,
        },
      },
    },
  },
};
