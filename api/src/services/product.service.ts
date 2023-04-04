import { Category } from '@boom-platform/globals';
import { repository } from '@loopback/repository';
import { Options } from '@loopback/repository';
import Dinero from 'dinero.js';
import { getLogger, Logger } from 'log4js';
import { IsolationLevel, service, transactional } from 'loopback4-spring';

import { LoggingCategory, ProductResponseMessages } from '../constants';
import { Product, SearchRecordProduct } from '../models';
import { CategoryRepository, ProductRepository } from '../repositories';
import { SearchEngineService } from '../services';
import { APIResponse } from '../types';
import { APIResponseFalseOutput, transformGeolocForSearchEngine } from '../utils';

export class ProductService {
  logger: Logger = getLogger(LoggingCategory.PRODUCTS_SERVICE);
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @service(SearchEngineService)
    public searchEngineService: SearchEngineService,
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository
  ) {}

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async deleteById(objectID: string, mongoID: string, options?: Options): Promise<void> {
    await this.productRepository.deleteById(
      mongoID,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    const indexResult: {
      success: boolean;
      message?: string;
    } = await this.searchEngineService.delete(objectID);
    if (!indexResult.success) {
      throw new Error(indexResult.message);
    }
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED }) // TODO: Review if we can remove searchProduct and objectID
  async updateById(
    searchProduct: SearchRecordProduct,
    objectID: string,
    mongoID: string,
    newProduct: Product,
    options?: Options
  ): Promise<void> {
    if (newProduct.category) {
      const isValid: APIResponse = await this.validateCategory(newProduct.category);
      if (!isValid.success) throw new Error(`product ${newProduct.name} has ${isValid.message}`);
    }

    await this.productRepository.updateById(
      mongoID,
      newProduct,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    /**
     * This needs to be updated when new search engine is ready. until then
     * it is commented out because ! causes lint problems
     */
    const indexResult: APIResponse = await this.searchEngineService.update(
      process.env.SEARCH_ENGINE_PRODUCTS_INDEX!,
      objectID,
      searchProduct
    );
    if (!indexResult.success) {
      throw new Error(indexResult.message);
    }
  }

  @transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async create(newProduct: Product, now: number, options?: Options): Promise<Product> {
    const isValid: APIResponse = await this.validateCategory(newProduct.category);
    if (!isValid.success) throw new Error(`product ${newProduct.name} has ${isValid.message}`);
    const result = await this.productRepository.create(
      {
        ...newProduct,
        category: { ...isValid.data, subCategories: newProduct.category.subCategories },
        updatedAt: now,
        createdAt: now,
      },
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    let searchProduct: SearchRecordProduct;
    try {
      searchProduct = {
        id: result._id,
        categoryName: result.category.name,
        subCategoryName: result.category!.subCategories!.join(','),
        hasOffer: false,
        productID: result._id,
        // TODO: Some default location value needs to be set on a constant variable(probably on globals) to use on these cases when no value is available
        _geoloc: transformGeolocForSearchEngine(
          result.store._geoloc?.lat && result.store._geoloc?.lng
            ? result.store._geoloc
            : { lat: 0, lng: 0 }
        ),
        createdAt: result.createdAt,
        updatedAt: now,
        imageUrl: result.imageUrl,
        merchantUID: result.merchantUID,
        price: result.price,
        priceNum: Dinero(result.price).toUnit(),
        name: result.name,
        category: result.category,
        description: result.description,
        attributes: result.attributes,
        _tags: result._tags,
        store: {
          _id: result.store!._id,
          number: result.store.number,
          street1: result.store.street1,
          street2: result.store.street2,
          city: result.store.city,
          state: result.store.state,
          zip: result.store.zip,
          country: result.store.country,
        },
      } as SearchRecordProduct;
    } catch (err) {
      throw new Error(
        `product ${result._id} is missing properties needed to make a new SearchRecordProduct:\n\t${err}`
      );
    }

    console.log(
      'Will add product to search engine index:',
      process.env.SEARCH_ENGINE_PRODUCTS_INDEX,
      'Product:',
      searchProduct
    );

    const indexResult: {
      success: boolean;
      message?: any;
      data?: any;
    } = await this.searchEngineService.create(
      process.env.SEARCH_ENGINE_PRODUCTS_INDEX!,
      searchProduct
    );
    if (!indexResult.success) {
      throw new Error(indexResult.message!);
    }

    const resultWithObjectID: Product = {
      ...result,
      objectID: indexResult.data._id,
      updatedAt: now,
    } as Product;

    await this.productRepository.updateById(
      result._id,
      resultWithObjectID,
      process.env.ALLOW_TRANSACTIONAL_FEATURE === 'true' ? options : undefined
    );

    return resultWithObjectID;
  }

  /**
   * Async method to validate if a Category is valid.
   * feel free to add more validation over a valid category as needed.
   * @param category
   * @return {Promise<APIResponse>}
   */
  async validateCategory(category: Category): Promise<APIResponse> {
    try {
      // empty param validation.
      if (!category) return APIResponseFalseOutput('Invalid category.');
      // query of requested category from our database.
      const dbCategory = await this.categoryRepository.findOne({ where: { name: category.name } });
      // unsuccesful query validation.
      if (!dbCategory) return APIResponseFalseOutput('Category no longer exist.');
      // sub-categories validation, requested category must match with our db records.
      if (category.subCategories && category.subCategories.length) {
        // each sub-category received must match with db category sub-category
        for (const subcategory of category.subCategories)
          if (!dbCategory.subCategories.includes(subcategory))
            return APIResponseFalseOutput(`Invalid Sub Category: ${subcategory}`);
      }
      // at this point Category pass all validations.
      return {
        success: true,
        message: 'Category valid.',
        data: dbCategory,
      };
    } catch (error) {
      return APIResponseFalseOutput();
    }
  }
  /**
   * Async Method to validate if a Product exist and is valid.
   * feel free to add as many validation you need.
   * @param product
   * @return {Promise<APIResponse>}
   */
  async validateProduct(product: Product): Promise<APIResponse> {
    try {
      // empty product or empty product_id validation.
      if (!product || !product._id)
        return APIResponseFalseOutput(ProductResponseMessages.MISSING_ID);
      // empty category validation.
      if (!product.category)
        return APIResponseFalseOutput(ProductResponseMessages.MISSING_CATEGORY);
      // call validateCategory to verify is the category is valid.
      const hasValidCategory: APIResponse = await this.validateCategory(
        product.category as Category
      );
      // validateCategory result validation.
      if (!hasValidCategory.success) {
        return APIResponseFalseOutput(hasValidCategory.message);
      }
      // query product by id from db.
      const dbProduct: Product = await this.productRepository.findById(product._id);
      // unsuccessful query validation.
      if (!dbProduct) return APIResponseFalseOutput(ProductResponseMessages.NOT_LONGER_EXIST);
      // at this point product has been pass all validations.
      return {
        success: true,
        message: ProductResponseMessages.VALID,
      };
    } catch (error) {
      this.logger.error(error);
      if (error.code) {
        return APIResponseFalseOutput(error);
      }
      return APIResponseFalseOutput();
    }
  }
}
