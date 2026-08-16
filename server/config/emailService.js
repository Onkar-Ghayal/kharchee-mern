const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer Transporter
 * If EMAIL_USER & EMAIL_PASS are set, use real SMTP (e.g. Gmail App Password).
 * Otherwise, log OTP to console in development.
 */
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

/**
 * Send OTP Email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} type - "verification" | "reset"
 */
async function sendOtpEmail(toEmail, otp, type = "verification") {
    const isVerification = type === "verification";
    const subject = isVerification
        ? "Verify Your Email - Kharchee"
        : "Reset Your Password - Kharchee";

    const title = isVerification ? "Email Verification Code" : "Password Reset Code";
    const message = isVerification
        ? "Thank you for joining <strong>Kharchee</strong>. Please use the verification code below to activate your account. This code is valid for <strong>10 minutes</strong>."
        : "We received a request to reset your password for your <strong>Kharchee</strong> account. Use the code below to proceed with resetting your password. This code is valid for <strong>10 minutes</strong>.";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
        .container { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; text-align: center; }
        .content h2 { margin-top: 0; color: #f1f5f9; font-size: 20px; }
        .content p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { display: inline-block; background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #818cf8; margin: 10px 0 24px 0; }
        .footer { padding: 20px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💸 Kharchee</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>${message}</p>
          <div class="otp-box">${otp}</div>
          <p style="font-size: 13px; color: #64748b;">If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Kharchee. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    console.log(`\n=================================================`);
    console.log(`🔑 [OTP NOTIFICATION] To: ${toEmail} | Type: ${type}`);
    console.log(`👉 OTP Code: ${otp}`);
    console.log(`=================================================\n`);

    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Kharchee Security" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: subject,
                html: html
            });
            console.log(`📧 Email sent successfully to ${toEmail}`);
        } catch (err) {
            console.error("❌ Email sending failed via SMTP:", err.message);
        }
    }
}

module.exports = { sendOtpEmail };
