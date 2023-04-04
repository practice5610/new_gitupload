import { Status } from '@boom-platform/globals/lib/enums/returns';
import { Filter } from '@loopback/repository';
import { createStubInstance, expect, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';

import { ReturnResponseMessages, ServiceResponseCodes } from '../../../constants';
import { ReturnDisputeModel, ReturnRequestModel } from '../../../models';
import {
  ReturnDisputeRepository,
  ReturnPolicyRepository,
  ReturnRequestRepository,
  ShippingOrderRepository,
  TransactionRepository,
} from '../../../repositories';
import { ReturnService } from '../../../services';
import {
  givenEmptyDatabase,
  givenMerchant,
  givenReturnDispute,
  givenReturnPolicy,
  givenReturnRequest,
  givenSuperAdmin,
} from '../../helpers/database.helpers';
describe('Return Service (unit)', () => {
  let returnPolicyRepository: StubbedInstanceWithSinonAccessor<ReturnPolicyRepository>;
  let returnRequestRepository: StubbedInstanceWithSinonAccessor<ReturnRequestRepository>;
  let returnDisputeRepository: StubbedInstanceWithSinonAccessor<ReturnDisputeRepository>;
  let transactionRepository: StubbedInstanceWithSinonAccessor<TransactionRepository>;
  let shippingRepository: StubbedInstanceWithSinonAccessor<ShippingOrderRepository>;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenReturnPolicyRepository);
  beforeEach(givenReturnRequestRepository);
  beforeEach(givenReturnDisputeRepository);
  beforeEach(givenTransactionRepository);
  beforeEach(givenShippingOrderRepository);

  function givenReturnPolicyRepository() {
    returnPolicyRepository = createStubInstance(ReturnPolicyRepository);
  }
  function givenReturnRequestRepository() {
    returnRequestRepository = createStubInstance(ReturnRequestRepository);
  }
  function givenReturnDisputeRepository() {
    returnDisputeRepository = createStubInstance(ReturnDisputeRepository);
  }
  function givenTransactionRepository() {
    transactionRepository = createStubInstance(TransactionRepository);
  }
  function givenShippingOrderRepository() {
    shippingRepository = createStubInstance(ShippingOrderRepository);
  }

  describe('createReturnPolicy Test', () => {
    it('calls create on ReturnPolicyReposity to create a new ReturnPolicy instance', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnPolicy = await givenReturnPolicy();

      returnPolicyRepository.stubs.create.resolves(returnPolicy);

      await service.createReturnPolicy(returnPolicy);
      expect(returnPolicyRepository.stubs.create.callCount).to.equal(1);
    });
  });

  describe('getReturnPolicies Test', () => {
    it('displays Policy Not Found message if no ReturnPolicy instances match provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnPolicy = await givenReturnPolicy();

      returnPolicyRepository.stubs.find.resolves([]);

      const result = await service.getReturnPolicies(returnPolicy._id);

      expect(result).to.eql({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.POLICY_NOT_FOUND,
      });
    });

    it('calls find on ReturnPolicyRepository to find a ReturnPolicy instance matching provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnPolicy = await givenReturnPolicy();

      returnPolicyRepository.stubs.find.resolves([returnPolicy]);

      await service.getReturnPolicies(returnPolicy._id);
      expect(returnPolicyRepository.stubs.find.callCount).to.equal(1);
    });
  });

  describe('deleteById Test', () => {
    it('calls deleteById on the provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnPolicy = await givenReturnPolicy();

      returnPolicyRepository.stubs.findById.resolves(returnPolicy);

      await service.deleteById(returnPolicy._id);
      expect(returnPolicyRepository.stubs.deleteById.callCount).to.equal(1);
    });
  });

  describe('createReturnRequest Test', () => {
    it('calls create on ReturnRequestRepository to create a new ReturnRequest instance', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnRequest = await givenReturnRequest();

      returnRequestRepository.stubs.create.resolves(returnRequest);

      await service.createReturnRequest(returnRequest);
      expect(returnRequestRepository.stubs.create.callCount).to.equal(1);
    });
  });

  describe('getReturnRequest Test', () => {
    it('displays Request Not Found message if no ReturnRequest instances match provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const filter: Filter<ReturnRequestModel> = {};

      returnRequestRepository.stubs.find.resolves([]);

      const result = await service.getReturnRequest(filter);

      expect(result).to.eql({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.REQUEST_NOT_FOUND,
      });
    });

    it('calls find on ReturnRequestRepository to find ReturnRequest instances matching provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnRequest = await givenReturnRequest();
      const filter: Filter<ReturnRequestModel> = {};

      returnRequestRepository.stubs.find.resolves([returnRequest]);

      await service.getReturnRequest(filter);
      expect(returnRequestRepository.stubs.find.callCount).to.equal(1);
    });
  });

  describe('updateReturnRequest Test', () => {
    it('displays No Further Updates Available message if merchant updates ReturnRequest instance when status is complete', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );

      const returnRequest = await givenReturnRequest();
      returnRequest.returnStatus = Status.COMPLETE;

      const currentUser = givenMerchant();

      returnRequestRepository.stubs.findById.resolves(returnRequest);

      const result = await service.updateReturnRequest(
        returnRequest._id,
        returnRequest,
        currentUser
      );

      expect(result).to.eql({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.REQUEST_NOT_UPDATED,
      });
    });

    it('calls updateById on ReturnRequest instance matching provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnRequest = await givenReturnRequest();

      returnRequestRepository.stubs.findById.resolves(returnRequest);

      const currentUser = givenSuperAdmin();

      await service.updateReturnRequest(returnRequest._id, returnRequest, currentUser);
      expect(returnRequestRepository.stubs.updateById.callCount).to.equal(1);
    });
  });

  describe('createDispute Test', () => {
    it('calls create on ReturnDisputeRepository to create a new ReturnDispute instance', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnDispute = await givenReturnDispute();

      returnDisputeRepository.stubs.create.resolves(returnDispute);

      await service.createDispute(returnDispute);
      expect(returnDisputeRepository.stubs.create.callCount).to.equal(1);
    });
  });

  describe('getDisputeByID Test', () => {
    it('displays Dispute Not Found message if there are no ReturnDispute instances matching the provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const filter: Filter<ReturnDisputeModel> = {};

      returnDisputeRepository.stubs.find.resolves([]);

      const result = await service.getDisputeByID(filter);
      expect(result).to.eql({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.DISPUTE_NOT_FOUND,
      });
    });

    it('calls find on ReturnDisputeRepository to find a ReturnDispute instance matching the provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnDispute = await givenReturnDispute();
      const filter: Filter<ReturnDisputeModel> = {};

      returnDisputeRepository.stubs.find.resolves([returnDispute]);

      await service.getDisputeByID(filter);
      expect(returnDisputeRepository.stubs.find.callCount).to.equal(1);
    });
  });

  describe('updateDispute Test', () => {
    it('displays No Updates Available message when user updates ReturnDispute instance when dispute is closed', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnDispute = await givenReturnDispute();
      returnDispute.isOpen = false;

      returnDisputeRepository.stubs.findById.resolves(returnDispute);

      const result = await service.updateDispute(returnDispute._id, returnDispute);

      expect(result).to.eql({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: ReturnResponseMessages.DISPUTE_NOT_UPDATED,
      });
    });

    it('calls updateById on ReturnDispute instance matching provided ID', async () => {
      const service = new ReturnService(
        returnPolicyRepository,
        transactionRepository,
        shippingRepository,
        returnRequestRepository,
        returnDisputeRepository
      );
      const returnDispute = await givenReturnDispute();

      returnDisputeRepository.stubs.findById.resolves(returnDispute);

      await service.updateDispute(returnDispute._id, returnDispute);
      expect(returnDisputeRepository.stubs.updateById.callCount).to.equal(1);
    });
  });
});
