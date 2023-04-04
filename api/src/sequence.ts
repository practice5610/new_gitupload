import { AllOptionalExceptFor, BoomUser } from '@boom-platform/globals';
import { inject } from '@loopback/context';
import {
  FindRoute,
  HttpErrors,
  InvokeMethod,
  InvokeMiddleware,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';

import {
  AuthenticateFn,
  AuthorizatonBindings,
  AuthorizeErrorKeys,
  AuthorizeFn,
} from './authorization';
import { RateLimitAction, RateLimitSecurityBindings } from './loopback4-ratelimiter';

const SequenceActions = RestBindings.SequenceActions;

export class MySequence implements SequenceHandler {
  /**
   * Optional invoker for registered middleware in a chain.
   * To be injected via SequenceActions.INVOKE_MIDDLEWARE.
   */
  @inject(SequenceActions.INVOKE_MIDDLEWARE, { optional: true })
  protected invokeMiddleware: InvokeMiddleware = () => false;

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(RateLimitSecurityBindings.RATELIMIT_SECURITY_ACTION)
    protected rateLimitAction: RateLimitAction,
    @inject(AuthorizatonBindings.AUTHENTICATE_ACTION)
    protected authenticateRequest: AuthenticateFn,
    @inject(AuthorizatonBindings.AUTHORIZE_ACTION)
    protected checkAuthorization: AuthorizeFn
  ) {}

  async handle(context: RequestContext): Promise<void> {
    try {
      const { request, response } = context;

      const finished = await this.invokeMiddleware(context);
      if (finished) return;

      const route = this.findRoute(request);
      const args = await this.parseParams(request, route);

      // rate limit Action here
      await this.rateLimitAction(request, response);

      let authUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined;
      //http://localhost:3000/api/v1/ping This endpoint gives ctor issues on my side

      let isAccessAllowed = route.path === '/' || route.path.indexOf('/explorer') >= 0;

      if (!isAccessAllowed) {
        if (request.headers.authorization) {
          const token: string = request.headers.authorization.split('Bearer ')[1];
          authUser = await this.authenticateRequest(token);
        } else {
          authUser = await this.authenticateRequest(null); // so we can use AuthorizatonBindings.CURRENT_USER on routes which don't receive a token like : /categories
        }
        // If no set of roles is passed, then the provider will check if it is a public route
        isAccessAllowed = await this.checkAuthorization(authUser ? authUser.roles : null);
      }

      if (!isAccessAllowed) {
        throw new HttpErrors.Forbidden(AuthorizeErrorKeys.NotAllowedAccess);
      }

      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}
