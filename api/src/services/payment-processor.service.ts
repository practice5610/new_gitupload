import { getLogger } from 'log4js';

import { LoggingCategory } from '../constants';
import { ProcessEMVSREDRequest } from '../types/processEMVSRED-request';

const soap = require('strong-soap').soap;
const soapRequest = require('easy-soap-request');

const magensaCustomerCode = process.env.MAGENSA_CUSTOMERCODE || '';
const magensaPassword = process.env.MAGENSA_PASSWORD || '';
const magensaUserName = process.env.MAGENSA_USERNAME || '';
const magensaProcessorName = process.env.MAGENSA_PROCESSOR_NAME || '';

/**
 * Class in charge of processing payments from the POS Tablet's chip card reader
 */
export class PaymentProcessorService {
  client: any;
  logger = getLogger(LoggingCategory.PAYMENT_PROCESSING);

  async ProcessEMVSRED(payinfo: ProcessEMVSREDRequest[]): Promise<any> {
    /*eslint-disable */
    return new Promise(async (resolve) => {
      const requestUrl = 'https://mppg.magensa.net/v3/MPPGv3Service.svc?wsdl';

      const requestHeaders: object = {
        'Content-Type': 'text/xml;charset=UTF-8',
        soapAction: 'http://www.magensa.net/MPPGv3/IMPPGv3Service/ProcessEMVSRED',
      };

      const processEMVSREDRequests = payinfo.map((item: ProcessEMVSREDRequest) => {
        return `<mpp1:ProcessEMVSREDRequest>
                   <mpp1:AdditionalRequestData>
                      <sys:KeyValuePairOfstringstring>
                        ${item.KeyValuePairOfstringstring.map((keyvalueItem) => {
                          return `<sys:key>${keyvalueItem.key}</sys:key>
                                  <sys:value>${keyvalueItem.value}</sys:value>`;
                        }).join('')}
                      </sys:KeyValuePairOfstringstring>
                   </mpp1:AdditionalRequestData>
                   <mpp1:Authentication>
                      <mpp1:CustomerCode>${magensaCustomerCode}</mpp1:CustomerCode>
                      <mpp1:Password>${magensaPassword}</mpp1:Password>
                      <mpp1:Username>${magensaUserName}</mpp1:Username>
                   </mpp1:Authentication>
                   <mpp1:CustomerTransactionID>${
                     item.CustomerTransactionID
                   }</mpp1:CustomerTransactionID>
                   <mpp1:EMVSREDInput>
                      <mpp1:EMVSREDData>${item.EMVSREDInput.EMVSREDData}</mpp1:EMVSREDData>
                      <mpp1:EncryptionType>${item.EMVSREDInput.EncryptionType}</mpp1:EncryptionType>
                      <mpp1:KSN>${item.EMVSREDInput.KSN}</mpp1:KSN>
                      <mpp1:NumberOfPaddedBytes>${
                        item.EMVSREDInput.NumberOfPaddedBytes
                      }</mpp1:NumberOfPaddedBytes>
                      <mpp1:PaymentMode>${item.EMVSREDInput.PaymentMode}</mpp1:PaymentMode>
                   </mpp1:EMVSREDInput>
                   <mpp1:TransactionInput>
                      <mpp1:Amount>${item.TransactionInput.Amount}</mpp1:Amount>
                      <mpp1:ProcessorName>${magensaProcessorName}</mpp1:ProcessorName>
                      <mpp1:TransactionInputDetails>
                         <sys:KeyValuePairOfstringstring>
                             <sys:key>${
                               item.TransactionInput.TransactionInputDetails
                                 .KeyValuePairOfstringstring.key
                             }</sys:key>
                             <sys:value>${
                               item.TransactionInput.TransactionInputDetails
                                 .KeyValuePairOfstringstring.value
                             }</sys:value>
                         </sys:KeyValuePairOfstringstring>
                      </mpp1:TransactionInputDetails>
                      <mpp1:TransactionType>${
                        item.TransactionInput.TransactionType
                      }</mpp1:TransactionType>
                   </mpp1:TransactionInput>
                </mpp1:ProcessEMVSREDRequest>`;
      });

      const requestBody = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mpp="http://www.magensa.net/MPPGv3/" xmlns:mpp1="http://schemas.datacontract.org/2004/07/MPPGv3WS.Core" xmlns:sys="http://schemas.datacontract.org/2004/07/System.Collections.Generic">
           <soapenv:Header />
           <soapenv:Body>
              <mpp:ProcessEMVSRED>
                 <mpp:ProcessEMVSREDRequests>
                  ${processEMVSREDRequests.join('')}
                 </mpp:ProcessEMVSREDRequests>
              </mpp:ProcessEMVSRED>
           </soapenv:Body>
        </soapenv:Envelope>`;

      const { response } = await soapRequest(requestUrl, requestHeaders, requestBody);
      const { headers, body, statusCode } = response;

      if (statusCode === 200) {
        const XMLHandler = soap.XMLHandler;
        const xmlHandler = new XMLHandler();
        const responseJson = xmlHandler.xmlToJson(null, body, null);

        this.logger.debug(
          'response JSON',
          responseJson.Body.ProcessEMVSREDResponse.ProcessEMVSREDResult.ProcessEMVSREDResponse
        );

        const ProcessEMVSREDResponse =
          responseJson.Body.ProcessEMVSREDResponse.ProcessEMVSREDResult.ProcessEMVSREDResponse;

        resolve({
          success: true,
          message: 'Transaction Complete',
          data: ProcessEMVSREDResponse,
        });
      } else {
        this.logger.error(
          'Error processing payment. Status code:',
          statusCode,
          'response object:',
          response
        );
        resolve({ success: false, message: 'Request error' });
      }
    });
  }
}
