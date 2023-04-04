require('dotenv').config();

import { ExpressServer } from './server';
import { BoomPlatformApiApplication } from './application';
import { ApplicationConfig } from '@loopback/core';
// const Slack = require('slack-node');
export { BoomPlatformApiApplication };

export { ExpressServer };

export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(options);
  await server.boot();
  await server.start();

  // let webhookUri = "https://hooks.slack.com/services/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";

  // let slack = new Slack();
  // slack.setWebhook(webhookUri);

  // slack.webhook({
  //   channel: "#general",
  //   username: "webhookbot",
  //   icon_emoji: ":ghost:",
  //   text: "test message, test message"
  // }, function(err, response) {
  //   console.log(response);
  // });
  console.log(`Server is running at ${server.host}:${server.port}`);
  console.log(`Try ${server.host}:${server.port}/api/v1/ping`);
}
