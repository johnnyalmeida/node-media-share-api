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
class HistoryController {
  constructor(config) {
    this.history = historyService;
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

  async post(req) {
    try {
      const { file, type } = req.body;
      const key = await this.upload(file, type);

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

      const [id] = await historyService.post(history);

      await this.postToApi(type, key);

      return defaultResponse({ id, key });
    } catch (e) {
      return (errorResponse(e));
    }
  }

  async postBack(req) {
    const data = {
      key: req.body.key.trim(),
      status: req.body.status,
    };
    try {
      const status = await this.history.put(data.key, data);
      if (status) {
        return defaultResponse('success');
      }
      return errorResponse('Update failed');
    } catch (e) {
      return errorResponse(e);
    }
  }

  postToApi(type, key) {
    console.log(`posting ${type} to processing api`);
    return new Promise((resolve, reject) => {
      request.post(
        `${this.processingApi[type]}/${type}`,
        {
          json: { key },
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
   * Upload file.
   */
  upload(file, type) {
    return new Promise((resolve, reject) => {
      console.log(`uploading ${type}`);
      const extension = type === 'video' ? 'mp4' : 'jpg';
      const prefix = type === 'video' ? 'videos' : 'images';
      const base64data = Buffer.from(file, 'base64');
      const s3 = new AWS.S3();
      const { bucket } = this.config.aws;
      const token = uuid();
      const fileName = `${token}.${extension}`;
      const key = `${prefix}/${fileName}`;
      console.log(`key to upload: ${key}`);
      s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: base64data,
      }, (errorS3) => {
        if (errorS3) {
          reject(errorS3);
        }
        console.log('uploaded');
        resolve(token);
      });
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
        resolve(token);
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
        resolve(token);
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
