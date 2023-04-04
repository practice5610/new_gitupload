import AppError from './app-error';

export default class MerchantTransactionError extends AppError {
  constructor(message: string, publicMessage: string, diagnosticsData: unknown) {
    super(message, publicMessage, diagnosticsData);
    this.name = 'MerchantTransactionError';
    this.message = message;
    this.data = diagnosticsData;
  }
}
