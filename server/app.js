import express from 'express';
import config from './config/config';
import videoRouter from './routes/video';
import imageRouter from './routes/image';


const app = express();

app.config = config;

app.set('port', app.config.port);

videoRouter(app);
imageRouter(app);

export default app;
