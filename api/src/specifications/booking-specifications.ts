import { getModelSchemaRef } from '@loopback/openapi-v3';

import { CommonSummary, ExampleField, ServiceResponseCodes } from '../constants';
import { Booking } from '../models';
import {
  GETBookingByIDResponseExamples,
  GETBookingsCountResponseExamples,
  GETBookingsResponseExamples,
  GlobalResponseExamplesBuilder,
  PATCHBookingsResponseExamples,
  POSTBookingsResponseExamples,
} from './examples/responses';

export const POSTBookingsSpecification = {
  summary: 'Bookings creation.',
  description:
    'This endpoint should be use, to __create__ one or more Bookings instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Booking model instance',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: POSTBookingsResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.UNPROCESSABLE]: GlobalResponseExamplesBuilder.UNPROCESSABLE({
      description: 'List of missing or additional properties in a Booking instance.',
    }),
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const GETBookingsCountSpecification = {
  summary: 'Bookings count.',
  description: 'This endpoint should be use, to __Count__ Bookings instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Count of Booking instance',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object }, // TODO: Check if a Count is sent here
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETBookingsCountResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const GETBookingsSpecification = {
  summary: 'List all bookings, if member all bookings only related to this current member.',
  description: 'This endpoint should be use, to __GET__ a List of Bookings instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Array of Booking model instances',
      content: {
        'application/json': {
          schema: { type: 'array', items: { 'x-ts-type': Booking } },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETBookingsResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PATCHBookingsFilteredSpecification = {
  summary: 'Update bookings instance by Filter conditions.',
  description: 'This endpoint should be use, to __Update Bookings__ instances in database.',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Bookings PATCH instance',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Object },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: PATCHBookingsResponseExamples.SUCCESS,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PATCHBookingsRequestBody = {
  description: 'Object containing the fields for the existing Bookings',
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(Booking, {
        partial: true,
        exclude: ['_id', 'createdAt', 'updatedAt'],
      }), // TODO: Missing examples
    },
  },
};

export const GETBookingByIDSpecification = {
  summary: 'Get a Booking instance by ID.',
  description:
    'This endpoint should be used to __request__ any __Booking__ instance by his MongoDB unique identifier string. - try out with __5fe9f9be5d4f0b1945cc47a3__',
  responses: {
    [ServiceResponseCodes.SUCCESS]: {
      description: 'Booking model instance',
      content: {
        'application/json': {
          schema: { 'x-ts-type': Booking },
          examples: {
            [ExampleField.SUCCESS]: {
              summary: CommonSummary.SUCCESS,
              value: GETBookingByIDResponseExamples.SUCCESS,
            },
          },
        },
      },
    },

    //[ServiceResponseCodes.RECORD_NOT_FOUND]: GlobalResponseExamplesBuilder.RECORD_NOT_FOUND(), // TODO: Once Bookings controller is updated check if we can use this global
    [ServiceResponseCodes.BAD_REQUEST]: {
      //TODO: it seems that this needs to be RECORD_NOT_FOUND
      description: 'ENTITY_NOT_FOUND',
      content: {
        'application/json': {
          examples: {
            [ExampleField.RECORD_NOT_FOUND]: {
              summary: CommonSummary.RECORD_NOT_FOUND,
              value: GETBookingByIDResponseExamples.NOT_FOUND,
            },
          },
        },
      },
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PATCHBookingByIDSpecification = {
  summary: 'Update a single Booking instance by ID.',
  description:
    'This endpoint should be use, to __update__ a __single product__ instances in database.',
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Booking PATCH success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};

export const PATCHBookingByIDRequestBody = {
  description: 'Object containing the fields for the Booking with the id received',
  required: true,
  content: {
    'application/json': {
      schema: getModelSchemaRef(Booking, {
        partial: true,
        exclude: ['_id', 'createdAt', 'updatedAt'],
      }), // TODO: Missing examples
    },
  },
};

export const DELBookingByIDSpecification = {
  summary: 'Delete a single Booking instance by ID.',
  description:
    'This endpoint should be use, to __Delete__ a __single product__ instances in database.',
  responses: {
    [ServiceResponseCodes.NO_CONTENT]: {
      description: 'Booking DEL success',
    },
    [ServiceResponseCodes.FORBIDDEN]: GlobalResponseExamplesBuilder.FORBIDDEN(),
  },
};
