import dotenv from 'dotenv';

// Init dotenv config
dotenv.config();

export default {
  aws_key: process.env.AWS_KEY,
  aws_secret: process.env.AWS_SECRET,
  port: process.env.PORT,
};
