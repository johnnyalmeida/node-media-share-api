import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import uuid from 'uuid';
import request from 'request';
import moment from 'moment';
import historyService from '../services/HistoryServices';

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
class HistoryController/*  */ {
  constructor(config) {
    this.config = config;

    this.processingApi = {
      video: this.config.video_processing_api_url,
      image: this.config.image_processing_api_url,
    };

    // For dev purposes only
    AWS.config.update({
      accessKeyId: this.config.aws.key,
      secretAccessKey: this.config.aws.secret,
    });

    this.s3 = new AWS.S3();
  }

  async postVideo(req) {
    try {
      const { file, user } = req.body;

      const key = await this.uploadVideo(file);

      const type = 'video';

      const history = {
        key,
        user,
        type,
      };

      const [id] = await historyService.post(history);

      console.log(id);

      await this.postToApi(type, key, id);

      return defaultResponse({ id, key });
    } catch (e) {
      return (errorResponse(e));
    }
  }


  async postImage(req) {
    console.log('posting image');
    try {
      const { file } = req.body;

      const key = await this.uploadImage(file);
      console.log('uploaded');
      const type = 'image';

      const userId = '1';
      const now = moment().format('YYYY-MM-DD H:mm:ss');

      const history = {
        key,
        user_id: userId,
        type,
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      };

      console.log('registering');

      console.log(history);

      const [id] = await historyService.post(history);

      console.log(`id: ${id}`);
      console.log('posting');
      await this.postToApi(type, key, id);

      return defaultResponse({ id, key });
    } catch (e) {
      console.log(e);
      return (errorResponse(e));
    }
  }

  async postBack(req) {
    let configs = this.config;
    const data = {
      key: req.body.key.trim(),
      status: req.body.status,
    };
    console.log('receiving post back', data);
    try {
      const [id] = await historyService.put(data);
      console.log('updated');
      return (defaultResponse(id));
    } catch (e) {
      console.log('error updating');
      console.log(e);
      return (errorResponse(e));
    }
  }

  postToApi(type, key, history) {
    console.log('posting image to processing api');
    return new Promise((resolve, reject) => {
      request.post(
        `${this.processingApi[type]}/${type}`,
        {
          json: { key, history },
        },
        (errRequest, response) => {
          if (!errRequest && response.statusCode === 200) {
            resolve();
          }
          reject(errRequest);
        },
      );
    });
  }

  /**
   * Upload video.
   */
  uploadVideo(file) {
    return new Promise((resolve, reject) => {
      console.log('uploading');
      const base64data = Buffer.from(file, 'base64');
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
              resolve(fileName);
            } else {
              reject(errRequest);
            }
          },
        );
      });
    });
  }

  /**
   * Get image
   */
  getVideoThumb(req, res) {
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
   * Upload image.
   */
  uploadImage(file) {
    return new Promise((resolve, reject) => {
      console.log('uploading image');
      const base64data = Buffer.from(file, 'base64');
      const s3 = new AWS.S3();
      const { bucket } = this.config.aws;
      const token = uuid();
      const fileName = `${token}.jpg`;
      console.log('image params done');

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
              console.log('upload finished');
              resolve(fileName);
            } else {
              console.log(errRequest);
              reject(errRequest);
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
      Bucket: this.config.aws.bucket,
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
  getImageThumb(req, res) {
    const { key } = req.params;

    console.log(key);

    const params = {
      Bucket: this.config.aws.bucket,
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

export default HistoryController;
