import {
  AddressInfo,
  AddressValidationResponse,
  AllOptionalExceptFor,
  APIResponse,
  BoomUser,
  EstimateRateRequest,
  GetRatesRequest,
  PurchaseRateRequest,
  Rate,
  RoleKey,
  ShippoTransaction,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  HttpErrors,
  param,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { getLogger, Logger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { authorize } from '../authorization';
import { AuthorizatonBindings } from '../authorization';
import {
  APIResponseMessages,
  LoggingCategory,
  ServiceResponseCodes,
  ShippingErrorMessages,
} from '../constants';
import { ShippingBox, ShippingOrder, ShippingPolicy } from '../models';
import {
  ShippingBoxRepository,
  ShippingOrderRepository,
  ShippingPolicyRepository,
} from '../repositories';
import { ShippingService } from '../services';
import {
  GETShippingBoxSpecification,
  GETShippingLabelsSpecification,
  GETShippingOrderSpecification,
  GETShippingPolicySpecification,
  GETShippoTransactionSpecification,
  POSTAddressValidationRequestBody,
  POSTAddressValidationSpecification,
  POSTEstimateShippingRequestBody,
  POSTEstimateShippingSpecification,
  POSTGetRatesRequestBody,
  POSTGetRatesSpecification,
  POSTPurchaseRateRequestBody,
  POSTPurchaseRateSpecification,
  POSTRefundShippingRequestBody,
  POSTRefundShippingSpecification,
  POSTShippingBoxRequestBody,
  POSTShippingBoxSpecification,
  POSTShippingCheckoutRequestBody,
  POSTShippingCheckoutSpecification,
  POSTShippingPolicyRequestBody,
  POSTShippingPolicySpecification,
} from '../specifications/';
import { ShippingCheckoutRequest } from '../types';

export class ShippingController {
  logger: Logger = getLogger(LoggingCategory.DEFAULT);

  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @repository(ShippingOrderRepository)
    public shippingOrderRepository: ShippingOrderRepository,
    @repository(ShippingPolicyRepository)
    public shippingPolicyRepository: ShippingPolicyRepository,
    @repository(ShippingBoxRepository)
    public shippingBoxRepository: ShippingBoxRepository,
    @service(ShippingService)
    public shippingService: ShippingService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  /**
   * Validate an address and add it to shippo
   * @param address
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/validate', POSTAddressValidationSpecification)
  async validate(
    @requestBody(POSTAddressValidationRequestBody)
    address: AllOptionalExceptFor<
      AddressInfo,
      'name' | 'street1' | 'city' | 'state' | 'zip' | 'country'
    >
  ): Promise<Response> {
    try {
      const res: APIResponse<AddressValidationResponse> =
        await this.shippingService.validateAddress(address);
      if (!res.success || !res?.data) {
        // TODO: handleServiceResponseResult should be used here in the future and replace this
        throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
      }
      return this.response.status(ServiceResponseCodes.SUCCESS).send(res); // TODO: change to APIResponse format
    } catch (error) {
      this.logger.error(error);
      if (HttpErrors.isHttpError(error)) throw error;
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * get rates from specific packages to a specific destination
   *
   * @param body.addressTo the shippo id of the address
   * @param body.addressFrom the shippo id of the address
   * @param body.parcels a list of all parcels to ship
   * @param body.extra extra shipping options, like signature required
   * @param body.returnAll true if you want to return all rates
   * @param body.shipmentMethods a list of services to be included in the rates returned. If
   *                            this is set, ONLY the cheapest rate and the rates listed will be returned
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/rates', POSTGetRatesSpecification)
  async getRates(
    @requestBody(POSTGetRatesRequestBody)
    body: GetRatesRequest
  ): Promise<Response> {
    try {
      const { shipToAddressId, shipFromAddressId, parcels, extra, returnAll, shipmentMethods } =
        body;

      const rates: APIResponse<Rate[]> = await this.shippingService.getRates(
        shipToAddressId,
        shipFromAddressId,
        parcels,
        extra,
        returnAll,
        shipmentMethods
      );
      if (rates.success && rates?.data?.length) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(rates);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * purchase a label and return the Shippo transaction object_id
   *
   * @param body.rate the rate to buy
   * @param body.purchaser the uid of the account paying for shipping
   * @param body.labelFileType the file type for the label. Default is set in Shippo settings
   *
   * @returns the _id of the new ShippingOrder
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/purchase', POSTPurchaseRateSpecification)
  async purchase(
    @requestBody(POSTPurchaseRateRequestBody)
    body: PurchaseRateRequest
  ): Promise<Response> {
    try {
      const { shippoRateId, purchaserId, labelFileType } = body;

      const transaction: APIResponse<string> = await this.shippingService.purchase(
        shippoRateId,
        purchaserId,
        labelFileType
      );
      if (transaction.success && transaction.data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(transaction);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get full shippo transaction details for a given shippo transaction or ShippingOrder
   *
   * @param id the shippo_id of the transaction, or the _id of the ShippingOrder
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/shipping/transaction/{id}', GETShippoTransactionSpecification)
  async getTransaction(@param.path.string('id') id: string): Promise<Response> {
    try {
      const order: ShippingOrder[] = await this.shippingOrderRepository.find({
        where: { _id: id },
      });
      const transaction: APIResponse<ShippoTransaction> = await this.shippingService.getTransaction(
        order?.length && order[0]?.shippo_id ? order[0].shippo_id : id
      );

      if (transaction.success && transaction?.data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(transaction);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all labels for a given shippo transaction. There is usually only one
   * label per transaction but sometimes multiple parcels from the same sender can each have
   * a label within the same transaction
   *
   * @param id the shippo_id of the transaction
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/shipping/labels/{id}', GETShippingLabelsSpecification)
  async getLabels(@param.path.string('id') id: string): Promise<Response> {
    try {
      const urls: APIResponse<string[]> = await this.shippingService.getLabels(id);
      if (urls.success && urls?.data?.length) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(urls);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refund an unused label (transaction)
   *
   * @param transaction the shippo transaction to refund (shippo_id)
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/refund', POSTRefundShippingSpecification)
  async refund(@requestBody(POSTRefundShippingRequestBody) transaction: string): Promise<Response> {
    try {
      const refund: APIResponse<string> = await this.shippingService.refund(transaction);
      if (refund.success && refund?.data) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(refund);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    } catch (error) {
      this.logger.error(error);
      if (
        error.type === 'ShippoAPIError' &&
        error.detail.transaction.includes('Refund with this Transaction already exists.')
      ) {
        throw new HttpErrors.BadRequest(ShippingErrorMessages.REFUND_ALREADY_EXISTS);
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Estimate the cost of a shipping service level
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/estimate', POSTEstimateShippingSpecification)
  async estimate(
    @requestBody(POSTEstimateShippingRequestBody)
    body: EstimateRateRequest
  ): Promise<Response> {
    const { parcel, shipmentMethod, to, from } = body;
    try {
      // the default addresses are the boom office in Weston to Tallahassee
      const response: APIResponse<Rate[]> = await this.shippingService.getRates(
        to,
        from,
        [parcel],
        undefined,
        false,
        [shipmentMethod]
      );

      if (response.success && response?.data?.length) {
        const result = response.data.filter((res: Rate) => {
          return res.service_token === shipmentMethod;
        });
        if (result?.length) {
          return this.response
            .status(ServiceResponseCodes.SUCCESS)
            .send({ success: true, message: 'Successful estimate', data: result[0].amount });
        }
      }
      throw new HttpErrors.NotFound('Rate not found');
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * This gets a ShippingOrder document by id
   * @param id _id of the ShippingOrder
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/shipping/order/{id}', GETShippingOrderSpecification)
  async getShippingOrder(@param.path.string('id') id: string): Promise<Response> {
    try {
      const order = await this.shippingOrderRepository.findById(id);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(order);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Post a new ShippingPolicy
   *
   * @param policy new policy to add to database
   */
  @authorize([RoleKey.Admin, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/policy', POSTShippingPolicySpecification)
  async createPolicy(
    @requestBody(POSTShippingPolicyRequestBody) policy: ShippingPolicy
  ): Promise<Response> {
    try {
      const response = await this.shippingPolicyRepository.create({
        ...policy,
        createdAt: moment().utc().unix(),
        updatedAt: moment().utc().unix(),
      });
      return this.response.status(ServiceResponseCodes.SUCCESS).send(response);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a ShippingPolicy by id
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/shipping/policy/{id}', GETShippingPolicySpecification)
  async getShippingPolicy(@param.path.string('id') id: string): Promise<Response> {
    try {
      const policy = await this.shippingPolicyRepository.findById(id);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(policy);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a ShippingPolicies
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @get('/shipping/policies', GETShippingPolicySpecification)
  async findShippingPolicies(
    @param.query.object('filter', getFilterSchemaFor(ShippingPolicy))
    filter?: Filter<ShippingPolicy>
  ): Promise<Response> {
    try {
      const policies = await this.shippingPolicyRepository.find(filter);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'Success', data: policies });
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * organize bookings into shipable groups and get rates for those groups
   */
  @authorize([RoleKey.Admin, RoleKey.Member, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/checkout', POSTShippingCheckoutSpecification)
  async checkout(
    @requestBody(POSTShippingCheckoutRequestBody)
    body: ShippingCheckoutRequest
  ): Promise<Response> {
    const { bookings, shipToAddressId } = body;
    try {
      const response = await this.shippingService.optimizeCart(bookings, shipToAddressId);
      if (response?.success) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(response);
      }
      throw new HttpErrors.InternalServerError('Can not get rates at this time');
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Post a new Shipping Box
   *
   * @param box new shipping box to add to database
   */
  @authorize([RoleKey.Admin, RoleKey.Merchant, RoleKey.SuperAdmin])
  @post('/shipping/box', POSTShippingBoxSpecification)
  async createBox(@requestBody(POSTShippingBoxRequestBody) box: ShippingBox): Promise<Response> {
    try {
      const response = await this.shippingBoxRepository.create({
        ...box,
        createdAt: moment().utc().unix(),
        updatedAt: moment().utc().unix(),
      });
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'success', data: response });
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
  /**
   * Get Shipping Box list
   *
   */
  @authorize([RoleKey.Admin, RoleKey.Merchant, RoleKey.Member, RoleKey.SuperAdmin])
  @get('/shipping/box', GETShippingBoxSpecification)
  async findBox(
    @param.query.object('filter', getFilterSchemaFor(ShippingBox))
    filter?: Filter<ShippingBox>
  ): Promise<Response> {
    try {
      const response: ShippingBox[] = await this.shippingBoxRepository.find(filter);
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'success', data: response });
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
