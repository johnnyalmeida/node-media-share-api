import FeedController from '../controllers/feed';

export default (app) => {
  const feedController = new FeedController(app.config);
  app.route('/feed')
    .get((req, res) => {
      feedController.get()
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
