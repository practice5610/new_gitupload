import { AllOptionalExceptFor, BoomUser } from '@boom-platform/globals';
import { Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import moment from 'moment';
import { SinonStub } from 'sinon';

import { BoomAccountResponseMessages, GlobalResponseMessages } from '../../../constants';
import { BoomAccountController } from '../../../controllers/boom-account.controller';
import { BoomAccount } from '../../../models';
import { BoomAccountRepository } from '../../../repositories';
import { BoomAccountService, ProfileService } from '../../../services';
import {
  givenAdmin,
  givenBoomAccount,
  givenCustomer,
  givenEmptyDatabase,
} from '../../helpers/database.helpers';

describe('Boom-Account Controller (unit)', () => {
  let boomAccountRepository: StubbedInstanceWithSinonAccessor<BoomAccountRepository>;
  let boomAccountService: StubbedInstanceWithSinonAccessor<BoomAccountService>;
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;
  let getCurrentUser: SinonStub;
  let getCurrentAdmin: SinonStub;
  let user: AllOptionalExceptFor<
    BoomUser,
    'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
  >;
  let admin: AllOptionalExceptFor<
    BoomUser,
    'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
  >;
  const now: number = moment().unix();

  beforeEach(givenBoomAccountRepository);
  beforeEach(givenBoomAccountService);
  beforeEach(givenProfileService);
  beforeEach(givenEmptyDatabase);
  beforeEach(givenCurrentAdmin);
  beforeEach(givenCurrentUser);
  beforeEach(givenResponse);

  describe('boom-account/{id}', () => {
    it('success when Admin request with correct boom-account {id}', async () => {
      const controller = new BoomAccountController(
        boomAccountRepository,
        <Response>response,
        profileService,
        getCurrentAdmin,
        boomAccountService
      );
      const boomAcc: BoomAccount = await givenBoomAccount({
        updatedAt: now,
        createdAt: now,
        customerID: admin.uid,
      });
      boomAccountRepository.stubs.findById.resolves(boomAcc);
      const result = await controller.findById(boomAcc._id);
      expect(result).to.deepEqual({
        success: true,
        message: 'Success',
        data: boomAcc,
      });
    });

    it('success when Admin request with NOT-correct boom-account {id}', async () => {
      const controller = new BoomAccountController(
        boomAccountRepository,
        <Response>response,
        profileService,
        getCurrentAdmin,
        boomAccountService
      );
      boomAccountRepository.stubs.findById.resolves(undefined);
      await expect(controller.findById('NOT-correct')).to.be.rejectedWith(
        BoomAccountResponseMessages.NOT_FOUND
      );
    });

    it('false when Member request a boom-account NOT belong to', async () => {
      const controller = new BoomAccountController(
        boomAccountRepository,
        <Response>response,
        profileService,
        getCurrentUser,
        boomAccountService
      );
      const boomAcc: BoomAccount = await givenBoomAccount({
        updatedAt: now,
        createdAt: now,
        customerID: admin.uid,
      });
      boomAccountRepository.stubs.findById.resolves(boomAcc);

      await expect(controller.findById(boomAcc._id)).to.be.rejectedWith(
        GlobalResponseMessages.NOT_AUTHORIZED
      );
    });

    it('success when Member request his boom-account', async () => {
      const controller = new BoomAccountController(
        boomAccountRepository,
        <Response>response,
        profileService,
        getCurrentUser,
        boomAccountService
      );
      const boomAcc: BoomAccount = await givenBoomAccount({
        updatedAt: now,
        createdAt: now,
        customerID: user.uid,
      });
      boomAccountRepository.stubs.findById.resolves(boomAcc);
      const result = await controller.findById(boomAcc._id);
      expect(result).to.deepEqual({
        success: true,
        message: 'Success',
        data: boomAcc,
      });
    });
  });

  function givenBoomAccountRepository() {
    boomAccountRepository = createStubInstance(BoomAccountRepository);
  }

  function givenBoomAccountService() {
    boomAccountService = createStubInstance(BoomAccountService);
  }

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }

  function givenResponse() {
    send = sinon.stub();
    responseSend = {
      send,
    };
    response = {
      status: sinon.stub().returns(responseSend),
    };
  }

  function givenCurrentUser() {
    user = givenCustomer();
    getCurrentUser = sinon.stub().resolves(user);
  }

  function givenCurrentAdmin() {
    admin = givenAdmin();
    getCurrentAdmin = sinon.stub().resolves(admin);
  }
});
