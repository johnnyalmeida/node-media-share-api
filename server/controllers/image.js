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
   * List images.
   */
  list() {
    return new Promise((resolve, reject) => {
      console.log('listing images');
      const params = {
        Bucket: this.config.aws_bucket,
        Prefix: 'images/processed',
      };
      this.s3.listObjects(params, (err, objects) => {
        if (err) {
          reject(err);
        } else {
          const result = objects.Contents.map((value) => {
            const text = value.Key.replace('.jpg', '');
            return text.replace('images/processed/', '');
          });
          resolve(result);
        }
      });
    });
  }

  /**
   * List thumbs.
   */
  listThumbs() {
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
            return text.replace('images/thumbs/', '');
          });
          resolve(result);
        }
      });
    });
  }

  /**
   * Upload image.
   */
  uploadImage(req) {
    return new Promise((resolve, reject) => {
      console.log('uploading image');
      const base64data = Buffer.from(req.body.file, 'base64');
      const s3 = new AWS.S3();
      const bucket = this.config.aws_bucket;
      const token = uuid();
      const fileName = `${token}.jpg`;

      s3.putObject({
        Bucket: bucket,
        Key: `images/${fileName}`,
        Body: base64data,
      }, (errorS3) => {
        if (errorS3) {
          reject(errorS3);
        }
        request.post(
          `${this.config.image_processing_api_url}/image`,
          { json: { key: fileName } },
          (errRequest, response) => {
            if (!errRequest && response.statusCode === 200) {
              console.log('post to process');
              resolve(defaultResponse(fileName));
            } else {
              console.log(errRequest);
              reject(errorResponse(errRequest));
            }
          },
        );
      });
    });
  }

  /**
   * Get image
   */
  getImage(req, res) {
    const { key } = req.params;

    console.log(key);

    const params = {
      Bucket: this.config.aws_bucket,
      Key: `images/processed/${key}`,
    };

    this.s3.getObject(params)
      .createReadStream()
      .pipe(res)
      .on('error', () => {
        errorResponse('Image not found', HttpStatus.NOT_FOUND);
      })
      .on('finish', () => {
        console.log('finished serving image');
      });
  }

  /**
   * Get image
   */
  getThumb(req, res) {
    const { key } = req.params;

    console.log(key);

    const params = {
      Bucket: this.config.aws_bucket,
      Key: `images/thumbs/${key}`,
    };

    try {
      this.s3.getObject(params)
        .createReadStream()
        .pipe(res)
        .on('error', (err) => {
          errorResponse(err, HttpStatus.BAD_REQUEST);
        })
        .on('finish', () => {
          console.log('finished serving image');
        });
    } catch (e) {
      errorResponse(e, HttpStatus.BAD_REQUEST);
    }
  }
}

export default ImageController;
