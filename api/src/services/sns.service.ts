import AWS from 'aws-sdk';

const secretAccessKey = process.env.AWS_API_KEY;
const accessKeyId = process.env.AWS_API_KEY_ID;
const region = 'us-west-2';

export class SNSService {
  sns: AWS.SNS;

  constructor() {
    AWS.config.update({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    });
    this.sns = new AWS.SNS();
  }

  async sendSMS(params: AWS.SNS.PublishInput): Promise<{ success: boolean; message?: string }> {
    try {
      await this.sns.publish(params).promise();

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Could not send SMS message' };
    }
  }
}
