import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import uuid from 'uuid';
import path from 'path';
import formidable from 'formidable';

/**
 * Default success response callback
 * @param {Obj} data - Response data
 * @param {*} statusCode - Status code, default 200
 */
const defaultResponse = (data, statusCode = HttpStatus.OK) => ({
  data,
  statusCode,
});

/**
 * Default error response callback
 * @param {Obj} data - Response data
 * @param {*} statusCode - Status code, default 400
 */
const errorResponse = (message, statusCode = HttpStatus.BAD_REQUEST) => defaultResponse({
  error: message,
}, statusCode);

/**
 * Manage movies endpoints
 */
class VideoController/*  */ {
  constructor(config) {
    this.config = config;
    // For dev purposes only
    AWS.config.update({
      accessKeyId: this.config.aws_key,
      secretAccessKey: this.config.aws_secret,
    });
  }

  /**
   * Upload video.
   */
  uploadVideo(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      // `file` is the name of the <input> field of type `file`
      // const oldPath = files.file.path;
      // const fileSize = files.file.size;
      // const fileExt = files.file.name.split('.').pop();
      // const index = oldPath.lastIndexOf('/') + 1;
      // const fileName = oldPath.substr(index);
      // const newPath = path.join(process.env.PWD, '/uploads/', `${fileName}.${fileExt}`);

      fs.readFile(files.file.path, (error, data) => {
        if (error) { throw error; }
        const base64data = Buffer.from(data, 'binary');
        const s3 = new AWS.S3();
        const bucket = this.config.aws_bucket;
        const token = uuid();
        const key = `${token}${path.extname(files.file.name)}`;

        console.log(key);

        s3.putObject({
          Bucket: bucket,
          Key: key,
          Body: base64data,
          ACL: 'public-read',
        }, (errorS3, result) => {
          if (errorS3) {
            res.status(500);
            res.json(errorS3);
          }
          // this.processVideo(key, result);
          res.status(200);
          res.json(result);
        });
      });
    });
  }

  processVideo(key) {
    const s3 = new AWS.S3();
    const params = {
      Bucket: this.config.aws_bucket,
      Key: key,
    };

    const file = fs.createWriteStream(`./tmp/${key}`);

    s3.getObject(params).createReadStream().pipe(file);

    const filePath = `./tmp/${key}`;

    const command = ffmpeg(filePath);
    // .audioCodec('libfaac')
    // .videoCodec('libx264')
    // .format('mp4');

    const newPath = `./tmp/processed/${key}`;

    command.clone()
      .size('640x?')
      .aspect('9:16')
      .autopad()
      .save(newPath);

    // this.moveTempToS3(newPath, key);
  }

  moveTempToS3(filePath, fileName) {
    // Read in the file, convert it to base64, store to S3
    fs.readFile(filePath, (err, data) => {
      if (err) { throw err; }
      const base64data = Buffer.from(data, 'binary');
      const s3 = new AWS.S3();
      const bucket = this.config.aws_bucket;
      const key = `processed/${fileName}`;

      s3.client.putObject({
        Bucket: bucket,
        Key: key,
        Body: base64data,
        ACL: 'public-read',
      }, (error, result) => {
        if (error) {
          return errorResponse(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return defaultResponse({ s3: result, file: key });
      });
    });
  }
}

export default VideoController;
