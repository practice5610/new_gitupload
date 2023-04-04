export interface ProcessEMVSREDRequest {
  KeyValuePairOfstringstring: KeyValuePairOfstringstring[];
  CustomerTransactionID?: string;
  EMVSREDInput: EMVSREDInput;
  TransactionInput: TransactionInput;
}

export interface KeyValuePairOfstringstring {
  key: string;
  value: string;
}

export interface EMVSREDInput {
  EMVSREDData: string;
  EncryptionType: string;
  KSN: string;
  NumberOfPaddedBytes: string;
  PaymentMode: string;
}

export interface TransactionInput {
  Amount: number;
  TransactionInputDetails: TransactionInputDetails;
  TransactionType: string;
}

export interface TransactionInputDetails {
  KeyValuePairOfstringstring: KeyValuePairOfstringstring;
}
