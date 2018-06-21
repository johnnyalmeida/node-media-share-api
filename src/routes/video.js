import fs from 'fs';
import AWS from 'aws-sdk';
import VideoController from '../controllers/video';

export default (app) => {
  const videoController = new VideoController(app.config);

  app.get('/', (req, res) => {
    fs.readFile('./_files/index.html', (err, html) => res.end(html));
  });

  app.route('/video/thumb/:key')
    .get((req, res) => {
      videoController.getThumb(req, res);
    });


  app.route('/video/cover/:key')
    .get((req, res) => {
      videoController.getCover(req, res);
    });

  app.route('/video/stream/:key')
    .get((req, res) => {
      const { key } = req.params;

      AWS.config.update({
        accessKeyId: app.config.aws.key,
        secretAccessKey: app.config.aws.secret,
      });

      const params = {
        Bucket: app.config.aws.bucket,
        Key: `videos/processed/${key}`,
      };
      console.log(key);
      const s3 = new AWS.S3();

      s3.listObjectsV2({ Bucket: params.Bucket, MaxKeys: 1, Prefix: `videos/processed/${key}` }, (err, data) => {
        if (err) {
          console.log();
          res.json({ lol: 'lol' });
          res.sendStatus(404);
        }
        if (req != null && req.headers.range != null) {
          try {
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
            s3.getObject({ Bucket: params.Bucket, Key: `videos/processed/${key}`, Range: range })
              .createReadStream()
              .pipe(res);
          } catch (e) {
            console.log(e);
          }
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
          res.status(err.statusCode);
          res.json(err.data);
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
