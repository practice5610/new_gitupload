import { APIResponse } from '@boom-platform/globals';
import { repository } from '@loopback/repository';
import { getLogger, Logger } from 'log4js';

import { APIResponseMessages, GlobalResponseMessages, LoggingCategory } from '../constants';
import { Store } from '../models';
import { StoreRepository } from '../repositories';
import { APIResponseFalseOutput } from '../utils';

export class StoreService {
  logger: Logger = getLogger(LoggingCategory.STORE_SERVICE);
  constructor(
    @repository(StoreRepository)
    public storeRepository: StoreRepository
  ) {}

  async findStoreById(id: string): Promise<APIResponse<Store>> {
    try {
      const storeData: Store = await this.storeRepository.findById(id);
      if (storeData) {
        return { success: true, message: 'Success', data: storeData };
      } else {
        return APIResponseFalseOutput(APIResponseMessages.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      this.logger.error(error);
      if (error.code) return APIResponseFalseOutput(error.code);
      return APIResponseFalseOutput(GlobalResponseMessages.DB_ERROR);
    }
  }
}
