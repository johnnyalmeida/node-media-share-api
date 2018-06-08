import env from 'dotenv';


export default () => {
  env.config();
  return {
    aws_key: process.env.AWS_KEY,
    aws_secret: process.env.AWS_SECRET,
    port: 3000,
  };
};
