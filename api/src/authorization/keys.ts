import { BoomUser } from '@boom-platform/globals';
import { BindingKey } from '@loopback/context';
import { MetadataAccessor } from '@loopback/metadata';

import { AuthenticateFn, AuthorizationMetadata, AuthorizeFn } from './types';

/**
 * Binding keys used by this component.
 */
export namespace AuthorizatonBindings {
  export const AUTHENTICATE_ACTION = BindingKey.create<AuthenticateFn>(
    'userAuthorization.actions.authenticate'
  );

  export const AUTHORIZE_ACTION = BindingKey.create<AuthorizeFn>(
    'userAuthorization.actions.authorize'
  );

  export const METADATA = BindingKey.create<AuthorizationMetadata | undefined>(
    'userAuthorization.operationMetadata'
  );
  export const CURRENT_USER = BindingKey.create<BoomUser | undefined>('authentication.currentUser');
}

/**
 * Metadata accessor key for authorize method decorator
 */
export const AUTHORIZATION_METADATA_ACCESSOR = MetadataAccessor.create<
  AuthorizationMetadata,
  MethodDecorator
>('userAuthorization.accessor.operationMetadata');
