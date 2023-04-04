// This file is for reference only

import { Client } from '@loopback/testlab';

import { BoomPlatformApiApplication } from '../..';
import { givenEmptyDatabase } from '../helpers/database.helpers';
import { setupApplication } from './test-helper';

// Enabling this is keeping the test runner from completing its process.
xdescribe('Users', () => {
  let app: BoomPlatformApiApplication;
  let client: Client;

  before(givenEmptyDatabase);
  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('fails creating existing user', async () => {
    // login validation needs to be set here
    await client
      .post('/admin/user')
      .send({
        email: 'julienash@gmail.com',
        password: '123456',
        role: 'admin',
      })
      .expect(200, function (err) {
        console.log(err);
      });

    /*
    // act
    const response = await client.get('/product/ink-pen');

    // assert
    expect(response.body).to.containEql(expected);
 
    */
  });
});
