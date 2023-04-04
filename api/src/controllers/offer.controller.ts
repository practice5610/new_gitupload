import { Category, RoleKey } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { Count, CountSchema, Filter, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import Dinero from 'dinero.js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { authorize } from '../authorization';
import { ServiceResponseCodes } from '../constants';
import { Offer, Product, SearchRecordProduct } from '../models';
import { CategoryRepository, OfferRepository, ProductRepository } from '../repositories';
import { SearchEngineService } from '../services/search-engine.service';
import { APIResponse } from '../types';
import { transformGeolocForSearchEngine } from '../utils/transformers';

interface IsValidResponse {
  success: boolean;
  message: string;
}

export class OfferController {
  constructor(
    @repository(OfferRepository)
    public offerRepository: OfferRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @service(SearchEngineService)
    public searchEngineService: SearchEngineService,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository
  ) {}

  async isCategoryValid(category: Category): Promise<IsValidResponse> {
    let response: IsValidResponse = { success: true, message: '' };
    try {
      const result = await this.categoryRepository.findOne({ where: { name: category.name } });
      if (!result) {
        return { success: false, message: `Invalid Category: ${category.name}` };
      }
      if (category.subCategories?.length) {
        category.subCategories.forEach((subcategory) => {
          if (!result.subCategories?.includes(subcategory)) {
            response = { success: false, message: `Invalid Sub Category: ${subcategory}` };
          }
        });
      }
    } catch (error) {
      return { success: false, message: `error looking for this category: ${category.name}` };
    }
    return response;
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/offers', {
    responses: {
      '200': {
        description: 'Offer model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Offer } } },
      },
    },
  })
  async create(@requestBody() offer: Offer): Promise<Offer | Response> {
    const response = await this.isCategoryValid(offer.product.category as Category);
    if (!response.success) {
      return this.response.status(ServiceResponseCodes.SUCCESS).send(response);
    }
    const now: number = moment().utc().unix();

    const result: Offer = await this.offerRepository.create({
      ...offer,
      createdAt: now,
      updatedAt: now,
    });

    const product: Product = await this.productRepository.findById(result.product._id);

    // search product by objectID and update it with offer
    const searchIndexResult: APIResponse = await this.searchEngineService.searchByObjectId(
      process.env.SEARCH_ENGINE_PRODUCTS_INDEX ?? '',
      [product.objectID || '']
    );

    const partialOffer = { ...result };
    //@ts-ignore
    delete partialOffer.product; // remove product from offer

    const currentProduct: Product =
      searchIndexResult.data && searchIndexResult.data.length ? searchIndexResult.data[0] : product;

    const searchProduct: SearchRecordProduct = {
      productID: currentProduct._id,
      categoryName: currentProduct.category.name,
      subCategoryName: currentProduct.category?.subCategories?.join(',') ?? '',
      hasOffer: true,
      ...(product?.store?._geoloc && {
        _geoloc: transformGeolocForSearchEngine(product.store._geoloc),
      }),
      offer: partialOffer,
      priceNum: Dinero(currentProduct.price).toUnit(),
      createdAt: currentProduct.createdAt,
      updatedAt: currentProduct.updatedAt,
      imageUrl: currentProduct.imageUrl,
      merchantUID: currentProduct.merchantUID,
      category: currentProduct.category,
      name: currentProduct.name,
      description: currentProduct.description,
      store: {
        _id: currentProduct.store._id,
        number: currentProduct.store.number,
        street1: currentProduct.store.street1,
        street2: currentProduct.store.street2,
        city: currentProduct.store.city,
        state: currentProduct.store.state,
        zip: currentProduct.store.zip,
        country: currentProduct.store.country,
      },
      price: currentProduct.price,
      attributes: currentProduct.attributes,
      _tags: currentProduct._tags,
    } as SearchRecordProduct;

    // This check was added to get rid of ! usage for lint. I think this should be fine since we need
    // objectID on search engine records.
    if (currentProduct?.objectID && process.env.SEARCH_ENGINE_PRODUCTS_INDEX) {
      const indexResult: APIResponse = await this.searchEngineService.update(
        process.env.SEARCH_ENGINE_PRODUCTS_INDEX,
        currentProduct.objectID,
        searchProduct
      );

      if (!indexResult.success) {
        // There was an error, rolling back...
        await this.offerRepository.deleteById(result._id);
        return this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: false, message: indexResult.message });
      }
    }

    return result;
  }

  @authorize([RoleKey.All])
  @get('/offers/count', {
    responses: {
      '200': {
        description: 'Offer model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Offer)) where?: Where<Offer>
  ): Promise<Count> {
    return this.offerRepository.count(where);
  }

  @authorize([RoleKey.All])
  @get('/offers', {
    responses: {
      '200': {
        description: 'Array of Offer model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Offer } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Offer)) filter?: Filter<Offer>
  ): Promise<Offer[]> {
    return this.offerRepository.find(filter);
  }

  @authorize([RoleKey.All])
  @get('/offers/{id}', {
    responses: {
      '200': {
        description: 'Offer model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Offer } } },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Offer> {
    return this.offerRepository.findById(id);
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/offers/{id}', {
    responses: {
      '204': {
        description: 'Offer PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() incomingOffer: Offer
  ): Promise<void | Response> {
    const existingOffer: Offer = await this.offerRepository.findById(id);
    const existingProduct: Product = await this.productRepository.findById(
      existingOffer.product._id
    );

    if (incomingOffer.product?.category) {
      const response = await this.isCategoryValid(incomingOffer.product.category as Category);
      if (!response.success) {
        return this.response.status(ServiceResponseCodes.SUCCESS).send(response);
      }
    }

    const partialOffer: Offer = { ...incomingOffer } as Offer;
    //@ts-ignore
    delete partialOffer.product; // remove product from offer

    const searchProduct: SearchRecordProduct = {
      hasOffer: true,
      offer: partialOffer,
    } as SearchRecordProduct;

    // This check was added to get rid of ! usage for lint
    if (process.env.SEARCH_ENGINE_PRODUCTS_INDEX && existingProduct.objectID) {
      const indexResult: APIResponse = await this.searchEngineService.update(
        process.env.SEARCH_ENGINE_PRODUCTS_INDEX,
        existingProduct.objectID,
        searchProduct
      );

      if (!indexResult.success) {
        return this.response
          .status(ServiceResponseCodes.SUCCESS)
          .send({ success: false, message: indexResult.message });
      }
    }
    await this.offerRepository.updateById(id, incomingOffer);
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/offers/{id}', {
    responses: {
      '204': {
        description: 'Offer DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void | Response> {
    const existingOffer: Offer = await this.offerRepository.findById(id);

    if (!existingOffer) {
      throw new HttpErrors.NotFound('Could not find offer to delete.');
    }
    const existingProduct: Product = await this.productRepository.findById(
      existingOffer.product._id
    );

    if (!existingProduct) {
      throw new HttpErrors.NotFound('Could not find product of given offer.');
    }

    const indexResult: { success: boolean; error?: string } = await this.searchEngineService.delete(
      existingProduct.objectID
    );
    if (!indexResult.success) {
      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: false, message: indexResult.error });
    }
    await this.offerRepository.deleteById(id);
  }
}
