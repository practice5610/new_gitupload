import {
  AllOptionalExceptFor,
  BoomUser,
  TransactionStatus,
  TransactionType,
} from '@boom-platform/globals';
import { Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import moment from 'moment';
import { SinonStub } from 'sinon';

import {
  BoomAccountResponseMessages,
  FundTransferResponseMessages,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../../../constants';
import { TransferController } from '../../../controllers';
import { BoomAccount, Transaction } from '../../../models';
import { TransactionRepository } from '../../../repositories';
import {
  BoomAccountService,
  EmailService,
  getProfileOptions,
  ProfileService,
  SNSService,
  TransfersService,
} from '../../../services';
import { givenCustomer, givenEmptyDatabase, givenMerchant } from '../../helpers/database.helpers';

describe('TransfersController (unit)', () => {
  let transactionRepository: StubbedInstanceWithSinonAccessor<TransactionRepository>;
  let transfersService: StubbedInstanceWithSinonAccessor<TransfersService>;
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let emailService: StubbedInstanceWithSinonAccessor<EmailService>;
  let snsService: StubbedInstanceWithSinonAccessor<SNSService>;
  let response: Partial<Response>;
  let responseSend: Partial<Response>;
  let send: SinonStub;
  let boomAccountService: StubbedInstanceWithSinonAccessor<BoomAccountService>;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenResponse);
  beforeEach(givenTransactionRepository);
  beforeEach(givenProfileService);
  beforeEach(givenTransfersService);
  beforeEach(givenEmailService);
  beforeEach(givenSNSService);
  beforeEach(givenBoomAccountService);

  describe('POST new transfer', () => {
    /**
     * This test gives every stub valid output and then checks that the final transaction
     * create call is passed the correct object
     */
    it('creates correct transaction on success', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11112223344' },
        boomAccounts: ['1111'],
      });

      const receiver: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
        | 'addresses'
      > = givenCustomer({
        contact: { phoneNumber: '+12223334455' },
        boomAccounts: ['2222'],
      });

      const senderBoomAccount: BoomAccount = {
        _id: '1111',
        createdAt: 1611767842,
        updatedAt: 1612382579,
        status: 'Active',
        balance: {
          amount: 2200,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        customerID: receiver.uid,
      } as BoomAccount;

      //here we replace moment() with a stub that always returns 0 so we can predict the final output
      moment.now = sinon.stub().returns(moment.unix(0));
      const controller = new TransferController(
        transactionRepository,
        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      profileService.stubs.getProfile
        .withArgs(sender.uid, {
          requiredFields: ['contact', 'firstName'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: sender,
        });
      profileService.stubs.getProfile
        .withArgs('+12223334455', {
          requiredFields: ['contact', 'firstName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: receiver,
        });

      /**
       * The controller always gets the sender's data first
       */
      transactionRepository.stubs.create.resolves({} as Transaction);

      boomAccountService.stubs.verifyExistingAccounts.resolves({
        success: true,
        message: `Success`,
        data: senderBoomAccount,
      });

      const input = {
        sender: { firstName: sender.firstName, uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
        amount: { amount: 1000, precision: 2 },
      } as Transaction;

      await controller.create(input);

      expect(transactionRepository.stubs.create.args[0][0]).deepEqual({
        sender: { uid: sender.uid, firstName: sender.firstName },
        receiver: {
          uid: receiver.uid,
          firstName: receiver.firstName,
          contact: {
            emails: receiver.contact.emails,
            phoneNumber: receiver.contact.phoneNumber,
          },
        },
        createdAt: moment().utc().unix(),
        updatedAt: moment().utc().unix(), // this moment returns zero, see above
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        amount: input.amount,
      });
    });

    it('throws error if receiver is merchant', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['1111'],
      });

      const receiver: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
        | 'addresses'
      > = givenMerchant({
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['2222'],
      });

      const senderBoomAccount: BoomAccount = {
        _id: '1111',
        createdAt: 1611767842,
        updatedAt: 1612382579,
        status: 'Active',
        balance: {
          amount: 0,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        customerID: receiver.uid,
      } as BoomAccount;

      const controller = new TransferController(
        transactionRepository,
        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      profileService.stubs.getProfile
        .withArgs(sender.uid, {
          requiredFields: ['contact', 'firstName'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: sender,
        });
      profileService.stubs.getProfile
        .withArgs('+11111111111', {
          requiredFields: ['contact', 'firstName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: receiver,
        });

      boomAccountService.stubs.verifyExistingAccounts.resolves({
        success: true,
        message: `Success`,
        data: senderBoomAccount,
      });

      const input = {
        sender: { uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
        amount: { amount: 1000, precision: 2 },
      } as Transaction;

      await expect(controller.create(input)).to.be.rejectedWith(
        FundTransferResponseMessages.RECEIVER_IS_MERCHANT
      );
    });

    it('throws error if sender had not enough funds', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['1111'],
      });

      const receiver: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
        | 'addresses'
      > = givenCustomer({
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['2222'],
      });

      const senderBoomAccount: BoomAccount = {
        _id: '1111',
        createdAt: 1611767842,
        updatedAt: 1612382579,
        status: 'Active',
        balance: {
          amount: 0,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        customerID: receiver.uid,
      } as BoomAccount;

      const controller = new TransferController(
        transactionRepository,
        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      profileService.stubs.getProfile
        .withArgs(sender.uid, {
          requiredFields: ['contact', 'firstName'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: sender,
        });
      profileService.stubs.getProfile
        .withArgs('+11111111111', {
          requiredFields: ['contact', 'firstName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: receiver,
        });

      boomAccountService.stubs.verifyExistingAccounts.resolves({
        success: true,
        message: `Success`,
        data: senderBoomAccount,
      });

      const input = {
        sender: { uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
        amount: { amount: 1000, precision: 2 },
      } as Transaction;

      await expect(controller.create(input)).to.be.rejectedWith(
        FundTransferResponseMessages.INSUFFICIENT_FUNDS
      );
    });

    it('fails if transaction is missing info', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['1111'],
      });
      const receiver: AllOptionalExceptFor<
        BoomUser,
        | 'uid'
        | 'firstName'
        | 'lastName'
        | 'contact'
        | 'createdAt'
        | 'updatedAt'
        | 'roles'
        | 'addresses'
      > = givenCustomer({
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['2222'],
      });

      const controller = new TransferController(
        transactionRepository,
        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      profileService.stubs.getProfile
        .withArgs(sender.uid, {
          requiredFields: ['contact', 'firstName'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: sender,
        });
      profileService.stubs.getProfile
        .withArgs('+11111111111', {
          requiredFields: ['contact', 'firstName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: receiver,
        });

      // This input is missing an amount for the transaction
      const input = {
        sender: { uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
      } as Transaction;

      await expect(controller.create(input)).to.be.rejectedWith(
        FundTransferResponseMessages.TRANSACTION_MISSING_INFO
      );
    });

    it('throws error if sender account is no valid - no account or more than one', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['1111'],
      });
      const receiver: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer({
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['2222'],
      });

      const senderBoomAccount: BoomAccount = {
        _id: '1111',
        createdAt: 1611767842,
        updatedAt: 1612382579,
        status: 'Active',
        balance: {
          amount: 0,
          precision: 2,
          currency: 'USD',
          symbol: '$',
        },
        customerID: receiver.uid,
      } as BoomAccount;

      const controller = new TransferController(
        transactionRepository,

        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      profileService.stubs.getProfile
        .withArgs(sender.uid, {
          requiredFields: ['contact', 'firstName'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: sender,
        });
      profileService.stubs.getProfile
        .withArgs('+11111111111', {
          requiredFields: ['contact', 'firstName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: false,
          statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
          message: ProfileResponseMessages.NO_PROFILE_FOUND,
        });

      boomAccountService.stubs.verifyExistingAccounts.resolves({
        success: false,
        message: BoomAccountResponseMessages.NOT_FOUND,
        //data: senderBoomAccount,
      });

      const input = {
        sender: { uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
        amount: { amount: 1000, precision: 2 },
      } as Transaction;

      await expect(controller.create(input)).to.be.rejectedWith(
        BoomAccountResponseMessages.NOT_FOUND
      );
    });

    it('throws an error when phone number does not match format - 11 digits', async () => {
      const sender: AllOptionalExceptFor<
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
        contact: { phoneNumber: '+11111111111' },
        boomAccounts: ['1111'],
      });

      //the receiver number needs to be 10 digits with no +1 OR 12 digits with the +1 so 11 digits should throw error
      const receiver: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer({
        contact: { phoneNumber: '11111111111' },
        boomAccounts: ['2222'],
      });

      const controller = new TransferController(
        transactionRepository,
        <Response>response,
        transfersService,
        profileService,
        emailService,
        snsService,
        boomAccountService
      );

      const input = {
        sender: { uid: sender.uid },
        receiver: { contact: { phoneNumber: receiver.contact.phoneNumber } },
        amount: { amount: 1000, precision: 2 },
      } as Transaction;

      await expect(controller.create(input)).to.be.rejectedWith(
        FundTransferResponseMessages.BAD_PHONE_FORMAT
      );
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

  function givenTransactionRepository() {
    transactionRepository = createStubInstance(TransactionRepository);
  }

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }

  function givenTransfersService() {
    transfersService = createStubInstance(TransfersService);
  }

  function givenEmailService() {
    emailService = createStubInstance(EmailService);
  }

  function givenSNSService() {
    snsService = createStubInstance(SNSService);
  }
  function givenBoomAccountService() {
    boomAccountService = createStubInstance(BoomAccountService);
  }
});
