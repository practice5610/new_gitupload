import { RoleKey } from '@boom-platform/globals';
import { Count, CountSchema, Filter, repository, Where } from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import moment from 'moment';

import { authorize } from '../authorization';
import { Review } from '../models';
import { ReviewRepository } from '../repositories';

export class ReviewController {
  constructor(
    @repository(ReviewRepository)
    public reviewRepository: ReviewRepository
  ) {}
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/reviews', {
    responses: {
      '200': {
        description: 'Review model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Review } } },
      },
    },
  })
  async create(@requestBody() review: Review): Promise<Review> {
    const now: number = moment().utc().unix();
    review.createdAt = now;
    review.updatedAt = now;
    return this.reviewRepository.create(review);
  }
  @authorize([RoleKey.All])
  @get('/reviews/count', {
    responses: {
      '200': {
        description: 'Review model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Review)) where?: Where<Review>
  ): Promise<Count> {
    return this.reviewRepository.count(where);
  }
  @authorize([RoleKey.All])
  @get('/reviews', {
    responses: {
      '200': {
        description: 'Array of Review model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Review } },
          },
        },
      },
    },
  })
  async find(
    //@ts-ignore
    @param.query.object('filter', getFilterSchemaFor(Review)) filter?: Filter<Review>
  ): Promise<Review[]> {
    return this.reviewRepository.find(filter);
  }
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/reviews', {
    responses: {
      '200': {
        description: 'Review PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody() review: Review,
    //@ts-ignore
    @param.query.object('where', getWhereSchemaFor(Review)) where?: Where<Review>
  ): Promise<Count> {
    review.updatedAt = moment().utc().unix();
    return this.reviewRepository.updateAll(review, where);
  }
  @authorize([RoleKey.All])
  @get('/reviews/{id}', {
    responses: {
      '200': {
        description: 'Review model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Review } } },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Review> {
    return this.reviewRepository.findById(id);
  }
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @patch('/reviews/{id}', {
    responses: {
      '204': {
        description: 'Review PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() review: Review
  ): Promise<void> {
    review.updatedAt = moment().utc().unix();
    await this.reviewRepository.updateById(id, review);
  }
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @put('/reviews/{id}', {
    responses: {
      '204': {
        description: 'Review PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() review: Review
  ): Promise<void> {
    const now: number = moment().utc().unix();
    review.createdAt = now;
    review.updatedAt = now;
    await this.reviewRepository.replaceById(id, review);
  }
  @authorize([RoleKey.Member, RoleKey.Admin, RoleKey.SuperAdmin])
  @del('/reviews/{id}', {
    responses: {
      '204': {
        description: 'Review DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.reviewRepository.deleteById(id);
  }
}
