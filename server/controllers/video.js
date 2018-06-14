import HttpStatus from 'http-status';
import AWS from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
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
class VideoController/*  */ {
  constructor(config) {
    this.config = config;
    this.testKey = 'sample_vertical.mp4';
    // For dev purposes only
    AWS.config.update({
      accessKeyId: this.config.aws_key,
      secretAccessKey: this.config.aws_secret,
    });

    this.s3 = new AWS.S3();
  }

  /**
   * List videos.
   */
  list() {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.config.aws_bucket,
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
  uploadVideo(req, gif = true) {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();

      form.parse(req, (err, fields, files) => {
        fs.readFile(files.file.path, (error, data) => {
          if (error) { throw error; }
          const base64data = Buffer.from(data, 'binary');
          const s3 = new AWS.S3();
          const bucket = this.config.aws_bucket;
          const token = uuid();
          const fileName = `${token}${path.extname(files.file.name)}`;
          const key = `videos/${fileName}`;

          s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: base64data,
          }, (errorS3, result) => {
            console.log('uploaded');
            if (errorS3) {
              reject(errorS3);
            }
            if (gif) {
              this.processWithGif(fileName, result)
                .then((response) => {
                  resolve(defaultResponse(response));
                })
                .catch(promisseErr => reject(promisseErr));
            } else {
              this.processVideo(fileName, result)
                .then((response) => {
                  resolve(defaultResponse(response));
                })
                .catch(promisseErr => reject(promisseErr));
            }
          });
        });
      });
    });
  }

  processVideo(key) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(`./tmp/videos/${key}`);

      const params = {
        Bucket: this.config.aws_bucket,
        Key: `videos/${key}`,
      };

      this.s3.getObject(params).createReadStream().pipe(file)
        .on('finish', () => {
          console.log('start processing');
          const filePath = `./tmp/videos/${key}`;

          const newPath = `./tmp/videos/processed/${key}`;

          ffmpeg(filePath)
            .audioCodec('aac')
            .videoCodec('libx264')
            .format('mp4')
            .size('750x1334')
            .aspect('9:16')
            .autopad()
            .save(newPath)
            .videoBitrate(3500)
            .fps(29.7)
            .on('end', () => {
              console.log('processed');
              this.moveTempToS3(newPath, key, resolve, reject)
                .then((data) => {
                  resolve(data);
                })
                .catch(error => reject(error));
            });
        });
    });
  }

  moveTempToS3(filePath, fileName) {
    return new Promise((resolve, reject) => {
      // Read in the file, convert it to base64, store to S3
      fs.readFile(filePath, (err, data) => {
        if (err) { throw err; }
        const base64data = Buffer.from(data, 'binary');
        const bucket = this.config.aws_bucket;
        const key = `videos/processed/${fileName}`;

        this.s3.putObject({
          Bucket: bucket,
          Key: key,
          Body: base64data,
        }, (error, result) => {
          console.log('move');
          if (error) {
            reject(error);
          }
          const file = {
            path: key,
            s3: result,
          };
          console.log(file);
          resolve(file);
        });
      });
    });
  }

  processWithGif(key) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(`./tmp/videos/${key}`);

      const params = {
        Bucket: this.config.aws_bucket,
        Key: `videos/${key}`,
      };

      this.s3.getObject(params).createReadStream().pipe(file)
        .on('finish', () => {
          console.log('start processing');
          const filePath = `./tmp/videos/${key}`;

          const newPath = `./tmp/videos/processed/${key}`;

          ffmpeg(filePath)
            .input('./_files/homer.gif')
            .audioCodec('aac')
            .videoCodec('libx264')
            .videoBitrate(1000)
            .inputOptions('-ignore_loop 0')
            .complexFilter([
              '[0:v]crop=in_w-2*28:in_h-2*25[base];[base][1:v]overlay=400:H-h-500:shortest=1',
            ])
            .save(newPath)
            .on('end', () => {
              console.log('processed');
              this.moveTempToS3(newPath, key, resolve, reject)
                .then((data) => {
                  resolve(data);
                })
                .catch(error => reject(error));
            });
        });
    });
  }

  processTestVideo() {
    return new Promise((resolve) => {
      const newPath = `./tmp/processed/${this.testKey}`;
      console.log('testing');
      // ffmpeg(filePath)
      // .audioCodec('aac')
      // .videoCodec('libx264')
      // .format('mp4')
      // .size('750x1334')
      // .aspect('9:16')
      // .autopad()
      // .videoBitrate(1500)
      // .fps(29.7)
      const video = ffmpeg(`./_files/${this.testKey}`)
        // .loop()
        // .input('./_files/4all.png')
        .input('https://media.giphy.com/media/LTsawtG3DdFfi/source.gif')
        // .input('./_files/homer.gif/')
        .audioCodec('aac')
        .videoCodec('libx264')
        // .size('750x1334')
        .videoBitrate(1000)
        .inputOptions('-ignore_loop 0')
        .complexFilter([
          '[0:v]crop=in_w-2*28:in_h-2*25[base];[base][1:v]overlay=0:H-h-500:shortest=1',
        ]);
        // .complexFilter([
        //   '[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10',
        // ]);

        // .videoFilters({
        //   filter: 'drawtext',
        //   options: {
        //     text: 'LOREM IPSUM',
        //   },
        // })
      console.log('post code');

      video.save(newPath)
        .on('end', () => {
          console.log('processed');
          resolve();
        });
    });
  }
}

export default VideoController;
