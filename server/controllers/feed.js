import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import uuid from 'uuid';
import request from 'request';

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
   * List thumbs.
   */
  get() {
    return new Promise((resolve, reject) => {
      console.log('listing thumbs');
      const params = {
        Bucket: this.config.aws_bucket,
        Prefix: 'images/thumbs',
      };
      this.s3.listObjects(params, (err, objects) => {
        if (err) {
          reject(err);
        } else {
          const result = objects.Contents.map((value) => {
            const text = value.Key.replace('.jpg', '');
            return {
              key: text.replace('images/thumbs/', ''),
              type: 'image',
            };
          });
          resolve(result);
        }
      });
    });
  }
}

export default ImageController;
