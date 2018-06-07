import express from 'express';
// import bodyParser from 'body-parser';
import videoRouter from './routes/video';


const app = express();

app.set('port', 3000);

videoRouter(app);

export default app;
