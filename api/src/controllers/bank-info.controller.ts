import {
  AccountOwnerInfo,
  AllOptionalExceptFor,
  APIResponse as APIResponse2,
  BoomUser,
  BoomUserPlaidInfo,
  PlaidAddress,
  PlaidAuthResult,
  PlaidIdentityResult,
  RoleKey,
} from '@boom-platform/globals';
import { Getter, inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, HttpErrors, post, requestBody, Response, RestBindings } from '@loopback/rest';
import { getLogger } from 'log4js';
import { service } from 'loopback4-spring';
import moment from 'moment';

import { AuthorizatonBindings, authorize } from '../authorization';
import {
  APIResponseMessages,
  BankAccountResponseMessages,
  GlobalResponseMessages,
  LoggingCategory,
  ProfileResponseMessages,
} from '../constants';
import { BankInfo } from '../models';
import { BankInfoRepository } from '../repositories/bank-info.repository';
import { BankInfoService, BoomAccountService, ProfileService } from '../services';
import { handleServiceResponseResult } from '../utils';

/**
 * This controller routes bank account information requests to/from user profiles and our bank account info service
 */
export class BankInfoController {
  logger = getLogger(LoggingCategory.BANK_INFO_SERVICE);

  constructor(
    @repository(BankInfoRepository)
    public bankInfoRepository: BankInfoRepository,
    @inject(RestBindings.Http.RESPONSE)
    protected response: Response,
    @service(ProfileService)
    private profileService: ProfileService,
    @service(BoomAccountService)
    private boomAccountService: BoomAccountService,
    @service(BankInfoService)
    private bankInfoService: BankInfoService,
    @inject.getter(AuthorizatonBindings.CURRENT_USER)
    public currentUserGetter: Getter<AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined>
  ) {}

