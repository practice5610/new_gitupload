import AppError from './app-error';

export default class PurchaseError extends AppError {
  constructor(message: string, publicMessage: string, diagnosticsData: unknown) {
    super(message, publicMessage, diagnosticsData);
    this.name = 'PurchaseError';
    this.message = message;
    this.data = diagnosticsData;
  }
}
