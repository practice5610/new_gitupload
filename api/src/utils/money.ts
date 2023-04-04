import { Money } from '@boom-platform/globals';
import Dinero from 'dinero.js';

export const fromMoney = (
  money?: Money,
  includeSymbol: boolean = true,
  customFormatting: string = '0,0.00'
): string => {
  return Dinero(money || { amount: 0, precision: 2 }).toFormat(
    `${money && includeSymbol ? money.symbol || '$' : ''}${customFormatting}`
  );
};
