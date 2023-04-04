// Check https://en.wikipedia.org/wiki/List_of_HTTP_status_codes for more codes
export enum ServiceResponseCodes {
  SUCCESS = 200, // Used for POST and GET
  NO_CONTENT = 204, // Used for DELETE, PUT and PATCH
  BAD_REQUEST = 400, // WARNING!! This is used by the Schema validators too
  UNAUTHORIZED = 401,
  FORBIDDEN = 403, // WARNING!! This must not be used, reserved for Schema validators
  RECORD_NOT_FOUND = 404,
  NOT_ACCEPTABLE = 406,
  RECORD_CONFLICT = 409,
  UNPROCESSABLE = 422, // WARNING!! This must not be used, reserved for Schema validators
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * This enum represent a list of known error codes throwed by loopback repositories methods
 * intent to be accurate with error response codes
 */
export enum LoopbackErrorCodes {
  RECORD_NOT_FOUND = 'ENTITY_NOT_FOUND',
}
