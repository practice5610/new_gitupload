import { AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import { service } from 'loopback4-spring';
import moment from 'moment';
import { nanoid } from 'nanoid';
// import { rateLimitKeyGen } from '../utils/rateLimitKeyGen';
import RedisStore from 'rate-limit-redis';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  InventoryItemResponseMessages,
  InventoryItemStatus,
  ProfileResponseMessages,
  REDIS_CONFIGURATION,
  REDIS_ENABLED,
} from '../constants';
import { ratelimit } from '../loopback4-ratelimiter';
import { InventoryItem } from '../models';
import { InventoryItemRepository } from '../repositories';
import { ProfileService } from '../services/profile.service';

export class InventoryItemsController {
  constructor(
    @repository(InventoryItemRepository)
    public inventoryItemRepository: InventoryItemRepository,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ProfileService)
    public profileService: ProfileService
  ) {}

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/inventory', {
    responses: {
      '200': {
        description: 'Inventory Item model instance',
        content: { 'application/json': { schema: { 'x-ts-type': InventoryItem } } },
      },
    },
  })
  async create(@requestBody() inventoryItem: InventoryItem): Promise<InventoryItem | Response> {
    const now: number = moment().utc().unix();
    const newInventoryItem: InventoryItem = {
      ...inventoryItem,
      status: InventoryItemStatus.INACTIVE,
      createdAt: now,
      updatedAt: now,
      friendlyID: nanoid(10), //it can collide but expected time is 17 years for 1%
    } as InventoryItem;

    const result = await this.inventoryItemRepository.create(newInventoryItem);

    return result;
  }

  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/inventory/{id}', {
    responses: {
      '204': {
        description: 'Inventory Item PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() inventoryItem: InventoryItem
  ): Promise<void | Response> {
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const isAdmin: boolean =
      currentUser.roles.includes(RoleKey.Admin) || currentUser.roles.includes(RoleKey.SuperAdmin);
    const now: number = moment().utc().unix();

    if (isAdmin) {
      const newInventoryItem: InventoryItem = {
        ...inventoryItem,
        updatedAt: now,
      } as InventoryItem;
      await this.inventoryItemRepository.updateById(id, newInventoryItem);
    } else {
      const targetItem: InventoryItem = await this.inventoryItemRepository.findById(id);

      if (targetItem.merchant?.uid !== currentUser.uid)
        throw new HttpErrors.BadRequest(InventoryItemResponseMessages.MERCHANT_UNAUTHORIZED);

      if (!inventoryItem.itemID && !inventoryItem.nickname)
        throw new HttpErrors.BadRequest(APIResponseMessages.INVALID_JSON);

      if (inventoryItem.itemID) {
        if (targetItem.status !== InventoryItemStatus.INACTIVE_ISSUED)
          throw new HttpErrors.BadRequest(InventoryItemResponseMessages.ITEM_STATUS_INVALID);

        const newInventoryItem: InventoryItem = {
          ...targetItem,
          updatedAt: now,
          itemID: inventoryItem.itemID,
          status: InventoryItemStatus.ACTIVE,
        } as InventoryItem;

        await this.inventoryItemRepository.updateById(id, newInventoryItem);
      } else if (inventoryItem.nickname) {
        const newInventoryItem: InventoryItem = {
          ...targetItem,
          updatedAt: now,
          nickname: inventoryItem.nickname,
        } as InventoryItem;

        await this.inventoryItemRepository.updateById(id, newInventoryItem);
      }
    }
  }

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/inventory', {
    responses: {
      '204': {
        description: 'Inventory List PATCH success',
      },
    },
  })
  async updateList(@requestBody() list: any[]): Promise<void | Response> {
    for (const item of list) {
      const newInventoryItem = await this.inventoryItemRepository.findById(item._id);
      newInventoryItem.status = item.status;
      newInventoryItem.inactiveReason = item.inactiveReason;
      newInventoryItem.updatedAt = moment().utc().unix();

      await this.inventoryItemRepository.updateById(item._id, newInventoryItem);
    }
  }

  @ratelimit(true, {
    store: REDIS_ENABLED
      ? new RedisStore({
          client: require('redis').createClient(REDIS_CONFIGURATION),
          expiry: 30, // 30 seconds
          prefix: 'inventory:', // Used to rename the redis variable name
          resetExpiryOnChange: true,
        })
      : undefined,
    windowMs: 30000, // 30 seconds
    max: 3,
    message: '[Inventory] You have exceeded the 3 requests in 30 seconds limit!',
    //keyGenerator: rateLimitKeyGen, // we could set a different one if needed
    /*handler: function (req, res, next) { // These overwrite the ones set on api\src\application.ts
      console.log('handler', req.originalUrl);
      console.log('limit', req.rateLimit.limit);
      console.log('current', req.rateLimit.current);
      console.log('remaining ', req.rateLimit.remaining);
      console.log('options ', next);
      next();
      //res.status(options.statusCode).send(options.message);
    },*/
    /*onLimitReached: function (req, res, options) {
      console.log('onLimitReached', req.originalUrl);
    },*/
  })
  @authorize([RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/inventory', {
    responses: {
      '200': {
        description: 'Array of InventoryItem model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': InventoryItem } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(InventoryItem)) filter?: Filter<InventoryItem>
  ): Promise<InventoryItem[]> {
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    const isMerchant: boolean = currentUser.roles.includes(RoleKey.Merchant);

    if (isMerchant) {
      filter = {
        ...filter,
        where: {
          and: [{ ...filter?.where }, { 'merchant.uid': currentUser.uid }],
        },
      } as Filter<InventoryItem>;
    }
    return this.inventoryItemRepository.find(filter);
  }
}
