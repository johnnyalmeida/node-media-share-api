import HistoryController from '../controllers/history';

export default (app) => {
  const historyController = new HistoryController(app.config);

  app.route('/story/image')
    .post((req, res) => {
      historyController.uploadImage(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    });
};
