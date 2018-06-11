import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
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
class ImageController {
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
   * Upload image.
   */
  uploadImage(req) {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();

      form.parse(req, (err, fields, files) => {
        fs.readFile(files.file.path, (error, data) => {
          if (error) { throw error; }
          const base64data = Buffer.from(data, 'binary');
          const s3 = new AWS.S3();
          const bucket = this.config.aws_bucket;
          const token = uuid();
          const key = `images/${token}${path.extname(files.file.name)}`;

          s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: base64data,
          }, (errorS3, result) => {
            if (errorS3) {
              reject(errorS3);
            }
            const response = {
              path: key,
              s3: result,
            };
            resolve(defaultResponse(response));
          });
        });
      });
    });
  }
}

export default ImageController;
