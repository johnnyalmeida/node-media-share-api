import ffmpeg from 'fluent-ffmpeg';
import AWS from 'aws-sdk';
import fs from 'fs';
import uuid from 'uuid';
import path from 'path';

export default (app) => {
  app.route('/video')
    .get((req, res) => {
      const command = ffmpeg('/www/node-video/sample_video.mp4');
      // .audioCodec('libfaac')
      // .videoCodec('libx264')
      // .format('mp4');

      command.clone()
        .size('640x?')
        .aspect('9:16')
        .autopad()
        .save('/www/node-video/converted.mp4');

      res.status(200);
      res.json({ test: '' });
    })
    .post((req, res) => {
      // For dev purposes only
      AWS.config.update({
        accessKeyId: app.config.aws_key,
        secretAccessKey: app.config.aws_secret,
      });

      const { file } = req.files;

      // Read in the file, convert it to base64, store to S3
      fs.readFile(file.path, (err, data) => {
        if (err) { throw err; }
        const base64data = Buffer.from(data, 'binary');
        const s3 = new AWS.S3();
        const bucket = '';
        const token = uuid();
        const key = `${token}.${path.extname(file.filename)}`;

        s3.client.putObject({
          Bucket: bucket,
          Key: key,
          Body: base64data,
          ACL: 'public-read',
        }, (error, result) => {
          if (error) {
            res.status(500);
            res.json(error);
          }
          res.status(200);
          res.json(result);
        });
      });
    });
};
