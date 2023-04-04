import { givenCustomer } from '../../../__tests__/helpers/database.helpers';

const { firstName, lastName, roles, contact, ...others } = givenCustomer();

export const POSTUsersVerifyPhoneNumberRequestBodyExamples = {
  DATA_SENT: { firstName: firstName, lastName: lastName, phone: '5555555555' },
};
export const POSTAdminUserRequestBodyExamples = {
  DATA_SENT: { email: firstName, password: contact.emails?.[0], roles: roles },
};
