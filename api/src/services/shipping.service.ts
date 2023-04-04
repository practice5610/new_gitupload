import {
  AddressInfo,
  AddressValidationResponse,
  AllOptionalExceptFor,
  APIResponse,
  dineroToMoney,
  isOffer,
  MassUnit,
  Parcel,
  Rate,
  RateAttributes,
  ShipmentExtras,
  ShipmentMethod,
  ShippingOrderStatus,
  ShippoAddressResponse,
  ShippoLabelType,
  ShippoRateResponse,
  ShippoRefundResponse,
  ShippoShipmentResponse,
  ShippoTransaction,
  ShippoTransactionResponse,
  toMoney,
} from '@boom-platform/globals';
import { IsolationLevel, Options, repository } from '@loopback/repository';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { transactional } from 'loopback4-spring';
import moment from 'moment';

import { LoggingCategory } from '../constants';
import { Booking, Offer, Product, ShippingPolicy } from '../models';
import {
  ShippingBoxRepository,
  ShippingOrderRepository,
  ShippingPolicyRepository,
} from '../repositories';
import {
  Boxes,
  BoxItem,
  Groups,
  MerchantTotals,
  OrderGroup,
  ParcelData,
  ParcelGroups,
  ShippingPolicyList,
  Weight,
} from '../types';

const shippo = require('shippo')(process.env.SHIPPO_API_KEY);

export class ShippingService {
  logger: Logger = getLogger(LoggingCategory.SHIPPING);
  constructor(
    @repository(ShippingOrderRepository)
    public shippingOrderRepository: ShippingOrderRepository,
    @repository(ShippingPolicyRepository)
    public shippingPolicyRepository: ShippingPolicyRepository,
    @repository(ShippingBoxRepository)
    public shippingBoxRepository: ShippingBoxRepository
  ) {}

  /**
   *  Validates an address, returns the address as it is stored in shippo and messages with warnings or
   *  errors.
   *  @param address the address to be validated
   */
  async validateAddress(
    address: AllOptionalExceptFor<
      AddressInfo,
      'name' | 'street1' | 'city' | 'state' | 'zip' | 'country'
    >
  ): Promise<APIResponse<AddressValidationResponse>> {
    const response: ShippoAddressResponse = await shippo.address.create({
      name: address.name,
      street_no: address?.number,
      street1: address.street1,
      street2: address?.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      validate: true,
    });

    if (!response?.validation_results) {
      return {
        success: false,
        message: 'Validation Failed',
      };
    }

    if (!response.validation_results.is_valid) {
      return {
        success: true,
        data: {
          is_valid: false,
          messages: response.validation_results?.messages?.length
            ? response.validation_results.messages
            : undefined,
        },
        message: 'Failed',
      };
    }

    const validatedAddress: AddressInfo = {
      object_id: response.object_id,
      name: response.name,
      number: response.street1.split(' ')[0],
      street1: response.street1.substring(response.street1.indexOf(' ') + 1),
      street2: response.street2,
      city: response.city,
      state: response.state,
      zip: response.zip,
      country: response.country,
      is_complete: response.is_complete,
    };

    return {
      success: true,
      data: {
        address: validatedAddress,
        is_valid: true,
        messages: response.validation_results?.messages?.length
          ? response.validation_results.messages
          : undefined,
      },
      message: 'success',
    };
  }

