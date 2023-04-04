import { SchemaObject } from '@loopback/openapi-v3';

export const ProfileImageSchema = {
  type: 'object',
  description: "Profile's image",
  properties: {
    imgUrl: { type: 'string', minLength: 2 },
    imgFile: { type: 'object', nullable: true }, // TODO: Create schema for File
    base64Data: { type: 'string', nullable: true },
    previewImgUrl: { type: 'string', nullable: true },
    previewBase64Data: { type: 'string', nullable: true },
  },
  required: [],
  additionalProperties: false,
} as const;

export const ProfileImageSchemaObject: SchemaObject = {
  ...ProfileImageSchema,
  properties: {
    ...ProfileImageSchema.properties,
  },
  required: [...ProfileImageSchema.required],
};
