// These must match api\src\constants\service-response-codes.ts
export enum CommonSummary {
  SUCCESS = 'On Success', // ServiceResponseCodes.SUCCESS
  BAD_REQUEST = 'Bad request', // ServiceResponseCodes.BAD_REQUEST // WARNING!! This is used by the Schema validators too
  UNAUTHORIZED = 'Unauthorized to perform this action.', // ServiceResponseCodes.UNAUTHORIZED
  FORBIDDEN = 'Not allowed Access', // ServiceResponseCodes.FORBIDDEN // WARNING!! This must not be used, reserved for Schema validators
  RECORD_NOT_FOUND = 'Record not found', // ServiceResponseCodes.RECORD_NOT_FOUND
  NOT_ACCEPTABLE = 'Not Acceptable', // ServiceResponseCodes.NOT_ACCEPTABLE
  UNPROCESSABLE = 'Unprocessable Entity Error', // ServiceResponseCodes.UNPROCESSABLE // WARNING!! This must not be used, reserved for Schema validators
  RECORD_CONFLICT = 'Record conflict', // ServiceResponseCodes.RECORD_CONFLICT
  INTERNAL_SERVER_ERROR = 'Internal Server Error', // ServiceResponseCodes.INTERNAL_SERVER_ERROR
  // ServiceResponseCodes.NOT_IMPLEMENTED
  // ServiceResponseCodes.SERVICE_UNAVAILABLE
}
// These must match CommonSummary
export enum ExampleField {
  SUCCESS = 'success',
  BAD_REQUEST = 'badRequest', // WARNING!! This is used by the Schema validators too
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden', // WARNING!! This must not be used, reserved for Schema validators
  RECORD_NOT_FOUND = 'notFound',
  NOT_ACCEPTABLE = 'notAcceptable',
  UNPROCESSABLE = 'unprocessable', // WARNING!! This must not be used, reserved for Schema validators
  RECORD_CONFLICT = 'conflict',
  INTERNAL_SERVER_ERROR = 'internalServerError',
}

