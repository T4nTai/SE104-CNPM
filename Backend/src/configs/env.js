import dotenv from "dotenv";
dotenv.config();

export const {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV,
  NODEMAILER_USER,
  NODEMAILER_PASSWORD,
  WEBSITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE
} = process.env;