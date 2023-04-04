import {
  APIResponseMessages,
  CommonSummary,
  ExampleField,
  ServiceResponseCodes,
} from '../../../constants';

export interface GlobalResponseExamplesBuilderInterface {
  description?: string;
  message?: string;
}
const standardErrorResponseSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    name: { type: 'string' },
    message: { type: 'string' },
  },
};
export const GlobalResponseExamplesBuilder = {
  BAD_REQUEST: ({
    // WARNING!! This is used by the Schema validators too - It can be used by our controllers
    description = 'Bad Request.',
    message = APIResponseMessages.BAD_REQUEST,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: {
            ...standardErrorResponseSchema,
            properties: { ...standardErrorResponseSchema.properties, code: { type: 'string' } },
          },
          examples: {
            [ExampleField.BAD_REQUEST]: {
              summary: CommonSummary.BAD_REQUEST,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.BAD_REQUEST,
                  name: 'BadRequestError',
                  message,
                  code: 'MISSING_REQUIRED_PARAMETER', // Our validators add this parameter when a field is missed
                },
              },
            },
          },
        },
      },
    };
  },

  UNAUTHORIZED: ({
    description = 'Unauthorized to perform this action.',
    message = APIResponseMessages.UNAUTHORIZED,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.UNAUTHORIZED]: {
              summary: CommonSummary.UNAUTHORIZED,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.UNAUTHORIZED,
                  name: 'Unauthorized',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },

  FORBIDDEN: ({
    // WARNING!! This one is only used by our Schema validators, it must not be used directly
    description = 'Access not allowed, returns an object with an error object.',
    message = APIResponseMessages.FORBIDDEN,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.FORBIDDEN]: {
              summary: CommonSummary.FORBIDDEN,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.FORBIDDEN,
                  name: 'ForbiddenError',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },

  RECORD_NOT_FOUND: ({
    description = 'No record found, returns an object with an error object.',
    message = APIResponseMessages.RECORD_NOT_FOUND,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.RECORD_NOT_FOUND]: {
              summary: CommonSummary.RECORD_NOT_FOUND,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
                  name: 'NotFoundError',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },

  NOT_ACCEPTABLE: ({
    description = 'Not Acceptable.',
    message = APIResponseMessages.NOT_ACCEPTABLE,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.NOT_ACCEPTABLE]: {
              summary: CommonSummary.NOT_ACCEPTABLE,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.NOT_ACCEPTABLE,
                  name: 'NotAcceptableError',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },

  UNPROCESSABLE: ({
    // WARNING!! This one is only used by our Schema validators, it must not be used directly
    description = 'Wrong data received.',
    message = APIResponseMessages.UNPROCESSABLE,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: {
            ...standardErrorResponseSchema,
            properties: {
              ...standardErrorResponseSchema.properties,
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
          examples: {
            [ExampleField.UNPROCESSABLE]: {
              summary: CommonSummary.UNPROCESSABLE,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.UNPROCESSABLE,
                  name: 'UnprocessableEntityError',
                  message,
                  code: 'VALIDATION_FAILED',
                  details: [
                    {
                      path: '/0',
                      code: 'required',
                      message: "should have required property 'quantity'",
                      info: {
                        missingProperty: 'quantity',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };
  },

  RECORD_CONFLICT: ({
    description = 'Record conflict, returns an object with an error object.',
    message = APIResponseMessages.RECORD_CONFLICT,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.RECORD_CONFLICT]: {
              summary: CommonSummary.RECORD_CONFLICT,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
                  name: 'ConflictError',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },

  INTERNAL_SERVER_ERROR: ({
    description = 'Internal Server Error.',
    message = APIResponseMessages.INTERNAL_SERVER_ERROR,
  }: GlobalResponseExamplesBuilderInterface = {}) => {
    return {
      description,
      content: {
        'application/json': {
          schema: standardErrorResponseSchema,
          examples: {
            [ExampleField.INTERNAL_SERVER_ERROR]: {
              summary: CommonSummary.INTERNAL_SERVER_ERROR,
              value: {
                error: {
                  statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
                  name: 'InternalServerError',
                  message,
                },
              },
            },
          },
        },
      },
    };
  },
};
