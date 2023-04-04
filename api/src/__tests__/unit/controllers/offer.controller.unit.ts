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

import { OfferController } from '../../../controllers';
import { Category, Offer, Product } from '../../../models';
import { CategoryRepository, OfferRepository, ProductRepository } from '../../../repositories';
import { SearchEngineService } from '../../../services';
import { givenEmptyDatabase, givenOffer, givenProduct } from '../../helpers/database.helpers';

describe('OfferController (unit)', () => {
  let offerRepository: StubbedInstanceWithSinonAccessor<OfferRepository>;
  let productRepository: StubbedInstanceWithSinonAccessor<ProductRepository>;
  let categoryRepository: StubbedInstanceWithSinonAccessor<CategoryRepository>;
  let searchEngineService: StubbedInstanceWithSinonAccessor<SearchEngineService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenResponse);
  beforeEach(givenOfferRepository);
  beforeEach(givenProductRepository);
  beforeEach(givenCategoryRepository);
  beforeEach(givenSearchEngineService);

  describe('create', () => {
    it('returns invalid offer reason invalid category', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const input = await givenOffer();

      await controller.create(input);
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid Category: ${input.product.category.name}`,
      });
    });

    it('returns invalid offer reason invalid sub category', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const category = {
        name: 'Sports',
        subCategories: ['Accessories'],
      } as Category;

      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      const partialProduct = {
        category: { ...category, subCategories: ['TestInvalid'] },
      } as Product;

      const input = await givenOffer({ product: partialProduct } as Offer);

      await controller.create(input);
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid Sub Category: ${'TestInvalid'}`,
      });
    });

    it('returns invalid offer validating category failed with a reason', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.throws(new Error('error looking for this category: TestError'));

      const input = await givenOffer();

      await controller.create(input);
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `error looking for this category: ${input.product.category.name}`,
      });
    });

    it('returns invalid offer updating search engine product failed with a reason', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const category = {
        _id: '5d12bf519eb1641840519334',
        name: 'Apparel, shoes, jewelry',
        subCategories: ['Accessories'],
      } as Category;

      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      const product = await givenProduct();

      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(product);

      const input = await givenOffer();

      const createOfferStub = offerRepository.stubs.create as sinon.SinonStub;
      createOfferStub.resolves(input);

      const searchByObjectIdStub = searchEngineService.stubs.searchByObjectId as sinon.SinonStub;
      searchByObjectIdStub.resolves([]);

      const searchEngineUpdateStub = searchEngineService.stubs.update as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: false, message: 'Invalid product update' });

      await controller.create(input);
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid product update`,
      });
    });

    it('returns offer as successful', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const category = {
        _id: '5d12bf519eb1641840519334',
        name: 'Apparel, shoes, jewelry',
        subCategories: ['Accessories'],
      } as Category;

      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      const product = await givenProduct();

      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(product);

      const inputOffer = await givenOffer();

      const createOfferStub = offerRepository.stubs.create as sinon.SinonStub;
      createOfferStub.resolves(inputOffer);

      const searchByObjectIdStub = searchEngineService.stubs.searchByObjectId as sinon.SinonStub;
      searchByObjectIdStub.resolves([]);

      const searchEngineUpdateStub = searchEngineService.stubs.update as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: true });

      const newOffer = await controller.create(inputOffer);
      expect(newOffer).to.deepEqual(inputOffer, 'controllers return value should match this');
    });
  });

  describe('count', () => {
    it('passes the correct Where clause to offerRepository.count', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      await controller.count({ title: 'offer-title' });
      sinon.assert.calledOnceWithExactly(offerRepository.stubs.count, {
        title: 'offer-title',
      });
    });

    it('returns the correct value from offerRepository.count', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      offerRepository.stubs.count.resolves({ count: 15 });
      const result = await controller.count({ description: 'description' });
      expect(result.count).to.equal(
        15,
        'this should be the value returned by offerRepository.count'
      );
    });
  });

  describe('find', () => {
    it('returns a list of offers from the offersRepository', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const offers: Offer[] = [];
      offers.push(await givenOffer());
      offers.push(await givenOffer());
      offerRepository.stubs.find.resolves(offers);
      const result = await controller.find();
      expect(result).to.eql(offers, 'the offers we put in the offerRepository');
    });

    it('passes the correct filter to the repository function', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const filter = {
        where: {
          title: 'offer-title',
        },
      };
      await controller.find(filter);
      sinon.assert.calledOnceWithExactly(offerRepository.stubs.find, filter);
    });
  });

  describe('findById', () => {
    it('returns rejected promise when id is not found', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      offerRepository.stubs.findById.returns(Promise.reject());
      await expect(controller.findById('1')).to.be.rejected();
    });

    it('returns product from the offerRepo', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const offer: Offer = await givenOffer();
      const id = offer._id as string;
      offerRepository.stubs.findById.resolves(offer);
      const result = await controller.findById(id);
      expect(result).to.eql(offer, `the offer with _id = ${id}`);
    });

    it('passes the correct id to the repository function', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const id = nanoid();
      await controller.findById(id);
      sinon.assert.calledOnceWithExactly(offerRepository.stubs.findById, id);
    });
  });

  describe('updateById', () => {
    it('returns invalid offer reason invalid category', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const inputOffer = await givenOffer();
      // assert offer
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(inputOffer.product);
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(inputOffer);
      if (inputOffer._id) await controller.updateById(inputOffer._id, inputOffer);
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid Category: ${inputOffer.product.category.name}`,
      });
    });

    it('returns invalid offer reason invalid sub category', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const oldOffer = await givenOffer();
      const category = oldOffer.product.category;

      // assert category
      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      // assert offer
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(oldOffer.product);
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(oldOffer);

      const inputOffer = {
        ...oldOffer,
        title: 'updated-offer',
        product: {
          ...oldOffer.product,
          category: { ...oldOffer.product.category, subCategories: ['TestInvalid'] },
        },
      } as Offer;

      if (inputOffer._id) await controller.updateById(inputOffer._id, inputOffer);

      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid Sub Category: ${'TestInvalid'}`,
      });
    });

    it('returns invalid offer validating category failed with a reason', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const oldOffer = await givenOffer();

      // assert category
      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.throws(new Error('error looking for this category: TestError'));

      // assert offer
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(oldOffer.product);
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(oldOffer);

      const inputOffer = { ...oldOffer, title: 'updated-offer' } as Offer;

      if (inputOffer._id) await controller.updateById(inputOffer._id, inputOffer);

      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `error looking for this category: ${inputOffer.product.category.name}`,
      });
    });

    it('returns invalid offer updating search engine product failed with a reason', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const oldOffer = await givenOffer();
      const category = oldOffer.product.category;

      // assert category
      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      // assert offer
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(oldOffer.product);
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(oldOffer);

      const inputOffer = { ...oldOffer, title: 'updated-offer' } as Offer;

      const searchEngineUpdateStub = searchEngineService.stubs.update as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: false, message: 'Invalid product update' });

      if (inputOffer._id) await controller.updateById(inputOffer._id, inputOffer);

      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Invalid product update`,
      });
    });

    it('returns offer as successful', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );

      const oldOffer = await givenOffer();
      const category = oldOffer.product.category;

      // assert category
      const findCatStub = categoryRepository.stubs.findOne as sinon.SinonStub;
      findCatStub.resolves(category);

      // assert offer
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(oldOffer.product);
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(oldOffer);
      // assert searchEngineResponse success true
      const searchEngineUpdateStub = searchEngineService.stubs.update as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: true });

      const inputOffer = {
        ...oldOffer,
        title: 'updated-offer',
        updatedAt: moment().utc().unix(),
      } as Offer;
      if (inputOffer._id) await controller.updateById(inputOffer._id, inputOffer);
      const newOffer: Offer | {} = offerRepository.stubs.updateById.args[0][1];
      expect(newOffer).to.deepEqual(inputOffer, 'controllers return value should match this');
    });
  });

  describe('deleteById', () => {
    it('returns a rejected promise when id does not exist', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      await expect(controller.deleteById('does not exist')).to.be.rejectedWith(
        'Could not find offer to delete.'
      );
    });

    it('returns a rejected promise when offer product id does not exist', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const inputOffer = await givenOffer();
      // assert product
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(inputOffer);
      expect(inputOffer._id).not.eql(undefined, 'offer needs to have _id');
      if (inputOffer._id)
        await expect(controller.deleteById(inputOffer._id)).to.be.rejectedWith(
          'Could not find product of given offer.'
        );
    });

    it('returns error when offer search engine product does not exist', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const inputOffer = await givenOffer();
      // assert offer
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(inputOffer);

      // assert product
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(inputOffer.product);

      // assert searchEngineResponse success false
      const searchEngineUpdateStub = searchEngineService.stubs.delete as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: false, error: 'Product does not exists' });

      if (inputOffer._id) await controller.deleteById(inputOffer._id);

      expect(send.getCall(0).args[0]).to.deepEqual({
        success: false,
        message: `Product does not exists`,
      });
    });
    it('deletes offer with search engine product update', async () => {
      const controller = new OfferController(
        offerRepository,
        productRepository,
        searchEngineService,
        <Response>response,
        categoryRepository
      );
      const inputOffer = await givenOffer();
      // assert offer
      const findByIdOfferStub = offerRepository.stubs.findById as sinon.SinonStub;
      findByIdOfferStub.resolves(inputOffer);

      // assert product
      const findByIdProdStub = productRepository.stubs.findById as sinon.SinonStub;
      findByIdProdStub.resolves(inputOffer.product);

      // assert searchEngineResponse success false
      const searchEngineUpdateStub = searchEngineService.stubs.delete as sinon.SinonStub;
      searchEngineUpdateStub.resolves({ success: true });

      if (inputOffer._id) await controller.deleteById(inputOffer._id);
      sinon.assert.calledOnceWithExactly(offerRepository.stubs.deleteById, inputOffer._id);
    });
  });

  function givenResponse() {
    send = sinon.stub();
    responseSend = {
      send,
    };
    response = {
      status: sinon.stub().returns(responseSend),
    };
  }

  function givenOfferRepository() {
    offerRepository = createStubInstance(OfferRepository);
  }

  function givenProductRepository() {
    productRepository = createStubInstance(ProductRepository);
  }

  function givenCategoryRepository() {
    categoryRepository = createStubInstance(CategoryRepository);
  }

  function givenSearchEngineService() {
    searchEngineService = createStubInstance(SearchEngineService);
  }
});
