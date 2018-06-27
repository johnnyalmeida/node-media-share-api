import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import shuffle from 'shuffle-array';
import redis from 'redis';
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
class FeedController {
  constructor(config) {
    this.cache = redis.createClient();
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
      const token = 'user3';
      let feed = await this.getFeedCache(token);

      if (!feed) {
        feed = await this.setFeed(token);
      }

      return feed;
    } catch (e) {
      return errorResponse(e);
    }
  }

  getFeedCache(token) {
    return new Promise((resolve, reject) => {
      const key = `feed:${token}`;
      this.cache.get(key, (err, data) => {
        if (err) {
          return reject(err);
        }
        console.log('cached: ', data);
        return resolve(JSON.parse(data));
      });
    });
  }

  setFeed(token) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('loading feed');
        let feed = [];
        const list = await this.history.list();

        while (Object.keys(list).length > 3) {
          const aux = list.splice(0, 3);
          feed.push(aux);
        }
        feed.push(list);

        feed = shuffle(feed);

        const key = `feed:${token}`;

        this.cache.set(key, JSON.stringify(feed), (err, data) => {
          console.log('feed', feed);
          console.log('feed', data);
          console.log('finished memcached');
        });

        console.log('feed loaded');
        return resolve(feed);
      } catch (e) {
        return reject(e);
      }
    });
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

export default FeedController;
