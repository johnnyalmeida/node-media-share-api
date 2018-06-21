import HistoryController from '../controllers/history';

export default (app) => {
  const historyController = new HistoryController(app.config);

  app.route('/history')
    .post((req, res) => {
      historyController.post(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    })
    .put((req, res) => {
      historyController.postBack(req)
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
