import { AccountInfoQueryTypes, BoomUser } from '@boom-platform/globals';
import { ClientResponse } from '@sendgrid/client/src/response';
import { MailData } from '@sendgrid/helpers/classes/mail';
import sendgrid from '@sendgrid/mail';
// @ts-ignore
import Mailgen from '@silverstone/mailgen';

const boomAdminEmail: string = process.env.BOOM_TECHNICAL_ADMIN_EMAIL || 'noel@boomcarding.com';

export class EmailService {
  gateway: any;
  mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Boom',
      link: process.env.DOMAIN_SOURCE,
      logo: `${process.env.DOMAIN_SOURCE}/assets/logo-business.png`,
    },
  });

  constructor() {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  async send(mailOptions: MailData): Promise<[ClientResponse, {}]> {
    return sendgrid.send(mailOptions);
  }

  async sendAppError(
    subject: string,
    title: string,
    dictionary: Record<string, unknown>
  ): Promise<void> {
    let html = this.mailGenerator.generate({
      body: {
        title,
        dictionary,
        hideSignature: true,
      },
    });
    const css =
      '.email-masthead { background-color: #d52c25; } .email-footer { background-color: #191919; }</style>';
    html = html.replace(/<\/style>/, css);
    await this.send({
      to: boomAdminEmail,
      from: 'Boom Admin <noreply@boomcarding.com>',
      subject: subject,
      html: html,
    });
  }

  async sendConfirmationToCustomer({
    customer,
    customerEmail,
    subject,
    intro,
    instructions,
    buttonLabel,
    buttonLink,
    dictionary,
  }: {
    customer: BoomUser | null;
    customerEmail: string;
    subject: string;
    intro: string;
    instructions?: string;
    buttonLabel?: string;
    buttonLink?: string;
    dictionary?: Record<string, unknown>;
  }): Promise<[ClientResponse, {}]> {
    return this.send({
      to: customerEmail,
      from: 'Boom Rewards <noreply@boomcarding.com>',
      subject: subject,
      html: this.mailGenerator.generate({
        body: {
          name: (customer?.firstName || '') + (customer?.lastName ? ' ' + customer?.lastName : ''),
          intro,
          dictionary,
          action: {
            instructions,
            button:
              buttonLabel && buttonLink
                ? {
                    color: '#d52c25',
                    text: buttonLabel,
                    link: buttonLink,
                  }
                : {},
          },
          hideSignature: true,
        },
      }),
    });
  }

  async sendAccountInfoToUser({
    user,
    pin,
    type,
  }: {
    user: BoomUser;
    pin: number;
    type: AccountInfoQueryTypes;
  }): Promise<[ClientResponse, {}]> {
    if (!user?.contact?.emails?.length) {
      throw new Error('Could not complete request. User does not have an email address..');
    }
    // We may support other kinds later
    if (type !== AccountInfoQueryTypes.BoomcardPin) {
      throw new Error('Currently this function only supports a Boom card pin info request');
    }
    return this.send({
      to: user.contact.emails[0],
      from: 'Boom Rewards <noreply@boomcarding.com>',
      subject: 'Your account info',
      html: this.mailGenerator.generate({
        body: {
          name: (user.firstName || '') + (user.lastName ? ' ' + user.lastName : ''),
          intro: `Your Boom card pin is ${pin}`,
          hideSignature: true,
        },
      }),
    });
  }
}
