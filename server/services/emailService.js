const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, otp) => {
  const transporter = createTransporter();

  const subject = 'YatrAI Password Reset Code';
  const text = `Your password reset code is ${otp}. It expires in 15 minutes.`;
  const html = `<p>Your password reset code is <strong>${otp}</strong>.</p><p>This code expires in 15 minutes.</p>`;

  if (!transporter) {
    console.warn('EMAIL SERVICE NOT CONFIGURED: Password reset OTP:', otp, 'for', email);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject,
    text,
    html,
  });
};

module.exports = { sendPasswordResetEmail };
