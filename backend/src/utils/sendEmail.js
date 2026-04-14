const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    // 1. Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let safeCtaUrl = options.ctaUrl;
    
    // Handle Localhost replacement
    if (safeCtaUrl && safeCtaUrl.includes('http://localhost:5173')) {
        safeCtaUrl = safeCtaUrl.replace('http://localhost:5173', frontendUrl);
    }

    // ✅ RECIPIENT LOGIC:
    // Resend SDK accepts either a single string or an array of strings.
    const recipients = options.email || options.to;

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

    // 2. Send via Resend API
    // NOTE: 'from' must be onboarding@resend.dev until you verify your custom domain tomorrow
    const { data, error } = await resend.emails.send({
      from: 'Maryland Pharmacy <onboarding@resend.dev>',
      to: recipients,
      subject: options.subject,
      html: htmlTemplate,
    });

    if (error) {
      console.error("❌ Resend API Error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Resend Email sent successfully:", data.id);
    return { success: true, id: data.id };

  } catch (error) {
    console.error("❌ Resend Utility Failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;