import { Geolocation } from '@boom-platform/globals';

// TODO: update when new search is implemented
// this is for the old search, I do not know if elastic search will need it
// so I am including this inline return type to fix lint error.
// If this is still used when elastic search is implemented we should define better return type
export const transformGeolocForSearchEngine = (
  geolocation: Geolocation
): { lat: number | null | undefined; lon: number | null | undefined } => {
  return {
    lat: geolocation ? geolocation.lat : undefined,
    lon: geolocation ? geolocation.lng : undefined,
  };
};
