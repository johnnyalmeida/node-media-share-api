import ImageController from '../controllers/image';

export default (app) => {
  const imageController = new ImageController(app.config);
  app.route('/image')
    .post((req, res) => {
      imageController.uploadImage(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    });
};