  /**
   * gets rates for a shipment
   *
   * @param shipToAddressId the object_id of the address being shipped to
   * @param addressFrom the object_id of the address being shipped from
   * @param parcels a list of parcels in the shipment
   * @param extra this is where things like required signature or contains alcohol can be specified
   * @param returnAll set this to true to get every rate. by default this will only return 1-3 of the best rates
   * @param shipmentMethods a list of the service levels to return
   */
  async getRates(
    shipToAddressId: string,
    shipFromAddressId: string,
    parcels: Parcel[],
    extra?: ShipmentExtras,
    returnAll?: boolean,
    shipmentMethods?: ShipmentMethod[]
  ): Promise<APIResponse<Rate[]>> {
    const response: ShippoShipmentResponse = await shippo.shipment.create({
      address_to: shipToAddressId,
      address_from: shipFromAddressId,
      parcels: parcels,
      extra: extra,
      async: false,
    });
    console.log('checkresponseerate ', response);
    if (!response?.rates) {
      return { success: false, message: 'No rates found' };
    }

    let rates: Rate[];
    if (returnAll) {
      rates = response.rates.map((rate: ShippoRateResponse) => {
        return {
          shippo_id: rate.object_id,
          attributes: rate.attributes,
          amount: toMoney(rate.amount),
          provider: rate.provider,
          service: rate.servicelevel?.name ?? '',
          service_token: rate.servicelevel?.token ?? '',
          estimated_days: rate.estimated_days,
          duration_terms: rate.duration_terms,
        };
      });
    } else {
      // If no service levels were provided, default to UPS 3 day and UPS next day air saver
      if (!shipmentMethods?.length) {
        shipmentMethods = [ShipmentMethod.UPS_3_DAY, ShipmentMethod.UPS_NEXT_DAY_AIR_SAVER];
      }

      rates = response.rates
        .map((rate: ShippoRateResponse) => {
          if (rate.attributes.includes(RateAttributes.CHEAPEST)) {
            return {
              shippo_id: rate.object_id,
              attributes: rate.attributes,
              amount: toMoney(rate.amount),
              provider: rate.provider,
              service: rate.servicelevel?.name ?? '',
              service_token: rate.servicelevel?.token ?? '',
              estimated_days: rate.estimated_days,
              duration_terms: rate.duration_terms,
            };
          }
          // return the rate if it is in the list of service levels
          else if (rate.servicelevel?.token && shipmentMethods?.includes(rate.servicelevel.token)) {
            return {
              shippo_id: rate.object_id,
              attributes: rate.attributes,
              amount: toMoney(rate.amount),
              provider: rate.provider,
              service: rate.servicelevel?.name ?? '',
              service_token: rate.servicelevel?.token ?? '',
              estimated_days: rate.estimated_days,
              duration_terms: rate.duration_terms,
            };
          } else {
            return undefined;
          }
        })
        // map turns all the rates we don't want into undefined so we filter them out
        .filter((element: Rate | undefined) => {
          return element !== undefined;
        }) as Rate[];
    }

    //sort from cheapest to most expensive for front end
    rates.sort((a, b) => {
      return a.amount.amount - b.amount.amount;
    });

    return { success: true, message: 'success', data: rates };
  }

  /**
   * Retrieves rate details for a given rate
   * @param id the Shippo id of the rate
   */
  async getRate(id: string): Promise<Rate> {
    const response: ShippoRateResponse = await shippo.rate.retrieve(id);

    return {
      shippo_id: response.object_id,
      attributes: response.attributes,
      amount: toMoney(response.amount),
      provider: response.provider,
      service: response.servicelevel?.name ?? '',
      service_token: response.servicelevel?.token ?? '',
      estimated_days: response.estimated_days,
      duration_terms: response.duration_terms,
    };
  }

