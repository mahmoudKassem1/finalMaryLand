const { Resend } = require('resend');

// Initialize Resend with your API Key from Railway Variables
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    // ✅ 1. CONTENT LOGIC (Identical to your old script)
    let contentBody = '';
    if (options.html) {
      contentBody = options.html;
    } else {
      const messageText = options.message || "No specific message text provided.";
      contentBody = `<p style="font-size: 16px; margin-bottom: 20px;">${messageText.replace(/\n/g, '<br />')}</p>`;
    }

    // ✅ 2. BUTTON LOGIC (Identical to your old script)
    const buttonHtml = options.ctaUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${options.ctaUrl}" style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
          ${options.ctaText || 'Click Here'}
        </a>
      </div>
      <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
        If the button above doesn't work, use this link:
        <br>
        <a href="${options.ctaUrl}" style="color: #DC2626; word-break: break-all;">${options.ctaUrl}</a>
      </p>
    ` : '';

    // ✅ 3. MASTER TEMPLATE (Identical to your old script)
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #DC2626; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Maryland Pharmacy</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 500;">Your Trusted Healthcare Partner</p>
        </div>
        <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
          <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; font-weight: 700;">Hello,</h2>
          ${contentBody}
          ${buttonHtml}
          <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #DC2626; border-radius: 4px; font-size: 13px; color: #475569;">
            <strong>Notification:</strong> This is an automated email from Maryland Pharmacy system.
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: 600;">&copy; ${new Date().getFullYear()} Maryland Pharmacy</p>
          <p style="margin: 5px 0;">Alexandria, Egypt</p>
        </div>
      </div>
    `;

    // ✅ 4. SEND VIA RESEND API
    await resend.emails.send({
      from: 'Maryland Pharmacy <onboarding@resend.dev>', // Keep this for free tier
      to: options.email || options.to,
      subject: options.subject,
      html: htmlTemplate,
    });

    console.log("✅ Email sent via Resend API");

  } catch (error) {
    // ⚠️ Prevent Backend Crash
    console.error("❌ Resend Email Failed:", error.message);
  }
};

module.exports = sendEmail;