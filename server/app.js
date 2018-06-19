import express from 'express';
import bodyParser from 'body-parser';
import config from './config/config';
import videoRouter from './routes/video';
import imageRouter from './routes/image';
import feedRouter from './routes/feed';
import historyRouter from './routes/history';

const app = express();

app.config = config;

app.use(bodyParser.json({ limit: '50mb' }));

app.set('port', app.config.port);

videoRouter(app);
imageRouter(app);
feedRouter(app);
historyRouter(app);


export default app;
