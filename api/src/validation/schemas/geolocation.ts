import { SchemaObject } from '@loopback/openapi-v3';

export const GeolocationSchema = {
  type: 'object',
  description: 'Geolocation',
  properties: {
    lat: { type: 'number' }, // TODO: Update globals Geolocation must not allow null values
    lng: { type: 'number' }, // TODO: Update globals Geolocation must not allow null values
  },
  required: ['lat', 'lng'],
  additionalProperties: false,
} as const;
export const GeolocationSchemaObject: SchemaObject = {
  ...GeolocationSchema,
  properties: {
    ...GeolocationSchema.properties,
  },
  required: [...GeolocationSchema.required],
};
