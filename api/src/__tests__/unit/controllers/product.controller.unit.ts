import { Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { SinonStub } from 'sinon';

import { APIResponseMessages } from '../../../constants';
import { ProductController } from '../../../controllers';
import { Category, Product, SearchRecordProduct } from '../../../models';
import { ProductRepository } from '../../../repositories';
import { ProductService, ProfileService, SearchEngineService } from '../../../services';
import { givenEmptyDatabase, givenProduct } from '../../helpers/database.helpers';

describe('ProductController (unit)', () => {
  let productRepository: StubbedInstanceWithSinonAccessor<ProductRepository>;
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let searchEngineService: StubbedInstanceWithSinonAccessor<SearchEngineService>;
  let productService: StubbedInstanceWithSinonAccessor<ProductService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;
  let sendStatus: SinonStub;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenResponse);
  beforeEach(givenProductService);
  beforeEach(givenProductRepository);
  beforeEach(givenProfileService);
  beforeEach(givenSearchEngineService);

  describe('create', () => {
    it('returns successful products as successful', async () => {
      // The product controller's create function takes an array of products, calls the
      // product service create function for each of them, and returns lists of successful
      // and unsuccessful products added
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );

      // the product that will be sent to the api
      const input = await givenProduct();

      // the product that the service returns (this would be the same as input in real life but in a unit test it does not matter)
      const newProduct = await givenProduct();

      // we define the behavior of all of the functions that the route we are testing calls
      productService.stubs.create.resolves(newProduct);

      // we call the function
      await controller.create([input]);

      // we confirm the result
      expect(send.args[0][0]).to.deepEqual(
        { successful: [newProduct], failed: [] },
        'controllers return value should match this'
      );
    });

    it('returns failed products as failed with a reason', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const input: Product = await givenProduct();

      productService.stubs.create.throws(new Error('create error'));
      await controller.create([input]);
      expect(send.args[0][0]).to.deepEqual(
        { successful: [], failed: [{ product: input, reason: 'create error' }] },
        'controllers return value should match this'
      );
    });

    it('tries to create every product it is passed (does not stop after an error)', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const input: Product[] = [];
      input.push(await givenProduct());
      input.push(await givenProduct());
      input.push(await givenProduct());

      productService.stubs.create.throws(new Error('create error'));
      await controller.create(input);
      expect(send.args[0][0]).to.deepEqual(
        {
          successful: [],
          failed: [
            { product: input[0], reason: 'create error' },
            { product: input[1], reason: 'create error' },
            { product: input[2], reason: 'create error' },
          ],
        },
        'controllers return value should match this'
      );
    });
  });

  describe('count', () => {
    it('passes the correct Where clause to productRepository.count', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      await controller.count({ description: 'description' });
      sinon.assert.calledOnceWithExactly(productRepository.stubs.count, {
        description: 'description',
      });
    });

    it('returns the correct value from productRepository.count', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      productRepository.stubs.count.resolves({ count: 5 });
      await controller.count();

      expect(send.args[0][0]).to.eql(
        { count: 5 },
        'this should be the value returned by productRepository.count'
      );
    });
  });

  describe('find', () => {
    it('returns a list of products from the productRepo', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const products: Product[] = [];
      products.push(await givenProduct());
      products.push(await givenProduct());
      productRepository.stubs.find.resolves(products);
      await controller.find();
      expect(send.args[0][0]).to.eql(products, 'the products we put in the productRepository');
    });

    it('passes the correct filter to the repository function', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const filter = {
        where: {
          description: 'test filter',
        },
      };
      await controller.find(filter);
      sinon.assert.calledOnceWithExactly(productRepository.stubs.find, filter);
    });
  });

  describe('findById', () => {
    it('returns rejected promise when id is not found', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      productRepository.stubs.findById.returns(Promise.reject());
      await expect(controller.findById('1')).to.be.rejected();
    });

    it('returns product from the productRepo', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const product: Product = await givenProduct();
      const id = product._id as string;
      productRepository.stubs.findById.resolves(product);
      await controller.findById(id);
      expect(send.args[0][0]).to.eql(product, `the product with _id = ${id}`);
    });

    it('passes the correct id to the repository function', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const id = nanoid();
      await controller.findById(id);
      sinon.assert.calledOnceWithExactly(productRepository.stubs.findById, id);
    });
  });

  //TODO: update this after search is updated
  /**
   * This needs to be updated after search is updated
   */
  xdescribe('updateById', () => {
    it('sends the updated Product to the productService', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const update: Product = {
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        imageUrl: 'NEW testurl',
        description: 'a-NEW-product-description',
      } as Product;

      const oldProduct: Product = {
        objectID: 'test12345',
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        createdAt: 1595689198,
        updatedAt: 1601045998,
        imageUrl: 'testurl',

        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        category: {
          _id: '5d12bf519eb1641840519334',
          name: 'Apparel, shoes, jewelry',
          subCategories: ['Accessories'],
        } as Category,
        name: 'name',
        description: 'a-product-description',
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          companyName: 'store name',
          number: '111',
          street1: 'N Stetson Ave',
          city: 'Boca Raton',
          _geoloc: { lat: 1, lng: 1 },
          merchant: {
            uid: 'PzhQqzDft6X8FnclXsvdvbgzihE3',
            firstName: 'Daniel',
            lastName: 'Montano',
          },
        },
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        attributes: {},
        _tags: ['tag'],
      } as Product;

      const now = moment().utc().unix();

      const correctProduct: Product = {
        objectID: 'test12345',
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        createdAt: 1595689198,
        updatedAt: now,
        imageUrl: 'NEW testurl',
        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        category: {
          _id: '5d12bf519eb1641840519334',
          name: 'Apparel, shoes, jewelry',
          subCategories: ['Accessories'],
        } as Category,
        name: 'name',
        description: 'a-NEW-product-description',
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          companyName: 'store name',
          number: '111',
          street1: 'N Stetson Ave',
          _geoloc: { lat: 1, lng: 1 },
          city: 'Boca Raton',
          merchant: {
            uid: 'PzhQqzDft6X8FnclXsvdvbgzihE3',
            firstName: 'Daniel',
            lastName: 'Montano',
          },
        },
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        attributes: {},
        _tags: ['tag'],
      } as Product;

      productRepository.stubs.findById.resolves(oldProduct);
      if (update._id) await controller.updateById(update._id, update);
      const newProduct: Product = productService.stubs.updateById.args[0][3];

      for (const [key] of Object.entries(correctProduct)) {
        if (key === 'updatedAt') {
          const newUpdatedAt: number | undefined = newProduct[key];
          const correctUpdatedAt: number | undefined = correctProduct.updatedAt;
          // these are here so that we can do the last expect in a way that doesn't cause lint errors
          expect(newUpdatedAt).not.eql(undefined);
          expect(correctUpdatedAt).not.eql(undefined);
          if (newUpdatedAt !== undefined && correctUpdatedAt !== undefined)
            expect(newUpdatedAt >= correctUpdatedAt).to.exactly(
              true,
              'if this is false, updatedAt was not updated'
            );
        } else {
          expect(newProduct[key as keyof Product]).to.deepEqual(
            correctProduct[key as keyof Product],
            'checking that each property in the new product is correct'
          );
        }
      }
    });

    it('sends a new SearchRecordProduct to the productService', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const update: Product = {
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        imageUrl: 'NEW testurl',
        description: 'a-NEW-product-description',
      } as Product;

      const oldProduct: Product = {
        objectID: 'test12345',
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        createdAt: 1595689198,
        updatedAt: 1601045998,
        imageUrl: 'testurl',

        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        category: {
          _id: '5d12bf519eb1641840519334',
          name: 'Apparel, shoes, jewelry',
          subCategories: ['Accessories'],
        } as Category,
        name: 'name',
        description: 'a-product-description',
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          companyName: 'store name',
          number: '111',
          street1: 'N Stetson Ave',
          city: 'Boca Raton',
          _geoloc: { lat: 1, lng: 1 },
          merchant: {
            uid: 'PzhQqzDft6X8FnclXsvdvbgzihE3',
            firstName: 'Daniel',
            lastName: 'Montano',
          },
        },
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        attributes: {},
        _tags: ['tag'],
      } as Product;

      const now = moment().utc().unix();

      const correctSearchProduct: SearchRecordProduct = {
        productID: 'V976aWa7LJHgBNTZ0Qs7g',
        categoryName: 'Apparel, shoes, jewelry',
        subCategoryName: 'Accessories',
        hasOffer: false,
        _geoloc: { lat: 1, lon: 1 },
        createdAt: 1595689198,
        updatedAt: now,
        imageUrl: 'NEW testurl',
        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        priceNum: 20,
        name: 'name',
        category: {
          _id: '5d12bf519eb1641840519334',
          name: 'Apparel, shoes, jewelry',
          subCategories: ['Accessories'],
        } as Category,
        description: 'a-NEW-product-description',
        attributes: {},
        _tags: ['tag'],
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          number: '111',
          street1: 'N Stetson Ave',
          city: 'Boca Raton',
          state: 'FL',
          country: 'US',
          zip: '33487',
        },
      } as SearchRecordProduct;

      productRepository.stubs.findById.resolves(oldProduct);
      if (update._id) await controller.updateById(update._id, update);
      const newSearchProduct: SearchRecordProduct = productService.stubs.updateById.args[0][0];

      for (const [key] of Object.entries(correctSearchProduct)) {
        if (key === 'updatedAt')
          expect(newSearchProduct.updatedAt >= correctSearchProduct.updatedAt).to.exactly(
            true,
            'if this is false the new searchProduct updatedAt wasnt updated'
          );
        else
          expect(newSearchProduct[key as keyof SearchRecordProduct]).to.deepEqual(
            correctSearchProduct[key as keyof SearchRecordProduct],
            'checks that the properties of newSearchProdect match the expected result'
          );
      }
    });

    it('throws an error if the product can not be found', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      productRepository.stubs.findById.resolves(undefined);
      const product: Product = await givenProduct();
      expect(product._id).not.eql(undefined);
      if (product._id)
        await expect(controller.updateById(product._id, product)).to.be.rejectedWith(
          'Could not find product to update.'
        );
    });

    it('throws an error if the product is missing data that the SearchRecordProduct needs', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      // this update will be missing critical category info
      const update: Product = {
        objectID: 'test12345',
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        createdAt: 1595689198,
        updatedAt: 1601045998,
        imageUrl: 'testurl',

        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        category: {
          _id: '5d12bf519eb1641840519334',
        },
        name: 'name',
        description: 'a-product-description',
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          companyName: 'store name',
          number: '111',
          street1: 'N Stetson Ave',
          city: 'Boca Raton',
          _geoloc: { lat: 1, lng: 1 },
          merchant: {
            uid: 'PzhQqzDft6X8FnclXsvdvbgzihE3',
            firstName: 'Daniel',
            lastName: 'Montano',
          },
        },
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        attributes: {},
        _tags: ['tag'],
      } as Product;

      const oldProduct: Product = {
        objectID: 'test12345',
        _id: 'V976aWa7LJHgBNTZ0Qs7g',
        createdAt: 1595689198,
        updatedAt: 1601045998,
        imageUrl: 'testurl',

        merchantUID: 'ETDLzzIUzuaTf62E0VHen',
        category: {
          _id: '5d12bf519eb1641840519334',
          name: 'Apparel, shoes, jewelry',
          subCategories: ['Accessories'],
        } as Category,
        name: 'name',
        description: 'a-product-description',
        store: {
          _id: 'xZ0Z4ScMPLhhWwDrWI6qV',
          companyName: 'store name',
          number: '111',
          street1: 'N Stetson Ave',
          city: 'Boca Raton',
          _geoloc: { lat: 1, lng: 1 },
          merchant: {
            uid: 'PzhQqzDft6X8FnclXsvdvbgzihE3',
            firstName: 'Daniel',
            lastName: 'Montano',
          },
        },
        price: { amount: 2000, precision: 2, currency: 'USD', symbol: '$' },
        attributes: {},
        _tags: ['tag'],
      } as Product;

      productRepository.stubs.findById.resolves(oldProduct);
      expect(update._id).not.eql(undefined);
      if (update._id) await expect(controller.updateById(update._id, update)).to.be.rejected();
    });
  });

  describe('deleteById', () => {
    it('returns a rejected promise when id does not exist', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );

      await expect(controller.deleteById('does not exist')).to.be.rejectedWith(
        APIResponseMessages.INTERNAL_SERVER_ERROR
      );
    });

    it('sends the right id to the repo', async () => {
      const controller = new ProductController(
        productRepository,
        searchEngineService,
        <Response>response,
        profileService,
        productService
      );
      const product: Product = await givenProduct();

      productRepository.stubs.findById.resolves(product);
      if (product._id) await controller.deleteById(product._id);

      sinon.assert.calledOnceWithExactly(
        productRepository.stubs.deleteById,
        product._id ?? 'error'
      );
      expect(sendStatus.args[0][0]).to.eql(204);
    });
  });

  function givenResponse() {
    send = sinon.stub();
    sendStatus = sinon.stub();
    responseSend = {
      send,
    };
    response = {
      status: sinon.stub().returns(responseSend),
      sendStatus: sendStatus,
    };
  }

  function givenProductRepository() {
    productRepository = createStubInstance(ProductRepository);
  }

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }

  function givenProductService() {
    productService = createStubInstance(ProductService);
  }

  function givenSearchEngineService() {
    searchEngineService = createStubInstance(SearchEngineService);
  }
});
