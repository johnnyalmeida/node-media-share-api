import HistoryController from '../controllers/history';

export default (app) => {
  const historyController = new HistoryController(app.config);

  app.route('/history')
    .post((req, res) => {
      historyController.postImage(req)
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

  app.route('/history/image')
    .post((req, res) => {
      historyController.postImage(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    });

  app.route('/history/video')
    .post((req, res) => {
      historyController.postVideo(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((err) => {
          res.status(err.statusCode);
          res.json(err.data);
        });
    });
};
