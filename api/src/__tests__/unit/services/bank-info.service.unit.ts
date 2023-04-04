import { createStubInstance, expect, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';
import sinon from 'sinon';

import { BankAccountResponseMessages } from '../../../constants';
import { BankInfo } from '../../../models';
import { BankInfoRepository, CustomerBillingRepository } from '../../../repositories';
import { BankInfoService } from '../../../services';
import {
  givenBankInfo,
  givenCustomerBilling,
  givenEmptyDatabase,
} from '../../helpers/database.helpers';
import { givenPlaidIdentityResult } from '../../helpers/response.helpers';

describe('Bank Info Service (unit)', () => {
  let bankInfoRepository: StubbedInstanceWithSinonAccessor<BankInfoRepository>;
  let customerBillingRepository: StubbedInstanceWithSinonAccessor<CustomerBillingRepository>;

  beforeEach(givenEmptyDatabase);
  beforeEach(givenBankInfoRepository);
  beforeEach(givenCustomerBillingRepository);

  describe('deleteAccounts', () => {
    /**
     * an error should be thrown if any of the given accounts have a pending billing.
     *
     * CAN WE TEST THE TRANSACTIONAL DELETE YET?
     */
    it('throws error if the account has a pending transaction', async () => {
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const input = [{ plaidID: 'plaidid', userID: 'userid' }];
      const pendingBillings = await givenCustomerBilling();
      customerBillingRepository.stubs.find.resolves([pendingBillings]);

      await expect(service.deleteAccounts(input)).to.be.rejectedWith(
        BankAccountResponseMessages.BANK_DELETE_BLOCKED
      );
    });

    it('does nothing if the provided accounts do not exist', async () => {
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const input = [{ plaidID: 'plaidid', userID: 'userid' }];

      customerBillingRepository.stubs.find.resolves([]);
      bankInfoRepository.stubs.find.resolves([]);

      await service.deleteAccounts(input);
      expect(bankInfoRepository.stubs.delete.callCount).to.equal(0);
    });

    it('calls delete on the provided accounts if they exist', async () => {
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const input = [{ plaidID: 'plaidid', userID: 'userid' }];
      const bankInfo: BankInfo = await givenBankInfo();

      customerBillingRepository.stubs.find.resolves([]);
      bankInfoRepository.stubs.find.resolves([bankInfo]);

      await service.deleteAccounts(input);
      expect(bankInfoRepository.stubs.delete.callCount).to.equal(1);
    });

    it('calls delete on multiple provided accounts if they exist', async () => {
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const input = [{ plaidID: 'plaidid', userID: 'userid' }];
      const bankInfo: BankInfo = await givenBankInfo();

      customerBillingRepository.stubs.find.resolves([]);
      bankInfoRepository.stubs.find.resolves([bankInfo, bankInfo]);

      await service.deleteAccounts(input);
      expect(bankInfoRepository.stubs.delete.callCount).to.equal(2);
    });
  });

  describe('getAuth', () => {
    it('returns error if plaid throws error', async () => {
      const errorMessageFromPlaid = {
        error_code: 'INVALID_ACCESS_TOKEN',
        error_message: 'This is an error message',
      };
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const fake = sinon.fake.yields(errorMessageFromPlaid, null);
      sinon.replace(service.client, 'getAuth', fake);

      const result = await service.getAuth('an invalid token');

      expect(fake.callCount).to.equal(1);
      expect(result).to.eql({
        success: false,
        message: errorMessageFromPlaid.error_message,
        data: errorMessageFromPlaid,
      });
    });

    it('returns success on Plaid success', async () => {
      const responseFromPlaid = {
        accounts: [
          {
            account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
            balances: {
              available: 100,
              current: 110,
              limit: null,
              iso_currency_code: 'USD',
              unofficial_currency_code: null,
            },
            mask: '9606',
            name: 'Plaid Checking',
            official_name: 'Plaid Gold Checking',
            subtype: 'checking',
            type: 'depository',
          },
        ],
        numbers: {
          ach: [
            {
              account: '9900009606',
              account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
              routing: '011401533',
              wire_routing: '021000021',
            },
          ],
          eft: [],
          international: [],
          bacs: [],
        },
        item: {
          available_products: ['balance', 'identity', 'payment_initiation', 'transactions'],
          billed_products: ['assets', 'auth'],
          consent_expiration_time: null,
          error: null,
          institution_id: 'ins_117650',
          item_id: 'DWVAAPWq4RHGlEaNyGKRTAnPLaEmo8Cvq7na6',
          webhook: 'https://www.genericwebhookurl.com/webhook',
        },
        request_id: 'm8MDnv9okwxFNBV',
      };
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const fake = sinon.fake.yields(null, responseFromPlaid);
      sinon.replace(service.client, 'getAuth', fake);

      const result = await service.getAuth('an invalid token');

      expect(fake.callCount).to.equal(1);
      expect(result).to.eql({
        success: true,
        message: 'Success',
        data: {
          numbers: {
            achNumbers: [
              {
                account: '9900009606',
                account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
                routing: '011401533',
                wire_routing: '021000021',
              },
            ],
          },
          accounts: [
            {
              account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
              balances: {
                available: 100,
                current: 110,
                limit: null,
                iso_currency_code: 'USD',
                unofficial_currency_code: null,
              },
              mask: '9606',
              name: 'Plaid Checking',
              official_name: 'Plaid Gold Checking',
              subtype: 'checking',
              type: 'depository',
            },
          ],
        },
      });
    });
  });

  describe('getIdentity', () => {
    it('returns error if plaid throws error', async () => {
      const errorMessageFromPlaid = {
        error_code: 'INVALID_ACCESS_TOKEN',
        error_message: 'This is an error message',
      };
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const fake = sinon.fake.yields(errorMessageFromPlaid, null);
      sinon.replace(service.client, 'getIdentity', fake);

      const result = await service.getIdentity('an invalid token');

      expect(fake.callCount).to.equal(1);
      expect(result).to.eql({
        success: false,
        message: errorMessageFromPlaid.error_message,
        data: errorMessageFromPlaid,
      });
    });

    it('returns success on Plaid success', async () => {
      const responseFromPlaid = givenPlaidIdentityResult();
      const service = new BankInfoService(bankInfoRepository, customerBillingRepository);
      const fake = sinon.fake.yields(null, responseFromPlaid);
      sinon.replace(service.client, 'getIdentity', fake);

      const result = await service.getIdentity('an invalid token');

      expect(fake.callCount).to.equal(1);
      expect(result).to.eql({
        success: true,
        message: 'Success',
        data: responseFromPlaid,
      });
    });
  });

  function givenBankInfoRepository() {
    bankInfoRepository = createStubInstance(BankInfoRepository);
  }
  function givenCustomerBillingRepository() {
    customerBillingRepository = createStubInstance(CustomerBillingRepository);
  }
});
