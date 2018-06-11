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
// const errorResponse = (message, statusCode = HttpStatus.BAD_REQUEST) => defaultResponse({
//   error: message,
// }, statusCode);

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

    this.s3 = new AWS.S3();
  }

  /**
   * Upload video.
   */
  uploadVideo(req) {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();

      form.parse(req, (err, fields, files) => {
        fs.readFile(files.file.path, (error, data) => {
          if (error) { throw error; }
          const base64data = Buffer.from(data, 'binary');
          const s3 = new AWS.S3();
          const bucket = this.config.aws_bucket;
          const token = uuid();
          const key = `${token}${path.extname(files.file.name)}`;

          s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: base64data,
          }, (errorS3, result) => {
            if (errorS3) {
              reject(errorS3);
            }
            this.processVideo(key, result)
              .then((response) => {
                resolve(defaultResponse(response));
              })
              .catch(promisseErr => reject(promisseErr));
          });
        });
      });
    });
  }

  processVideo(key) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(`./tmp/${key}`);

      const params = {
        Bucket: this.config.aws_bucket,
        Key: key,
      };

      this.s3.getObject(params).createReadStream().pipe(file)
        .on('finish', () => {
          const filePath = `./tmp/${key}`;
          const command = ffmpeg(filePath)
            .audioCodec('aac')
          // .videoCodec('libx264')
            .format('mp4');

          const newPath = `./tmp/processed/${key}`;

          command.clone()
            .size('414x?')
            .aspect('9:16')
            .autopad()
            .save(newPath)
            .on('end', () => {
              this.moveTempToS3(newPath, key, resolve, reject)
                .then((data) => {
                  resolve(data);
                })
                .catch(error => reject(error));
            });
        });
    });
  }

  moveTempToS3(filePath, fileName) {
    return new Promise((resolve, reject) => {
      // Read in the file, convert it to base64, store to S3
      fs.readFile(filePath, (err, data) => {
        if (err) { throw err; }
        const base64data = Buffer.from(data, 'binary');
        const bucket = this.config.aws_bucket;
        const key = `processed/${fileName}`;

        this.s3.putObject({
          Bucket: bucket,
          Key: key,
          Body: base64data,
        }, (error, result) => {
          if (error) {
            reject(error);
          }
          const file = {
            path: key,
            s3: result,
          };
          resolve(file);
        });
      });
    });
  }
}

export default VideoController;
