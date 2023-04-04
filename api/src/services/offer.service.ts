import { repository } from '@loopback/repository';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { OfferResponseMessages, ProductResponseMessages } from '../constants';
import { Offer } from '../models';
import { OfferRepository } from '../repositories';
import { APIResponse } from '../types';
import { APIResponseFalseOutput } from '../utils';
import { ProductService } from './product.service';

export class OfferService {
  constructor(
    @repository(OfferRepository)
    public offerRepository: OfferRepository,
    @service(ProductService)
    public productService: ProductService
  ) {}

  async validateOffer(offer: Offer): Promise<APIResponse> {
    try {
      const now: number = moment().utc().unix();
      // empty offer or empty offer id validation.
      if (!offer || !offer._id) return APIResponseFalseOutput(OfferResponseMessages.INVALID);
      // query offer from our database.
      const dbOffer: Offer = await this.offerRepository.findById(offer._id);
      // unsuccessful query validation.
      if (!dbOffer) return APIResponseFalseOutput(OfferResponseMessages.NO_LONGER_EXIST);
      // expiration date validation
      if (dbOffer.expiration <= now) return APIResponseFalseOutput(OfferResponseMessages.EXPIRED);
      // Offer product validation
      if (!dbOffer.product || !dbOffer.product._id)
        return APIResponseFalseOutput(ProductResponseMessages.INVALID);
      const productValidation: APIResponse = await this.productService.validateProduct(
        offer.product
      );
      if (!productValidation.success) return APIResponseFalseOutput(productValidation.message);

      return {
        success: true,
        message: OfferResponseMessages.VALID,
      };
    } catch (error) {
      if (error.code) return APIResponseFalseOutput(error);
      return APIResponseFalseOutput();
    }
  }
}
