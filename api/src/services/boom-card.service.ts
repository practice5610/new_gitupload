import { Count, Filter, repository, Where } from '@loopback/repository';
import { getLogger, Logger } from 'log4js';

import { APIResponseMessages, LoggingCategory, ServiceResponseCodes } from '../constants';
import { BoomCard } from '../models';
import { BoomCardRepository } from '../repositories';
import { ServiceResponse } from '../types';

export class BoomCardService {
  logger: Logger = getLogger(LoggingCategory.BOOM_CARD_SERVICE);
  constructor(
    @repository(BoomCardRepository)
    public boomCardRepository: BoomCardRepository
  ) {}

  async createBoomCards(boomCards: BoomCard[]): Promise<ServiceResponse<BoomCard[]>> {
    const createdBoomCards: BoomCard[] = await this.boomCardRepository.createAll(boomCards);
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: APIResponseMessages.SUCCESS,
      data: createdBoomCards,
    };
  }

  async countBoomCards(where: Where<BoomCard> | undefined): Promise<ServiceResponse<Count>> {
    const counter: Count = await this.boomCardRepository.count(where);
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: APIResponseMessages.SUCCESS,
      data: counter,
    };
  }

  async findBoomCards(filter: Filter<BoomCard> | undefined): Promise<ServiceResponse<BoomCard[]>> {
    const boomCards: BoomCard[] = await this.boomCardRepository.find(filter);
    if (boomCards.length) {
      return {
        success: true,
        statusCode: ServiceResponseCodes.SUCCESS,
        message: APIResponseMessages.SUCCESS,
        data: boomCards,
      };
    }
    return {
      success: false,
      statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
      message: APIResponseMessages.RECORD_NOT_FOUND,
    };
  }

  async findBoomCardById(id: string): Promise<ServiceResponse<BoomCard>> {
    const boomCard: BoomCard = await this.boomCardRepository.findById(id);
    return {
      success: true,
      statusCode: ServiceResponseCodes.SUCCESS,
      message: APIResponseMessages.SUCCESS,
      data: boomCard,
    };
  }
}
