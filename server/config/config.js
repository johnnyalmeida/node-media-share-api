import dotenv from 'dotenv';

// Init dotenv config
dotenv.config();

export default {
  aws_key: process.env.AWS_KEY,
  aws_secret: process.env.AWS_SECRET,
  aws_bucket: process.env.AWS_BUCKET,
  aws_s3_domain: process.env.AWS_S3_DOMAIN,
  processing_api_url: process.env.PROCESSING_API_URL,
  port: process.env.PORT,
};
