import fs from 'fs';

import VideoController from '../controllers/video';

export default (app) => {
  const videoController = new VideoController(app.config);

  app.get('/', (req, res) => {
    fs.readFile('./_files/index.html', (err, html) => res.end(html));
  });

  app.route('/video/:key')
    .get((req, res) => {
      const { key } = req.params;
      const movieFile = `/${app.config.aws_bucket}/${key}`;

      fs.stat(movieFile, (err, stats) => {
        if (err) {
          return res.status(404).json(err);
        }
        // Setup the chunk headers variables
        const { range } = req.headers;
        const { size } = stats;
        const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
        const end = size - 1;
        const chunkSize = (end - start) + 1;
        // Set chunk headers
        res.set({
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        });

        // Read the file and send chunks through stream.pipe()
        const stream = fs.createReadStream(movieFile, { start, end });
        stream.on('open', () => stream.pipe(res));
        stream.on('error', streamErr => res.end(streamErr));

        // Send a PARTIAL CONTENT status code
        return res.status(206);
      });
    });

  app.route('/video')
    .post((req, res) => {
      videoController.uploadVideo(req)
        .then((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    });
};
