import fs from 'fs';
import AWS from 'aws-sdk';
import VideoController from '../controllers/video';

export default (app) => {
  const videoController = new VideoController(app.config);

  app.get('/', (req, res) => {
    fs.readFile('./_files/index.html', (err, html) => res.end(html));
  });

  app.route('/video/stream/:key')
    .get((req, res) => {
      const { key } = req.params;

      AWS.config.update({
        accessKeyId: app.config.aws_key,
        secretAccessKey: app.config.aws_secret,
      });

      const params = {
        Bucket: app.config.aws_bucket,
        Key: `videos/processed/${key}.mp4`,
      };

      const s3 = new AWS.S3();

      s3.listObjectsV2({ Bucket: params.Bucket, MaxKeys: 1, Prefix: `videos/processed/${key}.mp4` }, (err, data) => {
        if (err) {
          return res.sendStatus(404);
        }
        if (req != null && req.headers.range != null) {
          const { range } = req.headers;
          const bytes = range.replace(/bytes=/, '').split('-');
          const start = parseInt(bytes[0], 10);

          const total = data.Contents[0].Size;
          const end = bytes[1] ? parseInt(bytes[1], 10) : total - 1;
          const chunksize = (end - start) + 1;

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Last-Modified': data.Contents[0].LastModified,
            'Content-Type': 'video/mp4',
          });
          s3.getObject({ Bucket: params.Bucket, Key: `videos/processed/${key}.mp4`, Range: range })
            .createReadStream()
            .pipe(res);
        } else {
          const cache = 3600;
          res.writeHead(
            200,
            {
              'Cache-Control': `max-age=${cache}, private`,
              'Content-Length': data.Contents[0].Size,
              'Last-Modified': data.Contents[0].LastModified,
              'Content-Type': 'video/mp4',
            },
          );
          s3.getObject(params).createReadStream().pipe(res);
        }
        return res.status(206);
      });
    });

  app.route('/video/:key')
    .get((req, res) => {
      const { key } = req.params;

      AWS.config.update({
        accessKeyId: app.config.aws_key,
        secretAccessKey: app.config.aws_secret,
      });

      const s3 = new AWS.S3();
      const file = fs.createWriteStream(`./streaming/${key}`);

      const params = {
        Bucket: app.config.aws_bucket,
        Key: `processed/${key}`,
      };

      s3.getObject(params).createReadStream().pipe(file)
        .on('finish', () => {
          const filePath = `./streaming/${key}`;

          fs.stat(filePath, (err, stats) => {
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
            const stream = fs.createReadStream(filePath, { start, end });
            stream.on('open', () => stream.pipe(res));
            stream.on('error', streamErr => res.end(streamErr));

            // Send a PARTIAL CONTENT status code
            return res.status(206);
          });
        });
    });

  app.route('/video')
    .get((req, res) => {
      videoController.list()
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    })
    .post((req, res) => {
      videoController.uploadVideo(req)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    });


  app.route('/video/filter/gif')
    .post((req, res) => {
      videoController.uploadVideo(req, true)
        .then((response) => {
          res.status(200);
          res.json(response);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    });

  app.route('/video/filter/manual-test')
    .get((req, res) => {
      videoController.processTestVideo()
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
