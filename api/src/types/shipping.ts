import { DistanceUnit, MassUnit, Money, Rate } from '@boom-platform/globals';

import { Booking, ShippingPolicy } from '../models';

export interface MerchantTotals {
  [index: string]: Money;
}
export interface Weight {
  value: number;
  unit: MassUnit;
}
export interface BoxItem {
  booking: Booking;
  boxFill: number;
  weight: Weight;
}
export interface BoxGroups {
  [index: string]: {
    items: BoxItem[];
    distanceUnit: DistanceUnit;
    length: number;
    width: number;
    height: number;
  };
}
export interface Groups {
  [index: string]: BoxGroups;
}
export interface Boxes {
  [index: string]: {
    distanceUnit: DistanceUnit;
    length: number;
    width: number;
    height: number;
  };
}
export interface ParcelData {
  bookings: Booking[];
  weight: number;
  weightUnit: MassUnit;
  distanceUnit: DistanceUnit;
  length: number;
  width: number;
  height: number;
}
export interface ParcelGroups {
  parcels: ParcelData[];
  policy: ShippingPolicy;
}
export interface OrderGroup {
  store: string;
  bookings: Booking[];
  shippable: boolean;
  rates: Rate[];
  selectedRate?: Rate;
}

export interface ShippingPolicyList {
  [index: string]: ShippingPolicy;
}

/**
 * This is the request body for the POST /shipping/checkout route
 */
export interface ShippingCheckoutRequest {
  /**
   * The bookings a user is checking out with
   */
  bookings: Booking[];
  /**
   * The object_id of the chosen destination AddressInfo
   */
  shipToAddressId: string;
}