export enum SpecificationSummaries {
  // BoomCards Specifications
  POSTBoomCardsSpecification = 'Create Boom Card(s) instance(s).',
  GETBoomCardsCountSpecification = 'Boom Card(s) count by where condition.',
  GETBoomCardsByIdSpecification = 'Return Boom Card instance by mongodb ID',
  GETBoomCardsSpecification = 'Get Boom Card instances (filter optional).',
  GETBoomCardsMerchantByCardNumberSpecification = 'Get Boom Card instances by CardNumber (for Merchants).',
  POSTBoomCardsMerchantActivateByIdSpecification = 'Activate Boom Card(s) by ID (for Merchants).',
  PATCHBoomCardsByIdSpecification = 'Update a Boom Card instance',
  DELBoomCardsByIdSpecifications = 'Delete a Boom Card from database by ID',
  POSTBoomCardsLoginSpecification = 'Boom Card Login',
  // User Specifications
  GETAdminUsersSpecification = 'List all Users that match the FILTER field received.',
  GETAdminUserSpecification = 'Return BoomUser profile for received ID.',
  POSTUsersVerifyPhoneNumberSpecification = 'Verifies the information for a phone number (for sending funds)',
  GETTransferReceiverProfileSpecification = 'Get receiver user profile data.',
  POSTAdminUserSpecification = 'Create a new BoomUser instance',
  // Category Specifications
  POSTCategoriesSpecification = 'Create a new Category instance.',
  GETCategoryCountSpecification = 'Count Categories that match the WHERE field received',
  GETCategoriesSpecification = 'List all Categories that match the FILTER field received.',
  GETCategoriesIdSpecification = 'Return Category for the received ID.',
  PATCHCategoriesSpecification = 'Update Categories that match the WHERE field received.',
  PATCHCategoriesIdSpecification = 'Update Category for the received ID.',
  PUTCategoriesIdSpecifications = 'Update Category for the received ID.',
  DELCategoriesIdSpecifications = 'Delete Category for the received ID.',
  // Order Specifications
  GETOrdersCountSpecification = 'Count Orders',
  GETInventoryOrdersCountSpecification = 'Count Inventory Orders',
  GETOrdersSpecification = 'Get Orders',
  GETOrdersByIdSpecification = 'Get Order by id',
  PATCHOrdersByIdSpecification = 'Update Order by id',
  // Return Specifications
  POSTReturnPolicySpecification = 'Create a new ReturnPolicy instance',
  GETPolicySpecification = 'List all Return Policies that match the FILTER field received',
  DELPolicyByIDSpecification = 'Delete Return Policy for the received ID',
  POSTReturnRequestSpecifications = 'Create a new ReturnRequest instance',
  GETReturnRequestSpecification = 'List all Return Requests that match the FILTER field received',
  PATCHReturnRequestSpecification = 'Update ReturnRequest for the received ID',
  POSTDisputeSpecifications = 'Create a new ReturnDispute instance',
  GETDisputeSpecification = 'Get Return Dispute for the received ID',
  PATCHDisputeSpecification = 'Update ReturnDispute for the received ID',
  // Config Specifications
  POSTConfigSpecification = 'Create a new Config instance.',
  GETConfigSpecification = 'List all Configs that match the FILTER field received.',
  PATCHConfigSpecification = 'Update Config for the received ID.',
  DELConfigIdSpecifications = 'Delete Category for the received ID.',
  GETInventoryOrdersSpecification = 'GETInventoryOrdersSpecification',
  // Merchant Withdrawal
  GETMerchantWithdrawalCountSpecification = 'Count Merchant Withdrawal Transactions',
  GETMerchantWithdrawalSpecification = 'Merchant Withdrawal Transactions.',
  GETMerchantWithdrawalByIdSpecification = 'Get a Merchant Withdrawal Transaction by id',
  PATCHMerchantWithdrawalByIdSpecification = 'Update a single Merchant Withdrawal Transaction by ID.',
}
export enum SpecificationDescriptions {
  // BoomCards Specifications
  POSTBoomCardsSpecification = 'This endpoint should be used, to __POST__ one or more Boom cards instances in database.',
  GETBoomCardsCountSpecification = 'This endpoint should be used for __COUNT__ Boom cards instances in database.',
  GETBoomCardsByIdSpecification = 'This endpoint should be used, to __GET__ a __BoomCard instance__ by his mongodb ID.',
  GETBoomCardsSpecification = 'This endpoint should be used for __GET__ Boom cards instances in database.',
  GETBoomCardsMerchantByCardNumberSpecification = 'This endpoint should be used for __GET__ Boom cards instances in database.',
  POSTBoomCardsMerchantActivateByIdSpecification = 'Activates Boom Card  by its database ID. The card ID must have already been added to the user profile in order to authenticate.',
  PATCHBoomCardsByIdSpecification = 'This endpoint should be used, to __UPDATE__ a Boom Card instance__ matching the ID field in database.',
  DELBoomCardsByIdSpecifications = 'This endpoint should be used, to __DELETE__ a __Boom Card instance__ by ID from database.',
  POSTBoomCardsLoginSpecification = 'This endpoint should be used, to __LOGIN__ using __Boom Card instance__.',
  // User Specifications
  GETAdminUsersSpecification = 'This endpoint should be used, to __GET__ a __List of User instances__ matching the filter received in the database.',
  GETAdminUserSpecification = 'This endpoint should be used, to __GET__ a __BoomUser instance__ matching the ID field received in the database.',
  POSTUsersVerifyPhoneNumberSpecification = 'This endpoint should be used, to __POST__ values to search for a Valid phone number on our records.',
  GETTransferReceiverProfileSpecification = 'This endpoint should be used, to __GET__ "name" and "profileImg" from receiver user in database.',
  POSTAdminUserSpecification = 'This endpoint should be used, to __POST__ a __new BoomUser instance__ into the database.',
  // Category Specifications
  POSTCategoriesSpecification = 'This endpoint should be used, to __POST__ a __new Category instance__ into the database.',
  GETCategoryCountSpecification = 'This endpoint should be used, to __GET__ a __Count of Category instances__ matching the WHERE field received in the database.',
  GETCategoriesSpecification = 'This endpoint should be used, to __GET__ a __List of Category instances__ matching the FILTER field received in the database.',
  GETCategoriesIdSpecification = 'This endpoint should be used, to __GET__ a __Category instance__ matching the ID field received in the database.',
  PATCHCategoriesSpecification = 'This endpoint should be used, to __UPDATE__ a __List of Category instances__ matching the WHERE field received in the database.',
  PATCHCategoriesIdSpecification = 'This endpoint should be used, to __UPDATE__ a __Category instance__ matching the ID field received in the database.',
  PUTCategoriesIdSpecifications = 'This endpoint should be used, to __UPDATE__ a __Category instance__ matching the ID field received in the database.',
  DELCategoriesIdSpecifications = 'This endpoint should be used, to __DELETE__ a __Category instance__ matching the ID field received in the database.',
  // Order Specifications
  GETOrdersCountSpecification = 'This endpoint should be used, to __COUNT__ Orders instances in database. allow (where condition)',
  GETOrdersSpecification = 'This endpoint should be used, to __GET__ Orders instances in database.',
  GETOrdersByIdSpecification = 'This endpoint should be used, to __GET__ an Order instances in database by _id.',
  PATCHOrdersByIdSpecification = 'This endpoint should be used, to __Update__ an Order instances in database by _id.',
  // Return Specifications
  POSTReturnPolicySpecification = 'This endpoint should be used to __POST__a__new ReturnPolicy instance__ into the database.',
  GETPolicySpecification = 'This endpoint should be used to __GET__a__List of ReturnPolicy instances__ matching the FILTER field received in the database.',
  DELPolicyByIDSpecification = 'This endpoint should be used to __DELETE__a__ReturnPolicy instance__ matching the ID field received in the database.',
  POSTReturnRequestSpecifications = 'This endpoint should be used to __POST__a__new ReturnRequest instance__ into the database.',
  GETReturnRequestSpecification = 'This endpoint should be used to __GET__a__List of ReturnRequest instances__ matching the FILTER field received in the database.',
  PATCHReturnRequestSpecification = 'This endpoint should be used to __UPDATE__a__ReturnRequest instance__ matching the ID field received in the database.',
  POSTDisputeSpecifications = 'This endpoint should be used to __POST__a__new ReturnDispute instance__ into the database.',
  GETDisputeSpecification = 'This endpoint should be used to __GET__a__ReturnDispute instance__ matching the ID field received.',
  PATCHDisputeSpecification = 'This endpoint should be used to __UPDATE__a__ReturnDispute instance__ matching the ID field received in the database.',
  // Config Specifications
  POSTConfigSpecification = 'This endpoint should be used, to __POST__ a __new Config instance__ into the database.',
  GETConfigSpecification = 'This endpoint should be used, to __GET__ a __List of Config instances__ matching the FILTER field received in the database.',
  PATCHConfigSpecification = 'This endpoint should be used, to __UPDATE__ a __Config instance__ matching the ID field received in the database.',
  DELConfigIdSpecifications = 'This endpoint should be used, to __DELETE__ a __Config instance__ matching the ID field received in the database.',
  GETInventoryOrdersSpecification = 'GETInventoryOrdersSpecification',
  // Merchant Withdrawal
  GETMerchantWithdrawalCountSpecification = 'This endpoint should be used, to __COUNT__ Merchant Withdrawal Transactions in database. allow (where condition)',
  GETMerchantWithdrawalSpecification = 'This endpoint should be used, to __GET__ Merchant Withdrawal Transactions instances in database.',
  GETMerchantWithdrawalByIdSpecification = 'This endpoint should be used, to __GET__ a Merchant Withdrawal Transaction by ID.',
  PATCHMerchantWithdrawalByIdSpecification = 'This endpoint should be used, to __PATCH__ a single Merchant Withdrawal Transaction by ID.',
}
export enum RequestBodyDescriptions {
  // Boom Cards
  POSTBoomCardsMerchantActivateByIdRequestBody = 'Object containing the fields to __UPDATE a Boom card instance__ to active must pass this fields (pinNumber, uid, boomAccountID, storeId)',
  PATCHBoomCardsByIdRequestBody = 'Object containing the fields to __UPDATE a Boom card instance__ you can update only any of this fields (pinNumber, uid, boomAccountID, storeId, status, customerID, storeMerchantID)',
  POSTBoomCardsLoginRequestBody = 'Object containing the fields (cardNumber, pinNumber)',
  // User Specifications
  POSTUsersVerifyPhoneNumberRequestBody = 'Object containing the fields to search for(firstName, lastName, and phone)',
  POSTAdminUserRequestBody = 'Object containing the fields to __create a new BoomUser instance__ (email, password, and phone)',
  // Category Specifications
  POSTCategoriesRequestBody = 'Object containing the fields to __CREATE a new Category instance__ (name, commissionRate, and subCategories)',
  PATCHCategoriesRequestBody = 'Object containing the fields to __UPDATE Config instances__ matching the WHERE field received in the database.',
  PATCHCategoriesIdRequestBody = 'Object containing the fields to __UPDATE a Category instance__ matching the ID (name, commissionRate, and subCategories)',
  PUTCategoriesIdRequestBody = 'Object containing the fields to __UPDATE a Category instance__ matching the ID (name, commissionRate, and subCategories)',
  // Order Specifications
  PATCHORdersByIdRequestBody = 'Object containing the fields for the existing Bookings',
  // Return Specifications
  POSTReturnPolicyRequestBody = 'Object containing the fields to __CREATE a new ReturnPolicy instance__',
  POSTReturnRequestBody = 'Object containing the fields to __CREATE a new ReturnRequest instance__',
  PATCHReturnRequestBody = 'Object containing the fields to __UPDATE a ReturnRequest instance__ matching the ID',
  POSTDisputeRequestBody = 'Object containing the fields to __CREATE a new ReturnDispute instance__',
  PATCHDisputeRequestBody = 'Object containing the fields to __UPDATE a ReturnDispute instance__ matching the  ID',
  // Config Specifications
  POSTConfigRequestBody = 'Object containing the fields to __CREATE a new Config instance__ (name, commissionRate, and subCategories)',
}

