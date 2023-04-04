import { AllOptional, AllOptionalExceptFor, BoomUser, RoleKey } from '@boom-platform/globals';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteResult,
} from '@google-cloud/firestore';
//import Ajv, { JSONSchemaType } from 'ajv'; // TODO: Enable when Loopback gets updated
import Ajv from 'ajv';
import * as admin from 'firebase-admin';
//import { FromSchema } from 'json-schema-to-ts'; // TODO: Enable once loopback is updated and Schemas are all set
import { getLogger, Logger } from 'log4js';
import moment from 'moment';

import {
  APIResponseMessages,
  FilterResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
  ServiceResponseCodes,
} from '../constants';
import { ServiceResponse } from '../types';
import { CreateUserType, FilterAdminUsersType, ProfileSchema } from '../validation/schemas';

export enum getProfileOptions {
  BY_ID = 'by_id',
  BY_PHONE = 'by_phone',
  BY_EMAIL = 'by_email',
  BY_CARD = 'by_card',
}

export interface getProfileProperties {
  requiredFields?: (keyof BoomUser)[];
  method?: getProfileOptions;
  messageNoProfileFound?: ProfileResponseMessages;
}

const ajv = new Ajv({ allErrors: true });

export class ProfileService {
  logger: Logger = getLogger(LoggingCategory.PROFILE_SERVICE);

