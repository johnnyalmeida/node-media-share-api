import express from 'express';
import bodyParser from 'body-parser';
import config from './config/config';
import videoRouter from './routes/video';
import imageRouter from './routes/image';
import feedRouter from './routes/feed';
import historyRouter from './routes/history';
import knex from './config/db';

import newrelic from 'newrelic';

const app = express();

app.config = config;

app.use(bodyParser.json({ limit: '50mb' }));

app.set('port', app.config.port);

/* Status endpoint */
app.get(['/', '/status'], async (req, res) => {
  try {
    await knex.raw('SELECT 1 + 1 as result');
    res.send('ok');
  } catch (err) {
    res.status(500).send('error');
  }
});

videoRouter(app);
imageRouter(app);
feedRouter(app);
historyRouter(app);


export default app;