export enum ResponseSuccessDescription {
  // BoomCards Specifications
  POSTBoomCardsSpecification = 'Boom Card model instance',
  GETBoomCardsCountSpecification = 'Boom Card COUNT',
  GETBoomCardsByIdSpecification = 'Boom Card instance',
  GETBoomCardsMerchantByCardNumberSpecification = 'Boom Card by CardNumber',
  POSTBoomCardsMerchantActivateByIdSpecification = 'Boom Card instance update success',
  POSTBoomCardsLoginSpecification = 'Boom Card owner token',
  // Order Specifications
  GETOrdersSpecification = 'APIResponse Data with an Array of Order model instances',
  GETOrdersByIdSpecification = 'APIResponse Data with an Order model instance',
  PATCHOrdersByIdSpecification = 'Order PATCH success',
  GETInventoryOrdersSpecification = 'GETInventoryOrdersSpecification',
  // Merchant Withdrawal Specifications
  GETMerchantWithdrawalSpecification = 'APIResponse data with merchant withdrawal transactions.',
  GETMerchantWithdrawalByIdSpecification = 'APIResponse data with a single merchant withdrawal transaction requested by id',
  PATCHMerchantWithdrawalByIdSpecification = 'Merchant Withdrawal Transaction PATCH succeed.',
}
