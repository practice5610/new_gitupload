export enum MerchantTransactionStatus { // Seems to be the same as TransactionType on globals but isolated just in case it changes in the future
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}
export enum MerchantTransactionType {
  RECURRING = 'recurring',
  ONE_TIME = 'one-time',
  RETURN = 'return',
}
