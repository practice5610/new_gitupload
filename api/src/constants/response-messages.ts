export enum FundTransferResponseMessages {
  INACTIVE_CARD = 'At least one user did not have an active Boom Card.',
  INSUFFICIENT_FUNDS = 'Not enough funds to transfer.',
  BOOM_CARD_ERROR = 'There was an error while looking up Boom Cards.',
  TRANSACTION_MISSING_INFO = 'This transaction is missing information and can not be completed',
  SENDER_NOT_FOUND = 'The senders account could not be found',
  RECEIVER_NOT_FOUND = 'The receivers account could not be found',
  RECEIVER_IS_MERCHANT = 'The receivers account cannot be a of merchant type',
  BAD_PHONE_FORMAT = 'The phone number provided is not valid',
  SENDER_BOOM_ACCOUNT_NOT_FOUND = 'The senders boom account could not be found',
  RECEIVER_BOOM_ACCOUNT_NOT_FOUND = 'The receivers boom account could not be found',
  TRANSACTION_CREATION_ERROR = 'There was a problem saving the transaction',
}

export enum CheckOutResponseMessages {
  SUCCESS = 'Check out complete.',
  DELETED_OFFER = 'This offer no longer exists.',
  DELETED_PRODUCT = 'This product no longer exists.',
  MISSING_CASHBACK = 'The offer booked did not have a cashback value. This is not supported.',
  NO_FUNDS = 'Could not find a BoomCard with enough funds for this booking. Please add more funds to a card and try again.',
  BOOKING_INACTIVE = 'This booking was already used, or it was cancelled.',
  MISSING_BOOKING = 'This booking no longer exists.',
  BAD_REQUEST_NO_BOOKINGS = 'You did not provide bookings to check out.',
  BAD_REQUEST_MISSING_OFFER = 'An offer booking was provided without an offer.',
  BAD_REQUEST_MISSING_PRODUCT = 'A product booking was provided without a product.',
  INVALID_CATEGORY = 'The category for this product was invalid',
  TAX_ERROR = 'Tax calculation failure.',
}

export enum PurchaseResponseMessages {
  COMPLETED = 'Purchase complete successful',
  FAILURE = 'Purchase Failure',
  ERROR_PRODUCT_CATEGORY = 'Error getting product category.',
  ERROR_GETTING_BOOMACCOUNT = 'Error getting merchant boomAccount',
}

export enum ProfileResponseMessages {
  MERCHANT_NOT_FOUND = 'The merchant account requested was not found.',
  CUSTOMER_NOT_FOUND = 'Customer not found. Is the customer registered?',
  MEMBER_NOT_FOUND = 'The customer account requested was not found.',
  USER_NOT_FOUND = 'User account was not found',
  MERCHANT_EMPTY_TAX_NEXUS = 'Merchant with ID of do not have taxable nexus states',
  MISSING_PROFILE_PARAMETERS = 'Missing Parameters for Profile with id:',
  CORRUPT_PROFILE_DATA = 'Missing or Extra Parameters for Profile with id:',
  METHOD_NOT_SUPPORTED = 'Method not supported',
  NO_PROFILE_FOUND = 'No Profile Found',
  NO_PROFILES_FOUND = 'No Profiles Found',
  PHONE_NUMBER_WITHOUT_ACCOUNT = 'This phone number does not have a boom account.',
  ACCOUNT_NAME_CANNOT_BE_CONFIRMED = 'The name on this account can not be confirmed.',
  NAME_DOESNT_MATCH = 'Name does not match account.',
}