  /**
   * Get the environment defined for Plaid on the API environment. Plaid environment and front end environments must match
   */
  @authorize([RoleKey.All])
  @get('/bank-info/auth/getPlaidEnvInfo', {
    responses: {
      '200': {
        description: 'Retrieves a public key from the payment processor.',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  getPlaidEnvInfo(): object {
    const result: any = this.bankInfoService.getPlaidEnvInfo();
    return {
      success: true,
      plaidEnv: result.env,
      message: 'Successfully fetched plaid env info',
    };
  }

  /**
   * Get Plaid public token to authorize user with the Plaid front-end interface
   * @param req
   */
  @authorize([RoleKey.All])
  @post('/bank-info/auth/getPublicToken', {
    responses: {
      '200': {
        description: 'Retrieves public token from the Plaid service.',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async getPlaidPublicToken(@requestBody() req: { itemId: string; uid: string }): Promise<object> {
    const { itemId, uid } = req;

    const profile = await this.profileService.getProfile<
      AllOptionalExceptFor<BoomUser, 'plaidInfo'>
    >(uid, {
      requiredFields: ['plaidInfo'],
    });

    const profileData = handleServiceResponseResult<typeof profile.data>(profile);
    if (!profileData) throw new HttpErrors.NotFound(APIResponseMessages.RECORD_NOT_FOUND); // This line is only to keep TS ok, handleServiceResponseResult will automatically do this for us

    const plaidInfo: BoomUserPlaidInfo | undefined = profileData.plaidInfo.find(
      (info: BoomUserPlaidInfo) => info.item.itemId === itemId
    );

    const plaidAccessToken = plaidInfo ? plaidInfo.item.accessToken : null;

    if (!plaidAccessToken) throw new HttpErrors.NotFound();

    const result: any = await this.bankInfoService.getPlaidPublicToken(plaidAccessToken);
    return result;
  }

  @authorize([RoleKey.All])
  @post('/bank-info/auth/exchangeToken', {
    responses: {
      '200': {
        description: 'Retrieves access token from the Plaid service.',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async exchangeToken(@requestBody() req: { publicToken: string }): Promise<object> {
    const { publicToken } = req;
    const result: any = await this.bankInfoService.exchangeToken(publicToken);
    return { success: true, item: result };
  }

  @authorize([RoleKey.Member, RoleKey.Merchant])
  @post('/bank-info/saveAccounts', {
    responses: {
      '200': {
        description: 'Saves new account info',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async saveAccounts(
    @requestBody() req: { plaidInfo: any; user: AllOptionalExceptFor<BoomUser, 'uid'> }
  ): Promise<any> {
    // accounts to be added to the database
    const bankInfoList: BankInfo[] = [];
    const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
      await this.currentUserGetter();
    if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

    if (currentUser.uid !== req.user.uid) {
      // throw new HttpErrors.Forbidden(GlobalResponseMessages.NOT_AUTHORIZED); We probably need to use this one
      return { success: false, message: GlobalResponseMessages.NOT_AUTHORIZED };
    }

    try {
      // Creating a new boom account related to current user in order to store/handle the balance.
      // This proccess should NOT stop here if the boom account fails, we will be paying Plaid ~$1 for every time we have to try again.
      if (!currentUser.boomAccounts) {
        const response = await this.boomAccountService.create(currentUser.uid);
        this.logger.debug(`Boom account created: ${response.success}`);
      }

      const itemID = req.plaidInfo.item.itemId;
      const institution = req.plaidInfo.institution.name;
      const accessToken = req.plaidInfo.item.accessToken;

      const authResult: APIResponse2<PlaidAuthResult> = await this.bankInfoService.getAuth(
        accessToken
      );

      if (!authResult.success || !authResult.data) {
        return {
          success: false,
          message: BankAccountResponseMessages.NO_ACCOUNT_NUMBERS_FROM_PLAID,
        };
      }

      const identityResult: APIResponse2<PlaidIdentityResult> =
        await this.bankInfoService.getIdentity(accessToken);

      // if the identity call gave us info we replace the auth accounts with identity accounts
      if (authResult.data && identityResult.success && identityResult.data?.accounts) {
        authResult.data.accounts = identityResult.data.accounts;
      }

      const ownerInfo: AccountOwnerInfo = {
        phone: '',
        names: [],
        address: '',
        city: '',
        state: '',
        zip: '',
        emails: [],
        gotInfoFromBank: false,
      };

      // fill the ownerInfo with the BoomUser data in case the bank does not provide data
      if (req.user.addresses?.length) {
        if (req.user.contact?.phoneNumber) {
          ownerInfo.phone = req.user.contact.phoneNumber;
        }
        if (req.user.addresses[0].number && req.user.addresses[0].street1) {
          //TODO: use new compose address function when it is created getComposedAddressFromStore
          ownerInfo.address = req.user.addresses[0].number + ' ' + req.user.addresses[0].street1;
        }
        if (req.user.addresses[0].city) {
          ownerInfo.city = req.user.addresses[0].city;
        }
        if (req.user.addresses[0].state) {
          ownerInfo.state = req.user.addresses[0].state;
        }
        if (req.user.addresses[0].zip) {
          ownerInfo.zip = req.user.addresses[0].zip;
        }
      }
      if (req.user.contact?.emails) {
        ownerInfo.emails = req.user.contact.emails;
      }

      let userName = '';
      if (req.user.firstName) userName += req.user.firstName + ' ';
      if (req.user.lastName) userName += req.user.lastName;

      ownerInfo.names = [userName];

      /**
       *  when a user connects to a bank, Plaid gets all of the accounts that the user has at that bank.
       *  We now have:
       *  1) the plaid info summary for a single institution that is saved in the user document (req.plaidInfo)
       *  2) the account numbers we got from an Auth call to Plaid (authResult.data.numbers.achNumbers)
       *  3) the account owner info from an Identity call to Plaid (authResult.data.accounts)
       *
       *    We now go through each account that the user just added to their plaidInfo, find the matching account
       *    numbers and the matching identity info, then combine it all into a new account document.
       * */
      req.plaidInfo.accounts.forEach((account: { id: string; subtype: string }) => {
        if (!authResult.data) {
          throw new HttpErrors.NotFound(BankAccountResponseMessages.NO_ACCOUNT_NUMBERS_FROM_PLAID);
        }

        //this only gets american numbers and returns if there isnt an american ach number
        const foundNumbers = authResult.data.numbers.achNumbers.find(
          (achNum) => achNum.account_id === account.id
        );

        if (!foundNumbers) {
          throw new HttpErrors.NotFound(BankAccountResponseMessages.NO_ACCOUNT_NUMBERS_FROM_PLAID);
        }

        // copy the base ownerInfo for this iteration of plaidInfo.accounts
        const accountOwner: AccountOwnerInfo = JSON.parse(JSON.stringify(ownerInfo));

        // find the account data for the current plaid account id
        const authAccountInfo = authResult.data.accounts.find(
          (acc: { account_id: string }) => acc.account_id === account.id
        );

        if (!authAccountInfo) {
          throw new HttpErrors.NotFound(BankAccountResponseMessages.NO_IDENTITY_DATA_FROM_PLAID);
        }

        //we have the account data and the account numbers
        //check if we have owners and at least an address from identity
        /***
         * owners is an array, but if there are multiple owners they are all in the first
         * element. I do not think we will miss anything by just accessing owners[0]
         */
        if (authAccountInfo.owners?.[0]?.addresses?.length) {
          //we know we have at least an address from the bank so we mark this user data as confirmed
          accountOwner.gotInfoFromBank = true;

          // if plaid gave us a name list with at least one name, use it
          if (authAccountInfo.owners[0].names && authAccountInfo.owners[0].names.length)
            accountOwner.names = authAccountInfo.owners[0].names;

          // add the list of emails from the bank if they exist
          if (authAccountInfo.owners[0].emails && authAccountInfo.owners[0].emails.length) {
            accountOwner.emails = [
              ...accountOwner.emails,
              ...authAccountInfo.owners[0].emails.map((email: { data: any }) => email.data),
            ];
          }

          if (authAccountInfo.owners[0].addresses.length > 0) {
            let primary: PlaidAddress = authAccountInfo.owners[0].addresses.find(
              (address: PlaidAddress) => address.primary
            );
            if (!primary) {
              primary = authAccountInfo.owners[0].addresses[0];
            }
            accountOwner.address = primary.data.street;
            accountOwner.city = primary.data.city;
            accountOwner.state = primary.data.region ? primary.data.region : 'NULL';
            accountOwner.zip = primary.data.postal_code || 'Not Provided';
          }
        }

        const bankInfo: BankInfo = {
          createdAt: moment().utc().unix(),
          updatedAt: moment().utc().unix(),
          accountNumber: foundNumbers.account,
          routingNumber: foundNumbers.routing,
          wireRoutingNumber: foundNumbers.wire_routing,
          plaidID: account.id,
          plaidItemID: itemID,
          plaidAccessToken: accessToken,
          name: institution + ' ' + account.subtype,
          userID: req.user.uid,
          balances: {
            available: authAccountInfo.balances.available.toString(),
            current: authAccountInfo.balances.current.toString(),
            limit: authAccountInfo.balances.limit
              ? authAccountInfo.balances.limit.toString()
              : null,
          },
          accountOwner: accountOwner,
        } as BankInfo;
        bankInfoList.push(bankInfo);
      });
    } catch (err) {
      return { success: false, message: err.message };
    }
    try {
      for (const account of bankInfoList) {
        const savedAccount = await this.bankInfoRepository.find({
          where: { and: [{ plaidID: account.plaidID }, { userID: account.userID }] },
        });
        if (savedAccount.length) throw new Error('Account exists');
      }
      for (const account of bankInfoList) {
        await this.bankInfoRepository.create(account);
      }
    } catch (err) {
      return { success: false, message: err.message };
    }

    return { success: true };
  }

  /**  we access account data from 2 places, customer billings and merchant transactions.
   *
   *    CustomerBillings have a plaidID on them and a userID so we want to check for an account with
   *    both of those things because it is the safest way to make sure we are getting the right account
   *    info. When we call this from the CustomerBillings page we just set the merchant flag to false.
   *
   *    MerchantTransactions do not include a plaidID. Since merchants can only add one bank account,
   *   we can search for an account by userID only. When we call this from the MerchantTransactions page
   *   we can just set the isMerchant flag to true.
   *
   * @param req
   */
  @authorize([RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/bank-info/getAccountInfo', {
    responses: {
      '200': {
        description:
          'Find any user bank account information by their user ID and the accounts plaid id',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async getAccountInfo(
    @requestBody() req: { uid: string; accountID: string; isMerchant: boolean }
  ): Promise<object> {
    let account;
    if (req.isMerchant) {
      account = await this.bankInfoRepository.findOne({ where: { userID: req.uid } });
    } else {
      account = await this.bankInfoRepository.findOne({
        where: { and: [{ plaidID: req.accountID }, { userID: req.uid }] },
      });
    }

    if (!account) {
      return { success: false, message: BankAccountResponseMessages.BANK_ACCOUNT_INFO_NOT_FOUND };
    }
    return { success: true, data: account };
  }

  @authorize([RoleKey.Member, RoleKey.Merchant, RoleKey.Admin, RoleKey.SuperAdmin])
  @post('/bank-info/deleteAccount', {
    responses: {
      '200': {
        description: 'deletes saved account info',
        content: { 'application/json': { schema: { 'x-ts-type': Object } } },
      },
    },
  })
  async deleteAccount(
    @requestBody() req: { plaidID: string; userID: string }[]
  ): Promise<Record<string, any>> {
    try {
      const currentUser: AllOptionalExceptFor<BoomUser, 'roles' | 'uid'> | undefined =
        await this.currentUserGetter();
      if (!currentUser) throw new HttpErrors.NotFound(ProfileResponseMessages.MEMBER_NOT_FOUND);

      if (!(req.length && currentUser.uid === req[0].userID)) {
        // throw new HttpErrors.Forbidden(GlobalResponseMessages.NOT_AUTHORIZED); We probably need to use this one
        return { success: false, message: 'you can only delete accounts with your own userID' };
      }

      await this.bankInfoService.deleteAccounts(req);
    } catch (err) {
      this.logger.error(err.message);
      if (err.message === BankAccountResponseMessages.BANK_DELETE_BLOCKED) {
        return this.response
          .status(500)
          .send({ success: false, message: BankAccountResponseMessages.BANK_DELETE_BLOCKED });
      } else {
        return this.response
          .status(500)
          .send({ success: false, message: BankAccountResponseMessages.BANK_DELETE_FAILED });
      }
    }
    return { success: true };
  }
}
