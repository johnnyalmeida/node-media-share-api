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
class VideoController/*  */ {
  constructor(config) {
    this.config = config;
    this.testKey = 'sample_vertical.mp4';
    // For dev purposes only
    AWS.config.update({
      accessKeyId: this.config.aws.key,
      secretAccessKey: this.config.aws.secret,
    });

    this.s3 = new AWS.S3();
  }

  /**
   * List videos.
   */
  list() {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.config.aws.bucket,
        Prefix: 'videos/processed',
      };
      this.s3.listObjects(params, (err, objects) => {
        if (err) {
          reject(err);
        } else {
          const result = objects.Contents.map((value) => {
            const text = value.Key.replace('.mp4', '');
            return text.replace('videos/processed/', '');
          });
          resolve(result);
        }
      });
    });
  }

  /**
   * Upload video.
   */
  uploadVideo(req) {
    return new Promise((resolve, reject) => {
      console.log('uploading');
      const base64data = Buffer.from(req.body.file, 'base64');
      const s3 = new AWS.S3();
      const { bucket } = this.config.aws;
      const token = uuid();
      const fileName = `${token}.mp4`;
      const key = `videos/${fileName}`;

      s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: base64data,
      }, (errorS3) => {
        if (errorS3) {
          reject(errorS3);
        }
        console.log('uploaded');
        request.post(
          `${this.config.video_processing_api_url}/video`,
          { json: { key: token } },
          (errRequest, response) => {
            if (!errRequest && response.statusCode === 200) {
              resolve(defaultResponse(fileName));
            } else {
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
  getThumb(req, res) {
    const { key } = req.params;

    console.log(key);

    const params = {
      Bucket: this.config.aws.bucket,
      Key: `videos/thumbs/${key}`,
    };

    try {
      this.s3.getObject(params)
        .createReadStream()
        .pipe(res)
        .on('error', (err) => {
          errorResponse(err, HttpStatus.BAD_REQUEST);
        })
        .on('finish', () => {
          console.log('finished serving thumb');
        });
    } catch (e) {
      errorResponse(e, HttpStatus.BAD_REQUEST);
    }
  }

 
  /**
   * Get image
   */
  getCover(req, res) {
    const { key } = req.params;

    console.log(key);

    const params = {
      Bucket: this.config.aws.bucket,
      Key: `videos/covers/${key}`,
    };

    try {
      this.s3.getObject(params)
        .createReadStream()
        .pipe(res)
        .on('error', (err) => {
          errorResponse(err, HttpStatus.BAD_REQUEST);
        })
        .on('finish', () => {
          console.log('finished serving cover');
        });
    } catch (e) {
      errorResponse(e, HttpStatus.BAD_REQUEST);
    }
  }
}

export default VideoController;
