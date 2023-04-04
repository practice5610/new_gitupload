// TODO: [BW-1417] review all dependencies to this file, update Booking-Types in globals. and use Globals always
import { AllOptionalExceptFor } from '@boom-platform/globals';

import { Booking, Store } from '../models';

export type StoreAddress = AllOptionalExceptFor<
  Store,
  | 'companyName'
  | 'number'
  | 'street1'
  | 'city'
  | 'state'
  | 'zip'
  | 'country'
  | '_geoloc'
  | 'merchant'
>;

export interface InvalidBookingBundle {
  booking: Booking;
  reason: string;
}

export interface ValidBookingBundle {
  booking: Booking;
  shippingOrderId: string;
}

export interface BookingValidationResult {
  valids: Booking[];
  invalids: InvalidBookingBundle[];
}