  /**
   * Purchase lables from a rate. Create a ShippingOrder with the new shipping info
   * @param rate rate to purchase
   * @param purchaser the uid of the account paying for shipping
   * @param labelFileType file type for label. Default is set in shippo settings
   *
   * @returns the _id of the new ShippingOrder
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async purchase(
    shippoRateId: string,
    purchaserId: string,
    labelFileType?: ShippoLabelType,
    options?: Options
  ): Promise<APIResponse<string>> {
    const rateDetails: Rate = await this.getRate(shippoRateId);

    const shippingOrder = await this.shippingOrderRepository.create(
      {
        createdAt: moment().utc().unix(),
        updatedAt: moment().utc().unix(),
        price: rateDetails.amount,
        purchaser: purchaserId,
      },
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    if (!shippingOrder?._id) {
      throw new Error('Error creating Shipping Order');
    }

    const response: ShippoTransactionResponse = await shippo.transaction.create({
      rate: shippoRateId,
      label_file_type: labelFileType,
      async: false,
    });

    if (response?.status === 'SUCCESS') {
      try {
        await this.shippingOrderRepository.updateById(shippingOrder._id, {
          updatedAt: moment().utc().unix(),
          trackingNumber: response.tracking_number,
          trackingLink: response.tracking_url_provider,
          shippo_id: response.object_id,
          status: ShippingOrderStatus.PAID,
        });
      } catch (error) {
        // Log the error and continue, we dont want to roll back after shipping is purchased from shippo
        this.logger.error(error.message);
        this.logger.error(`Shipping Order ${shippingOrder._id} failed to update:
        |  updatedAt: ${moment().utc().unix()},
        |  trackingNumber: ${response.tracking_number},
        |  trackingLink: ${response.tracking_url_provider},
        |  shippo_id: ${response.object_id},
        |  status: ${ShippingOrderStatus.PAID},`);
      }

      return { success: true, message: 'ShippingOrder id', data: shippingOrder._id.toString() };
    }

    this.logger.error('Error purchasing shippo rate' + shippoRateId);
    this.logger.error(response?.messages);

    // throw error to roll back Shipping Order create
    throw new Error('shipping purchase service error');
  }

  /**
   * This retrieves a shippo transaction and returns the info in a useful way
   *
   * @param id id of the ShippoTransaction
   */
  async getTransaction(id: string): Promise<APIResponse<ShippoTransaction>> {
    const response: ShippoTransactionResponse = await shippo.transaction.retrieve(id);

    if (!response) return { success: false, message: 'Shippo transaction not found' };

    return {
      success: true,
      message: 'success',
      data: {
        status: response.status,
        createdAt: moment(response.object_created).utc().unix(),
        updatedAt: moment(response.object_updated).utc().unix(),
        shippo_id: response.object_id,
        rate: response.rate,
        label_url: response.label_url,
        eta: response?.eta ? Date.parse(response?.eta) : null,
        ...(response?.metadata && { metadata: response.metadata }),
        ...(response?.tracking_number && { tracking_number: response.tracking_number }),
        ...(response?.tracking_status && { tracking_status: response.tracking_status }),
        ...(response?.tracking_url_provider && {
          tracking_url_provider: response.tracking_url_provider,
        }),
      } as ShippoTransaction,
    };
  }

  /**
   * get all label urls for a transaction
   * First it gets the transaction for the given shippo_id, then it uses the
   * rate from the transaction to get all of the labels
   *
   * @param transaction shippo_id of the transaction the label belongs to
   */
  async getLabels(transaction: string): Promise<APIResponse<string[]>> {
    const fullTransaction: APIResponse<ShippoTransaction> = await this.getTransaction(transaction);

    if (!fullTransaction.success || !fullTransaction?.data)
      return { success: false, message: 'Labels not found' };

    const transactions = await shippo.transaction.list({ rate: fullTransaction.data.rate });

    if (!transactions?.results?.length) {
      return { success: false, message: 'Labels not found' };
    }

    return {
      success: true,
      message: 'List of label urls',
      data: transactions.results.map((trans: { label_url: string }) => {
        return trans.label_url;
      }),
    };
  }

