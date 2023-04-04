import { RoleKey } from '@boom-platform/globals';
import { MethodDecoratorFactory } from '@loopback/core';

import { AUTHORIZATION_METADATA_ACCESSOR } from '../keys';
import { AuthorizationMetadata } from '../types';

export function authorize(roles: RoleKey[]): MethodDecorator {
  return MethodDecoratorFactory.createDecorator<AuthorizationMetadata>(
    AUTHORIZATION_METADATA_ACCESSOR,
    {
      roles: roles || [],
    }
  );
}
