const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Setup the Gmail Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // smtp.gmail.com
      port: process.env.EMAIL_PORT, // 587
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Your 16-character App Password
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let safeCtaUrl = options.ctaUrl;
    
    // Handle Localhost replacement
    if (safeCtaUrl && safeCtaUrl.includes('http://localhost:5173')) {
        safeCtaUrl = safeCtaUrl.replace('http://localhost:5173', frontendUrl);
    }

    // ✅ RECIPIENT LOGIC: Format for Nodemailer (Comma separated string)
    const recipientInput = options.email || options.to;
    let recipients;

    if (Array.isArray(recipientInput)) {
      recipients = recipientInput.join(', ');
    } else {
      recipients = recipientInput; 
    }

    let contentBody = options.html || `<p style="font-size: 16px; margin-bottom: 20px;">${(options.message || "").replace(/\n/g, '<br />')}</p>`;

    const buttonHtml = safeCtaUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safeCtaUrl}" style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          ${options.ctaText || 'Click Here'}
        </a>
      </div>
    ` : '';

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Maryland Pharmacy</h1>
        </div>
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
          ${contentBody}
          ${buttonHtml}
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>&copy; ${new Date().getFullYear()} Maryland Pharmacy - Alexandria, Egypt</p>
        </div>
      </div>
    `;

    // 2. Send via SMTP
    const info = await transporter.sendMail({
  // 1. Ensure the 'from' matches the EMAIL_USER exactly
  from: `"Maryland Pharmacy" <${process.env.EMAIL_USER}>`, 
  to: recipients,
  subject: options.subject,
  html: htmlTemplate,
  // 2. Add a List-Unsubscribe header (even if not used, it looks more 'legit' to filters)
  headers: {
    "X-Entity-Ref-ID": new Date().getTime(),
  }
});

    console.log("✅ SMTP Email sent: %s", info.messageId);

  } catch (error) {
    console.error("❌ SMTP Email Failed:", error.message);
  }
};

module.exports = sendEmail;