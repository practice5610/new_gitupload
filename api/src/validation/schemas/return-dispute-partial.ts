import { SchemaObject } from '@loopback/openapi-v3';

import { DisputeSchema, DisputeSchemaObject } from '.';

const { _id, createdAt, updatedAt, ...POSTDisputeSchemaPartialProperties } =
  DisputeSchema.properties;

export const POSTDisputeSchemaObjectPartial: SchemaObject = {
  ...DisputeSchemaObject,
  properties: {
    ...POSTDisputeSchemaPartialProperties,
    returnRequest: {
      ...POSTDisputeSchemaPartialProperties.returnRequest,
      required: [...POSTDisputeSchemaPartialProperties.returnRequest.required],
    },
  },
  required: ['returnRequest', 'isOpen', 'comment'],
};

const { returnRequest, ...PATCHDisputeSchemaPartialProperties } = DisputeSchema.properties;

export const PATCHDisputeSchemaObjectPartial: SchemaObject = {
  ...DisputeSchemaObject,
  properties: {
    ...PATCHDisputeSchemaPartialProperties,
  },
  required: ['isOpen', 'comment'],
};
