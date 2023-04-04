export default class AppError extends Error {
  //TODO: seems that we can use ServiceResponse(api\src\types\service.ts) in some cases to replace this class
  data: unknown;
  publicMessage: string;

  constructor(message: string, publicMessage: string, diagnosticsData: unknown) {
    super(message);
    this.name = 'AppError';
    this.message = message;
    this.publicMessage = publicMessage;
    this.data = diagnosticsData;
  }
  toJSON(): string {
    return JSON.stringify({
      error: {
        name: this.name,
        message: this.message,
        data: this.data,
      },
    });
  }
}
