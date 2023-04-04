// This interface needs this values due to those are the required for TaxJar (third party API services that we use to tax calculation), names cannot be changed(street1, zip) or new fields added(number)
export interface TaxAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  country?: string | null;
}
