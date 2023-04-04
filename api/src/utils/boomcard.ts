import { BoomUser, Offer, ProductStatus } from '@boom-platform/globals';

import { BoomCard } from '../models/index';

export const getBoomCardLast4 = (boomcard: BoomCard): string => {
  const length: number = boomcard.cardNumber.length;
  const cardNumber: string = boomcard.cardNumber;
  return cardNumber.substring(length - 5, length - 1);
};

/**
 * Checks a boom card database ID against a profile to determine if it belongs to the user
 * @param {BoomUser} user
 * @param {string} id
 * @returns {boolean}
 */
export const boomcardBelongsToUser = (user: BoomUser, id: string): boolean => {
  const boomcardIds: string[] | null = user.cards && user.cards.length ? user.cards : null;
  return !!boomcardIds && boomcardIds.findIndex((_id: string) => _id === id) > -1;
};

/**
 * Checks an array of boom card database IDs, against a profile to determine if all belong to the user
 * @param {BoomUser} user
 * @param {string[]} ids
 * @returns {boolean}
 */
export const allBoomcardsBelongToUser = (user: BoomUser, ids: string[]): boolean => {
  let belongs: boolean = true;
  for (const id of ids) {
    if (!boomcardBelongsToUser(user, id)) {
      belongs = false;
      break;
    }
  }
  return belongs;
};
