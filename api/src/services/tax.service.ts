import { APIResponse, Money } from '@boom-platform/globals';
import Dinero from 'dinero.js';
import { getLogger } from 'log4js';
import Taxjar from 'taxjar';
import { TaxForOrderRes } from 'taxjar/dist/types/returnTypes';

import { LoggingCategory } from '../constants';
import { Nexus } from '../types/tax';
import { TaxAddress } from '../types/tax-address';

const apiKey = process.env.TAXJAR_SANDBOX_API_KEY || '';
const apiUrl = Taxjar.SANDBOX_API_URL || '';

export class TaxService {
  logger = getLogger(LoggingCategory.TAXES);
  client: any;
  constructor() {
    this.client = new Taxjar({
      apiKey,
      apiUrl,
    });
  }
  async getTotalTaxByProduct(
    fromAddress: TaxAddress,
    toAddress: TaxAddress,
    nexus: Nexus[],
    price: Money
  ): Promise<APIResponse<TaxForOrderRes>> {
    try {
      console.log('checktoaddress', toAddress);
      const result: TaxForOrderRes = await this.client
        .taxForOrder({
          from_country: fromAddress.country,
          from_zip: fromAddress.zipcode,
          from_state: fromAddress.state,
          from_city: fromAddress.city,
          from_street: fromAddress.address,
          to_country: toAddress.country,
          to_zip: toAddress.zipcode,
          to_state: toAddress.state,
          to_city: toAddress.city,
          to_street: toAddress.address,
          amount: Dinero(price).toUnit(),
          shipping: 0,
          nexus_addresses: nexus,
        })
        .then((result: any) => {
          console.log('taxresul', result);
          return result;
        })
        .catch((err: any) => {
          console.log('taxerror', err);
          return err;
        });
      console.log('checktexresult', result);

      if (!result) {
        return { success: false, message: 'TaxJar error.' };
      }
      return {
        success: true,
        message: 'Success',
        data: result,
      };
    } catch (err) {
      this.logger.error(err);
      return { success: false, message: 'TaxJar error.' };
    }
  }
}
