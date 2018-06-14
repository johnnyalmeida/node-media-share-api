import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import fs from 'fs';
import uuid from 'uuid';
import path from 'path';
import formidable from 'formidable';
import Jimp from 'jimp';

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
   * List images.
   */
  list() {
    return new Promise((resolve, reject) => {
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
          const key = `${token}${path.extname(files.file.name)}`;

          s3.putObject({
            Bucket: bucket,
            Key: `images/${key}`,
            Body: base64data,
          }, (errorS3) => {
            if (errorS3) {
              reject(errorS3);
            }
            this.processImage(key)
              .then((response) => {
                resolve(defaultResponse(response));
              })
              .catch(processError => reject(processError));
          });
        });
      });
    });
  }

  processImage(key) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(`./tmp/images/${key}`);

      const params = {
        Bucket: this.config.aws_bucket,
        Key: `images/${key}`,
      };

      this.s3.getObject(params).createReadStream().pipe(file)
        .on('finish', () => {
          const filePath = `./tmp/images/${key}`;
          // console.log(filePath);
          Jimp.read(filePath).then((image) => {
            image
              .exifRotate()
              .scaleToFit(1080, 1920)
              .quality(75)
              .write(`./tmp/images/processed/${key}`, () => {
                this.moveImageToS3(key, filePath)
                  .then(data => resolve(data))
                  .catch(err => reject(err));
              });
          }).catch((err) => {
            reject(err);
          });
        });
    });
  }

  /**
   * Move processed image to S3
   */
  moveImageToS3(fileName, filePath) {
    return new Promise((resolve, reject) => {
      // Read in the file, convert it to base64, store to S3
      fs.readFile(filePath, (err, data) => {
        if (err) { throw err; }
        const base64data = Buffer.from(data, 'binary');
        const bucket = this.config.aws_bucket;
        const key = `images/processed/${fileName}`;

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

  /**
   * Get image
   */
  getImage(req, res) {
    const { key } = req.params;

    const params = {
      Bucket: this.config.aws_bucket,
      Key: `images/processed/${key}`,
    };

    this.s3.getObject(params)
      .createReadStream()
      .pipe(res);
  }
}

export default ImageController;
