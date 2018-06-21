import app from './app';

app.listen(app.get('port'), () => {
  console.log(`Running on port ${app.get('port')}`);
});
