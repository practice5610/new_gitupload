import {
  givenCustomer,
  givenTransferReceiverProfileData,
} from '../../../__tests__/helpers/database.helpers';
import { APIResponseMessages } from '../../../constants';

const { uid, lastName, roles, contact, ...others } = givenCustomer();

export const GETAdminUsersResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: [givenCustomer(), givenCustomer()],
  },
};
export const GETAdminUserResponseExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: givenCustomer(),
  },
};
export const GETUserTransferReceiverProfileExamples = {
  SUCCESS: {
    success: true,
    message: APIResponseMessages.SUCCESS,
    data: givenTransferReceiverProfileData(),
  },
};
export const POSTUsersVerifyPhoneNumberExamples = {
  SUCCESS: {
    success: true,
    message: 'Information is verified',
    data: {
      foundAccount: true,
    },
  },
};
export const POSTAdminUserExamples = {
  SUCCESS: {
    success: true,
    message: 'success',
    data: {
      uid: uid,
      email: contact.emails?.[0],
      emailVerified: false,
      disabled: false,
      metadata: {
        lastSignInTime: null,
        creationTime: 'Tue, 18 May 2021 19:29:06 GMT',
      },
      tokensValidAfterTime: 'Tue, 18 May 2021 19:29:06 GMT',
      providerData: [
        {
          uid: contact.emails?.[0],
          email: contact.emails?.[0],
          providerId: 'password',
        },
      ],
    },
  },
};
