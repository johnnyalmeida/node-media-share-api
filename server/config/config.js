import dotenv from 'dotenv';

// Init dotenv config
dotenv.config();

export default {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    pass: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    pool_min: process.env.DB_POOL_MIN,
    pool_max: process.env.DB_POOL_MAX,
  },
  aws: {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: process.env.AWS_BUCKET,
  },
  video_processing_api_url: process.env.VIDEO_PROCESSING_API_URL,
  image_processing_api_url: process.env.IMAGE_PROCESSING_API_URL,
  port: process.env.PORT,
};
