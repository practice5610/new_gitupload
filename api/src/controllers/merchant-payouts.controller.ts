import { param, get, RestBindings, Response } from '@loopback/rest'; //eslint-disable-line
import { authorize } from '../authorization';
import { LoggingCategory } from '../constants';
import { getLogger } from 'log4js';
import { RoleKey, BoomUser } from '@boom-platform/globals';
import { inject } from '@loopback/core';
import * as admin from 'firebase-admin';
import { QuerySnapshot, QueryDocumentSnapshot } from '@google-cloud/firestore';

/**
 * Controller for managing of payouts for merchants (accounts payable)
 */
export class MerchantPayoutsController {
  logger = getLogger(LoggingCategory.MERCHANT_PAYOUTS);

  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response
  ) {}

  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @get('/payouts/merchants', {
    responses: {
      '200': {
        description:
          'Gets merchant profile info for those that have a payout amount in their account.',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Object } },
          },
        },
      },
    },
  })
  async findMerchants(@param.query.string('keyword') keyword = ''): Promise<object> {
    try {
      const firestore: admin.firestore.Firestore = admin.firestore();
      const users: QuerySnapshot = await firestore
        .collection('users')
        .where('netEarningsPendingWithdrawal.amount', '>', 0)
        .get();

      const filteredUsers: BoomUser[] = [];
      /* eslint-disable */
      !users.empty &&
        users.forEach((userDoc: QueryDocumentSnapshot) => {
          if (userDoc.exists) {
            const userData: BoomUser = userDoc.data() as BoomUser;
            const fullName = `${userData.firstName} ${userData.lastName}`;

            if (
              fullName.toLowerCase().indexOf(keyword) >= 0 ||
              userData.uid!.toLowerCase().indexOf(keyword) >= 0 ||
              userData.store!.companyName!.toLowerCase().indexOf(keyword) >= 0 ||
              userData.store!.street1!.toLowerCase().indexOf(keyword) >= 0 || //TODO: Review if we need to add street2
              userData.store!._id!.toLowerCase().indexOf(keyword) >= 0
            ) {
              filteredUsers.push(userDoc.data() as BoomUser);
            }
          }
        });

      return this.response.json({ success: true, data: filteredUsers, message: 'success' });
    } catch (err) {
      return this.response.json({ success: false, message: err.message });
    }
  }
}
