const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Setup the Gmail Transporter with Railway-optimized settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // ✅ Use 465 for SSL (More stable on Railway than 587)
      secure: true, // ✅ Must be true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // ✅ Critical for Railway: Prevents the "Infinite Loading" bug
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let safeCtaUrl = options.ctaUrl;
    
    if (safeCtaUrl && safeCtaUrl.includes('http://localhost:5173')) {
        safeCtaUrl = safeCtaUrl.replace('http://localhost:5173', frontendUrl);
    }

    const recipientInput = options.email || options.to;
    const recipients = Array.isArray(recipientInput) ? recipientInput.join(', ') : recipientInput;

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
      from: `"Maryland Pharmacy" <${process.env.EMAIL_USER}>`, 
      to: recipients,
      subject: options.subject,
      html: htmlTemplate,
      headers: {
        "X-Entity-Ref-ID": new Date().getTime().toString(),
      }
    });

    console.log("✅ SMTP Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("❌ SMTP Email Failed:", error.message);
    // Return false instead of throwing to prevent crashing the order process
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;