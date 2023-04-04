import { APIResponse } from '../types';

const { Client } = require('@elastic/elasticsearch');

export class SearchEngineService {
  client: any;

  constructor() {
    if (process.env.ELASTIC_SEARCH_CLOUD_ID && process.env.ELASTIC_SEARCH_ENDPOINT) {
      this.client = new Client({
        node: process.env.ELASTIC_SEARCH_ENDPOINT,
        maxRetries: 5,
        requestTimeout: 60000,
        cloud: {
          id: process.env.ELASTIC_SEARCH_CLOUD_ID,
        },
        auth: {
          username: process.env.ELASTIC_SEARCH_USER,
          password: process.env.ELASTIC_SEARCH_PW,
        },
      });
    } else {
      throw new Error('At least one Elastic Search environment variable was not found.');
    }
  }

  async create(
    indexName: string,
    //TODO: define type
    // eslint-disable-next-line
    object: any,
    searchEngineOptions: object = {}
  ): Promise<APIResponse> {
    try {
      const result = await this.client.index({
        index: indexName,
        body: object,
        ...searchEngineOptions,
      });
      /*
      result looks like this:
      {
        body: object | boolean
        statusCode: number
        headers: object
        warnings: [string],
        meta: object
      }
      https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-usage.html
       */
      return {
        success: true,
        message: 'Success',
        data: { _id: result.body._id, statusCode: result.statusCode },
      };
    } catch (error) {
      if (error?.meta?.body) console.error(error.meta.body);
      console.error(error);
      return { success: false, message: 'Failed to submit item to search engine' };
    }
  }

  //The diff between update and create is that update will expect and id attribute as part of the body object:
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/update_examples.html
  async update(
    indexName: string,
    id: string,
    //TODO: define type
    // eslint-disable-next-line
    object: any,
    searchEngineOptions: object = {}
  ): Promise<APIResponse> {
    try {
      //TODO: Must test if this way of doing it lets you do partial updates. The idea with update is for partial updating if I remember correctly
      await this.client.update({
        index: indexName,
        id,
        body: {
          doc: object,
        },
        ...searchEngineOptions,
      });
    } catch (error) {
      if (error?.meta?.body) console.error(error.meta.body);
      console.error(`Error updating object with ID of: ${id}`, error);
      return { success: false, message: 'Failed to update item on search engine' };
    }

    return { success: true, message: 'Success' };
  }

  async delete(objectID?: string, searchEngineOptions: object = {}): Promise<APIResponse> {
    try {
      await this.client.delete({
        id: objectID,
        index: process.env.SEARCH_ENGINE_STORES_INDEX,
        ...searchEngineOptions,
      });
    } catch (error) {
      if (error?.meta?.body) console.error(error.meta.body);
      console.error(error);
      return { success: false, message: `Error deleting item: ${objectID}` };
    }

    return { success: true, message: 'Success' };
  }

  async searchByObjectId(
    indexName: string,
    objectIDs: string[],
    searchEngineOptions: object = {}
  ): Promise<APIResponse> {
    try {
      const result = await this.client.search({
        index: indexName,
        ...searchEngineOptions,
        body: {
          query: {
            terms: {
              _id: objectIDs,
            },
          },
        },
      });
      return { success: true, message: 'Success', data: result.hits };
    } catch (error) {
      if (error?.meta?.body) console.error(error.meta.body);
      console.error(error);
      return { success: false, message: `Error searching objects by ID: ${objectIDs.join(',')}` };
    }
  }

  async updateManyObjects(
    indexName: string,
    //TODO: define type
    // eslint-disable-next-line
    objects: any,
    searchEngineOptions: object = {}
  ): Promise<APIResponse> {
    try {
      //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/bulk_examples.html
      await this.client.bulk({
        index: indexName,
        ...searchEngineOptions,
        body: objects,
      });

      return { success: true, message: 'Success' };
    } catch (error) {
      if (error?.meta?.body) console.error(error.meta.body);
      console.error(error);
      return { success: false, message: 'Error updating search engine items in bulk.' };
    }
  }
}
