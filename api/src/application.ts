import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { CronComponent } from '@loopback/cron';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication, RestBindings } from '@loopback/rest';
import { RestExplorerBindings, RestExplorerComponent } from '@loopback/rest-explorer';
import { ServiceMixin } from '@loopback/service-proxy';
import { SpringComponent } from 'loopback4-spring';
import * as path from 'path';
import RedisStore from 'rate-limit-redis';

import { AuthorizationComponent } from './authorization';
import { REDIS_CONFIGURATION, REDIS_ENABLED } from './constants';
import { RateLimiterComponent, RateLimitSecurityBindings } from './loopback4-ratelimiter';
import { MySequence } from './sequence';
import { MySequenceWithoutRedis } from './sequenceWithoutRedis';
//import { MerchantTransactionCronJob } from './cronJobs/merchantTransaction.cronjob';
import { rateLimitKeyGen } from './utils/rateLimitKeyGen';
export class BoomPlatformApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication))
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(REDIS_ENABLED ? MySequence : MySequenceWithoutRedis);

    // Set up default home page
    this.static('/', path.join(__dirname, '../../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: `/explorer`,
    });

    //this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({ debug: true }); // this only must be enable for debugging for development no production
    //this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({ safeFields: ['name', 'message', 'status', 'statusCode'] }); // All the errors that we can get back
    this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({ safeFields: ['name', 'message'] });

    this.component(RestExplorerComponent);
    this.component(AuthorizationComponent);
    this.component(SpringComponent);

    this.component(CronComponent);
    //this.add(createBindingFromClass(MerchantTransactionCronJob));

    if (REDIS_ENABLED) {
      // Customize loopback4-ratelimiter configuration
      // The settings applied are applied to each route, the count is per route
      this.bind('RateLimitSecurityBindings.CONFIG').to({
        // *** Changed to String to fix injection issue, this was done on api\src\loopback4-ratelimiter\providers\ratelimit-action.provider.ts too
        store: new RedisStore({
          client: require('redis').createClient(REDIS_CONFIGURATION),
          //redisURL: 'redis://redis',
        }),
        name: 'redis',
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 60,
        message: '[MAIN] You have exceeded the 10 requests in 1 minute limit!',
        /*handler: function (req: any, res: any, next: any) { // Left these for debugging later, these will be used on decorators too if we don´t them overwrite
        console.log('application handler', req.originalUrl);
        console.log('application limit', req.rateLimit.limit);
        console.log('application current', req.rateLimit.current);
        console.log('application remaining ', req.rateLimit.remaining);
        console.log('application options ', options);
        next();
        //res.status(options.statusCode).send(options.message);
      },
      onLimitReached: function (req: any, res: any, options: any) {
        console.log('onLimitReached', req.originalUrl);
      },*/
        keyGenerator: rateLimitKeyGen, // This function will used globally, creates the variable name used to store the data in redis
      });
      this.component(RateLimiterComponent);
    }
    this.on('stateChanged', (data) => {
      console.log('Application State Changed: ', data);
    });

    this.projectRoot = __dirname;

    // Customize @loopback/boot Boot Conventions here
    this.bootOptions = {
      controllers: {
        // Customize Controller Boot Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
