import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import { Count, Filter, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
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
import { getLogger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { authorize } from '../authorization';
import {
  APIResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProductResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { ratelimit } from '../loopback4-ratelimiter';
import { Product, SearchRecordProduct } from '../models';
import { ProductRepository } from '../repositories';
import { ProductService, ProfileService, SearchEngineService } from '../services';
import {
  DELProductByIDSpecification,
  GETProductByIDSpecification,
  GETProductsCountSpecification,
  GETProductsSpecification,
  PATCHProductByIDRequestBody,
  PATCHProductByIDSpecification,
  POSTProductSourceDobaResumeSpecification,
  POSTProductSourceDobaSpecification,
  POSTProductsSpecification,
} from '../specifications';
import { XMLSourceProduct } from '../types';
import {
  generateProduct,
  handleServiceResponseResult,
  transformGeolocForSearchEngine,
  wait,
} from '../utils';

const fs = require('fs');
const path = require('path');

// TODO: update the routes with old search logic to use new elastic search stuff
// old search logic is all commented out because it has lint errors

export class ProductController {
  logger = getLogger(LoggingCategory.PRODUCTS_CONTROLLER);
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @service(SearchEngineService)
    public searchEngineService: SearchEngineService,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ProfileService)
    public profileService: ProfileService,
    @service(ProductService)
    public productService: ProductService
  ) {}

  /**
   * Converts Doba product xml into smaller json files of 1,000 products each
   * @param {Object} obj
   * @returns {Promise<Response>}
   * @memberof ProductController
   */
  @authorize([RoleKey.All])
  @post('/products/source/doba', POSTProductSourceDobaSpecification)
  async batchCreate(@requestBody() obj: Record<string, any>): Promise<Response> {
    try {
      const { uid, source }: { uid: string; source: string } = obj as {
        uid: string;
        source: string;
      };
      console.log('Will batch create from source:', source);

      const profile = await this.profileService.getProfile<
        AllOptionalExceptFor<BoomUser, 'firstName' | 'lastName' | 'store'>
      >(uid, {
        requiredFields: ['firstName', 'lastName', 'store'],
      });

      const profileData = handleServiceResponseResult<typeof profile.data>(profile);
      if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

      const doStream = async (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
          let products: Product[] = [];
          let currentProduct: XMLSourceProduct | undefined;
          let currentTag: string;
          let i = 0;

          const paths: string[] = [];
          const saxStream = require('sax').createStream(true, { trim: true });

          saxStream.on('error', function (e: any) {
            // unhandled errors will throw, since this is a proper node
            // event emitter.
            console.error('error!', e);
            // clear the error
            // @ts-ignore
            this._parser.error = null; //eslint-disable-line
            // @ts-ignore
            this._parser.resume(); //eslint-disable-line
          });
          saxStream.on('opentag', function (node: any) {
            // same object as above
            if (node.name === 'item') {
              currentProduct = {} as XMLSourceProduct;
            } else if (currentProduct) {
              currentTag = node.name;
              //@ts-ignore
              currentProduct[currentTag] = '';
            }
          });
          saxStream.on('text', function (value: any) {
            if (value.length) {
              //@ts-ignore
              currentProduct[currentTag] = value;
            }
          });
          saxStream.on('closetag', (name: string) => {
            // same object as above
            if (name === 'item' && currentProduct) {
              const product: Product = generateProduct(currentProduct, profileData);

              products.push(product);

              try {
                if (products.length >= 500) {
                  const coolPath = path.join(__dirname, `_products/product-${i}.json`);

                  paths.push(coolPath);

                  console.log('Writing file: ', coolPath);

                  fs.writeFile(coolPath, JSON.stringify({ products }), (err: Error) => {
                    if (err) {
                      console.error(err);
                      return;
                    }
                  });
                  i++;
                  products = [];
                }
              } catch (error) {
                console.error(error);
              }
              currentProduct = undefined;
            }
          });

          saxStream.on('end', () => {
            const coolPath = path.join(__dirname, `_products/product-${i}.json`);

            paths.push(coolPath);

            fs.writeFile(coolPath, JSON.stringify({ products }), (err: Error) => {
              if (err) {
                console.error(err);
                return;
              }
              return resolve(paths);
            });
          });
          // pipe is supported, and it's readable/writable
          // same chunks coming in also go out.
          const coolPath = path.join(__dirname, `_products/${source}`);

          fs.createReadStream(coolPath).pipe(saxStream);
        });
      };

      const paths: string[] = await doStream();

      console.log('Files saved in batches. Will write batched files to database...', paths);

      let totalRecords = 0;

      for (const batchPath of paths) {
        const json = fs.readFileSync(batchPath, 'utf8');
        const parsed = JSON.parse(json);
        const products: Product[] = parsed.products;

        console.log('Read batch:', batchPath);
        console.log('Will write products to database...');

        const now: number = moment().utc().unix();

        for (const item of products) {
          console.log('Creating product from batch:', batchPath);
          const result = await this.productRepository.create({
            ...item,
            createdAt: now,
            updatedAt: now,
          });

          // transform product according to search engine schema
          const searchProduct = {
            id: result._id,
            categoryName: result.category!.name,
            subCategoryName: result.category!.subCategories!.join(','),
            hasOffer: false,
            _geoloc: transformGeolocForSearchEngine(result.store!._geoloc!),
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

          console.log(
            'Product added to db. Will add product to search engine index:',
            process.env.SEARCH_ENGINE_PRODUCTS_INDEX,
            'Product:',
            searchProduct.id
          );

          const indexResult: {
            success: boolean;
            error?: string;
            data?: any;
          } = await this.searchEngineService.create(
            process.env.SEARCH_ENGINE_PRODUCTS_INDEX!,
            searchProduct
          );

          console.log('search engine success?', indexResult.success);

          if (!indexResult.success) {
            console.log('search engine Error:', indexResult);
            // There was an error, rolling back...
            await this.productRepository.deleteById(result._id);

            return this.response.status(ServiceResponseCodes.SUCCESS).send(indexResult);
          }

          const updatedProductWithObjectID: Product = {
            ...result,
            objectID: indexResult.data._id,
          } as Product;

          updatedProductWithObjectID.updatedAt = now;

          await this.productRepository.updateById(result._id, updatedProductWithObjectID);

          totalRecords++;

          console.log('Records created so far:', totalRecords);
        }
        console.log('All batches processed! Done. Total records created:', totalRecords);

        const waitVal = 30000;

        console.log('Will wait', waitVal, 'ms before next batch...');

        await wait(waitVal);

        console.log('Finished waiting...');

        console.log('Batch products created! for batch file:', batchPath, '\n\n\n');
      }

      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'All batches processed!' });
    } catch (error) {
      console.error(error.message, error.toJSON && error.toJSON());

      return this.response.status(500).send({ success: false, message: error.message });
    }
  }

  /**
   * Converts Doba product xml into smaller json files of 1,000 products each
   * @param {Object} obj
   * @returns {Promise<Response>}
   * @memberof ProductController
   */
  @authorize([RoleKey.All])
  @post('/products/source/doba/resume', POSTProductSourceDobaResumeSpecification)
  async batchCreateResume(@requestBody() obj: Record<string, any>): Promise<Response> {
    try {
      const { startIndex, source }: { startIndex: number; source: string } = obj as {
        startIndex: number;
        source: string;
      };
      console.log('Will resume batch create from source:', source);

      let totalRecords = 0;
      const paths = [];

      for (let i = startIndex; i < 886; i++) {
        const coolPath = path.join(__dirname, `_products/product-${i}.json`);

        paths.push(coolPath);
      }

      for (const batchPath of paths) {
        const json = fs.readFileSync(batchPath, 'utf8');
        const parsed = JSON.parse(json);
        const products: Product[] = parsed.products;

        console.log('Read batch:', batchPath);
        console.log('Will write products to database...');

        const now: number = moment().utc().unix();

        for (const item of products) {
          console.log('Creating product from batch:', batchPath);
          await this.productRepository.create({
            ...item,
            createdAt: now,
            updatedAt: now,
          });

          /**
           * This search engine code needs to be replaced for elastic search and it has
           * several lint errors
           */
          // // transform product according to search engine schema
          // const searchProduct = {
          //   id: result._id,
          //   categoryName: result.category!.name,
          //   subCategoryName: result.category!.subCategories!.join(','),
          //   hasOffer: false,
          //   _geoloc: transformGeolocForSearchEngine(result.store!._geoloc!),
          //   createdAt: result.createdAt,
          //   updatedAt: now,
          //   imageUrl: result.imageUrl,
          //   merchantUID: result.merchantUID,
          //   price: result.price,
          //   priceNum: Dinero(result.price).toUnit(),
          //   name: result.name,
          //   category: result.category,
          //   description: result.description,
          //   attributes: result.attributes,
          //   _tags: result._tags,
          //   store: {
          //     _id: result.store!._id,
          //     address: result.store!.street1,
          //   },
          // } as SearchRecordProduct;

          // console.log(
          //   'Product added to db. Will add product to search engine index:',
          //   process.env.SEARCH_ENGINE_PRODUCTS_INDEX,
          //   'Product:',
          //   searchProduct.id
          // );

          // const indexResult: {
          //   success: boolean;
          //   message?: string;
          //   data?: any;
          // } = await this.searchEngineService.create(
          //   process.env.SEARCH_ENGINE_PRODUCTS_INDEX!,
          //   searchProduct
          // );

          // console.log('search engine success?', indexResult.success);

          // if (!indexResult.success) {
          //   console.log('search engine Error:', indexResult);
          //   // There was an error, rolling back...
          //   await this.productRepository.deleteById(result._id);

          //   return this.response.status(ServiceResponseCodes.SUCCESS).send(indexResult);
          // }

          // const updatedProductWithObjectID: Product = {
          //   ...result,
          //   objectID: indexResult.data._id,
          // } as Product;

          // updatedProductWithObjectID.updatedAt = now;

          // await this.productRepository.updateById(result._id, updatedProductWithObjectID);
          totalRecords++;
          console.log('Records created so far:', totalRecords);
        }
        console.log('All batches processed! Done. Total records created:', totalRecords);

        const waitVal = 30000;

        console.log('Will wait', waitVal, 'ms before next batch...');

        await wait(waitVal);

        console.log('Finished waiting...');

        console.log('Batch products created! for batch file:', batchPath, '\n\n\n');
      }

      return this.response
        .status(ServiceResponseCodes.SUCCESS)
        .send({ success: true, message: 'All batches processed!' });
    } catch (error) {
      console.error(error.message, error.toJSON && error.toJSON());

      return this.response.status(500).send({ success: false, message: error.message });
    }
  }

  @authorize([RoleKey.Merchant])
  @post('/products', POSTProductsSpecification)
  async create(
    @requestBody.array(
      {
        schema: getModelSchemaRef(Product, {
          partial: true,
          exclude: ['_id', 'objectID', 'createdAt', 'merchantUID'],
        }),
      },
      { description: 'Require an array of products instances.', required: true }
    )
    products: Product[]
  ): Promise<Response> {
    const now: number = moment().utc().unix();

    const successfulProducts: Product[] = [];
    const failedProducts: { product: Product; reason: string }[] = [];

    for (const item of products) {
      try {
        const serviceResult: Product = await this.productService.create(item, now);
        successfulProducts.push(serviceResult);
      } catch (err) {
        failedProducts.push({ product: item, reason: err.message });
      }
    }

    return this.response
      .status(ServiceResponseCodes.SUCCESS)
      .send({ successful: successfulProducts, failed: failedProducts });
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/products/count', GETProductsCountSpecification)
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Product))
    where?: Where<Product>
  ): Promise<Response<Count>> {
    try {
      const product_count: Count = await this.productRepository.count(where);

      return this.response.status(ServiceResponseCodes.SUCCESS).send(product_count);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @ratelimit(false)
  @authorize([RoleKey.All])
  @get('/products', GETProductsSpecification)
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Product))
    filter?: Filter<Product>
  ): Promise<Response> {
    try {
      const result: Product[] = await this.productRepository.find(filter);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.All])
  @get('/products/{id}', GETProductByIDSpecification)
  async findById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const result: Product = await this.productRepository.findById(id);
      return this.response.status(ServiceResponseCodes.SUCCESS).send(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/products/{id}', PATCHProductByIDSpecification)
  async updateById(
    @param.path.string('id') id: string,
    @requestBody(PATCHProductByIDRequestBody)
    product: Partial<Product>
  ): Promise<Response> {
    try {
      const existingProduct: Product = await this.productRepository.findById(id);

      if (!existingProduct) {
        throw new HttpErrors.NotFound(ProductResponseMessages.NOT_FOUND);
      }

      const now: number = moment().utc().unix();

      const newProduct: Product = {
        ...existingProduct,
        ...product,
        updatedAt: now,
      } as Product;

      // this update is a temporary solution while we don't have a working search engine
      await this.productRepository.updateById(id, newProduct);

      /**
       * This search engine code needs to be replaced for elastic search and it has
       * several lint errors
       */
      // // transform product according to search engine schema
      // const searchProduct = {
      //   productID: existingProduct._id,
      //   categoryName: newProduct.category.name,
      //   subCategoryName: newProduct.category.subCategories?.join(','),
      //   hasOffer: false,
      //   _geoloc: transformGeolocForSearchEngine(existingProduct.store._geoloc!),
      //   createdAt: newProduct.createdAt,
      //   updatedAt: now,
      //   imageUrl: newProduct.imageUrl,
      //   merchantUID: newProduct.merchantUID,
      //   price: newProduct.price,
      //   priceNum: Dinero(newProduct.price).toUnit(),
      //   name: newProduct.name,
      //   category: newProduct.category,
      //   description: newProduct.description,
      //   attributes: newProduct.attributes,
      //   _tags: newProduct._tags,
      //   store: {
      //     _id: existingProduct.store._id,
      //     address: getComposedAddressFromStore(existingProduct.store),
      //   },
      // } as SearchRecordProduct;

      // await this.productService.updateById(
      //   searchProduct,
      //   existingProduct.objectID!,
      //   id,
      //   newProduct
      // );
      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      if (Object.values(ProductResponseMessages).includes(error.message)) {
        throw error;
      }
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/products/{id}', DELProductByIDSpecification)
  async deleteById(@param.path.string('id') id: string): Promise<Response> {
    try {
      const existingProduct: Product = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new HttpErrors.NotFound('Could not find product to delete.');
      }

      // while we do not have a search engine working we can delete via the repo
      // instead of service so we don't need the !
      //await this.productService.deleteById(existingProduct.objectID!, id);
      await this.productRepository.deleteById(id);

      return this.response.sendStatus(ServiceResponseCodes.NO_CONTENT);
    } catch (error) {
      this.logger.error(error);
      throw new HttpErrors.InternalServerError(APIResponseMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
