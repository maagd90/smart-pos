import { prisma } from '../../db/prismaClient';
import { sendWhatsApp } from './whatsappService';
import { sendSMS } from './smsService';
import { sendEmail } from './emailService';
import { createError } from '../../middleware/errorHandler';
import { MAX_MESSAGES_PER_MONTH, MESSAGE_GAP_DAYS } from '../../utils/constants';
import { daysBetween } from '../../utils/formatters';

export interface SendMessageOptions {
  customerId: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  content: string;
  subject?: string;
  userId?: string;
  campaignId?: string;
  skipSpamCheck?: boolean;
}

export async function sendMessage(options: SendMessageOptions) {
  const customer = await prisma.customer.findUnique({ where: { id: options.customerId } });
  if (!customer) throw createError('Customer not found', 404);

  // Check opt-in status
  if (options.channel === 'WHATSAPP' && !customer.optInWhatsapp) {
    throw createError('Customer has not opted in to WhatsApp', 403);
  }
  if (options.channel === 'SMS' && !customer.optInSms) {
    throw createError('Customer has not opted in to SMS', 403);
  }
  if (options.channel === 'EMAIL' && !customer.optInEmail) {
    throw createError('Customer has not opted in to email', 403);
  }

  if (!options.skipSpamCheck) {
    const now = new Date();

    // Check message gap (7 days)
    const lastMessage = await prisma.message.findFirst({
      where: { customerId: options.customerId, channel: options.channel },
      orderBy: { createdAt: 'desc' },
    });

    if (lastMessage) {
      const gap = daysBetween(lastMessage.createdAt, now);
      if (gap < MESSAGE_GAP_DAYS) {
        throw createError(
          `Message sent too recently. Wait ${MESSAGE_GAP_DAYS - gap} more day(s)`,
          429
        );
      }
    }

    // Check monthly limit
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await prisma.message.count({
      where: {
        customerId: options.customerId,
        channel: options.channel,
        createdAt: { gte: firstDayOfMonth },
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
    });

    if (monthlyCount >= MAX_MESSAGES_PER_MONTH) {
      throw createError('Monthly message limit reached for this customer', 429);
    }
  }

  // Create message record
  const message = await prisma.message.create({
    data: {
      customerId: options.customerId,
      userId: options.userId,
      channel: options.channel,
      content: options.content,
      status: 'PENDING',
      campaignId: options.campaignId,
    },
  });

  // Send the message
  let status: 'SENT' | 'FAILED' = 'FAILED';
  try {
    if (options.channel === 'WHATSAPP' && customer.phone) {
      await sendWhatsApp(customer.phone, options.content);
      status = 'SENT';
    } else if (options.channel === 'SMS' && customer.phone) {
      await sendSMS(customer.phone, options.content);
      status = 'SENT';
    } else if (options.channel === 'EMAIL' && customer.email) {
      await sendEmail(customer.email, options.subject ?? 'Message from Smart POS', options.content);
      status = 'SENT';
    }
  } catch (err) {
    status = 'FAILED';
  }

  await prisma.message.update({ where: { id: message.id }, data: { status } });
  return { ...message, status };
}

export async function sendCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw createError('Campaign not found', 404);
  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw createError('Campaign is not in a sendable state', 400);
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'RUNNING' } });

  const whereClause = campaign.segment ? { segment: campaign.segment } : {};
  const customers = await prisma.customer.findMany({ where: whereClause });

  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      await sendMessage({
        customerId: customer.id,
        channel: campaign.channel,
        content: campaign.template,
        campaignId,
        skipSpamCheck: false,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } });
  return { sent, failed, total: customers.length };
}
