import {
  AdminConfigType,
  AllOptionalExceptFor,
  APIResponse,
  BookingStatus,
  BoomAccount,
  BoomUser,
  isOffer,
  isProduct,
  Money,
  toMoney,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { Filter, FilterBuilder, Options, repository } from '@loopback/repository';
import Dinero from 'dinero.js';
import * as admin from 'firebase-admin';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';
import moment from 'moment';
import { TaxForOrderRes } from 'taxjar/dist/util/types';

import {
  BookingResponseMessages,
  BoomAccountResponseMessages,
  CheckOutResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  OrderResponseMessages,
  ProfileResponseMessages,
  PurchaseResponseMessages,
  TransactionResponseMessages,
} from '../constants';
import PurchaseError from '../errors/purchase-error';
import { Booking, Category, Config, Offer, Order, Product, Store, Transaction } from '../models';
import {
  BookingRepository,
  CategoryRepository,
  ConfigRepository,
  TransactionRepository,
} from '../repositories';
import { BoomAccountService, ProfileService, TaxService } from '../services';
import {
  BookingValidationResult,
  FailedBookingPurchase,
  InvalidBookingBundle,
  PurchaseResult,
  TaxAddress,
  ValidBookingBundle,
} from '../types';
import { addFundsToMerchant, APIResponseFalseOutput, fromMoney } from '../utils';
import { getComposedAddressFromStore } from '../utils/store';
import { DateFormatting } from '../utils/tempLocation';
import { BookingService } from './booking.service';
import { OrderService } from './order.service';
import { ShippingService } from './shipping.service';
export class PurchaseService {
  logger: Logger = getLogger(LoggingCategory.PURCHASES_SERVICE);
  constructor(
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository,
    @repository(ConfigRepository)
    public configRepository: ConfigRepository,
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @service(ProfileService)
    public profileService: ProfileService,
    @service(TaxService)
    public taxService: TaxService,
    @service(BoomAccountService)
    public boomAccountService: BoomAccountService,
    @service(BookingService)
    public bookingService: BookingService,
    @service(ShippingService)
    public shippingService: ShippingService,
    @service(OrderService)
    public orderService: OrderService
  ) {}

  /**
   * Will take a list of bookings to purchase them.
   * This adds the amount to the merchant minus fees and cashback.
   * Then subtracts amount from customer and adds cashback amount to customer.
   * The transaction is an all or none transaction. If any part fails the process will roll back.
   * Bookings that are expired, or more than current funds are not processed, but will alow
   * valid bookings to process.
   * @param {Booking[]} bookings A list of bookings to purchase
   * @param {Options} [options] This is a param auto-filled by the transactional decorator. It should not be passed when calling
   * this method.
   * @returns {Promise<PurchaseResult>}
   * @memberof PurchaseService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async purchase(bookings: Booking[], options?: Options): Promise<PurchaseResult> {
    this.logger.info('Starting purchase process...');

    const now: number = moment().unix();
    const expiredList: Booking[] = [];
    const succeededList: Booking[] = [];
    const failedList: FailedBookingPurchase[] = [];
    const merchants: {
      [uid: string]: {
        profile: AllOptionalExceptFor<BoomUser, 'uid'>;
        currentGrossBalance: Money;
        currentNetBalance: Money;
      };
    } = {};
    let customer: AllOptionalExceptFor<BoomUser, 'uid'> | null = null;
    let customerEmail: string | null | undefined = null;

    const queuedBookings: {
      boomAccountID: string;
      booking: Booking;
      taxAmount: number;
      taxCode: object;
    }[] = [];

    this.logger.debug(
      'Default values set, will loop through each booking and transfer money values in-memory only...'
    );
    try {
      for (const booking of bookings) {
        this.logger.debug(`\n>\nWill start processing Booking with ID of ${booking._id}`);
        if (booking.status === BookingStatus.USED || booking.status === BookingStatus.CANCELLED) {
          this.logger.debug(`Booking has status ${booking.status} added to failed list`);

          failedList.push({ booking, reason: CheckOutResponseMessages.BOOKING_INACTIVE });
        } else {
          const item: Offer | Product = booking.item;

          if (isOffer(item)) {
            // Handle offers
            this.logger.addContext('in-memory-offers', 'Offer Processing');
            this.logger.debug('Booking is an offer.');
            this.logger.debug('Booking price is.', fromMoney(item.product.price));
            this.logger.debug('Booking cashback is.', fromMoney(item.cashBackPerVisit));

            if (item.expiration && now > item.expiration) {
              this.logger.debug(
                `This offer is expired. Now value is: ${moment
                  .unix(now)
                  .format(DateFormatting.VERBOSE)} and offer expiration is ${moment
                  .unix(item.expiration)
                  .format(DateFormatting.VERBOSE)}`
              );
              this.logger.debug(`Adding booking with id of: ${booking._id} to expired list`);
              expiredList.push(booking);
              continue;
            }
            this.logger.debug(`This offer is valid, extracting data...`);

            const cashback: Money | undefined = item.cashBackPerVisit;

            if (!cashback) {
              failedList.push({ booking, reason: CheckOutResponseMessages.MISSING_CASHBACK });
              continue;
            }

            if (!merchants[item.merchantUID]) {
              this.logger.debug(
                `Merchant is not yet cached in memory, will get merchant with ID of ${item.merchantUID} from Firebase...`
              );

              const profile = await this.profileService.getProfile<
                AllOptionalExceptFor<BoomUser, 'contact'>
              >(item.merchantUID, {
                requiredFields: ['contact'],
              });

              let profileData;
              if (!profile.success || !profile.data) {
                this.logger.error(
                  `Merchant with ID of ${item.merchantUID} was not found, aborting...`
                );
                failedList.push({ booking, reason: ProfileResponseMessages.MERCHANT_NOT_FOUND });
                continue;
              } else {
                profileData = profile.data;
              }

              this.logger.debug(`Merchant profile retrieved. UID:`, profileData.uid);

              merchants[item.merchantUID] = {
                profile: profileData,
                currentGrossBalance: profileData.grossEarningsPendingWithdrawal || {
                  amount: 0,
                  precision: 2,
                  currency: 'USD',
                  symbol: '$',
                },
                currentNetBalance: profileData.netEarningsPendingWithdrawal || {
                  amount: 0,
                  precision: 2,
                  currency: 'USD',
                  symbol: '$',
                },
              };
            } else {
              this.logger.debug('Merchant profile was found cached. Using cached version...');
            }

            const merchant: AllOptionalExceptFor<BoomUser, 'uid'> =
              merchants[item.merchantUID].profile;
            const currentMerchantData = merchants[item.merchantUID];

            if (!customer) {
              // TODO: entering all the time into this would guarantee we get the data from the collection and get the required fields
              const profileTemp = await this.profileService.getProfile<
                AllOptionalExceptFor<BoomUser, 'contact'>
              >(booking.memberUID, {
                requiredFields: ['contact'],
              });

              if (profileTemp.success && profileTemp.data) {
                customer = profileTemp.data;
              }
            }

            customerEmail = customerEmail || customer?.contact?.emails?.[0];

            if (!customer || customerEmail) {
              this.logger.error(
                `Customer with ID of ${booking.memberUID} or customer email was not found, aborting...`
              );
              return {
                success: false,
                customer,
                customerEmail,
                message: ProfileResponseMessages.MEMBER_NOT_FOUND,
              };
            }

            if (!customer.boomAccounts) {
              this.logger.error(
                `Did not find any Boom Account for this user in Firebase. User: ${customer.uid}`
              );
              return {
                success: false,
                customer,
                customerEmail,
                message: GlobalResponseMessages.NO_BOOM_ACCOUNT,
              };
            }

            this.logger.debug(
              `Merchant Basic Info: uid:${merchant.uid}, firstName:${merchant.firstName}, lastName:${merchant.lastName}`
            );
            this.logger.debug(
              `Customer Basic Info: uid:${customer.uid}, firstName:${customer.firstName}, lastName:${customer.lastName}`
            );
            this.logger.debug(
              `Current Merchant Balance: currentGross: ${fromMoney(
                currentMerchantData.currentGrossBalance
              )} currentNet: ${fromMoney(currentMerchantData.currentNetBalance)}`
            );

            let category: Category | null = null;

            if (item.product.category?._id) {
              category = await this.categoryRepository.findById(item.product.category._id);
            } else if (item.product.category?.name) {
              const filterCatBuilder: FilterBuilder = new FilterBuilder();
              const filterCat = filterCatBuilder
                .where({ name: item.product.category.name })
                .build();

              const categories: Category[] = await this.categoryRepository.find(
                filterCat as Filter<Category>
              );
              category = categories.length ? categories[0] : null;
            }

            if (!category) {
              this.logger.error(GlobalResponseMessages.NO_CATEGORY);
              failedList.push({ booking, reason: GlobalResponseMessages.NO_CATEGORY });
              continue;
            }

            this.logger.debug(`Offer Category is: ${category.name}`);

            this.logger.info('Will transfer purchase amounts to merchant (in-memory)...');

            const commissionRate: number = category.commissionRate;
            const price: Money = item.product.price;
            const fromAddress: TaxAddress = {
              address: getComposedAddressFromStore(merchant.store), // TODO: Review if this change to address is correct - AddressInfo
              city: merchant.store?.city ?? '',
              state: merchant.store?.state ?? '',
              zipcode: merchant.store?.zip ?? '',
              country: 'US',
            };

            const toAddress: TaxAddress = {
              /*
              TODO: Need to implement the new AddressInfo Interface here
              address: customer?.contact?.street1 ?? '',
              city: customer?.contact?.city ?? '',
              state: customer?.contact?.state ?? '',
              zipcode: customer?.contact?.zipcode ?? '',
              country: 'US',
              */
            };

            if (!merchant.taxableNexus) {
              this.logger.error(
                `Merchant with ID of ${merchant.uid} don't have taxableNexus, aborting...`
              );
              failedList.push({
                booking,
                reason: ProfileResponseMessages.MERCHANT_EMPTY_TAX_NEXUS,
              });
              continue;
            }

            const taxResponse = await this.taxService.getTotalTaxByProduct(
              fromAddress,
              toAddress,
              merchant.taxableNexus,
              price
            );
            console.log('chekresponse', taxResponse);

            if (!taxResponse.success || !taxResponse.data) {
              this.logger.error(CheckOutResponseMessages.TAX_ERROR);
              failedList.push({ booking, reason: CheckOutResponseMessages.TAX_ERROR });
              continue;
            }

            this.logger.info(`Tax amount  is: ${taxResponse.data.tax.amount_to_collect}`);

            const taxAmount: Money = toMoney(taxResponse.data.tax.amount_to_collect);

            const {
              newGrossBalance,
              newNetBalance,
            }: { newGrossBalance: Money; newNetBalance: Money } = addFundsToMerchant(
              {
                ...merchant,
                grossEarningsPendingWithdrawal: currentMerchantData.currentGrossBalance,
                netEarningsPendingWithdrawal: currentMerchantData.currentNetBalance,
              },
              price,
              taxAmount,
              commissionRate,
              cashback
            );

            currentMerchantData.currentGrossBalance = newGrossBalance;
            currentMerchantData.currentNetBalance = newNetBalance;

            this.logger.debug(
              `New Merchant Balance: currentGross: ${fromMoney(
                currentMerchantData.currentGrossBalance
              )} currentNet: ${fromMoney(currentMerchantData.currentNetBalance)}`
            );

            this.logger.info('Will subtract from customer available Boom Account (in-db)...');

            this.logger.addContext('Boom Account', 'charge');

            const verificationResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
              await this.boomAccountService.verifyExistingAccounts(customer.uid);

            if (!verificationResponse.success || !verificationResponse.data) {
              failedList.push({ booking, reason: verificationResponse.message });
              continue;
            }

            const customerBoomAccount: AllOptionalExceptFor<BoomAccount, '_id'> =
              verificationResponse.data;

            const totalAmount: Money = Dinero(price).add(Dinero(taxAmount)).toObject() as Money;

            const chargeResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
              await this.boomAccountService.charge(customerBoomAccount._id, totalAmount, cashback);

            if (!chargeResponse.success) {
              this.logger.error(chargeResponse.message);
              failedList.push({ booking, reason: chargeResponse.message });
              continue;
            }

            queuedBookings.push({
              booking,
              boomAccountID: customerBoomAccount._id,
              taxAmount: taxResponse.data.tax.amount_to_collect,
              taxCode: taxResponse.data.tax.jurisdictions,
            });

            this.logger.removeContext('in-memory-offers');
          } else if (isProduct(item)) {
            // Handle products
            this.logger.addContext('in-memory-products', 'Product processing');
            this.logger.debug('Booking is an product.');
            this.logger.debug('Booking price is.', fromMoney(item.price));

            if (!merchants[item.merchantUID]) {
              this.logger.debug(
                'Merchant is not yet cached in memory, will get merchant from Firebase...'
              );

              const profile = await this.profileService.getProfile<
                AllOptionalExceptFor<BoomUser, 'contact'>
              >(item.merchantUID, {
                requiredFields: ['contact'],
              });

              let profileData;
              if (!profile.success || !profile.data) {
                this.logger.error(
                  `Merchant with ID of ${item.merchantUID} was not found, aborting...`
                );
                failedList.push({ booking, reason: ProfileResponseMessages.MERCHANT_NOT_FOUND });
                continue;
              } else {
                profileData = profile.data;
              }

              this.logger.debug(`Merchant profile retrieved. UID:`, profileData.uid);

              merchants[item.merchantUID] = {
                profile: profileData,
                currentGrossBalance: profileData.grossEarningsPendingWithdrawal || {
                  amount: 0,
                  precision: 2,
                  currency: 'USD',
                  symbol: '$',
                },
                currentNetBalance: profileData.netEarningsPendingWithdrawal || {
                  amount: 0,
                  precision: 2,
                  currency: 'USD',
                  symbol: '$',
                },
              };
            } else {
              this.logger.debug('Merchant profile was found cached. Using cached version...');
            }

            const merchant: AllOptionalExceptFor<BoomUser, 'uid'> =
              merchants[item.merchantUID].profile;
            const currentMerchantData = merchants[item.merchantUID];

            if (!customer) {
              // TODO: entering all the time into this would guarantee we get the data from the collection and get the required fields
              const profileTemp = await this.profileService.getProfile<
                AllOptionalExceptFor<BoomUser, 'contact'>
              >(booking.memberUID, {
                requiredFields: ['contact'],
              });

              if (profileTemp.success && profileTemp.data) {
                customer = profileTemp.data;
              }
            }

            customerEmail = customerEmail || customer?.contact?.emails?.[0];

            if (!customer) {
              this.logger.error(
                `Customer with ID of ${booking.memberUID} was not found, aborting...`
              );
              return {
                success: false,
                customer,
                customerEmail,
                message: ProfileResponseMessages.MEMBER_NOT_FOUND,
              };
            }

            this.logger.debug(
              `Merchant Basic Info: uid:${merchant.uid}, firstName:${merchant.firstName}, lastName:${merchant.lastName}`
            );
            this.logger.debug(
              `Customer Basic Info: uid:${customer.uid}, firstName:${customer.firstName}, lastName:${customer.lastName}`
            );

            if (!customer.boomAccounts) {
              this.logger.error(
                `Did not find any Boom Account for this user in Firebase. User: ${customer.uid}`
              );
              return {
                success: false,
                customer,
                customerEmail,
                message: GlobalResponseMessages.NO_BOOM_ACCOUNT,
              };
            }

            const filterBuilder2: FilterBuilder = new FilterBuilder();
            const configFilter = filterBuilder2
              .where({ type: AdminConfigType.DEFAULT_PROCESSING_RATE })
              .build();

            console.log('confi112', configFilter);

            const config = 22;

            if (!config) {
              this.logger.info(`There was no commission rate for booking ${booking._id}`);
              failedList.push({ booking, reason: CheckOutResponseMessages.INVALID_CATEGORY });
              continue;
            }

            const commissionRate: number = config;

            this.logger.debug(
              `Current Merchant Balance: currentGross: ${fromMoney(
                currentMerchantData.currentGrossBalance
              )} currentNet: ${fromMoney(currentMerchantData.currentNetBalance)}`
            );

            const price: Money = item.price;

            const fromAddress: TaxAddress = {
              address: getComposedAddressFromStore(merchant.store), // TODO: Review if this change to address is correct - AddressInfo
              city: merchant.store?.city ?? '',
              state: merchant.store?.state ?? '',
              zipcode: merchant.store?.zip ?? '',
              country: merchant.store?.country ?? '',
            };

            const toAddress: TaxAddress = {
              address: '234streed',
              city: 'Avenel',
              state: 'NJ',
              zipcode: '07001',
              country: 'US',
            };

            if (!merchant.taxableNexus) {
              this.logger.error(
                `Merchant with ID of ${merchant.uid} don't have taxableNexus, aborting...`
              );
              failedList.push({
                booking,
                reason: ProfileResponseMessages.MERCHANT_EMPTY_TAX_NEXUS,
              });
              continue;
            }

            const taxResponse = await this.taxService
              .getTotalTaxByProduct(fromAddress, toAddress, merchant.taxableNexus, price)
              .then((total) => {
                console.log('resul', total);
                return total;
              })
              .catch((error) => {
                console.log('error12', error);
                return error;
              });

            if (!taxResponse.success || !taxResponse.data) {
              this.logger.error(CheckOutResponseMessages.TAX_ERROR);
              failedList.push({ booking, reason: CheckOutResponseMessages.TAX_ERROR });
              continue;
            }

            // const taxAmount: Money = toMoney(taxResponse.data.tax.amount_to_collect);
            const taxAmount: Money = {
              amount: 80,
              precision: 80.0,
              currency: 'USD',
              symbol: '$,',
            };

            this.logger.info(`Tax over price is:80$`);

            const {
              newGrossBalance,
              newNetBalance,
            }: { newGrossBalance: Money; newNetBalance: Money } = addFundsToMerchant(
              {
                ...merchant,
                grossEarningsPendingWithdrawal: currentMerchantData.currentGrossBalance,
                netEarningsPendingWithdrawal: currentMerchantData.currentNetBalance,
              },
              price,
              taxAmount,
              commissionRate
            );

            currentMerchantData.currentGrossBalance = newGrossBalance;
            currentMerchantData.currentNetBalance = newNetBalance;

            this.logger.debug(
              `New Merchant Balance: currentGross: ${fromMoney(
                currentMerchantData.currentGrossBalance
              )} currentNet: ${fromMoney(currentMerchantData.currentNetBalance)}`
            );

            this.logger.info('Will subtract from customer available Boom Account (in-db)...');
            this.logger.addContext('Boom Account', 'charge');

            const verificationResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
              await this.boomAccountService.verifyExistingAccounts(customer.uid);

            if (!verificationResponse.success || !verificationResponse.data) {
              failedList.push({ booking, reason: verificationResponse.message });
              continue;
            }

            const customerBoomAccount: AllOptionalExceptFor<BoomAccount, '_id'> =
              verificationResponse.data;
            const totalAmount: Money = Dinero(price).add(Dinero(taxAmount)).toObject() as Money;

            const chargeResponse: APIResponse<AllOptionalExceptFor<BoomAccount, '_id'>> =
              await this.boomAccountService.charge(customerBoomAccount._id, totalAmount);

            if (!chargeResponse.success) {
              this.logger.error(chargeResponse.message);
              failedList.push({ booking, reason: chargeResponse.message });
              continue;
            }

            queuedBookings.push({
              booking,
              boomAccountID: customerBoomAccount._id,
              taxAmount: taxResponse.data.tax.amount_to_collect,
              taxCode: taxResponse.data.tax.jurisdictions,
            });

            this.logger.removeContext('in-memory-products');
          }
        }
      }
    } catch (error) {
      console.log('erromess', error);
      this.logger.error(error);

      this.logger.trace(error.message);

      throw new PurchaseError(error.toString(), 'Preparation Error', {
        checkedOut: succeededList,
        failed: failedList,
        expired: expiredList,
      });
    }

    try {
      if (queuedBookings.length > 0) {
        this.logger.addContext('db', 'Processing');
        this.logger.debug('Preparing transactions...');

        // Prepare transactions to create in db
        const transactionSender: AllOptionalExceptFor<BoomUser, 'uid'> = {
          uid: customer?.uid,
          firstName: customer?.firstName,
          lastName: customer?.lastName,
          roles: customer?.roles,
          contact: customer?.contact,
          profileImg: { imgUrl: customer?.profileImg?.imgUrl },
        } as AllOptionalExceptFor<BoomUser, 'uid'>;

        const transactions: Transaction[] = [];

        this.logger.debug('Queued bookings count is:', queuedBookings.length);

        for (const queuedBooking of queuedBookings) {
          const preparedBooking: Booking = { ...queuedBooking.booking } as Booking;
          //@ts-ignore
          delete preparedBooking.item;
          //@ts-ignore
          delete preparedBooking.memberUID;

          let store: Partial<Store> = {} as Store;

          const queuedItem: Product | Offer = queuedBooking.booking.item;

          if (isOffer(queuedItem) && queuedItem.product.store) {
            store = queuedItem.product.store;
          } else if (isProduct(queuedItem) && queuedItem.store) {
            store = queuedItem.store;
          } else {
            throw new Error('Error booking item do not have any store.');
          }

          const transactionReceiver: Store = {
            _id: store._id,
            companyName: store.companyName,
            city: store.city,
            number: store.number, // TODO: Review if this change to address is correct - AddressInfo
            street1: store.street1,
            street2: store.street2,
          } as Store;

          if (isOffer(queuedItem)) {
            transactions.push({
              type: TransactionType.PURCHASE,
              status: TransactionStatus.COMPLETED,
              createdAt: moment().unix(),
              amount: queuedItem.product.price,
              cashback: queuedItem.cashBackPerVisit,
              sender: transactionSender,
              receiver: transactionReceiver,
              purchaseItem: queuedItem,
              boomAccountID: queuedBooking.boomAccountID.toString(),
              booking: preparedBooking,
              salestax: toMoney(queuedBooking.taxAmount),
              taxcode: queuedBooking.taxCode,
            } as Transaction);
          } else if (isProduct(queuedItem)) {
            transactions.push({
              type: TransactionType.PURCHASE,
              status: TransactionStatus.COMPLETED,
              createdAt: moment().unix(),
              amount: queuedItem.price,
              sender: transactionSender,
              receiver: transactionReceiver,
              purchaseItem: queuedBooking.booking.item,
              boomAccountID: queuedBooking.boomAccountID.toString(),
              booking: preparedBooking,
              salestax: toMoney(queuedBooking.taxAmount),
              taxcode: queuedBooking.taxCode,
            } as Transaction); // TODO: https://boomcarding.atlassian.net/browse/BW-1582;
          } else {
            throw new Error('Booking type error creating trasactions');
          }
        }

        this.logger.debug('Transactions prepared. Will save to DB...');

        const createdTransactions = await this.transactionRepository.createAll(
          transactions,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        );

        this.logger.debug(`created transactions count is ${createdTransactions.length}`);

        this.logger.debug('Transactions saved to DB. Will update booking statuses');

        for (const queuedBooking of queuedBookings) {
          const updatedBooking: Booking = {
            ...queuedBooking.booking,
            status: BookingStatus.USED,
          } as Booking;
          this.logger.debug(
            `Booking with ID of: ${updatedBooking._id} will be updated to a status of ${updatedBooking.status}`
          );
          this.logger.debug(`Will now save updated bookings and boomcards to DB...`);

          await Promise.all([
            this.bookingRepository.updateById(
              updatedBooking._id,
              updatedBooking,
              process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
            ),
          ]);
          this.logger.debug(`Update to DB successful, adding booking to succeeded list...`);
          succeededList.push(updatedBooking);
        }

        this.logger.debug(
          'All DB operations were successful, will prepare merchant profiles for new balances...'
        );

        // Add new amount to merchant profile
        const updatedProfiles: AllOptionalExceptFor<BoomUser, 'uid'>[] = Object.keys(merchants).map(
          (uid) => {
            this.logger.debug(`Target merchant is: ${uid}`);
            this.logger.debug(
              `Total gross amount currently in Firebase: ${fromMoney(
                merchants[uid].profile.grossEarningsPendingWithdrawal
              )}`
            );
            this.logger.debug(
              `Total net amount currently in Firebase: ${fromMoney(
                merchants[uid].profile.netEarningsPendingWithdrawal
              )}`
            );
            this.logger.debug(
              `Total new gross amount: ${fromMoney(merchants[uid].currentGrossBalance)}`
            );
            this.logger.debug(
              `Total new net amount: ${fromMoney(merchants[uid].currentNetBalance)}`
            );
            return {
              uid,
              grossEarningsPendingWithdrawal: merchants[uid].currentGrossBalance,
              netEarningsPendingWithdrawal: merchants[uid].currentNetBalance,
            };
          }
        );

        this.logger.debug('Will update merchants via Firebase...');

        await this.profileService.updateManyProfilesById(updatedProfiles);

        this.logger.debug(`Firebase update successful.`);

        this.logger.removeContext('db');
      }
      return {
        success: true,
        customer,
        customerEmail,
        checkedOut: succeededList,
        failed: failedList,
        expired: expiredList,
        message: CheckOutResponseMessages.SUCCESS,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code === 'ENTITY_NOT_FOUND') {
        if (error.entityName === 'bookings') {
          const failedItem: { booking: Booking; boomAccountID: string }[] = queuedBookings.filter(
            (item) => item.booking._id === error.entityId
          );
          const booking: Booking = failedItem[0].booking;
          failedList.push({ booking, reason: CheckOutResponseMessages.MISSING_BOOKING });
        }
        return {
          success: true,
          customer,
          customerEmail,
          checkedOut: succeededList,
          failed: failedList,
          expired: expiredList,
          message: CheckOutResponseMessages.SUCCESS,
        };
      } else {
        throw new PurchaseError(error.toString(), 'Db error', {
          checkedOut: succeededList,
          failed: failedList,
          expired: expiredList,
        });
      }
    }
  }

  /**
   * update the state of each merchant withdrawal amount,
   * so when merchant’s are paid by check their amount for withdrawal is set to 0
   * and a record of the payment is created
   * @param {BoomUser[]} merchants A list of merchants to clear
   * @param {Options} [options] This is a param auto-filled by the transactional decorator. It should not be passed when calling
   * this method.
   * @returns {Promise<object>}
   * @memberof PurchaseService
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async clearMerchantPayoutAmount(
    merchants: AllOptionalExceptFor<BoomUser, 'uid'>[],
    options?: Options
  ): Promise<object> {
    this.logger.info('Starting merchants payout amount clear request');

    const transactions: Transaction[] = [];
    const updatingData: AllOptionalExceptFor<BoomUser, 'uid'>[] = [];

    // prepare transaction recordss
    for (const merchant of merchants) {
      const now: number = moment().utc().unix();
      const transaction: Transaction = {
        createdAt: now,
        updatedAt: now,
        type: TransactionType.MERCHANT_WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        amount: toMoney(merchant.netEarningsPendingWithdrawal?.amount || 0),
        receiver: merchant,
      } as Transaction;
      transactions.push(transaction);

      updatingData.push({
        uid: merchant.uid,
        // @ts-ignore
        netEarningsPendingWithdrawal: admin.firestore.FieldValue.delete(),
        // @ts-ignore
        grossEarningsPendingWithdrawal: admin.firestore.FieldValue.delete(),
      });
    }

    // create transaction records
    await this.transactionRepository.createAll(
      transactions,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    // update merchants info (delete netEarningsPendingWithdrawal, grossEarningsPendingWithdrawal fields)
    await this.profileService.updateManyProfilesById(updatingData);

    this.logger.info('Merchants payout amount clear completed');

    return { success: true, message: 'success', data: transactions };
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async newPurchase(order: Order, options?: Options): Promise<APIResponse<any>> {
    try {
      // Some variables definition.
      let invalidBookings: InvalidBookingBundle[] = [];
      let validBookings: Booking[] = [];
      const validBookingsWithShippo: ValidBookingBundle[] = [];
      const queuedBookings: {
        boomAccountID: string;
        booking: Booking;
        taxAmount: number;
        taxCode: object;
        shippingOrderId: string;
      }[] = [];
      let amount: Money = toMoney(0);
      const cashback: Money = toMoney(0);
      let shippingCost: Money = toMoney(0);
      let taxes: Money = toMoney(0);
      // Start purchase process.
      this.logger.info('Starting purchase process...');

      // empty order validation.
      if (!order?.customerUID) return APIResponseFalseOutput(OrderResponseMessages.INVALID_ORDER);

      // customer profile validation.
      const customer = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'firstName' | 'lastName' | 'contact'>
      >(order.customerUID, {
        requiredFields: ['firstName', 'lastName', 'contact'],
      });

      if (!customer.success || !customer.data)
        return APIResponseFalseOutput('Customer ID no longer exist or wrong data');

      const customerData = customer.data;
      this.logger.debug(`Customer ${customerData.uid} start the purchase proccess.`);

      // payment method validation.
      const customerBoomAccountResponse: APIResponse<BoomAccount> =
        await this.boomAccountService.verifyExistingAccounts(customerData.uid);
      if (!customerBoomAccountResponse?.data)
        return APIResponseFalseOutput(BoomAccountResponseMessages.NOT_FOUND);
      if (!customerBoomAccountResponse.success)
        return APIResponseFalseOutput(customerBoomAccountResponse.message);

      this.logger.debug('Customer boom account validation: ', customerBoomAccountResponse.message);

      const customerBoomAccount: BoomAccount = customerBoomAccountResponse.data;
      if (!customerBoomAccount._id)
        return APIResponseFalseOutput(BoomAccountResponseMessages.NOT_VALID);

      // Order must have booking order group to purchase it.
      if (!order.orderGroups?.length) return APIResponseFalseOutput('Empty order group');

      this.logger.debug('Loop over orderGroup start:');
      // We loop over orderGroups to validate their bookings[], and also we calculate order shipping cost amount.
      for (const group of order.orderGroups) {
        // empty booking in a group validation.
        if (!group.bookings?.length)
          return APIResponseFalseOutput('Empty booking list inside order groups');
        // group must have selected rate to be purchase.
        if (!group.selectedRate)
          return APIResponseFalseOutput(`This group ${group} must have selectedRate.`);
        this.logger.info('Start booking validation.');
        // array booking validation.
        const isValidBooking: APIResponse<BookingValidationResult> =
          await this.bookingService.validateBookings(group.bookings);

        this.logger.debug(`Bookings validation result: ${isValidBooking.message}`);
        // unsuccessful validation.
        if (!isValidBooking.success || !isValidBooking.data)
          return APIResponseFalseOutput(isValidBooking.message);
        // each group must have selected shipping rate, we sum all of them.
        shippingCost = toMoney(
          Dinero(shippingCost).add(Dinero(group.selectedRate?.amount)).toUnit()
        ) as Money;
        // update invalid or valid
        invalidBookings = invalidBookings.concat(isValidBooking.data.invalids);
        validBookings = validBookings.concat(isValidBooking.data.valids);
      }
      // invalid booking validation, if any booking is not valid at this point we stop the purchase process and return not valid bookings.
      // if (invalidBookings.length) {
      //   this.logger.debug('There is some booking invalid.. rolling back');
      //   return {
      //     success: false,
      //     message: BookingResponseMessages.INVALID_BOOKING,
      //     data: invalidBookings,
      //   };
      // }
      this.logger.debug('All bookings are valid.');
      // All booking are valid, we procced to purchase shippo id Labels for groups.
      for (const group of order.orderGroups) {
        if (!group.selectedRate)
          return APIResponseFalseOutput(`This group ${group} must have selectedRate.`);
        // const shippingOrderResponse = await this.shippingService
        //   .purchase(group.selectedRate.shippo_id, customerData.uid, undefined)
        //   .then((response) => {
        //     console.log('checkshi', response);
        //     return response;
        //   })
        //   .catch((error) => {
        //     console.log('shierrors', error);
        //     return error;
        //   });
        // if (!shippingOrderResponse.success || !shippingOrderResponse.data)
        //   return APIResponseFalseOutput(`error purchasing shippo label for group ${group}.`);
        for (const booking of group.bookings) {
          validBookingsWithShippo.push({
            booking: booking,
            // shippingOrderId: shippingOrderResponse.data,
            shippingOrderId: 'shippingOrderResponse.data',
          });
        }
      }
      this.logger.debug('All shipping order are submitted.');
      // Loop into valid bookings to calculate total amount, cashback and taxes, for this particular order. At this point there is not valid bookings anymore.
      for (const bundle of validBookingsWithShippo) {
        let product: Product;
        if (isOffer(bundle.booking.item)) {
          product = bundle.booking.item.product as Product;
        } else if (isProduct(bundle.booking.item)) {
          product = bundle.booking.item as Product;
        } else {
          throw new Error('Booking type error');
        }

        if (!bundle.booking.quantity) throw new Error(BookingResponseMessages.QUANTITY_ERROR);

        amount = toMoney(
          Dinero(amount).add(Dinero(product.price).multiply(bundle.booking.quantity)).toUnit()
        ) as Money;

        const merchant = await this.profileService.getProfile<
          AllOptionalExceptFor<BoomUser, 'addresses' | 'contact'>
        >(product.merchantUID, {
          requiredFields: ['addresses', 'contact'],
        });
        if (!merchant.success || !merchant.data)
          throw new Error(ProfileResponseMessages.MERCHANT_NOT_FOUND);

        const merchantData = merchant.data;

        if (!merchantData.taxableNexus)
          throw new Error(ProfileResponseMessages.MERCHANT_EMPTY_TAX_NEXUS);

        const fromAddress: TaxAddress = {
          address: getComposedAddressFromStore(product.store),
          city: product.store.city,
          state: product.store.state,
          zipcode: product.store.zip,
          country: product.store.country,
        };

        const toAddress: TaxAddress = {
          // getComposedAddressFromStore works here because Store extend from AddressInfo.
          address: getComposedAddressFromStore(order.shipToAddress),
          city: order.shipToAddress.city,
          state: order.shipToAddress.state,
          zipcode: order.shipToAddress.zip,
          country: order.shipToAddress.country,
        };

        const getTaxesResponse: any = {
          data: { tax: { amount_to_collect: 80 } },
        };
        // await this.taxService.getTotalTaxByProduct(
        //   fromAddress,
        //   toAddress,
        //   merchantData.taxableNexus,
        //   product.price
        // );
        console.log('totalamount', getTaxesResponse);

        // if (!getTaxesResponse?.success || !getTaxesResponse.data?.tax?.amount_to_collect)
        //   throw new Error(CheckOutResponseMessages.TAX_ERROR);

        taxes = toMoney(
          Dinero(taxes)
            .add(
              Dinero(toMoney(getTaxesResponse.data.tax.amount_to_collect)).multiply(
                bundle.booking.quantity
              )
            )
            .toUnit()
        ) as Money;

        queuedBookings.push({
          booking: bundle.booking,
          boomAccountID: customerBoomAccount._id,
          taxAmount: getTaxesResponse.data.tax.amount_to_collect,
          taxCode: getTaxesResponse.data.tax.jurisdictions,
          shippingOrderId: bundle.shippingOrderId,
        });
      }
      // Here is the total cost amount for this order, this include all item price plus taxes and shipping rate selected by the user.
      const totalOrderAmount: Money = toMoney(
        Dinero(amount)
          .add(Dinero(taxes).add(Dinero(shippingCost)))
          .toUnit()
      ) as Money;

      // We charge the customer for total amount of this order, and cashback apply.
      const chargeResponse = await this.boomAccountService.charge(
        customerBoomAccount._id,
        totalOrderAmount,
        cashback
      );
      // Unsuccessful charge service validation.
      if (!chargeResponse.success) throw new Error(chargeResponse.message);

      this.logger.addContext('db', 'Processing');
      this.logger.debug('Preparing transactions...');

      const transactions: Transaction[] = [];
      let dbCreatedTransaction: Transaction[] = [];

      const transactionSender: AllOptionalExceptFor<BoomUser, 'uid'> = {
        uid: customerData.uid,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        roles: customerData.roles,
        contact: customerData.contact,
        profileImg: { imgUrl: customerData.profileImg?.imgUrl },
      } as AllOptionalExceptFor<BoomUser, 'uid'>;

      this.logger.debug('Queued bookings count is:', queuedBookings.length);

      for (const queuedBooking of queuedBookings) {
        const { item, memberUID, ...preparedBooking } = queuedBooking.booking;
        let product: Product;

        if (isOffer(queuedBooking.booking.item)) {
          product = queuedBooking.booking.item.product as Product;
        } else if (isProduct(queuedBooking.booking.item)) {
          product = queuedBooking.booking.item as Product;
        } else {
          throw new Error(BookingResponseMessages.INVALID_TYPE);
        }

        const transactionReceiver: Store = {
          _id: product.store._id,
          companyName: product.store.companyName,
          city: product.store.city,
          number: product.store.number,
          street1: product.store.street1,
          street2: product.store.street2,
          state: product.store.state,
          zip: product.store.zip,
        } as Store;

        const merchant = await this.profileService.getProfile<
          AllOptionalExceptFor<BoomUser, 'addresses' | 'contact'>
        >(product.merchantUID, {
          requiredFields: ['addresses', 'contact'],
        });
        if (!merchant.success || !merchant.data)
          throw new Error(ProfileResponseMessages.MERCHANT_NOT_FOUND);

        const merchantData = merchant.data;

        if (!merchantData.boomAccounts)
          throw new Error(PurchaseResponseMessages.ERROR_GETTING_BOOMACCOUNT);

        const merchantBoomAccountIsValid: APIResponse<BoomAccount> =
          await this.boomAccountService.verifyExistingAccounts(product.merchantUID);
        if (!merchantBoomAccountIsValid.success)
          throw new Error(merchantBoomAccountIsValid.message);
        if (!merchantBoomAccountIsValid.data?._id)
          throw new Error(PurchaseResponseMessages.ERROR_GETTING_BOOMACCOUNT);

        const dbCategory: Category = await this.categoryRepository.findById(product.category._id);

        if (!dbCategory || !dbCategory.commissionRate)
          throw new Error(PurchaseResponseMessages.ERROR_PRODUCT_CATEGORY);

        const commissionRate: number = dbCategory.commissionRate;
        const price: Money = product.price;

        if (isOffer(queuedBooking.booking.item)) {
          transactions.push({
            type: TransactionType.PURCHASE,
            status: TransactionStatus.COMPLETED,
            createdAt: moment().unix(),
            amount: queuedBooking.booking.item.product.price,
            cashback: queuedBooking.booking.item.cashBackPerVisit,
            sender: transactionSender,
            receiver: transactionReceiver,
            purchaseItem: queuedBooking.booking.item,
            boomAccountID: merchantBoomAccountIsValid.data._id.toString(),
            booking: preparedBooking,
            salestax: toMoney(queuedBooking.taxAmount),
            taxcode: queuedBooking.taxCode,
            shippingOrderId: queuedBooking.shippingOrderId,
            commissionCollected: toMoney(Dinero(price).percentage(commissionRate).toUnit()),
          } as Transaction);
        } else if (isProduct(queuedBooking.booking.item)) {
          transactions.push({
            type: TransactionType.PURCHASE,
            status: TransactionStatus.COMPLETED,
            createdAt: moment().unix(),
            amount: queuedBooking.booking.item.price,
            sender: transactionSender,
            receiver: transactionReceiver,
            purchaseItem: queuedBooking.booking.item,
            boomAccountID: queuedBooking.boomAccountID.toString(),
            booking: preparedBooking,
            salestax: toMoney(queuedBooking.taxAmount),
            taxcode: queuedBooking.taxCode,
            shippingOrderId: queuedBooking.shippingOrderId,
            commissionCollected: toMoney(Dinero(price).percentage(commissionRate).toUnit()),
          } as Transaction);
        } else {
          throw new Error(TransactionResponseMessages.ERROR);
        }

        this.logger.debug('Transactions prepared. Will save to DB...');
        console.log('cehck232', transactions);
        const createdTransactions = await this.transactionRepository.createAll(
          transactions,
          process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
        );

        if (!createdTransactions) throw new Error(TransactionResponseMessages.ERROR);
        dbCreatedTransaction = createdTransactions;

        this.logger.debug(`created transactions count is ${createdTransactions.length}`);

        this.logger.debug('Transactions saved to DB. Will update booking statuses');

        for (const otherQueuedBooking of queuedBookings) {
          const updatedBooking: Booking = {
            ...otherQueuedBooking.booking,
            status: BookingStatus.USED,
          } as Booking;

          this.logger.debug(
            `Booking with ID of: ${updatedBooking._id} will be updated to a status of ${updatedBooking.status}`
          );
          this.logger.debug(`Will now save updated bookings and boomcards to DB...`);

          await this.bookingRepository.updateById(
            updatedBooking._id,
            updatedBooking,
            process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
          );
          this.logger.debug(`Update to DB successful, adding booking to succeeded list...`);
        }
      }
      // console.log('cehcktrans', dbCreatedTransaction[0], dbCreatedTransaction[1]);
      const check = dbCreatedTransaction.map((x) => {
        x.updatedAt = 1678676809;
        return x;
      });
      console.log('lastcehck', check);
      // const newtrans = dbCreatedTransaction[0];
      const orderHistoric: Order = { ...order, transactions: check } as Order;
      console.log('orderHistoric', orderHistoric);

      const createOrderResponse = await this.orderService
        .create(orderHistoric)
        .then((response) => {
          console.log('responsedfda', response);
          return response;
        })
        .catch((error) => {
          console.log('erro212r', error);
          return error;
        });
      if (!createOrderResponse.success) throw new Error(createOrderResponse.message);

      return {
        success: true,
        message: PurchaseResponseMessages.COMPLETED,
      };
    } catch (error) {
      this.logger.error(error);
      throw new Error(PurchaseResponseMessages.FAILURE);
    }
  }
}
