// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/example-express-composition
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { ApplicationConfig } from '@loopback/core';
import cors from 'cors';
import express from 'express';
import * as http from 'http';
import pEvent from 'p-event';

import { BoomPlatformApiApplication } from './application';

export class ExpressServer {
  private readonly app: express.Application;
  public readonly lbApp: BoomPlatformApiApplication;
  private server?: http.Server;
  public host: string;
  public port: number;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new BoomPlatformApiApplication(options);

    //this.app.options('*', cors());
    this.app.use(cors(options.rest.cors));

    // Expose the front-end assets via Express, not as LB4 route
    this.app.use('/api', this.lbApp.requestHandler);

    // Custom Express routes
    // this.app.get('/', function (_req: Request, res: Response) {
    //   res.sendFile(path.join(__dirname, '../public'));
    // });

    // Serve static files in the public folder
    this.app.use(express.static('public'));
  }

  public async boot(): Promise<void> {
    await this.lbApp.boot();
  }

  public async start(): Promise<void> {
    await this.lbApp.start();
    this.port = this.lbApp.restServer.config.port || 3000;
    this.host = this.lbApp.restServer.config.host || 'localhost';
    this.server = this.app.listen(this.port, this.host);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop(): Promise<void> {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = undefined;
  }
}
