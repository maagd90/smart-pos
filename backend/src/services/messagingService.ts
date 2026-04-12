import { prisma } from '../config/database';
import { env } from '../config/environment';
import { AppError } from '../middleware/errorHandler';
import { SendMessageDto, CreateCampaignDto, PaginationQuery, PaginatedResponse } from '../types';
import { MessageChannel, MessageStatus, CustomerSegment } from '@prisma/client';
import { logger } from '../config/logger';

function getTwilioClient() {
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    throw new AppError('Twilio credentials not configured', 503);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio') as (sid: string, token: string) => TwilioClient;
  return twilio(env.twilio.accountSid, env.twilio.authToken);
}

interface TwilioClient {
  messages: {
    create: (params: { from: string; to: string; body: string }) => Promise<{ sid: string }>;
  };
}

async function sendViaTwilio(
  to: string,
  content: string,
  channel: MessageChannel
): Promise<{ sid: string }> {
  const client = getTwilioClient();

  if (channel === MessageChannel.WHATSAPP) {
    if (!env.features.whatsappEnabled) throw new AppError('WhatsApp messaging is not enabled', 503);
    if (!env.twilio.whatsappNumber) throw new AppError('Twilio WhatsApp number not configured', 503);

    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    return client.messages.create({
      from: env.twilio.whatsappNumber,
      to: toWhatsApp,
      body: content,
    });
  } else if (channel === MessageChannel.SMS) {
    if (!env.features.smsEnabled) throw new AppError('SMS messaging is not enabled', 503);
    if (!env.twilio.smsFrom) throw new AppError('Twilio SMS number not configured', 503);

    return client.messages.create({
      from: env.twilio.smsFrom,
      to,
      body: content,
    });
  }

  throw new AppError(`Channel ${channel} not supported via Twilio`, 400);
}

export async function sendMessage(dto: SendMessageDto): Promise<object> {
  if (dto.channel === MessageChannel.WHATSAPP && !env.features.whatsappEnabled) {
    throw new AppError('WhatsApp messaging is not enabled', 503);
  }
  if (dto.channel === MessageChannel.SMS && !env.features.smsEnabled) {
    throw new AppError('SMS messaging is not enabled', 503);
  }
  if (dto.channel === MessageChannel.EMAIL && !env.features.emailEnabled) {
    throw new AppError('Email messaging is not enabled', 503);
  }

  const customer = await prisma.customer.findUnique({ where: { id: dto.customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const message = await prisma.message.create({
    data: {
      customerId: dto.customerId,
      channel: dto.channel,
      content: dto.content,
      status: MessageStatus.PENDING,
      templateId: dto.templateId,
    },
  });

  try {
    const to =
      dto.channel === MessageChannel.EMAIL
        ? customer.email ?? ''
        : customer.phone ?? '';

    if (!to) throw new AppError('Customer has no contact info for this channel', 400);

    if (dto.channel !== MessageChannel.EMAIL) {
      await sendViaTwilio(to, dto.content, dto.channel);
    }

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { status: MessageStatus.SENT, sentAt: new Date() },
    });

    return updated;
  } catch (error) {
    logger.error('Failed to send message', { messageId: message.id, error });

    await prisma.message.update({
      where: { id: message.id },
      data: { status: MessageStatus.FAILED },
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to send message', 502);
  }
}

export async function getMessageHistory(
  query: PaginationQuery & { channel?: MessageChannel; status?: MessageStatus }
): Promise<PaginatedResponse<object>> {
  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.channel) where['channel'] = query.channel;
  if (query.status) where['status'] = query.status;

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
    }),
    prisma.message.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createCampaign(dto: CreateCampaignDto): Promise<object> {
  if (dto.channel === MessageChannel.WHATSAPP && !env.features.whatsappEnabled) {
    throw new AppError('WhatsApp messaging is not enabled', 503);
  }
  if (dto.channel === MessageChannel.SMS && !env.features.smsEnabled) {
    throw new AppError('SMS messaging is not enabled', 503);
  }

  // Fetch target customers
  const where: Record<string, unknown> = {};
  if (dto.targetSegment) where['segment'] = dto.targetSegment;

  const customers = await prisma.customer.findMany({ where });

  if (customers.length === 0) {
    throw new AppError('No customers found for the target segment', 400);
  }

  const results = { sent: 0, failed: 0, total: customers.length, messageIds: [] as string[] };

  for (const customer of customers) {
    try {
      const message = await sendMessage({
        customerId: customer.id,
        channel: dto.channel,
        content: dto.content,
        templateId: dto.name,
      });
      results.sent++;
      results.messageIds.push((message as { id: string }).id);
    } catch {
      results.failed++;
    }
  }

  return {
    campaign: {
      name: dto.name,
      channel: dto.channel,
      targetSegment: dto.targetSegment,
      scheduledAt: dto.scheduledAt,
    },
    results,
  };
}

export async function getCampaigns(): Promise<object> {
  const campaigns = await prisma.message.groupBy({
    by: ['templateId', 'channel', 'status'],
    where: { templateId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return { campaigns };
}
