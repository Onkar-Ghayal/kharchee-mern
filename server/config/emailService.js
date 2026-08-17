const https = require("https");
const nodemailer = require("nodemailer");
const dns = require("dns");

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

/**
 * Send email via Resend HTTP API (Port 443 HTTPS - 100% unblocked on Render)
 */
function sendViaResend(apiKey, toEmail, subject, text, html) {
    const payload = JSON.stringify({
        from: process.env.RESEND_FROM || "Kharchee <onboarding@resend.dev>",
        to: [toEmail],
        subject: subject,
        text: text,
        html: html
    });

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: "api.resend.com",
                port: 443,
                path: "/emails",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey.trim()}`,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                },
                timeout: 10000
            },
            (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        const data = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ success: true, messageId: data.id, provider: "resend" });
                        } else {
                            reject(new Error(data.message || body));
                        }
                    } catch (e) {
                        reject(new Error(body));
                    }
                });
            }
        );

        req.on("error", (err) => reject(err));
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Resend API timed out"));
        });
        req.write(payload);
        req.end();
    });
}

/**
 * Send email via Brevo HTTP API (Port 443 HTTPS - 100% unblocked on Render)
 */
function sendViaBrevo(apiKey, toEmail, subject, text, html) {
    const senderEmail = (process.env.EMAIL_USER || "onkarghayal1@gmail.com").trim();
    const payload = JSON.stringify({
        sender: { name: "Kharchee", email: senderEmail },
        to: [{ email: toEmail }],
        subject: subject,
        textContent: text,
        htmlContent: html
    });

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: "api.brevo.com",
                port: 443,
                path: "/v3/smtp/email",
                method: "POST",
                headers: {
                    "api-key": apiKey.trim(),
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                },
                timeout: 10000
            },
            (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        const data = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ success: true, messageId: data.messageId, provider: "brevo" });
                        } else {
                            reject(new Error(data.message || body));
                        }
                    } catch (e) {
                        reject(new Error(body));
                    }
                });
            }
        );

        req.on("error", (err) => reject(err));
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Brevo API timed out"));
        });
        req.write(payload);
        req.end();
    });
}

/**
 * Fallback: Nodemailer SMTP
 */
function getSmtpTransporter() {
    const emailUser = (process.env.EMAIL_USER || "").trim();
    const emailPass = (process.env.EMAIL_PASS || "").replace(/[^a-zA-Z0-9]/g, "").trim();

    if (!emailUser || !emailPass) return null;

    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
        family: 4,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
}

/**
 * Universal Send OTP Email
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

    const text = `
Hello,

${actionText}

Your One-Time Code: ${otp}

This code is valid for 10 minutes. Please do not share this code with anyone.

If you did not request this code, you can safely ignore this email.

— The Kharchee Team
https://kharchee.vercel.app
`;

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
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                ${title}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
                ${actionText}
              </p>
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

    // 1. Try Resend HTTP API (Fastest & 100% unblocked on Render)
    if (process.env.RESEND_API_KEY) {
        try {
            const res = await sendViaResend(process.env.RESEND_API_KEY, toEmail, subject, text, html);
            console.log(`✅ [Resend] Email delivered to: ${toEmail}`);
            return res;
        } catch (err) {
            console.error("❌ Resend API error:", err.message);
        }
    }

    // 2. Try Brevo HTTP API
    if (process.env.BREVO_API_KEY) {
        try {
            const res = await sendViaBrevo(process.env.BREVO_API_KEY, toEmail, subject, text, html);
            console.log(`✅ [Brevo] Email delivered to: ${toEmail}`);
            return res;
        } catch (err) {
            console.error("❌ Brevo API error:", err.message);
        }
    }

    // 3. Fallback to SMTP
    const transporter = getSmtpTransporter();
    const emailUser = (process.env.EMAIL_USER || "").trim();

    if (transporter && emailUser) {
        try {
            const info = await transporter.sendMail({
                from: `"Kharchee" <${emailUser}>`,
                to: toEmail,
                subject: subject,
                text: text,
                html: html
            });
            console.log(`✅ [SMTP] Email delivered to: ${toEmail} | ID: ${info.messageId}`);
            return { success: true, messageId: info.messageId, provider: "smtp" };
        } catch (err) {
            console.error("❌ SMTP Delivery failed:", err.message);
            return { success: false, error: err.message, hint: "Render Free tier blocks SMTP ports 25/465/587. Add RESEND_API_KEY to Render for instant HTTP delivery." };
        }
    }

    return {
        success: false,
        error: "No email provider configured",
        hint: "Add RESEND_API_KEY (from https://resend.com) to your Render environment variables."
    };
}

module.exports = { sendOtpEmail };
