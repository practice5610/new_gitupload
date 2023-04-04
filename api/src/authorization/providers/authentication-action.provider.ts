import { AllOptionalExceptFor, BoomUser } from '@boom-platform/globals';
import { inject, Provider, Setter } from '@loopback/context';
import * as admin from 'firebase-admin';

import { AuthorizatonBindings } from '../keys';
import { AuthenticateFn } from '../types';

export class AuthenticateActionProvider implements Provider<AuthenticateFn> {
  constructor(
    @inject.setter(AuthorizatonBindings.CURRENT_USER)
    readonly setCurrentUser: Setter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  value(): AuthenticateFn {
    return (response) => this.action(response);
  }

  async action(
    token: string | null
  ): Promise<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined> {
    let user: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined = undefined;
    this.setCurrentUser(undefined);
    if (token) {
      try {
        const decoded: admin.auth.DecodedIdToken = await admin.auth().verifyIdToken(token);
        if (decoded) {
          user = { uid: decoded.uid, roles: decoded.roles };
          this.setCurrentUser(user);
        } else {
          console.error('Token was decoded but returned:', decoded);
        }
      } catch (error) {
        // throw new HttpErrors.Forbidden(error.code);
        console.error('Error getting current user:', error.code);
      }
    }
    return user;
  }
}
