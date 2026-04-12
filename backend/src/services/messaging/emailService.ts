import sgMail from '@sendgrid/mail';
import { logger } from '../../utils/constants';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  const from = {
    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@smartpos.com',
    name: process.env.SENDGRID_FROM_NAME || 'Smart POS',
  };

  await sgMail.send({
    to,
    from,
    subject,
    text: content,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">${content.replace(/\n/g, '<br>')}</div>`,
  });

  logger.info(`Email sent to ${to}`);
}
