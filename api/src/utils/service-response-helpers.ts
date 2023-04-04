import { HttpErrors } from '@loopback/rest';

import { APIResponseMessages, ServiceResponseCodes } from '../constants';
import { APIResponse, ServiceResponse } from '../types';

/**
 * Helper function to build an APIResponse success:false with a custom message and no data involved.
 * @param {string} message custom message.
 * @return APIResponse success: false, message: message.
 */
export const APIResponseFalseOutput = (message?: string): APIResponse => {
  return {
    success: false,
    message: message ? message : APIResponseMessages.INTERNAL_SERVER_ERROR,
  };
};

/**
 * Helper function that formats the response based on the status code received from a Service
 * This must be used only inside Controllers (Services must return a ServiceResponse object - api\src\types\service.ts)
 * @param {string} message custom message.
 * @return APIResponse success: false, message: message.
 */
export const handleServiceResponseResult = <T>(result: ServiceResponse<T>): T | undefined => {
  // console.log('cehckkkresult', result);
  switch (result.statusCode) {
    case ServiceResponseCodes.SUCCESS:
      return result.data;
    case ServiceResponseCodes.NO_CONTENT:
      return;
    case ServiceResponseCodes.BAD_REQUEST:
      console.log('WARNING!! This CODE is used by the Schema validators too');
      throw new HttpErrors.BadRequest(result.message ?? APIResponseMessages.BAD_REQUEST);
    case ServiceResponseCodes.UNAUTHORIZED:
      throw new HttpErrors.Unauthorized(result.message ?? APIResponseMessages.UNAUTHORIZED);
    case ServiceResponseCodes.FORBIDDEN:
      console.log(
        'WARNING!! This CODE must not be used, reserved for Schema validators (Alternative UNAUTHORIZED)'
      );
      throw new HttpErrors.Forbidden(result.message ?? APIResponseMessages.FORBIDDEN);
    case ServiceResponseCodes.RECORD_NOT_FOUND:
      console.log('WARNING!! This CODE is used by the Schema validators too');
      throw new HttpErrors.NotFound(result.message ?? APIResponseMessages.RECORD_NOT_FOUND);
    case ServiceResponseCodes.UNPROCESSABLE:
      console.log(
        'WARNING!! This CODE must not be used, reserved for Schema validators (Alternative BAD_REQUEST)'
      );
      throw new HttpErrors.UnprocessableEntity(result.message ?? APIResponseMessages.UNPROCESSABLE);
    case ServiceResponseCodes.RECORD_CONFLICT:
      throw new HttpErrors.Conflict(result.message ?? APIResponseMessages.RECORD_CONFLICT);
    case ServiceResponseCodes.NOT_IMPLEMENTED:
      throw new HttpErrors.Conflict(result.message ?? APIResponseMessages.NOT_IMPLEMENTED);
    case ServiceResponseCodes.INTERNAL_SERVER_ERROR:
      throw new HttpErrors.InternalServerError(
        result.message ?? APIResponseMessages.INTERNAL_SERVER_ERROR
      );
    default:
      throw new HttpErrors.InternalServerError(
        result.message ?? APIResponseMessages.INTERNAL_SERVER_ERROR
      );
  }
};
