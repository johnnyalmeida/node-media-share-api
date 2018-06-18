import ImageController from '../controllers/image';

export default (app) => {
  const imageController = new ImageController(app.config);
  app.route('/image')
    .get((req, res) => {
      imageController.list()
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    })
    .post((req, res) => {
      imageController.uploadImage(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    });

  app.route('/image/thumb')
    .get((req, res) => {
      imageController.listThumbs()
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    });

  app.route('/image/original/:key')
    .get((req, res) => {
      imageController.getImage(req, res);
    });

  app.route('/image/thumb/:key')
    .get((req, res) => {
      imageController.getThumb(req, res);
    });
};
