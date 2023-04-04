import AppError from './app-error';

export default class InventoryOrderError extends AppError {
  constructor(message: string, publicMessage: string, diagnosticsData: unknown) {
    super(message, publicMessage, diagnosticsData);
    this.name = 'InventoryOrderError';
    this.message = message;
    this.data = diagnosticsData;
  }
}
