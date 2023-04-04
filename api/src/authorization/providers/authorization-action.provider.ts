import { RoleKey } from '@boom-platform/globals';
import { Getter, inject, Provider } from '@loopback/context';
import { intersection } from 'lodash';

import { AuthorizatonBindings } from '../keys';
import { AuthorizationMetadata, AuthorizeFn } from '../types';

export class AuthorizeActionProvider implements Provider<AuthorizeFn> {
  constructor(
    @inject.getter(AuthorizatonBindings.METADATA)
    private readonly getMetadata: Getter<AuthorizationMetadata>
  ) {}

  value(): AuthorizeFn {
    return (response) => this.action(response);
  }

  async action(userRoles: RoleKey[] | null | undefined): Promise<boolean> {
    const metadata: AuthorizationMetadata = await this.getMetadata();
    if (!metadata) {
      // If the route was not annotated with an authorization decorator, or there was no role defined on the decorator, deny access
      return false;
    } else if (metadata.roles.indexOf('*') === 0) {
      // If the role of '*' is used, then this is a public route. Allow request right away.
      return true;
    }
    //Extract only matching roles between the user and the acceptable roles to the current route
    let matchingRoleCount = 0;
    if (userRoles) {
      const routeRoles = metadata.roles;
      matchingRoleCount = intersection(userRoles, routeRoles).length;
    }
    //If there is at least one set of roles matched, then the request is allowed, else it is not
    return matchingRoleCount > 0;
  }
}
