import { InventoryOrder, MerchantTransaction } from '../models';

export interface InventoryOrderResult {
  success: boolean;
  message: string;
  inventoryOrders?: InventoryOrder[];
  merchantTransactions?: MerchantTransaction[];
}
