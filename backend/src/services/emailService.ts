import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  to: string;
  tenantName: string;
  adminName: string;
  domain: string;
  adminEmail: string;
  temporaryPassword: string;
  apiKey: string;
}

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log('[EmailService] SMTP not configured – skipping welcome email');
    return;
  }

  const transporter = createTransporter();
  const loginUrl = `https://${data.domain}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 32px 40px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .body { padding: 32px 40px; }
    .credential-box { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .credential-label { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; }
    .credential-value { font-family: monospace; font-size: 14px; color: #1e293b; font-weight: 600; }
    .api-key { font-size: 11px; word-break: break-all; background: #e2e8f0; padding: 8px; border-radius: 4px; }
    .cta-button { display: inline-block; background: #4f46e5; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .step { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .step-num { background: #4f46e5; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-right: 12px; margin-top: 2px; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Smart POS!</h1>
      <p>Your tenant <strong>${data.tenantName}</strong> is ready</p>
    </div>
    <div class="body">
      <p>Hi ${data.adminName},</p>
      <p>Your Smart POS tenant has been created and is ready to use. Here are your credentials:</p>

      <div class="credential-box">
        <div class="credential-row">
          <span class="credential-label">Login URL</span>
          <span class="credential-value"><a href="${loginUrl}">${loginUrl}</a></span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Admin Email</span>
          <span class="credential-value">${data.adminEmail}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${data.temporaryPassword}</span>
        </div>
        <div class="credential-row" style="margin-bottom:0">
          <span class="credential-label">API Key</span>
        </div>
        <div class="api-key">${data.apiKey}</div>
      </div>

      <a href="${loginUrl}" class="cta-button">Login to Your Dashboard →</a>

      <h3>Next Steps</h3>
      <div class="steps">
        <div class="step"><div class="step-num">1</div><div>Login and change your temporary password immediately</div></div>
        <div class="step"><div class="step-num">2</div><div>Set up your first shop and add products</div></div>
        <div class="step"><div class="step-num">3</div><div>Invite your staff members with appropriate roles</div></div>
        <div class="step"><div class="step-num">4</div><div>Configure WhatsApp messaging for customer engagement</div></div>
        <div class="step"><div class="step-num">5</div><div>Start processing transactions at the POS terminal</div></div>
      </div>

      <p>Need help? Check our <a href="https://docs.smartpos.app">documentation</a> or contact support.</p>
    </div>
    <div class="footer">
      Smart POS · Secure · Multi-Tenant · Production-Ready
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@smartpos.app',
    to: data.to,
    subject: `🎉 Your Smart POS tenant "${data.tenantName}" is ready!`,
    html,
  });
}

export async function sendFailureNotification(
  to: string,
  tenantName: string,
  errorMessage: string
): Promise<void> {
  if (!process.env.SMTP_HOST) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@smartpos.app',
    to,
    subject: `⚠️ Tenant creation failed: ${tenantName}`,
    html: `<p>Unfortunately, the creation of tenant <strong>${tenantName}</strong> failed.</p>
           <p><strong>Error:</strong> ${errorMessage}</p>
           <p>Please contact support or retry the creation.</p>`,
  });
}
