import { Component, ProviderMap } from '@loopback/core';

import { AuthorizatonBindings } from './keys';
import { AuthenticateActionProvider } from './providers/authentication-action.provider';
import { AuthorizeActionProvider } from './providers/authorization-action.provider';
import { AuthorizationMetadataProvider } from './providers/authorization-metadata.provider';

export class AuthorizationComponent implements Component {
  providers?: ProviderMap;

  constructor() {
    this.providers = {
      [AuthorizatonBindings.AUTHENTICATE_ACTION.key]: AuthenticateActionProvider,
      [AuthorizatonBindings.AUTHORIZE_ACTION.key]: AuthorizeActionProvider,
      [AuthorizatonBindings.METADATA.key]: AuthorizationMetadataProvider,
    };
  }
}
