import nodemailer from "nodemailer";
import { studentAccountEmailHtml } from "./emailTemplates/studentAccountEmail.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { 
    user: process.env.NODEMAILER_USER, 
    pass: process.env.NODEMAILER_PASSWORD 
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendStudentAccountEmail(to, payload) {
  const html = studentAccountEmailHtml(payload);

  return transporter.sendMail({
    from: `"${payload.tenTruong || "Nhà trường"}" <${process.env.NODEMAILER_USER}>`,
    to,
    subject: "Tài khoản đăng nhập hệ thống học sinh",
    html,
  });
}
