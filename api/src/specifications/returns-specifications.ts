import {
  CommonSummary,
  ExampleField,
  RequestBodyDescriptions,
  SpecificationDescriptions,
  SpecificationSummaries,
} from '../constants';
import { ServiceResponseCodes } from '../constants/service-response-codes';
import {
  DisputeSchemaObject,
  PATCHDisputeSchemaObjectPartial,
  PATCHReturnRequestSchemaObjectPartial,
  PolicySchemaObject,
  POSTDisputeSchemaObjectPartial,
  POSTPolicySchemaObjectPartial,
  POSTReturnRequestSchemaObjectPartial,
  ReturnRequestSchemaObject,
} from '../validation/schemas';
import { GlobalResponseExamplesBuilder } from './examples/responses';
import {
  PATCHDisputeResponseExample,
  PATCHReturnRequestResponseExample,
  POSTDisputeResponseExamples,
  POSTReturnPolicyResponseExamples,
  POSTReturnRequestResponseExamples,
} from './examples/responses/returns-examples';

export const POSTReturnPolicyRequestBody = {
  description: RequestBodyDescriptions.POSTReturnPolicyRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: POSTPolicySchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTReturnPolicyResponseExamples.SUCCESS,
        },
      },
    },
  },
};

export const POSTReturnPolicySpecifications = {
  summary: SpecificationSummaries.POSTReturnPolicySpecification,
  description: SpecificationDescriptions.POSTReturnPolicySpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Successful ReturnPolicy Creation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: PolicySchemaObject,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTReturnPolicyResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const GETPolicySpecification = {
  summary: SpecificationSummaries.GETPolicySpecification,
  description: SpecificationDescriptions.GETPolicySpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'ReturnPolicy Instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: PolicySchemaObject },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const DELPolicyByIDSpecification = {
  summary: SpecificationSummaries.DELPolicyByIDSpecification,
  description: SpecificationDescriptions.DELPolicyByIDSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'ReturnPolicy instance DELETE success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    // [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    // [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const POSTReturnRequestBody = {
  description: RequestBodyDescriptions.POSTReturnRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: POSTReturnRequestSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTReturnRequestResponseExamples.SUCCESS,
        },
      },
    },
  },
};

export const POSTReturnRequestSpecifications = {
  summary: SpecificationSummaries.POSTReturnRequestSpecifications,
  description: SpecificationDescriptions.POSTReturnRequestSpecifications,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Successful ReturnRequest Creation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: ReturnRequestSchemaObject,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTReturnRequestResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const GETReturnRequestSpecification = {
  summary: SpecificationSummaries.GETReturnRequestSpecification,
  description: SpecificationDescriptions.GETReturnRequestSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'ReturnRequest Instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: ReturnRequestSchemaObject },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const PATCHReturnRequestBody = {
  description: RequestBodyDescriptions.PATCHReturnRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: PATCHReturnRequestSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: PATCHReturnRequestResponseExample.SUCCESS,
        },
      },
    },
  },
};

export const PATCHReturnRequestSpecification = {
  summary: SpecificationSummaries.PATCHReturnRequestSpecification,
  description: SpecificationDescriptions.PATCHReturnRequestSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'ReturnRequest instance PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const POSTDisputeRequestBody = {
  description: RequestBodyDescriptions.POSTDisputeRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: POSTDisputeSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: POSTDisputeResponseExamples.SUCCESS,
        },
      },
    },
  },
};

export const POSTDisputeSpecifications = {
  summary: SpecificationSummaries.POSTDisputeSpecifications,
  description: SpecificationDescriptions.POSTDisputeSpecifications,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Successful ReturnDispute Creation',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: DisputeSchemaObject,
            },
          },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTDisputeResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const GETDisputeSpecification = {
  summary: SpecificationSummaries.GETDisputeSpecification,
  description: SpecificationDescriptions.GETDisputeSpecification,
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'ReturnDispute Instances',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'array', items: DisputeSchemaObject },
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};

export const PATCHDisputeRequestBody = {
  description: RequestBodyDescriptions.PATCHDisputeRequestBody,
  required: true,
  content: {
    'application/json': {
      schema: PATCHDisputeSchemaObjectPartial,
      examples: {
        [ExampleField.SUCCESS]: {
          summary: CommonSummary.SUCCESS,
          value: PATCHDisputeResponseExample.SUCCESS,
        },
      },
    },
  },
};

export const PATCHDisputeSpecification = {
  summary: SpecificationSummaries.PATCHDisputeSpecification,
  description: SpecificationDescriptions.PATCHDisputeSpecification,
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'ReturnDispute instance PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
    [ServiceResponseCodes.INTERNAL_SERVER_ERROR]:
      GlobalResponseExamplesBuilder.INTERNAL_SERVER_ERROR(),
    [ServiceResponseCodes.BAD_REQUEST]: GlobalResponseExamplesBuilder.BAD_REQUEST(),
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE(),
  },
};
