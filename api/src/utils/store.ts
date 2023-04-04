import { Store } from '@boom-platform/globals';

// TODO: This functions is used on other repositories please move it to globals
// TODO: Review if this utility matches all cases where it is used
export const getComposedAddressFromStore = (
  store: Partial<Store> | undefined,
  excludedFields: string[] = []
): string => {
  if (store) {
    const address: string[] = [];

    if (!excludedFields.includes('number') && store.number !== undefined)
      address.push(store.number);

    if (!excludedFields.includes('street1') && store.street1 !== undefined)
      address.push(store.street1);

    if (!excludedFields.includes('street2') && store.street2 !== undefined)
      address.push(store.street2);

    return address.join(', ');
  } else {
    return '';
  }
};
