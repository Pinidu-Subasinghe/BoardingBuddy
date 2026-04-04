const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const EMAIL_LOGO_PATH = path.resolve(__dirname, "../../frontend/src/assets/bb_logo_no_bg.png");
const EMAIL_LOGO_CID = "bb_logo_no_bg";

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

function getInlineLogoAttachment() {
  if (!fs.existsSync(EMAIL_LOGO_PATH)) {
    return null;
  }

  return {
    filename: "bb_logo_no_bg.png",
    path: EMAIL_LOGO_PATH,
    cid: EMAIL_LOGO_CID,
  };
}

async function sendTransactionalEmail({ to, subject, text, html }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = { from, to, subject, text };

  if (html) {
    mailOptions.html = html;
    const logoAttachment = getInlineLogoAttachment();
    if (logoAttachment) {
      mailOptions.attachments = [logoAttachment];
    }
  }

  await transporter.sendMail(mailOptions);
}

module.exports = { sendTransactionalEmail };
