export const givenPlaidAuthResult = (): any => {
  return {
    success: true,
    message: 'Success',
    data: {
      numbers: {
        achNumbers: [
          {
            account: '9900009606',
            account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
            routing: '011401533',
            wire_routing: '021000021',
          },
        ],
      },
      accounts: [
        {
          account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
          balances: {
            available: 100,
            current: 110,
            limit: null,
            iso_currency_code: 'USD',
            unofficial_currency_code: null,
          },
          mask: '9606',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Checking',
          subtype: 'checking',
          type: 'depository',
        },
      ],
    },
  };
};

export const givenPlaidIdentityResult = (): any => {
  return {
    success: true,
    message: 'Success',
    data: {
      accounts: [
        {
          account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
          balances: {
            available: 100,
            current: 110,
            iso_currency_code: 'USD',
            limit: null,
            unofficial_currency_code: null,
          },
          mask: '9606',
          name: 'Plaid Checking',
          official_name: 'Plaid Gold Checking',
          owners: [
            {
              addresses: [
                {
                  data: {
                    city: 'Malakoff',
                    country: 'US',
                    postal_code: '14236',
                    region: 'NY',
                    street: '2992 Cameron Road',
                  },
                  primary: true,
                },
                {
                  data: {
                    city: 'San Matias',
                    country: 'US',
                    postal_code: '93405-2255',
                    region: 'CA',
                    street: '2493 Leisure Lane',
                  },
                  primary: false,
                },
              ],
              emails: [
                {
                  data: 'accountholder0@example.com',
                  primary: true,
                  type: 'primary',
                },
                {
                  data: 'accountholder1@example.com',
                  primary: false,
                  type: 'secondary',
                },
                {
                  data: 'extraordinarily.long.email.username.123456@reallylonghostname.com',
                  primary: false,
                  type: 'other',
                },
              ],
              names: ['Alberta Bobbeth Charleson'],
              phone_numbers: [
                {
                  data: '1112223333',
                  primary: false,
                  type: 'home',
                },
                {
                  data: '1112224444',
                  primary: false,
                  type: 'work',
                },
                {
                  data: '1112225555',
                  primary: false,
                  type: 'mobile',
                },
              ],
            },
          ],
          subtype: 'checking',
          type: 'depository',
        },
      ],
      item: {
        available_products: ['balance', 'investments'],
        billed_products: ['auth', 'identity'],
        consent_expiration_time: null,
        error: null,
        institution_id: 'ins_3',
        item_id: 'eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6',
        webhook: 'https://www.genericwebhookurl.com/webhook',
      },
      request_id: '3nARps6TOYtbACO',
    },
  };
};
