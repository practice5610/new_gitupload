export enum LoggingCategory {
  /**
   * Log activity related to our purchases services
   */
  PURCHASES_SERVICE = 'purchases-service',
  /**
   * Log activity related to our profile services
   */
  PROFILE_SERVICE = 'profile-service',
  /**
   * Log activity related to our payment processing services (Magensa Gateway for tablet chip card processing)
   */
  PAYMENT_PROCESSING = 'payment-processing',
  /**
   * Log activity related to our bank info services (Plaid for manual check generation)
   */
  BANK_INFO_SERVICE = 'bank-info-service',
  /**
   * Log activity related to billing of a customer. These are payments that flow into Boom from customers
   */
  CUSTOMER_BILLING = 'customer-billing',
  /**
   * Log activity related to billing of a merchant. These are payments that flow into Boom from merchants
   */
  MERCHANT_BILLING = 'merchant-billing',
  /**
   * Log activity related to payouts to merchants. These are payments that flow out of Boom to merchants
   */
  MERCHANT_PAYOUTS = 'merchant-payouts',
  /**
   * Log default activity
   */
  DEFAULT = 'default',
  /**
   * Log alerts activity
   */
  ALERTS = 'alerts',
  /**
   * Log activity related to inventory orders.
   */
  INVENTORY_ORDERS = 'inventory-orders',
  /**
   * Log activity related to account.
   */
  ACCOUNT = 'account',
  /**
   * Log activity related to taxes.
   */
  TAXES = 'taxes',
  /**
   * Log activity related to cron jobs
   */
  CRON_JOB = 'cron-job',
  /**
   * Log activity related to bookings
   */
  BOOKINGS = 'bookings',
  /**
   * Log activity related to profiles
   */
  PROFILES = 'profiles',
  /**
   * Log activity related to users
   */
  USERS = 'users',
  /**
   * Log activity related to shipping
   */
  SHIPPING = 'shipping',
  /**
   * Log activity related to transaction-service
   */
  TRANSACTION_SERVICE = 'transaction-service',
  /**
   * Log activity related to store-controller
   */
  STORE_CONTROLLER = 'store-controller',
  /**
   * Log activity related to store-service
   */
  STORE_SERVICE = 'store-service',
  /**
   * Log activity related to product-controller
   */
  PRODUCTS_CONTROLLER = 'product-controller',
  /**
   * Log activity related to product-service
   */
  PRODUCTS_SERVICE = 'product-service',
  /**
   * Log activity related to order-service
   */
  ORDER_SERVICE = 'order-service',
  /**
   * Log activity related to returns
   */
  RETURNS = 'returns',
  /*
   * Log activity related to order-controller
   */
  ORDER_CONTROLLER = 'order-controller',
  /**
   * Log activity related to boom-account-controller
   */
  BOOM_ACCOUNT_CONTROLLER = 'boom-account-controller',
  /**
   * Log activity related to config-controller
   */
  CONFIG_CONTROLLER = 'config-controller',
  /**
   * Log activity related to boom-account-service
   */
  BOOM_ACCOUNT_SERVICE = 'boom-account-service',
  /**
   * Log activity related to boom-card-controller
   */
  BOOM_CARD_CONTROLLER = 'boom-card-controller',
  /**
   * Log activity related to boom-card-service
   */
  BOOM_CARD_SERVICE = 'boom-card-service',
  /**
   * Log activity related to withdrawal-controller
   */
  WITHDRAWAL_CONTROLLER = 'withdrawal-controller',
  /**
   * Log activity related to withdrawal-service
   */
  WITHDRAWAL_SERVICE = 'withdrawal-service',
}
