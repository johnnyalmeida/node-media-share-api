import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import uuid from 'uuid';
import path from 'path';
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
  }

  /**
   * Upload video.
   */
  uploadVideo(req) {
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
      const bucket = this.config.aws_bucket;
      const token = uuid();
      const key = `${token}.${path.extname(file.filename)}`;

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

  processVideo(key) {
    const url = `${this.config.bucket}/${key}`;
    const command = ffmpeg(url);
    // .audioCodec('libfaac')
    // .videoCodec('libx264')
    // .format('mp4');

    const filePath = `./tmp/${key}`;

    command.clone()
      .size('640x?')
      .aspect('9:16')
      .autopad()
      .save(filePath);

    this.moveTempToS3(filePath, key);
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
