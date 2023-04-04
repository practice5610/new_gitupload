import { AllOptionalExceptFor, BankInfo, BoomUser } from '@boom-platform/globals';
import { Getter } from '@loopback/core';
import { Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import { SinonStub } from 'sinon';

import { BankAccountResponseMessages, ServiceResponseCodes } from '../../../constants';
import { PaymentController } from '../../../controllers';
import { BankInfoWithRelations, CustomerBilling, Transaction } from '../../../models';
import {
  BankInfoRepository,
  BoomCardRepository,
  CustomerBillingRepository,
  TransactionRepository,
} from '../../../repositories';
import {
  BankInfoService,
  EmailService,
  getProfileOptions,
  PaymentProcessorService,
  ProfileService,
  TransfersService,
} from '../../../services';
import {
  givenBankInfo,
  givenBoomCard,
  givenCustomer,
  givenEmptyDatabase,
  givenMoney,
  givenPlaidEntry,
} from '../../helpers/database.helpers';

describe('PaymentsController (unit)', () => {
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let bankInfoService: StubbedInstanceWithSinonAccessor<BankInfoService>;
  let bankInfoRepository: StubbedInstanceWithSinonAccessor<BankInfoRepository>;
  let customerBillingRepository: StubbedInstanceWithSinonAccessor<CustomerBillingRepository>;
  let paymentProcessorService: StubbedInstanceWithSinonAccessor<PaymentProcessorService>;
  let transactionRepository: StubbedInstanceWithSinonAccessor<TransactionRepository>;
  let boomCardRepository: StubbedInstanceWithSinonAccessor<BoomCardRepository>;
  let transfersService: StubbedInstanceWithSinonAccessor<TransfersService>;
  let emailService: Partial<EmailService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenResponse);
  beforeEach(givenBankInfoService);
  beforeEach(givenBankInfoRepository);
  beforeEach(givenProfileService);
  beforeEach(givenEmailService);
  beforeEach(givenTransfersService);
  beforeEach(givenBoomCardRepository);
  beforeEach(givenTransactionRepository);
  beforeEach(givenPaymentProcessorService);
  beforeEach(givenCustomerBillingRepository);

  describe('adds funds to user account', () => {
    it('throws exception one or more fields are missing: first name, last name, address, city, phone number, state, zip code', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        firstName: '',
        lastName: '',
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const userPlaidData = givenPlaidEntry();

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      const depositAmount = givenMoney(55);

      await expect(
        controller.create({
          nonce: 'true',
          uid: user.uid,
          plaidItemId: userPlaidData.item.itemId,
          amount: depositAmount,
          plaidAccountId: userPlaidData.accounts[0].id,
        })
      ).to.be.rejectedWith(
        'One or more fields are missing: first name, last name, address number, street, city, phone number, state, zip code'
      );
    });

    it('returns error while fetching BankInfo balance', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const depositAmount = givenMoney(55);
      const userPlaidData = givenPlaidEntry();
      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });
      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      bankInfoService.stubs.getPlaidBalance.resolves({
        success: false,
        message: 'Invalid Plaid Balance',
        error_code: 400,
      });

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({
        success: false,
        message: `Invalid Plaid Balance`,
        errorCode: 400,
      });
    });

    it('returns error missing balance account but BankInfo balance response ok', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const depositAmount = givenMoney(55);
      const userPlaidData = givenPlaidEntry();
      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      bankInfoService.stubs.getPlaidBalance.resolves({ success: true, accounts: [] });

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({
        success: false,
        message: BankAccountResponseMessages.BALANCE_CHECK_FAILED,
      });
    });

    it('returns error while finding account from bankInfoRepository', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available - 55,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert exception to bankInfoRepository->findOne
      bankInfoRepository.stubs.findOne.throwsException('Error finding account');

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({ success: false, message: 'Error finding account' });
    });

    it('returns error when current realtime balance is same with saved balance but balance is less then charged amount', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 300, current: 300 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(500);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });
      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert account to bankInfoRepo
      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({
        success: false,
        balanceInfo: {
          available: realTimeBalance.available,
          current: realTimeBalance.current,
          canPay: false,
        },
      });
    });

    it('returns error when current realtime balance is not same with saved balance but balance is less then charged amount', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(310);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });
      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert account to bankInfoRepo
      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({
        success: false,
        balanceInfo: {
          available: realTimeBalance.available,
          current: realTimeBalance.current,
          canPay: false,
        },
      });
    });

    it('returns error while updating account balance in saved account info', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available - 55,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });
      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert account to bankInfoRepo
      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      //assert transfersService.addFunds
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      // assert exception to bankInfoRepository.updateById
      bankInfoRepository.stubs.updateById.throwsException('Error updating account');

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({ success: false, message: 'Error updating account' });
    });

    it('updates the BankInfo with updated balance on success, when saved balance is outdated', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available - 55,
        current: realTimeBalance.current,
        limit: null,
      };

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: startingBankAccount.plaidItemID,
        amount: depositAmount,
        plaidAccountId: startingBankAccount.plaidID,
      });

      sinon.assert.match(bankInfoRepository.stubs.updateById.args[0][1], endBankAccount);
    });

    it('updates the BankInfo with updated balance on success, when saved balance is not outdated', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      const oldBalance = { available: 220, current: 300 };
      const realTimeBalance = { available: 300, current: 300 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55.5);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: oldBalance.available - 55.5,
        current: realTimeBalance.current,
        limit: null,
      };

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: startingBankAccount.plaidItemID,
        amount: depositAmount,
        plaidAccountId: startingBankAccount.plaidID,
      });

      sinon.assert.match(bankInfoRepository.stubs.updateById.args[0][1], endBankAccount);
    });

    it('does not update saved funds when not enough funds and saved balance is not outdated', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });
      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      const oldBalance = { available: 220, current: 300 };
      const realTimeBalance = { available: 300, current: 300 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(555.5);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: startingBankAccount.plaidItemID,
        amount: depositAmount,
        plaidAccountId: startingBankAccount.plaidID,
      });

      sinon.assert.notCalled(bankInfoRepository.stubs.updateById);
    });

    it('does not update saved funds when not enough funds and saved balance is outdated', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      const oldBalance = { available: 220, current: 230 };
      const realTimeBalance = { available: 300, current: 300 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(555.5);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: startingBankAccount.plaidItemID,
        amount: depositAmount,
        plaidAccountId: startingBankAccount.plaidID,
      });

      sinon.assert.notCalled(bankInfoRepository.stubs.updateById);
    });

    it('returns error while saving customer billing transactions', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available - 55,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert account to bankInfoRepo
      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      //assert transfersService.addFunds
      transfersService.stubs.addFunds.resolves({
        transaction: {} as Transaction,
        billingTransaction: {} as Transaction,
      });

      // assert response null  to billingRepository.create
      customerBillingRepository.stubs.create.resolves(undefined);

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({ success: false, message: 'Failed to save into DB' });
    });

    it('returns succuss after adding funds to user account', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const oldBalance = { available: 300, current: 300 };
      const realTimeBalance = { available: 210.5, current: 211 };
      const userPlaidData = givenPlaidEntry();
      const depositAmount = givenMoney(55);
      const startingBankAccount = await givenBankInfo({
        plaidID: userPlaidData.accounts[0].id,
        plaidAccessToken: userPlaidData.item.accessToken,
        plaidItemID: userPlaidData.item.itemId,
        userID: user.uid,
        balances: { available: oldBalance.available, current: oldBalance.current, limit: null },
      });

      const endBankAccount: BankInfo = { ...startingBankAccount };
      endBankAccount.balances = {
        available: realTimeBalance.available - 55,
        current: realTimeBalance.current,
        limit: null,
      };

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      //assert profile to profile service
      const userAndPlaidInfo = { ...user, plaidInfo: [userPlaidData] };
      profileService.stubs.getProfile
        .withArgs(user.uid, {
          requiredFields: ['firstName', 'lastName', 'contact', 'addresses'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: userAndPlaidInfo,
        });

      //assert boom card to boom card repo
      boomCardRepository.stubs.find.resolves([await givenBoomCard()]);
      //assert plaid balance accounts to bankInfo service
      bankInfoService.stubs.getPlaidBalance.resolves(
        getPlaidBalanceResult(
          true,
          startingBankAccount.plaidID,
          realTimeBalance.available,
          realTimeBalance.current
        )
      );

      //assert account to bankInfoRepo
      bankInfoRepository.stubs.findOne.resolves(
        startingBankAccount as BankInfo & BankInfoWithRelations
      );

      const transaction: Transaction = {} as Transaction;
      const billingTransaction: Transaction = {} as Transaction;

      //assert transfersService.addFunds
      transfersService.stubs.addFunds.resolves({
        transaction,
        billingTransaction,
      });

      // assert record to billingRepository.create
      customerBillingRepository.stubs.create.resolves({
        transaction: billingTransaction,
        plaidItemId: startingBankAccount.plaidItemID,
        plaidAccountId: startingBankAccount.plaidID,
      } as CustomerBilling);

      const result = await controller.create({
        nonce: 'true',
        uid: user.uid,
        plaidItemId: userPlaidData.item.itemId,
        amount: depositAmount,
        plaidAccountId: userPlaidData.accounts[0].id,
      });

      expect(result).to.deepEqual({
        success: true,
        transaction,
      });
    });
  });

  describe('add funds via credit card', () => {
    it('returns error while process request EMVSRED', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      // assert success false for payment process service
      paymentProcessorService.stubs.ProcessEMVSRED.resolves({
        success: false,
        message: 'Invalid Process',
      });

      await controller.ProcessCreditCardPayment({
        amount: givenMoney(100),
        ksn: '',
        EMVSREDData: '',
        numberOfPaddedBytes: '',
        userEmail: '',
        userFirstName: '',
        userLastName: '',
        userUid: '',
      });
      expect(send.getCall(0).args[0]).to.deepEqual({ success: false, message: 'Invalid Process' });
    });

    it('returns success after funds added successfully', async () => {
      const user: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'addresses'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
      > = givenCustomer({
        cards: ['test_card_ID'],
        contact: {
          phoneNumber: '6505559999',
          emails: ['name@website.com'],
        },
      });

      const controller = new PaymentController(
        transactionRepository,
        boomCardRepository,
        bankInfoRepository,
        customerBillingRepository,
        <Response>response,
        transfersService,
        profileService,
        <EmailService>emailService,
        bankInfoService,
        paymentProcessorService,
        Getter.fromValue(user)
      );

      // assert success false for payment process service
      paymentProcessorService.stubs.ProcessEMVSRED.resolves({
        success: true,
        message: 'Processed Successfully',
        data: [{ success: true }],
      });

      await controller.ProcessCreditCardPayment({
        amount: givenMoney(100),
        ksn: 'test',
        EMVSREDData: 'test',
        numberOfPaddedBytes: '2020',
        userEmail: 'test@website.com',
        userFirstName: 'test',
        userLastName: 'l-test',
        userUid: 'test',
      });
      expect(send.getCall(0).args[0]).to.deepEqual({
        success: true,
        message: 'Processed Successfully',
        data: [{ success: true }],
      });
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

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }

  function givenBankInfoService() {
    bankInfoService = createStubInstance(BankInfoService);
  }

  function givenBankInfoRepository() {
    bankInfoRepository = createStubInstance(BankInfoRepository);
  }

  function givenEmailService() {
    emailService = {
      mailGenerator: {
        generate: () => {
          return { replace: sinon.stub() };
        },
      },
      send: sinon.stub(),
    };
    //mailGenerator = emailService.mailGenerator as sinon.SinonStub;
  }

  function givenTransfersService() {
    transfersService = createStubInstance(TransfersService);
  }

  function givenBoomCardRepository() {
    boomCardRepository = createStubInstance(BoomCardRepository);
  }

  function givenTransactionRepository() {
    transactionRepository = createStubInstance(TransactionRepository);
  }

  function givenPaymentProcessorService() {
    paymentProcessorService = createStubInstance(PaymentProcessorService);
  }

  function givenCustomerBillingRepository() {
    customerBillingRepository = createStubInstance(CustomerBillingRepository);
  }

  function getPlaidBalanceResult(
    success: boolean,
    accountID: string,
    available: number,
    current: number
  ) {
    return {
      success: success,
      accounts: [{ account_id: accountID, balances: { available: available, current: current } }],
    };
  }
});
