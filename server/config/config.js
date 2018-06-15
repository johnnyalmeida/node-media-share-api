import dotenv from 'dotenv';

// Init dotenv config
dotenv.config();

export default {
  aws_key: process.env.AWS_KEY,
  aws_secret: process.env.AWS_SECRET,
  aws_bucket: process.env.AWS_BUCKET,
  aws_s3_domain: process.env.AWS_S3_DOMAIN,
  video_processing_api_url: process.env.VIDEO_PROCESSING_API_URL,
  image_processing_api_url: process.env.IMAGE_PROCESSING_API_URL,
  port: process.env.PORT,
};
