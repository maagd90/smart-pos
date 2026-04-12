import twilio from 'twilio';
import { logger } from '../../utils/constants';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  await client.messages.create({ from, to, body });
  logger.info(`SMS sent to ${to}`);
}
