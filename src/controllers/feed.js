import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import shuffle from 'shuffle-array';
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
class ImageController {
  constructor(config) {
    this.history = historyService;
    this.config = config;
    // For dev purposes only
    AWS.config.update({
      accessKeyId: this.config.aws.key,
      secretAccessKey: this.config.aws.secret,
    });

    this.s3 = new AWS.S3();
  }

  /**
   * List feed items.
   */
  async get() {
    try {
      console.log('loading feed');
      const feed = [];
      const list = await this.history.list();

      while (Object.keys(list).length > 3) {
        const aux = list.splice(0, 3);
        feed.push(aux);
      }
      feed.push(list);

      console.log('feed loaded');
      return shuffle(feed);
    } catch (e) {
      return errorResponse(e);
    }
  }

  /**
   * Get list of video.
   */
  getVideos() {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.config.aws.bucket,
        Prefix: 'videos/thumbs/',
      };
      this.s3.listObjects(params, (err, objects) => {
        if (err) {
          reject(err);
        } else {
          const result = objects.Contents.map((value) => {
            const text = value.Key.replace('.jpg', '');
            return {
              key: text.replace('videos/thumbs/', ''),
              type: 'video',
            };
          });
          resolve(result);
        }
      });
    });
  }
}

export default ImageController;
