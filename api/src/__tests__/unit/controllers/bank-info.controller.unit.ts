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

import { BankAccountResponseMessages, GlobalResponseMessages } from '../../../constants';
import { BankInfoController } from '../../../controllers';
import { BankInfo } from '../../../models';
import { BankInfoRepository } from '../../../repositories';
import { BankInfoService, BoomAccountService, ProfileService } from '../../../services';
import { givenCustomer, givenEmptyDatabase, givenPlaidEntry } from '../../helpers/database.helpers';
import { givenPlaidAuthResult, givenPlaidIdentityResult } from '../../helpers/response.helpers';

describe('Bank Info Controller (unit)', () => {
  let bankInfoRepository: StubbedInstanceWithSinonAccessor<BankInfoRepository>;
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let bankInfoService: StubbedInstanceWithSinonAccessor<BankInfoService>;
  let boomAccountService: StubbedInstanceWithSinonAccessor<BoomAccountService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;
  let getCurrentUser: SinonStub;
  let user: AllOptionalExceptFor<
    BoomUser,
    'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
  >;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenCurrentUser);
  beforeEach(givenResponse);
  beforeEach(givenBankInfoRepository);
  beforeEach(givenProfileService);
  beforeEach(givenBankInfoService);
  beforeEach(givenBoomAccountService);

  describe('bank-info/saveAccounts', () => {
    it('returns failed when the callers uid does not match the request body', async () => {
      const user2: AllOptionalExceptFor<BoomUser, 'uid'> = givenCustomer();
      const plaidInfo = givenPlaidEntry();

      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      const result = await controller.saveAccounts({ plaidInfo: plaidInfo, user: user2 });

      expect(result).to.deepEqual({
        success: false,
        message: GlobalResponseMessages.NOT_AUTHORIZED,
      });
    });

    it('adds a bankinfo record on valid input', async () => {
      const plaidInfo = givenPlaidEntry();
      const authResult = givenPlaidAuthResult();
      const idResult = givenPlaidIdentityResult();
      // We must set the plaid info account id to match the fake auth result
      plaidInfo.accounts[0].id = authResult.data.numbers.achNumbers[0].account_id;

      moment.now = sinon.stub().returns(moment.unix(0));

      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoService.stubs.getAuth.resolves(authResult);
      bankInfoService.stubs.getIdentity.resolves(idResult);
      bankInfoRepository.stubs.find.resolves([]);

      await controller.saveAccounts({ plaidInfo: plaidInfo, user: user });

      // The emails field below is a combination of the emails on the user account and the
      // emails returned from Plaid identity. Extracting them from the data for this test
      // seems confusing to follow so I just copy and pasted them from the database helper
      // functions
      expect(bankInfoRepository.stubs.create.args[0][0]).to.deepEqual({
        createdAt: moment.utc().unix(),
        updatedAt: moment.utc().unix(),
        accountNumber: authResult.data.numbers.achNumbers[0].account,
        routingNumber: authResult.data.numbers.achNumbers[0].routing,
        wireRoutingNumber: authResult.data.numbers.achNumbers[0].wire_routing,
        plaidID: authResult.data.numbers.achNumbers[0].account_id,
        plaidItemID: plaidInfo.item.itemId,
        plaidAccessToken: plaidInfo.item.accessToken,
        name: plaidInfo.institution.name + ' ' + plaidInfo.accounts[0].subtype,
        userID: user.uid,
        balances: {
          available: authResult.data.accounts[0].balances.available?.toString(),
          current: authResult.data.accounts[0].balances.current?.toString(),
          limit: authResult.data.accounts[0].balances.limit?.toString() || null,
        },
        accountOwner: {
          phone: user.contact.phoneNumber,
          names: idResult.data.accounts[0].owners[0].names,
          address: idResult.data.accounts[0].owners[0].addresses[0].data.street,
          city: idResult.data.accounts[0].owners[0].addresses[0].data.city,
          state: idResult.data.accounts[0].owners[0].addresses[0].data.region,
          zip: idResult.data.accounts[0].owners[0].addresses[0].data.postal_code,
          emails: [
            'john@email.com',
            'accountholder0@example.com',
            'accountholder1@example.com',
            'extraordinarily.long.email.username.123456@reallylonghostname.com',
          ],
          gotInfoFromBank: true,
        },
      });
    });

    it('does not create a record if the account exists', async () => {
      const plaidInfo = givenPlaidEntry();
      const authResult = givenPlaidAuthResult();
      const idResult = givenPlaidIdentityResult();
      // We must set the plaid info account id to match the fake auth result
      plaidInfo.accounts[0].id = authResult.data.numbers.achNumbers[0].account_id;

      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoService.stubs.getAuth.resolves(authResult);
      bankInfoService.stubs.getIdentity.resolves(idResult);
      bankInfoRepository.stubs.find.resolves([{} as BankInfo]);

      await controller.saveAccounts({ plaidInfo: plaidInfo, user: user });

      // if bankInfoRepository.find does not return an empty array,
      // the account already exists and this create should never be called
      expect(bankInfoRepository.stubs.create.callCount).to.equal(0);
    });

    it('returns failure when auth fails', async () => {
      const plaidInfo = givenPlaidEntry();

      const idResult = givenPlaidIdentityResult();

      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoService.stubs.getAuth.resolves({ success: false, message: '' });
      bankInfoService.stubs.getIdentity.resolves(idResult);

      const result = await controller.saveAccounts({ plaidInfo: plaidInfo, user: user });

      expect(result).to.deepEqual({
        success: false,
        message: 'Could not find account numbers for this Plaid data',
      });
    });

    it('returns success with backup billing info when identity fails', async () => {
      const plaidInfo = givenPlaidEntry();
      const authResult = givenPlaidAuthResult();
      // We must set the plaid info account id to match the fake auth result
      plaidInfo.accounts[0].id = authResult.data.numbers.achNumbers[0].account_id;

      moment.now = sinon.stub().returns(moment.unix(0));

      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoService.stubs.getAuth.resolves(authResult);
      bankInfoService.stubs.getIdentity.resolves({ success: false, message: '' });
      bankInfoRepository.stubs.find.resolves([]);

      await controller.saveAccounts({ plaidInfo: plaidInfo, user: user });

      expect(bankInfoRepository.stubs.create.args[0][0]).to.deepEqual({
        createdAt: moment.utc().unix(),
        updatedAt: moment.utc().unix(),
        accountNumber: authResult.data.numbers.achNumbers[0].account,
        routingNumber: authResult.data.numbers.achNumbers[0].routing,
        wireRoutingNumber: authResult.data.numbers.achNumbers[0].wire_routing,
        plaidID: authResult.data.numbers.achNumbers[0].account_id,
        plaidItemID: plaidInfo.item.itemId,
        plaidAccessToken: plaidInfo.item.accessToken,
        name: plaidInfo.institution.name + ' ' + plaidInfo.accounts[0].subtype,
        userID: user.uid,
        balances: {
          available: authResult.data.accounts[0].balances.available?.toString(),
          current: authResult.data.accounts[0].balances.current?.toString(),
          limit: authResult.data.accounts[0].balances.limit?.toString() || null,
        },
        accountOwner: {
          phone: user.contact.phoneNumber,
          names: [user.firstName + ' ' + user.lastName],
          //TODO: use new compose address function when it is created getComposedAddressFromStore
          address: user.addresses?.[0].number + ' ' + user.addresses?.[0].street1,
          city: user.addresses?.[0].city,
          state: user.addresses?.[0].state,
          zip: user.addresses?.[0].zip,
          emails: user.contact.emails,
          gotInfoFromBank: false,
        },
      });
    });
  });

  describe('bank-info/getAccountInfo', () => {
    it('succeeds when looking up merchant', async () => {
      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      await controller.getAccountInfo({ uid: user.uid, accountID: '', isMerchant: true });

      expect(bankInfoRepository.stubs.findOne.args[0][0]).to.deepEqual({
        where: { userID: user.uid },
      });
    });

    it('succeeds when looking up customer', async () => {
      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      await controller.getAccountInfo({ uid: user.uid, accountID: '111', isMerchant: false });

      expect(bankInfoRepository.stubs.findOne.args[0][0]).to.deepEqual({
        where: { and: [{ plaidID: '111' }, { userID: user.uid }] },
      });
    });

    it('returns error when info not found', async () => {
      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoRepository.stubs.findOne.resolves(undefined);

      const result = await controller.getAccountInfo({
        uid: user.uid,
        accountID: '',
        isMerchant: true,
      });

      expect(result).to.deepEqual({
        success: false,
        message: 'No bank info was found for this user',
      });
    });
  });

  describe('bank-info/deleteAccount', () => {
    it('returns failure message when delete fails', async () => {
      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      bankInfoService.stubs.deleteAccounts.throws(new Error('delete error'));

      await controller.deleteAccount([{ plaidID: '1', userID: user.uid }]);

      expect(send.args[0][0]).deepEqual({
        success: false,
        message: BankAccountResponseMessages.BANK_DELETE_FAILED,
      });
    });

    it('passes requests to bankInfoService for delete', async () => {
      const controller = new BankInfoController(
        bankInfoRepository,
        <Response>response,
        profileService,
        boomAccountService,
        bankInfoService,
        getCurrentUser
      );

      await controller.deleteAccount([{ plaidID: '1', userID: user.uid }]);

      expect(bankInfoService.stubs.deleteAccounts.args[0][0]).deepEqual([
        { plaidID: '1', userID: user.uid },
      ]);
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

  function givenCurrentUser() {
    user = givenCustomer();
    getCurrentUser = sinon.stub().resolves(user);
  }

  function givenBankInfoRepository() {
    bankInfoRepository = createStubInstance(BankInfoRepository);
  }

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }

  function givenBankInfoService() {
    bankInfoService = createStubInstance(BankInfoService);
  }

  function givenBoomAccountService() {
    boomAccountService = createStubInstance(BoomAccountService);
  }
});
