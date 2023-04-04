import { ServiceResponseCodes } from '../constants/service-response-codes';

export interface ServiceResponse<T> {
  success: boolean;
  statusCode: ServiceResponseCodes;
  message?: string;
  privateMessage?: string;
  data?: T;
}