export enum FilterResponseMessages {
  MISSING = 'Invalid, filter needed.',
  INVALID = 'Invalid filter.',
  MORE_THAN_ONE_CONDITION = 'More than one condition.',
  INVALID_DATE_RANGE = "Start date can't be bigger than end Date.",
  INVALID_FILTERS = 'Invalid condition for filter.',
}
export enum GlobalResponseMessages {
  NO_CATEGORY = 'The requested category was not found.',
  NO_BOOMCARDS = 'No Boom cards where found for this user.',
  NOT_AUTHORIZED = 'Not authorized to perform this action.', // TODO: Should we use APIResponseMessages.UNAUTHORIZED ??
  NO_CURRENT_USER_PUBLIC_PATH = 'Ignoring undefined user found on public route.',
  CANNOT_CREATE_ALREADY_EXISTS = 'Could not create item. It already exists.',
  NO_EMAIL = 'This user has no email address.',
  NO_BOOM_ACCOUNT = 'No Boom account where found for this user.',
  UNPROCESSABLE_PURCHASE = 'Unprocessable purchase.',
  UNEXPECTED = 'Unexpected error.',
  DB_ERROR = 'Db error',
  INVALID_ROLE = 'Invalid role.',
  INVALID_ID = 'Invalid id.',
}

// These must match api\src\constants\service-response-codes.ts
export enum APIResponseMessages {
  SUCCESS = 'Success',
  // ServiceResponseCodes.NO_CONTENT
  BAD_REQUEST = 'Request body is required',
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Not Allowed Access',
  RECORD_NOT_FOUND = 'Record not found',
  NOT_ACCEPTABLE = 'Not Acceptable',
  UNPROCESSABLE = 'Wrong Data', // This message can be improved, it is fired by our validators
  RECORD_CONFLICT = 'Record conflict',
  INTERNAL_SERVER_ERROR = 'Internal Server Error',
  NOT_IMPLEMENTED = 'Not Implemented',
  // ServiceResponseCodes.SERVICE_UNAVAILABLE
  //Others
  SUCCESS_MERCHANT_TRANSACTION_PATCH = 'Merchant Transaction Successfully Updated',
  INVALID_JSON = 'Invalid JSON request.',
  VERIFIED = 'Information is verified',
}

export enum TransactionResponseMessages {
  ERROR = 'Error creating transactions',
}

export enum ConfigResponseMessages {
  ERROR_COUNT_INVENTORY = 'Minimum count of Inventory item type (required) is 1',
}

export enum StoreResponseMessages {
  CURRENT_MERCHANT_HAS_STORE = 'This merchant already has a store.',
  INVALID_DATA = 'Invalid store data.',
  NOT_FOUND = 'Store not found',
}

export enum OrderResponseMessages {
  SUCCESS = 'Order complete.',
  INVALID_ORDER = 'Invalid order',
  NOT_FOUND = 'Order not found.',
}

export enum BoomCardResponseMessages {
  NOT_FOUND = 'Boom card(s) not found.',
  NOT_ISSUED = 'This Boom card is not issued to this user',
  UNAUTHORIZED_BOOMCARD_UPDATE = 'Not authorized to update some Boom Card values',
  BLOCKED = 'This Boom card is blocked, and cannot be used',
  PIN_REQUIRED = 'PIN number is required to block this Boom card.',
  PIN_INCORRECT = 'Incorrect PIN number, not authorized to block this Boom card.',
  UNACTIVE_TO_BLOCK = 'Boom card status should be Active to be blocked.',
  UID_REQUIRED = 'A uid is required.',
  BOOM_ACCOUNT_REQUIRED = 'A Boom Account ID is required.',
  BOOM_CARD_ALREADY_ACTIVE = 'This Boom Card is already active for a customer.',
}

export enum BankAccountResponseMessages {
  BANK_ACCOUNT_INFO_NOT_FOUND = 'No bank info was found for this user',
  NO_ACCOUNT_NUMBERS_FROM_PLAID = 'Could not find account numbers for this Plaid data',
  NO_IDENTITY_DATA_FROM_PLAID = 'Could not find identity info for this Plaid data',
  BALANCE_CHECK_FAILED = 'Could not get account balance from Plaid',
  BANK_DELETE_FAILED = 'Error deleting bank account. Try again later.',
  BANK_DELETE_BLOCKED = 'You can not delete an account with pending charges. Try again later.',
}

export enum InventoryLeaseResponseMessages {
  REPLACEMENT_INVENTORY_NOT_FOUND = 'There is no replacement currently available for this inventory item',
  REPLACEMENT_INVENTORY_FOUND = 'Inventory item replacement has been assigned',
}

