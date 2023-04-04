import { BoomUser, Money } from '@boom-platform/globals';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';

import { fromMoney } from './money';

/**
 * Adds amount to BoomUser merchant, taking away the commission for Boom.
 * @param {BoomUser} merchant
 * @param {Money} amount
 * @param {number} boomCommissionRate
 * @param {Money} [cashback]
 * @returns {{ newGrossBalance: Money, newNetBalance: Money }}
 */
export const addFundsToMerchant = (
  merchant: BoomUser,
  amount: Money,
  taxAmount: Money,
  boomCommissionRate: number,
  cashback?: Money
): { newGrossBalance: Money; newNetBalance: Money } => {
  const logger: Logger = getLogger();

  logger.debug('\n---\naddFundsToMerchant called....');

  logger.debug(
    `Current Merchant balances: newGrossBalance: ${fromMoney(
      merchant.grossEarningsPendingWithdrawal
    )} newNetBalance: ${fromMoney(merchant.netEarningsPendingWithdrawal)}`
  );
  logger.debug(`Amount: ${fromMoney(amount)}`);
  logger.debug(`Tax: ${fromMoney(taxAmount)}`);
  logger.debug(`Commission Rate for this category is: ${boomCommissionRate}%`);

  const commissionAmount: Dinero.Dinero = Dinero(amount).percentage(boomCommissionRate);

  if (logger.isDebugEnabled())
    logger.debug(`Commission amount:`, fromMoney(commissionAmount.toObject() as Money));

  let netPayment: Dinero.Dinero = Dinero(amount).subtract(commissionAmount).add(Dinero(taxAmount));

  if (logger.isDebugEnabled())
    logger.debug(`Payment minus commission:`, fromMoney(netPayment.toObject() as Money));

  if (cashback) netPayment = netPayment.subtract(Dinero(cashback));

  const newGrossBalance: Money = Dinero(merchant.grossEarningsPendingWithdrawal)
    .add(Dinero(amount))
    .add(Dinero(taxAmount))
    .toObject() as Money;
  const newNetBalance: Money = Dinero(merchant.netEarningsPendingWithdrawal)
    .add(netPayment)
    .add(Dinero(taxAmount))
    .toObject() as Money;

  if (logger.isDebugEnabled())
    logger.debug(
      `New merchant balances: newGrossBalance: ${fromMoney(
        newGrossBalance
      )} newNetBalance: ${fromMoney(newNetBalance)}`
    );
  logger.debug('addFundsToMerchant end.\n---\n');

  return { newGrossBalance, newNetBalance };
};
