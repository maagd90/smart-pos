import sgMail from '@sendgrid/mail';
import { logger } from '../../utils/constants';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  const from = {
    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@smartpos.com',
    name: process.env.SENDGRID_FROM_NAME || 'Smart POS',
  };

  const safeContent = escapeHtml(content).replace(/\n/g, '<br>');

  await sgMail.send({
    to,
    from,
    subject,
    text: content,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">${safeContent}</div>`,
  });

  logger.info(`Email sent to ${to}`);
}