export enum InventoryItemResponseMessages {
  ITEM_STATUS_INVALID = "Error this inventory item it's not ready to active",
  MERCHANT_UNAUTHORIZED = 'Error Merchant unauthorized to update this item',
}

export enum BookingResponseMessages {
  SUCCESS = 'Booking complete.',
  INVALID_BOOKING = 'This booking is not valid',
  UNEXPECTED = 'Something goes wrong looking for bookings.',
  EMPTY_ARRAY = 'Empty array.',
  NOT_FOUND = 'Booking not found',
  INVALID_ITEM = 'Invalid item, must be an Offer or a Product.',
  INVALID_TYPE = 'Invalid booking type',
  INVALID_OFFER_TYPE = 'Invalid booking type, item is an Offer.',
  INVALID_PRODUCT_TYPE = 'Invalid booking type, item is an Product.',
  VISITS_EXCEEDED = "Can't book this offer, the max visits have been reached.",
  OFFER_EXCEEDED = 'Offer quantity exceeded.',
  OFFER_EXPIRED = 'This offer has expired.',
  MISSING_ID = 'Booking must have an id',
  ITEM_NOT_FOUND = 'Booking item no longer exist',
  PRODUCT_EXCEEDED = 'Not enough quantity available of this product',
  VALIDATION_SUCCESS = 'Booking validation complete',
  QUANTITY_ERROR = 'Booking quantity error.',
}

export enum BoomAccountResponseMessages {
  CANCELLED = 'This Boom Account is cancelled, and cannot be used',
  NOT_FOUND = 'Boom Account NOT found.',
  UPDATE_SUCCESS = 'Boom account update successfully.',
  UPDATE_ERROR = 'Error updating boom account.',
  CREATE_SUCCESS = 'Boom account created successfully.',
  CREATE_ERROR = 'Database error, something wrong creating new boom account.',
  ALREADY_HAVE_ACCOUNT = `The user, already have a boom account.`,
  MORE_THAN_ONE_ACCOUNT = `Error user can't have more than one account at this moment.`,
  NOT_FUNDS = `Not enough funds.`,
  NOT_VALID = 'Customer boom account not valid.',
  UNAUTHORIZED = 'Unauthorized to request others boom accounts.',
}

export enum ProductResponseMessages {
  NOT_FOUND = 'Could not find any product.',
  INVALID = 'Invalid product.',
  MISSING_ID = 'Missing product _id',
  MISSING_CATEGORY = 'Product must have category',
  NOT_LONGER_EXIST = 'Product no longer exist.',
  VALID = 'Valid product.',
}
export enum OfferResponseMessages {
  VALID = 'Valid offer.',
  INVALID = 'Invalid offer.',
  NO_LONGER_EXIST = 'Offer no longer exist.',
  EXPIRED = 'Offer expired.',
}

export enum ShippingErrorMessages {
  REFUND_ALREADY_EXISTS = 'ShippoAPIError: Refund with this Transaction already exists',
}

export enum ReturnResponseMessages {
  POLICY_FOUND = 'Return Policy found',
  POLICY_NOT_FOUND = 'Return Policy not found',
  POLICY_CREATED = 'Return Policy successfully created',
  POLICY_DELETED = 'Return Policy succesfully deleted',
  REQUEST_CREATED = 'Return Request successfully created',
  REQUEST_FOUND = 'Return Request found',
  REQUEST_NOT_FOUND = 'Return Request not found',
  REQUEST_UPDATED = 'Return Request successfully updated',
  REQUEST_NOT_UPDATED = 'Return Request has already been completed. No further updates available.',
  DISPUTE_CREATED = 'Return Dispute successfully created',
  DISPUTE_FOUND = 'Return Dispute found',
  DISPUTE_NOT_FOUND = 'Return Dispute not found',
  DISPUTE_UPDATED = 'Return Dispute successfully updated',
  DISPUTE_NOT_UPDATED = 'Return Dispute has already been closed. No further updates available.',
}
