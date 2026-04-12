import twilio from 'twilio';
import { logger } from '../../utils/constants';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await client.messages.create({ from, to: toFormatted, body });
  logger.info(`WhatsApp sent to ${to}`);
}
