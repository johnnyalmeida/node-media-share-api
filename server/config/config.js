import dotenv from 'dotenv';

// Init dotenv config
dotenv.config();

export default {
  aws_key: process.env.AWS_KEY,
  aws_secret: process.env.AWS_SECRET,
  aws_bucket: process.env.AWS_BUCKET,
  port: process.env.PORT,
};
