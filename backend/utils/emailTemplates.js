const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatMultiline = (value = "") => {
  return escapeHtml(value).replace(/\n/g, "<br/>");
};

const createEmailHtml = ({ title, greeting, intro, bodyHtml, footerNote }) => {
  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3f5ff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5ff;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 8px;text-align:center;">
                <img src="cid:bb_logo_no_bg" alt="BoardingBuddy" style="display:inline-block;width:120px;max-width:100%;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#111827;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(greeting)}</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">${escapeHtml(intro)}</p>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const buildOtpEmail = (userName, otp) => {
  const text =
    `Dear ${userName},\n\n` +
    "Your OTP code is:\n" +
    `${otp}\n\n` +
    "This code will expire in 5 minutes.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Email Verification",
    greeting: `Hi ${userName},`,
    intro: "Use the OTP below to verify your email address.",
    bodyHtml: `
      <div style="margin:20px 0;text-align:center;">
        <span style="display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;border-radius:10px;font-size:24px;letter-spacing:6px;font-weight:700;">
          ${escapeHtml(otp)}
        </span>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">This OTP will expire in 5 minutes.</p>
    `,
    footerNote: "If you did not request this verification, please ignore this email.",
  });

  return {
    subject: "Email Verification - BoardingBuddy",
    text,
    html,
  };
};

const buildWelcomeEmail = (userName) => {
  const text =
    `Dear ${userName},\n\n` +
    "Welcome to BoardingBuddy!\n" +
    "Your account has been successfully created.\n" +
    "You can now explore boarding listings, manage your profile, and use our services.\n\n" +
    "If you did not create this account, please contact support immediately.\n\n" +
    "Thank you for choosing our platform.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Welcome to BoardingBuddy",
    greeting: `Hi ${userName},`,
    intro: "Your account is now active and ready to use.",
    bodyHtml: `
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:14px 16px;">
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4338ca;font-weight:600;">What you can do now:</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#374151;">
          <li>Explore boarding listings</li>
          <li>Manage your profile details</li>
          <li>Use platform services with confidence</li>
        </ul>
      </div>
    `,
    footerNote: "If this account was not created by you, please contact support immediately.",
  });

  return {
    subject: "Welcome to BoardingBuddy",
    text,
    html,
  };
};

const buildForgotPasswordOtpEmail = (otp) => {
  const text =
    "Dear User,\n\n" +
    "You requested to reset your password.\n\n" +
    "Use the OTP below to continue:\n" +
    `${otp}\n\n` +
    "This OTP will expire in 10 minutes.\n\n" +
    "If you did not request this, please ignore this email.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Password Reset",
    greeting: "Hi there,",
    intro: "We received a request to reset your password.",
    bodyHtml: `
      <div style="margin:20px 0;text-align:center;">
        <span style="display:inline-block;background:#7c2d12;color:#ffffff;padding:12px 20px;border-radius:10px;font-size:24px;letter-spacing:6px;font-weight:700;">
          ${escapeHtml(otp)}
        </span>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">This OTP will expire in 10 minutes.</p>
    `,
    footerNote: "If you did not request a password reset, no action is needed.",
  });

  return {
    subject: "Password Reset - BoardingBuddy",
    text,
    html,
  };
};

const buildProfileUpdatedEmail = (userName) => {
  const text =
    `Dear ${userName},\n\n` +
    "This is a confirmation that your profile information was successfully updated.\n\n" +
    "If you did not make these changes, please secure your account immediately.\n\n" +
    "Thank you for keeping your information up to date.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Profile Updated",
    greeting: `Hi ${userName},`,
    intro: "Your profile information was updated successfully.",
    bodyHtml: `
      <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#155e75;">If this was not you, please change your password and contact support immediately.</p>
      </div>
    `,
    footerNote: "Thank you for keeping your BoardingBuddy account secure.",
  });

  return {
    subject: "Your BoardingBuddy Profile Was Updated",
    text,
    html,
  };
};

const buildAccountDeletedEmail = (userName) => {
  const text =
    `Dear ${userName},\n\n` +
    "Your BoardingBuddy account has been successfully deleted.\n" +
    "We're sorry to see you go.\n\n" +
    "If this was not you, please contact support immediately.\n\n" +
    "We appreciate the time you spent with us and hope to serve you again in the future.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Account Deleted",
    greeting: `Hi ${userName},`,
    intro: "Your BoardingBuddy account has been deleted.",
    bodyHtml: `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#9a3412;">If this action was not performed by you, contact support immediately.</p>
      </div>
    `,
    footerNote: "Thank you for being with BoardingBuddy.",
  });

  return {
    subject: "Your BoardingBuddy Account Has Been Deleted",
    text,
    html,
  };
};

const buildInquiryReceivedEmail = (userName) => {
  const text =
    `Dear ${userName},\n\n` +
    "Your inquiry has been successfully submitted.\n" +
    "Our admin team will review it shortly.\n\n" +
    "Thank you for reaching out.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Inquiry Received",
    greeting: `Hi ${userName},`,
    intro: "Your inquiry is now in our queue.",
    bodyHtml: `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1e40af;">Our admin team will review it shortly and get back to you.</p>
      </div>
    `,
    footerNote: "Thanks for helping us improve the BoardingBuddy experience.",
  });

  return {
    subject: "Inquiry Received - BoardingBuddy",
    text,
    html,
  };
};

const buildInquiryResponseEmail = (userName, response) => {
  const text =
    `Dear ${userName},\n\n` +
    "Your inquiry has been reviewed.\n\n" +
    "Admin Response:\n" +
    `${response}\n\n` +
    "Thank you for your patience.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Inquiry Update",
    greeting: `Hi ${userName},`,
    intro: "Our team has reviewed your inquiry.",
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;font-weight:600;">Admin Response</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;">${formatMultiline(response)}</p>
      </div>
    `,
    footerNote: "Thank you for your patience.",
  });

  return {
    subject: "Update on Your Inquiry",
    text,
    html,
  };
};

const buildInquiryActionTakenEmail = (userName) => {
  const text =
    `Dear ${userName},\n\n` +
    "Appropriate action has been taken regarding your inquiry.\n\n" +
    "Thank you for helping us maintain quality standards.\n\n" +
    "Thank You,\n" +
    "BoardingBuddy Team";

  const html = createEmailHtml({
    title: "Action Taken",
    greeting: `Hi ${userName},`,
    intro: "Appropriate action has now been taken regarding your inquiry.",
    bodyHtml: `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#166534;">Thank you for helping us maintain quality standards.</p>
      </div>
    `,
    footerNote: "BoardingBuddy appreciates your contribution.",
  });

  return {
    subject: "Action Taken on Your Inquiry",
    text,
    html,
  };
};

module.exports = {
  buildOtpEmail,
  buildWelcomeEmail,
  buildForgotPasswordOtpEmail,
  buildProfileUpdatedEmail,
  buildAccountDeletedEmail,
  buildInquiryReceivedEmail,
  buildInquiryResponseEmail,
  buildInquiryActionTakenEmail,
};
