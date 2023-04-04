import AppError from './app-error';

export default class OrderError extends AppError {
  constructor(message: string, publicMessage: string, diagnosticsData: unknown) {
    super(message, publicMessage, diagnosticsData);
    this.name = 'OrderError';
    this.message = message;
    this.data = diagnosticsData;
  }
}
