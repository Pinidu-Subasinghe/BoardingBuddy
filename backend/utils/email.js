const nodemailer = require("nodemailer");

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

async function sendTransactionalEmail({ to, subject, text }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  // Send as plain text to keep the template simple and reliable.
  await transporter.sendMail({ from, to, subject, text });
}

module.exports = { sendTransactionalEmail };