  /**
   * Attempts to refund an unused label (transaction). Returns success: true if
   * successful, throws if not successful
   *
   * This function executes in this specific order because if shippo fails, we want to roll back the
   * ShippingOrder to not be refund pending. BUT if we just update the ShippingOrder after the refund
   * request goes through and the update fails, we have no way to track that a refund is in progress.
   * So we update to refund pending, then do the refund. If it fails we roll back. If it succeeds we
   * try to update ShippingOrder to success. If it is pending or queued we leave the ShippingOrder as
   * REFUND_PENDING
   *
   * @param transaction shippo_id for the transaction
   */
  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async refund(transaction: string, options?: Options): Promise<APIResponse<string>> {
    const shippingOrder = await this.shippingOrderRepository.find(
      { where: { shippo_id: transaction } },
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    if (shippingOrder.length) {
      await this.shippingOrderRepository.updateById(
        shippingOrder[0]._id,
        { updatedAt: moment().utc().unix(), status: ShippingOrderStatus.REFUND_PENDING },
        process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
      );
    }

    const response: ShippoRefundResponse = await shippo.refund.create({
      transaction: transaction,
      async: false,
    });

    if (!response?.status) {
      throw new Error('Refund failed');
    }
    if (response?.status === 'ERROR') {
      throw new Error('Refund failed, label has been used');
    }
    if (shippingOrder.length && response?.status === 'SUCCESS') {
      try {
        await this.shippingOrderRepository.updateById(shippingOrder[0]._id, {
          updatedAt: moment().utc().unix(),
          status: ShippingOrderStatus.REFUNDED,
        });
      } catch (error) {
        this.logger.error(`Error updating shipping order ${shippingOrder?.[0]._id} to REFUNDED`);
      }
    }
    return { success: true, message: `Refund ${response.status}`, data: transaction };
  }

  /**
   * This takes a list of bookings, splits them into shipable bookings (if any have too much quantity),
   * groups those by their ShippingPolicy and the place they ship from, further groups those into the
   * boxes they will be shipped in, then gets rates for each group of boxes that are shipped by the
   * same person
   *
   * @param bookings
   * @param shipToAddressId
   */
  async optimizeCart(
    bookings: Booking[],
    shipToAddressId: string
  ): Promise<APIResponse<{ orderGroups: OrderGroup[]; failedBookings: Booking[] }>> {
    const shippingPolicyList: ShippingPolicyList = await this.getShippingPolicies(bookings);
    const splitBookings: Booking[] = this.splitBookings(bookings);
    const {
      groupedBookings,
      pickUpOrders,
      failedBookings,
    }: {
      groupedBookings: Groups;
      pickUpOrders: OrderGroup[];
      failedBookings: Booking[];
    } = await this.groupBookings(splitBookings, shippingPolicyList);
    const merchantTotals: MerchantTotals = this.addMerchantTotals(splitBookings);

    const parcelGroups: ParcelGroups[] = this.createParcelGroups(
      groupedBookings,
      shippingPolicyList
    );
    const orderGroups: OrderGroup[] = await this.createOrderGroups(
      merchantTotals,
      parcelGroups,
      shipToAddressId
    );

    return {
      success: true,
      message:
        'Bookings that ship together share a group with a list of rate options for that group',
      data: { orderGroups: [...pickUpOrders, ...orderGroups], failedBookings: failedBookings },
    };
  }

  /////////////////////////////////
  // Helper Functions
  //////////////////////////

  /**
   * this gets the product out of a booking so we don't have to constantly
   * check if things are offers or products
   * @param booking the booking to get a product from
   */
  getProduct(booking: Booking): Product {
    if (isOffer(booking.item)) {
      return (booking.item as Offer).product;
    } else {
      return booking.item as Product;
    }
  }

  /**
   * This adds the total money being spent per merchant. This is used to see
   * if customers are spending enough to hit free shipping thresholds
   * @param bookings
   */
  addMerchantTotals(bookings: Booking[]): MerchantTotals {
    const totals: MerchantTotals = {} as MerchantTotals;
    bookings.forEach((booking) => {
      const product: Product = this.getProduct(booking);
      if (totals[product.merchantUID] === undefined) {
        totals[product.merchantUID] = { amount: 0, precision: 0, currency: 'USD', symbol: '$' };
      }
      totals[product.merchantUID] = dineroToMoney(
        Dinero(totals[product.merchantUID]).add(
          Dinero(product.price).multiply(booking.quantity ?? 1)
        )
      );
    });
    return totals;
  }

  /**
   * Gets the total weight from a booking. If the booking's product is missing packageDetails this returns 0 grams
   * @param booking
   */
  getBookingWeight(booking: Booking): Weight {
    const product: Product = this.getProduct(booking);
    if (!product.packageDetails) {
      return { value: 0, unit: MassUnit.GRAM };
    }
    return {
      value: (booking.quantity ?? 1) * product.packageDetails.weight,
      unit: product.packageDetails.massUnit,
    };
  }

  /**
   * This adds two weights of possible different units and returns the combined weight. If the units
   * do not match the weight is returned in grams.
   * @param w1
   * @param w2
   */
  addWeights(w1: Weight, w2: Weight): Weight {
    // if one weight is undefined, return the other one
    if ((!w1 || !w2) && !(w1 && w2)) {
      if (!w1 && !w2) {
        return { value: 0, unit: MassUnit.GRAM };
      }
      return w1 || w2;
    }
    // if a weight is ZERO return the other. This is used to preserve the units of the non-zero weight
    if (w1.value === 0) return w2;
    if (w2.value === 0) return w1;

    interface GramConversionDictionary {
      [index: string]: number;
    }
    const convertToGram = {} as GramConversionDictionary;
    convertToGram[MassUnit.GRAM] = 1;
    convertToGram[MassUnit.OUNCE] = 28.3495;
    convertToGram[MassUnit.POUND] = 453.592000004704;
    convertToGram[MassUnit.KILO] = 1000;

    if (w1.unit === w2.unit) {
      return { value: w1.value + w2.value, unit: w1.unit };
    }
    return {
      value: w1.value * convertToGram[w1.unit] + w2.value * convertToGram[w2.unit],
      unit: MassUnit.GRAM,
    };
  }

  /**
   * Checks a ShippingPolicy and returns the shipping methods to be offered (including any free methods)
   * @param moneyTotals the total amount of money being spent by merchant
   * @param policy
   */
  chooseShipmentMethods(moneyTotals: MerchantTotals, policy: ShippingPolicy): ShipmentMethod[] {
    if (policy.flatRate) {
      return [ShipmentMethod.SELF_SHIP];
    }

    // Not sure what the best way to handle default methods is
    const chosenMethods = [ShipmentMethod.UPS_GROUND, ShipmentMethod.UPS_NEXT_DAY_AIR_SAVER];
    if (!policy.merchantId || !moneyTotals[policy.merchantId] || !policy.freeShippingThresholds) {
      return chosenMethods;
    }

    chosenMethods.push(...this.getFreeShipmentMethods(moneyTotals, policy));

    // remove duplicates if a free service overlaps with a default one
    return [...new Set(chosenMethods)];
  }

  getFreeShipmentMethods(moneyTotals: MerchantTotals, policy: ShippingPolicy): ShipmentMethod[] {
    const freeMethods: ShipmentMethod[] = [];

    if (!policy.freeShippingThresholds) {
      return freeMethods;
    }
    policy.freeShippingThresholds.forEach((element) => {
      if (Dinero(moneyTotals[policy.merchantId]).greaterThanOrEqual(Dinero(element.amountSpent))) {
        freeMethods.push(element.freeService);
      }
    });

    return freeMethods;
  }

  /**
   * Groups a list of bookings into units that are shipped from the same
   * address with the same shipping policy
   *
   * Non shippable bookings are grouped by the shipping policy ID only
   * @param bookings
   */
  async groupBookings(
    bookings: Booking[],
    policies: ShippingPolicyList
  ): Promise<{ groupedBookings: Groups; pickUpOrders: OrderGroup[]; failedBookings: Booking[] }> {
    // this creates the index for each "group". a group is defined as shipping from the same
    // address and having the same shipping policy
    function getGroupID(p: Product) {
      return p.packageDetails?.shipsFrom + p.shippingPolicy;
    }

    const groups = {} as Groups;
    const boxes = {} as Boxes;
    const failedBookings: Booking[] = [];
    interface PickUpBookings {
      [index: string]: { bookings: Booking[]; storeName: string | undefined };
    }
    const pickUpBookings: PickUpBookings = {};
    for (const booking of bookings) {
      const product: Product = this.getProduct(booking);

      if (!product.shippingPolicy) {
        failedBookings.push(booking);
        continue;
      }

      if (policies[product.shippingPolicy].pickUpOnly) {
        if (pickUpBookings[product.shippingPolicy] === undefined) {
          pickUpBookings[product.shippingPolicy] = {
            bookings: [],
            storeName: product.store.companyName,
          };
        }
        pickUpBookings[product.shippingPolicy].bookings.push(booking);
        continue;
      }

      // If we get here, the product is being shipped so we need package details
      if (!product.packageDetails) {
        failedBookings.push(booking);
        continue;
      }

      //Get the box details
      if (boxes[product.packageDetails.boxId] === undefined) {
        try {
          const box = await this.shippingBoxRepository.findById(product.packageDetails.boxId);

          boxes[product.packageDetails.boxId] = {
            height: box.height,
            width: box.width,
            length: box.length,
            distanceUnit: box.unit,
          };
        } catch (error) {
          this.logger.error(`Failed to find Shipping Box ${product.packageDetails.boxId}`);
          failedBookings.push(booking);
          continue;
        }
      }

      //initialize the group for this product if it doesn't exist yet
      if (groups[getGroupID(product)] === undefined) {
        groups[getGroupID(product)] = {};
      }

      // create a BoxGroup within the current group and add the booking to it.
      // All bookings within a Group come from the same address and have the same
      // ShippingPolicy. Each booking within a BoxGroup belong to the same Group but also
      // share the same box type
      if (groups[getGroupID(product)][product.packageDetails.boxId] === undefined) {
        groups[getGroupID(product)][product.packageDetails.boxId] = {
          items: [
            {
              booking: booking,
              weight: this.getBookingWeight(booking),
              boxFill: (booking.quantity ?? 1) / product.packageDetails.itemsPerBox,
            },
          ],
          distanceUnit: boxes[product.packageDetails.boxId].distanceUnit,
          width: boxes[product.packageDetails.boxId].width,
          length: boxes[product.packageDetails.boxId].length,
          height: boxes[product.packageDetails.boxId].height,
        };
      }
      // else add the current booking to the existing boxGroup it belongs to
      else {
        groups[getGroupID(product)][product.packageDetails.boxId].items.push({
          booking: booking,
          weight: this.getBookingWeight(booking),
          boxFill: (booking.quantity ?? 1) / product.packageDetails.itemsPerBox,
        });
      }
    }

    const pickUpOrders: OrderGroup[] = [];
    for (const key in pickUpBookings) {
      // merchant is set to store name if it exists, else nothing?
      pickUpOrders.push({
        store: pickUpBookings[key].storeName ?? '',
        shippable: false,
        rates: [],
        bookings: pickUpBookings[key].bookings,
      });
    }

    return { groupedBookings: groups, pickUpOrders, failedBookings };
  }

  /**
   * reduce the BoxGroups data into the total boxes needed and each of those boxes final weight
   * @param groups
   */
  createParcelGroups(groups: Groups, policies: ShippingPolicyList): ParcelGroups[] {
    const parcelGroups: ParcelGroups[] = [];

    for (const group in groups) {
      let policy: ShippingPolicy | undefined = undefined;
      const parcels: ParcelData[] = [];
      for (const boxGroup in groups[group]) {
        const CAPACITY = 1;
        let currentFill = 0;
        const ZERO_WEIGHT: Weight = { value: 0, unit: MassUnit.GRAM };
        let totalWeight: Weight = ZERO_WEIGHT;
        let bookingsList: Booking[] = [];

        // Sort groups[group][boxGroup].booking to put hardest elements to place first
        groups[group][boxGroup].items.sort((a: BoxItem, b: BoxItem) => {
          return b.boxFill - a.boxFill;
        });

        groups[group][boxGroup].items.forEach((item) => {
          if (policy === undefined) {
            policy = policies[this.getProduct(item.booking).shippingPolicy];
          }

          if (currentFill + item.boxFill <= CAPACITY) {
            currentFill += item.boxFill;
            totalWeight = this.addWeights(totalWeight, item.weight);
            bookingsList.push(item.booking);
          } else {
            parcels.push({
              bookings: bookingsList,
              weight: totalWeight.value,
              weightUnit: totalWeight.unit,
              distanceUnit: groups[group][boxGroup].distanceUnit,
              length: groups[group][boxGroup].length,
              width: groups[group][boxGroup].width,
              height: groups[group][boxGroup].height,
            });
            bookingsList = [item.booking];
            totalWeight = item.weight;
            currentFill = item.boxFill;
          }
        });

        parcels.push({
          bookings: bookingsList,
          weight: totalWeight.value,
          weightUnit: totalWeight.unit,
          distanceUnit: groups[group][boxGroup].distanceUnit,
          length: groups[group][boxGroup].length,
          width: groups[group][boxGroup].width,
          height: groups[group][boxGroup].height,
        });
      }

      /**
       * We now have the total boxes and total weights that are shipping from this location
       */
      if (policy) parcelGroups.push({ parcels: parcels, policy: policy });
    }
    return parcelGroups;
  }

  /**
   * Now that we have the ideal groups of packages with their total weight figured out, we try to get
   * rates for them. If we can't get a group rate on a ParcelGroup, we have to try to get rates for
   * each item in the ParcelGroup. If any of those items can't get a rate for some reason, we fall back
   * on some error rate we can show the customer (like $8 maybe?)
   *
   * @param moneyTotals list of total money spent per merchant
   * @param parcelGroups the ideal groups of items that would ship together
   *
   * @returns a list that groups the bookings that are shipping together with their rate options
   */
  async createOrderGroups(
    moneyTotals: MerchantTotals,
    parcelGroups: ParcelGroups[],
    shipToAddressId: string
  ): Promise<OrderGroup[]> {
    const orderGroups: OrderGroup[] = [];
    for (const element of parcelGroups) {
      const methods: ShipmentMethod[] = this.chooseShipmentMethods(moneyTotals, element.policy);
      const policy = element.policy;
      const parcels: Parcel[] = element.parcels.map((p: ParcelData) => {
        return {
          length: p.length,
          weight: p.weight,
          height: p.height,
          width: p.width,
          distance_unit: p.distanceUnit,
          mass_unit: p.weightUnit,
        } as Parcel;
      });
      // any bookings whos products packageDetails are undefined would have been filtered out in the groupOrders step so this is safe
      const addressFrom = (
        this.getProduct(element.parcels[0].bookings[0]) as AllOptionalExceptFor<
          Product,
          'packageDetails'
        >
      ).packageDetails.shipsFrom;
      let rates: APIResponse<Rate[]>;
      if (policy.flatRate) {
        let numberOfItems = 0;
        element.parcels.forEach((par) => {
          par.bookings.forEach((b) => {
            numberOfItems += b.quantity ?? 1;
          });
        });
        rates = {
          success: true,
          message: 'Flat rate set by merchant',
          data: [
            {
              amount: { ...policy.flatRate, amount: policy.flatRate.amount * numberOfItems },
              shippo_id: '',
              attributes: [RateAttributes.SELF_SHIP],
              provider: '',
              service_token: '',
              service: '',
              estimated_days: -1,
              duration_terms: '',
            },
          ],
        };
      } else {
        rates = await this.getRates(
          shipToAddressId,
          addressFrom,
          parcels,
          undefined,
          undefined,
          methods
        );
      }

      if (!rates?.success) {
        let parcelIndex = 0;
        for (const p of parcels) {
          let individualRate: APIResponse<Rate[]> = await this.getRates(
            shipToAddressId,
            addressFrom,
            [p],
            undefined,
            undefined,
            methods
          );
          if (!individualRate?.success) {
            // Try getting rates without a shipmentMethods param if previous didn't work
            individualRate = await this.getRates(shipToAddressId, addressFrom, [p]);
          }
          if (!individualRate?.success) {
            // create a fake rate response if no rates were found
            individualRate = { data: [], success: false, message: 'Error: No Rate Found' };
          }

          const freeRates = this.getFreeShipmentMethods(moneyTotals, policy);
          if (individualRate.data) {
            individualRate.data = individualRate.data?.map((r) => {
              if (freeRates.includes(r.service_token as ShipmentMethod)) {
                return {
                  ...r,
                  attributes: [RateAttributes.FREE_SHIPPING],
                  amount: toMoney(0),
                };
              }
              return r;
            });
          }

          // merchant is set to the store name or empty string
          orderGroups.push({
            store: this.getProduct(element.parcels?.[0].bookings?.[0]).store.companyName ?? '',
            rates: individualRate?.data ?? [],
            bookings: element.parcels[parcelIndex].bookings,
            shippable: true,
          });
          parcelIndex++;
        }
      } else {
        const freeRates = this.getFreeShipmentMethods(moneyTotals, policy);
        if (rates.data) {
          rates.data = rates.data?.map((r) => {
            if (freeRates.includes(r.service_token as ShipmentMethod)) {
              return {
                ...r,
                attributes: [RateAttributes.FREE_SHIPPING],
                amount: toMoney(0),
              };
            }
            return r;
          });
        }
        const bookings: Booking[] = [];
        let storeName: string = '';
        parcels.forEach((p, index) => {
          element.parcels[index].bookings.forEach((e) => {
            if (storeName === '') {
              storeName = this.getProduct(e).store.companyName ?? '';
            }
            bookings.push(e);
          });
        });
        orderGroups.push({
          store: storeName,
          rates: rates?.data ?? [],
          bookings: bookings,
          shippable: true,
        });
      }
    }

    return orderGroups;
  }

  /**
   * This splits bookings that have too high of a quantity to ship together into smaller bookings
   * @param bookings
   */
  splitBookings(bookings: Booking[]): Booking[] {
    const newBookings: Booking[] = [];

    bookings.forEach((booking) => {
      const product: Product = this.getProduct(booking);
      let quantity = booking.quantity ?? 1;

      if (!product.packageDetails?.itemsPerBox) {
        return newBookings.push(booking);
      }
      while (quantity > product.packageDetails.itemsPerBox) {
        quantity -= product.packageDetails.itemsPerBox;
        newBookings.push({ ...booking, quantity: product.packageDetails.itemsPerBox } as Booking);
      }
      newBookings.push({ ...booking, quantity: quantity } as Booking);
    });

    return newBookings;
  }

  async getShippingPolicies(bookings: Booking[]): Promise<ShippingPolicyList> {
    const policyList: ShippingPolicyList = {};
    for (const element of bookings) {
      const product: Product = this.getProduct(element);
      if (!product.shippingPolicy) {
        continue;
      }
      if (policyList[product.shippingPolicy] === undefined) {
        try {
          const policy: ShippingPolicy = await this.shippingPolicyRepository.findById(
            product.shippingPolicy
          );
          policyList[product.shippingPolicy] = policy;
        } catch (error) {
          this.logger.error(
            `Shipping policy ${product.shippingPolicy} for product ${product._id} was not found.`
          );
        }
      }
    }
    return policyList;
  }
}
