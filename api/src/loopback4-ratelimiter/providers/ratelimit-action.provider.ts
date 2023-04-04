// import { CoreBindings, inject, Provider } from '@loopback/core'; // *** Reenable this if the juggler part works at some point
import { inject, Provider } from '@loopback/core';
// import { Getter, juggler } from '@loopback/repository'; // *** Reenable this if the juggler part works at some point
import { Getter } from '@loopback/repository';
// import { Request, Response, RestApplication, HttpErrors } from '@loopback/rest';  // *** Reenable this if the juggler part works at some point
import { HttpErrors, Request, Response } from '@loopback/rest';
import * as RateLimit from 'express-rate-limit';

//import * as RedisStore from 'rate-limit-redis'; // *** Reenable this if the juggler part works at some point
import { RateLimitSecurityBindings } from '../keys';
import { RateLimitAction, RateLimitMetadata, RateLimitOptions } from '../types';

export class RatelimitActionProvider implements Provider<RateLimitAction> {
  constructor(
    @inject.getter(RateLimitSecurityBindings.METADATA)
    private readonly getMetadata: Getter<RateLimitMetadata>,
    // @inject(CoreBindings.APPLICATION_INSTANCE) // TODO: Reenable this if the juggler part works at some point
    // private readonly application: RestApplication,
    // @inject('RateLimitSecurityBindings.CONFIG')
    @inject('RateLimitSecurityBindings.CONFIG') // *** Changed to String to fix injection issue, this was done on api\src\application.ts too
    private readonly config: RateLimitOptions
  ) {
    // console.log('application RateLimitSecurityBindings.CONFIG', RateLimitSecurityBindings.CONFIG); // *** Enable for testing
  }

  value(): RateLimitAction {
    return (req, resp) => this.action(req, resp);
  }

  async action(request: Request, response: Response): Promise<void> {
    const metadata: RateLimitMetadata = await this.getMetadata();

    // console.log('metadata', metadata); // *** Enable for testing
    //if metadata is null it means we are using the global settings - all routes, so we should continue
    if (metadata && !metadata.enabled) {
      return Promise.resolve();
    }

    // console.log('this.config', this.config); // *** Enable for testing
    // For redis datasource
    /* 
    let redisDS: juggler.DataSource;
    if (this.config) {
      redisDS = (await this.application.get(`datasources.${this.config.name}`)) as juggler.DataSource; // *** the juggler returned is always null, I cannot find where this juggler is created
    }
    */

    // Perform rate limiting now
    const promise = new Promise<void>((resolve, reject) => {
      // First check if rate limit options available at method level
      const operationMetadata = metadata ? metadata.options : {};

      // Create options based on global config and method level config
      const opts = Object.assign({}, this.config, operationMetadata); // Merges global settings and the ones added with the decorator on the controller if one is found

      // console.log('opts', opts); // *** Enable for testing

      /*if (redisDS?.connector) { // TODO: Reenable this if the juggler part works at some point
        opts.store = new RedisStore.default({
          client: redisDS.connector._client,
        });
      }*/

      opts.message = new HttpErrors.TooManyRequests(
        opts.message?.toString() ?? 'Method rate limit reached !'
      );

      const limiter = RateLimit.default(opts);
      limiter(request, response, (err: unknown) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
    await promise;
  }
}
