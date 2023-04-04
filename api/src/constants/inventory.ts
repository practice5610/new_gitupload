export enum InventoryItemStatus {
  INACTIVE = 'Inactive',
  INACTIVE_ISSUED = 'Inactive Issued',
  ACTIVE = 'Active',
}
export enum InventoryItemInactiveReason {
  STOLEN = 'stolen',
  EXPIRED = 'expired',
  MISSING = 'missing',
  DEFECTIVE = 'defective',
}

export enum InventoryOrderStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}
export enum InventoryOrderBillingType {
  RECURRING = 'recurring',
  ONE_TIME = 'one-time',
}
export enum InventoryOrderType {
  PURCHASE = 'purchase',
  RETURN_OTHER = 'return-other',
  RETURN_DEFECTIVE = 'return-defective',
  CANCEL = 'cancel',
}

export enum FulfillmentStatus {
  FULFILLED = 'fulfilled',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}
