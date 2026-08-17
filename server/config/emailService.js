const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer Transporter
 * Uses Gmail SMTP with Connection Pooling for sub-second email dispatch.
 */
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // SSL
        pool: true, // Keep socket alive for instant dispatch
        maxConnections: 5,
        maxMessages: 100,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Verify transporter on startup in background
    transporter.verify((err) => {
        if (err) {
            console.error("⚠️ Gmail SMTP verification warning:", err.message);
        } else {
            console.log("✅ Gmail SMTP Ready & Warm for instant OTP delivery");
        }
    });
}

/**
 * Send OTP Email (High Deliverability, Inbox-Optimized)
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} type - "verification" | "reset"
 */
async function sendOtpEmail(toEmail, otp, type = "verification") {
    const isVerification = type === "verification";
    const subject = isVerification
        ? `${otp} is your Kharchee verification code`
        : `${otp} is your Kharchee password reset code`;

    const title = isVerification ? "Verify your Kharchee account" : "Reset your Kharchee password";
    const actionText = isVerification
        ? "Please enter the verification code below to complete your registration and activate your account."
        : "We received a request to reset your password. Enter this code to set a new password.";

    // Plain text version (Crucial for Gmail inbox placement and spam filter bypass)
    const text = `
Hello,

${actionText}

Your One-Time Code: ${otp}

This code is valid for 10 minutes. Please do not share this code with anyone.

If you did not request this code, you can safely ignore this email.

— The Kharchee Team
https://kharchee.vercel.app
`;

    // Responsive HTML version
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                💸 Kharchee
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); font-weight: 500;">
                Smart Expense & Ledger Tracking
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                ${title}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
                ${actionText}
              </p>

              <!-- OTP Code Display Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', Courier, monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">
                ⏱️ Valid for 10 minutes
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                If you did not request this email, please ignore it. Your account remains completely secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Kharchee. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    console.log(`\n=================================================`);
    console.log(`🔑 [OTP DISPATCH] To: ${toEmail} | Type: ${type}`);
    console.log(`👉 OTP Code: ${otp}`);
    console.log(`=================================================\n`);

    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Kharchee" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: subject,
                text: text,
                html: html,
                headers: {
                    "X-Priority": "1 (Highest)",
                    "X-MSMail-Priority": "High",
                    Importance: "High"
                }
            });
            console.log(`✅ Email delivered to ${toEmail}`);
        } catch (err) {
            console.error("❌ Email sending failed via SMTP:", err.message);
        }
    } else {
        console.warn("⚠️ No EMAIL_USER and EMAIL_PASS set in environment. Check console for OTP code above.");
    }
}

module.exports = { sendOtpEmail };
