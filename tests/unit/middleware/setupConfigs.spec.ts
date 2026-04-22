/**
 * @description Test that the config was attached to the application set up
 */

import { setupConfig } from '#middleware/setupConfigs.js';
import express from 'express';
import { expect } from 'chai';
import http from 'http';

describe('setupConfig middleware', () => {
  it('should attach config to res.locals', (done) => {
    const app = express();

    setupConfig(app);

    // Simulate a route to trigger middleware
    app.get('/test', async (req, res) => {
      const config = (await import('#config.js')).default;
      expect(res.locals.config).to.deep.equal(config);
      res.sendStatus(200);
    });

    // Simulate a request
    const server = app.listen(() => {
      const port = (server.address() as any).port;

      http.get(`http://localhost:${port}/test`, (res: any) => {
        expect(res.statusCode).to.equal(200);
        server.close();
        done();
      }).on('error', done);
    });
  });
});
