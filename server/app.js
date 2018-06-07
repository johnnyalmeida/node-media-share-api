import express from 'express';
import config from './config/config';
import videoRouter from './routes/video';


const app = express();

app.config = config;

app.set('port', app.config.port);

videoRouter(app);

export default app;
