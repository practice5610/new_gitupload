import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter } from '@loopback/core';
import { /*HttpErrors,*/ Response } from '@loopback/rest';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import { SinonStub } from 'sinon';

import {
  APIResponseMessages,
  FilterResponseMessages,
  GlobalResponseMessages,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../../../constants';
import { UsersController } from '../../../controllers/users.controller';
import { getProfileOptions, ProfileService } from '../../../services/profile.service';
import { CreateUserType, FilterAdminUsersType } from '../../../validation/schemas';
import { givenCustomer } from '../../helpers/database.helpers';

describe('Users Controller', () => {
  let profileService: StubbedInstanceWithSinonAccessor<ProfileService>;
  let response: Partial<Response>;
  let response500: Partial<Response>;
  let responseSend: Partial<Response>;
  let responseSend500: Partial<Response>;
  let send: SinonStub;
  let sendStatus: SinonStub;
  let send500: SinonStub;

  let currentUserAdmin: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>;

  beforeEach(givenProfileService);
  beforeEach(givenResponse);
  beforeEach(given500Response);
  beforeEach(givenCurrentUserAdmin);

  describe('Get Multiple Profiles', () => {
    it('getProfile by roles', async () => {
      const controller = new UsersController(profileService, currentUserAdmin, <Response>response);
      const customer: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer();
      profileService.stubs.getFilteredProfiles.resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: [customer],
      });

      const filter: FilterAdminUsersType = {
        where: {
          roles: [RoleKey.Member],
        },
      };
      await controller.findAll(filter);

      //sinon.assert.calledOnceWithExactly(profileService.stubs.getFilteredProfiles, filter);
      expect(send.args[0][0]).deepEqual({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: [customer],
      });
    });
    describe('getProfile by id', () => {
      it('returns user profile by id as success', async () => {
        const controller = new UsersController(
          profileService,
          currentUserAdmin,
          <Response>response
        );
        const customer: AllOptionalExceptFor<
          BoomUser,
          'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
        > = givenCustomer();
        profileService.stubs.getFilteredProfiles.resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: [customer],
        });

        const filter: FilterAdminUsersType = {
          where: {
            uid: customer.uid,
          },
        };
        await controller.findAll(filter);
        expect(send.args[0][0]).deepEqual({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: [customer],
        });
      });

      it('returns error when id not found', async () => {
        const controller = new UsersController(
          profileService,
          currentUserAdmin,
          <Response>response
        );
        profileService.stubs.getFilteredProfiles.resolves({
          success: false,
          statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
          message: ProfileResponseMessages.NO_PROFILE_FOUND,
        });

        const filter: FilterAdminUsersType = {
          where: {
            uid: 'No id',
          },
        };

        await expect(controller.findAll(filter)).to.be.rejectedWith(
          ProfileResponseMessages.NO_PROFILE_FOUND
        );
      });
    });
    it('return false if more than one condition', async () => {
      const controller = new UsersController(profileService, currentUserAdmin, <Response>response);
      const customer: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer();
      profileService.stubs.getFilteredProfiles.resolves({
        success: false,
        statusCode: ServiceResponseCodes.BAD_REQUEST,
        message: FilterResponseMessages.MORE_THAN_ONE_CONDITION,
      });

      const filter: FilterAdminUsersType = {
        where: {
          uid: customer.uid,
          hasCards: false,
        },
      };
      await expect(controller.findAll(filter)).to.be.rejectedWith(
        FilterResponseMessages.MORE_THAN_ONE_CONDITION
      );
    });
    describe('getProfile by DATE', () => {
      it('return profiles by createdAt date', async () => {
        const controller = new UsersController(
          profileService,
          currentUserAdmin,
          <Response>response
        );
        const customer: AllOptionalExceptFor<
          BoomUser,
          'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
        > = givenCustomer();
        profileService.stubs.getFilteredProfiles.resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: [customer],
        });

        const filter: FilterAdminUsersType = {
          where: {
            createdAt: '1600198939',
          },
        };
        await controller.findAll(filter);
        expect(send.args[0][0]).deepEqual({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: [customer],
        });
      });

      it('return profiles by range between two createdAt date', async () => {
        const controller = new UsersController(
          profileService,
          currentUserAdmin,
          <Response>response
        );
        const customer: AllOptionalExceptFor<
          BoomUser,
          'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
        > = givenCustomer();
        profileService.stubs.getFilteredProfiles.resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: [customer],
        });

        const filter: FilterAdminUsersType = {
          where: {
            createdAt: '1600198000,1600198999',
          },
        };
        await controller.findAll(filter);
        expect(send.args[0][0]).deepEqual({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: [customer],
        });
      });
    });
    describe('getProfiles by hasCards', () => {
      it('return profiles with cards', async () => {
        const controller = new UsersController(
          profileService,
          currentUserAdmin,
          <Response>response
        );
        const customer: AllOptionalExceptFor<
          BoomUser,
          'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
        > = givenCustomer();
        profileService.stubs.getFilteredProfiles.resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: [customer],
        });

        const filter: FilterAdminUsersType = {
          where: {
            hasCards: true,
          },
        };
        await controller.findAll(filter);
        expect(send.args[0][0]).deepEqual({
          success: true,
          message: APIResponseMessages.SUCCESS,
          data: [customer],
        });
      });
    });
  });
  describe('Get One Profile by id', () => {
    it('Successfully get profile', async () => {
      const controller = new UsersController(profileService, currentUserAdmin, <Response>response);
      const customer: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer();
      profileService.stubs.getProfile
        .withArgs(customer.uid, {
          requiredFields: ['contact'],
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: customer,
        });

      profileService.stubs.getProfile.resolves({
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        data: customer,
      });

      await controller.getUserById(customer.uid);

      expect(send.args[0][0]).deepEqual({
        success: true,
        message: APIResponseMessages.SUCCESS,
        data: customer,
      });
    });
  });

  describe('Verify phone number', () => {
    it('Return valid data for phone number', async () => {
      const controller = new UsersController(profileService, currentUserAdmin, <Response>response);
      const customer: AllOptionalExceptFor<
        BoomUser,
        'uid' | 'firstName' | 'lastName' | 'contact' | 'createdAt' | 'updatedAt' | 'roles'
      > = givenCustomer({
        contact: {
          phoneNumber: '+1 555 555 5555',
          emails: ['john@email.com'],
        },
      });
      profileService.stubs.getProfile
        .withArgs('+15555555555', {
          requiredFields: ['firstName', 'lastName'],
          method: getProfileOptions.BY_PHONE,
        })
        .resolves({
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          data: customer,
        });

      await controller.verifyPhoneNumber({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: '+15555555555',
      });
      expect(send.args[0][0]).deepEqual({
        success: true,
        message: APIResponseMessages.VERIFIED,
        data: { foundAccount: true },
      });
    });
  });

  describe('create User', () => {
    it('returns NOT_AUTHORIZED response, when trying to create existing user as admin', async () => {
      const controller = new UsersController(
        profileService,
        currentUserAdmin,
        <Response>response
        //<Response>response500
      );
      profileService.stubs.createUser.resolves({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: 'The email address is already in use by another account.',
      });

      const data: CreateUserType = {
        email: 'BW-830-test1@test.com',
        password: '123456',
        roles: [RoleKey.Admin],
      };

      await expect(controller.createUser(data)).to.be.rejectedWith(
        GlobalResponseMessages.NOT_AUTHORIZED
      );

      /*expect(send500.getCall(0).args[0]).to.deepEqual({
        success: false,
        error: new HttpErrors.Forbidden(GlobalResponseMessages.NOT_AUTHORIZED),
      });*/
    });
    it('Fails when trying to create existing user', async () => {
      const controller = new UsersController(profileService, currentUserAdmin, <Response>response);
      profileService.stubs.createUser.resolves({
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: 'The email address is already in use by another account.',
      });

      const data: CreateUserType = {
        email: 'BW-830-test1@test.com',
        password: '123456',
        roles: [RoleKey.Member],
      };

      await expect(controller.createUser(data)).to.be.rejectedWith(
        'The email address is already in use by another account.'
      );
    });
  });

  function givenCurrentUserAdmin() {
    currentUserAdmin = sinon.stub().returns({ uid: '1111', roles: [RoleKey.Admin] });
  }

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

  function given500Response() {
    send500 = sinon.stub();
    responseSend500 = {
      send: send500,
    };
    response500 = {
      status: sinon.stub().withArgs(500).returns(responseSend500),
    };
  }

  function givenProfileService() {
    profileService = createStubInstance(ProfileService);
  }
});