  async createUser(user: CreateUserType): Promise<ServiceResponse<admin.auth.UserRecord>> {
    try {
      const userRecord = await admin
        .auth()
        .createUser({ email: user.email, password: user.password, disabled: false });
      const firestore: admin.firestore.Firestore = admin.firestore();
      // TODO: this was done previously on the frontend but now we can do it on the API itself, we should check the rules to see if we can block the users database later
      // for the web repo we could see if we can reuse this API endpoint
      const userDoc: DocumentReference = firestore.doc(`users/${userRecord.uid}`);
      await userDoc.set({
        uid: userRecord.uid,
        roles: user.roles,
        contact: { emails: [user.email] },
        createdAt: moment().utc().unix(),
      });
      /*
      // This would allow to instantly update the roles, it could be useful later if we use the same endpoint for the web repository
       await admin.auth().setCustomUserClaims(userRecord.uid, {
        roles: newDoc.roles,
      });
      */
      return { success: true, statusCode: ServiceResponseCodes.SUCCESS, data: userRecord };
    } catch (error) {
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getProfile<T = AllOptional<BoomUser>>(
    value: string,
    {
      requiredFields = [],
      method = getProfileOptions.BY_ID,
      messageNoProfileFound = ProfileResponseMessages.NO_PROFILE_FOUND,
    }: getProfileProperties = {}
  ): Promise<
    ServiceResponse<T & AllOptionalExceptFor<BoomUser, 'uid' | 'createdAt' | 'updatedAt' | 'roles'>>
  > {
    const firestore: admin.firestore.Firestore = admin.firestore();
    console.log('workingfine');
    // console.log('workingfine1', firestore);

    let id: string = value;
    let phone: string = value;
    const email: string = value;
    const cardId: string = value;
    let user: admin.auth.UserRecord;
    let userCollection: QuerySnapshot | undefined = undefined;
    switch (method) {
      case getProfileOptions.BY_PHONE:
        if (phone.length === 10) {
          // TODO: on ticket BW-1528 we should remove this validation the controller endpoint should check we get a number and verify that the +1 is present (Check line 102 api\src\controllers\users.controller.ts)
          phone = '+1' + phone;
        }
        try {
          user = await admin.auth().getUserByPhoneNumber(phone);
        } catch {
          return {
            success: false,
            statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
            privateMessage: 'Error with phone number provided',
            message: messageNoProfileFound,
          };
        }
        id = user.uid;
        break;
      case getProfileOptions.BY_EMAIL:
        try {
          user = await admin.auth().getUserByEmail(email);
        } catch {
          return {
            success: false,
            statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
            privateMessage: 'Error with Email provided',
            message: messageNoProfileFound,
          };
        }
        id = user.uid;
        break;
      case getProfileOptions.BY_CARD:
        userCollection = await firestore
          .collection('users')
          .where('cards', 'array-contains', cardId)
          .get();

        if (userCollection.empty) {
          return {
            success: false,
            statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
            //privateMessage: messageNoProfileFound,
            message: messageNoProfileFound,
          };
        }
        break;
      case getProfileOptions.BY_ID:
      default:
      //nothing is made line 151 would return error
    }
    let userDoc: DocumentSnapshot;
    if (method === getProfileOptions.BY_CARD && userCollection) {
      userDoc = userCollection.docs[0];
    } else if (method !== getProfileOptions.BY_CARD) {
      userDoc = await firestore.doc(`users/${id}`).get();
    } else {
      // just in case we sent a 'method' value not supported
      return {
        success: false,
        statusCode: ServiceResponseCodes.NOT_IMPLEMENTED,
        //privateMessage: ProfileResponseMessages.METHOD_NOT_SUPPORTED,
        message: ProfileResponseMessages.METHOD_NOT_SUPPORTED,
      };
    }

    if (userDoc.exists) {
      /* 
      TODO: Enable when Loopback gets updated
      const ProfileSchemaRequiredType: JSONSchemaType<
        T & {
        uid: BoomUser['uid'];
        createdAt: BoomUser['createdAt'];
        updatedAt: BoomUser['updatedAt'];
      }
      > = {
      */

      // const ProfileSchemaRequired = {
      //   ...ProfileSchema,
      //   required: ['uid', 'createdAt', 'updatedAt', 'roles', ...requiredFields], // uid, createdAt, roles, and updatedAt are always requested
      // } as const;
      // const validate = ajv.compile(ProfileSchemaRequired); // TODO: Review if this can be memoized(validate.errors could be an issue though)

      const data: DocumentData | undefined = userDoc.data();
      // console.log('userdata', data);
      //const valid = await validate(data);
      if (data != null) {
        // TODO: Validate false first in case once ajv is updated this keeps not working as type guard
        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          //data: data as FromSchema<typeof ProfileSchemaRequired>, // TODO: Enable once loopback is updated and Schemas are all set
          data: data as T & {
            uid: NonNullable<BoomUser['uid']>;
            createdAt: NonNullable<BoomUser['createdAt']>;
            updatedAt: NonNullable<BoomUser['updatedAt']>;
            roles: NonNullable<BoomUser['roles']>;
          },
        };
      } else {
        this.logger.error(`${ProfileResponseMessages.CORRUPT_PROFILE_DATA} ${id}`);
        // this.logger.error('Errors : ', validate.errors);
        return {
          success: false,
          statusCode: ServiceResponseCodes.RECORD_CONFLICT,
          //privateMessage: `${ProfileResponseMessages.CORRUPT_PROFILE_DATA} ${id}`,
          message: `${ProfileResponseMessages.CORRUPT_PROFILE_DATA} ${id}`,
        };
      }
    } else {
      return {
        success: false,
        statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
        //privateMessage: messageNoProfileFound,
        message: messageNoProfileFound,
      };
    }
  }

  async getFilteredProfiles(filter: FilterAdminUsersType): Promise<ServiceResponse<BoomUser[]>> {
    const firestore: admin.firestore.Firestore = admin.firestore();
    // TODO: Review this function | Type guard
    function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
      return value !== null && value !== undefined;
    }

    // This part is only used for unit testing, specifications already supports this validation
    if (!filter)
      return {
        success: false,
        statusCode: ServiceResponseCodes.BAD_REQUEST,
        message: FilterResponseMessages.MISSING,
      };

    // This part is only used for unit testing, specifications already supports this validation
    if (!filter.where)
      return {
        success: false,
        statusCode: ServiceResponseCodes.BAD_REQUEST,
        message: FilterResponseMessages.INVALID,
      };

    // This part is only used for unit testing, specifications already supports this validation
    if (Object.keys(filter.where).length > 1)
      return {
        success: false,
        statusCode: ServiceResponseCodes.BAD_REQUEST,
        message: FilterResponseMessages.MORE_THAN_ONE_CONDITION,
      };

    try {
      if (filter.where.roles) {
        if (
          filter.where.roles.includes(RoleKey.Merchant) ||
          filter.where.roles.includes(RoleKey.Member)
        ) {
          // TODO: if we allow more filters we need to block admin and superAdmin results they must not be included
          const users: QuerySnapshot = await firestore
            .collection('users')
            .where(
              'roles',
              'array-contains',
              filter.where.roles.includes(RoleKey.Merchant) ? RoleKey.Merchant : RoleKey.Member // we only search by one role
            )
            .get();
          let allProfiles = users.docs.map((userDoc: QueryDocumentSnapshot) => {
            //TODO: No validations to the records are done here, maybe we can apply one once all records are correct
            return userDoc.data();
          });
          allProfiles = allProfiles?.filter(notEmpty);
          if (!allProfiles?.length)
            return {
              success: false,
              statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
              message: ProfileResponseMessages.NO_PROFILES_FOUND,
            };
          return {
            success: true,
            statusCode: ServiceResponseCodes.SUCCESS,
            //data: data as FromSchema<typeof ProfileSchemaRequired>, // TODO: Enable once loopback is updated and Schemas are all set
            data: allProfiles,
          };
        }
        return {
          // This part is only used for unit testing, specifications already supports this validation
          success: false,
          statusCode: ServiceResponseCodes.BAD_REQUEST,
          message: GlobalResponseMessages.INVALID_ROLE,
        };
      }
      if (filter.where.uid) {
        const profile = await this.getProfile(filter.where.uid, {
          method: getProfileOptions.BY_ID,
        });

        if (!profile.success || !profile.data)
          // we could use here handleServiceResponseResult
          return {
            success: false,
            statusCode: profile.statusCode ?? ServiceResponseCodes.RECORD_NOT_FOUND,
            message: profile.message ?? ProfileResponseMessages.NO_PROFILE_FOUND,
          };

        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          //data: data as FromSchema<typeof ProfileSchemaRequired>, // TODO: Enable once loopback is updated and Schemas are all set
          data: [profile.data],
        };
      } /* else { // this causes no to go further with other checks
        return {
          success: false,
          statusCode: ServiceResponseCodes.BAD_REQUEST,
          message: GlobalResponseMessages.INVALID_ID,
        };
      }*/

      if (filter.where.createdAt) {
        let users: QuerySnapshot;
        if (String(filter.where.createdAt).includes(',')) {
          const range = String(filter.where.createdAt).split(',');
          const startDate = parseInt(range[0]);
          const endDate = parseInt(range[1]);

          if (startDate > endDate)
            return {
              success: false,
              statusCode: ServiceResponseCodes.BAD_REQUEST,
              message: FilterResponseMessages.INVALID_DATE_RANGE,
            };

          users = await firestore
            .collection('users')
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<=', endDate)
            .get();
        } else {
          const Date = parseInt(filter.where.createdAt);

          users = await firestore.collection('users').where('createdAt', '>=', Date).get();
        }
        let allProfiles = users.docs.map((userDoc: QueryDocumentSnapshot) => {
          return userDoc.data();
        });

        allProfiles = allProfiles?.filter(notEmpty);
        if (!allProfiles?.length)
          return {
            success: false,
            statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
            message: ProfileResponseMessages.NO_PROFILES_FOUND,
          };
        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          //data: data as FromSchema<typeof ProfileSchemaRequired>, // TODO: Enable once loopback is updated and Schemas are all set
          data: allProfiles,
        };
      }
      if (filter.where.hasCards !== undefined) {
        const users: QuerySnapshot = await firestore
          .collection('users')
          .where('hasCards', '==', filter.where.hasCards)
          .get();

        let allProfiles = users.docs.map((userDoc: QueryDocumentSnapshot) => {
          return userDoc.data();
        });

        allProfiles = allProfiles?.filter(notEmpty);
        if (!allProfiles?.length)
          return {
            success: false,
            statusCode: ServiceResponseCodes.RECORD_NOT_FOUND,
            message: ProfileResponseMessages.NO_PROFILES_FOUND,
          };
        return {
          success: true,
          statusCode: ServiceResponseCodes.SUCCESS,
          //data: data as FromSchema<typeof ProfileSchemaRequired>, // TODO: Enable once loopback is updated and Schemas are all set
          data: allProfiles,
        };
      }
      return {
        // This part is only used for unit testing, specifications already supports this validation
        success: false,
        statusCode: ServiceResponseCodes.BAD_REQUEST,
        message: FilterResponseMessages.INVALID_FILTERS,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: ServiceResponseCodes.INTERNAL_SERVER_ERROR,
        message: APIResponseMessages.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async generateCustomToken(uid: string, options: object): Promise<string> {
    const token: string = await admin.auth().createCustomToken(uid, options);
    return token;
  }

  async updateProfileById(uid: string, data: BoomUser): Promise<WriteResult> {
    const firestore: admin.firestore.Firestore = admin.firestore();
    const userDoc: DocumentReference = firestore.doc(`users/${uid}`);
    return userDoc.update(data);
  }
  async updateManyProfilesById(
    profiles: AllOptionalExceptFor<BoomUser, 'uid'>[]
  ): Promise<WriteResult[]> {
    const firestore: admin.firestore.Firestore = admin.firestore();
    const batch = firestore.batch();
    for (const profile of profiles) {
      const userDoc: DocumentReference = firestore.doc(`users/${profile.uid}`);
      batch.update(userDoc, profile);
    }
    return batch.commit();
  }
}
