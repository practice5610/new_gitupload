import { AllOptionalExceptFor, BoomUser, BoomUserBasic } from '@boom-platform/globals';

import { Booking } from '../models';

export interface FailedBookingPurchase {
  booking: Booking;
  reason: string;
}

export interface PurchaseResult {
  customer: AllOptionalExceptFor<BoomUser, 'uid'> | null;
  customerEmail: string | null | undefined;
  success: boolean;
  message: string;
  checkedOut?: Booking[];
  failed?: FailedBookingPurchase[];
  expired?: Booking[];
}

// REMINDER: This typeguard should be deleted if Store is no longer needed as a Transaction.sender type.
export const senderHasUID = (item: BoomUserBasic | any): item is BoomUserBasic => {
  return !!item && !!(item as BoomUserBasic).uid;
};
