import { PrismaClient } from '@prisma/client';
import { executeScript } from '../utils/executeScript';
import { generateApiKey, generatePassword } from '../utils/generateSecrets';
import { sendWelcomeEmail, sendFailureNotification } from './emailService';
import { hashPassword } from './auth';

export interface SetupStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  message: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

const SETUP_STEPS = [
  'CREATE_RECORD',
  'CREATE_DATABASE',
  'RUN_MIGRATIONS',
  'SEED_DATA',
  'CREATE_ADMIN_USER',
  'SETUP_DOMAIN',
  'GENERATE_SSL',
  'GENERATE_API_KEY',
  'SEND_EMAIL',
  'MARK_ACTIVE',
];

export async function runTenantSetup(prisma: PrismaClient, tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { setup: true } });
  if (!tenant) throw new Error('Tenant not found');

  const steps: SetupStep[] = SETUP_STEPS.map((name) => ({
    name,
    status: 'pending',
    message: getStepMessage(name),
  }));

  const updateStep = async (stepName: string, status: SetupStep['status'], error?: string) => {
    const idx = steps.findIndex((s) => s.name === stepName);
    if (idx >= 0) {
      steps[idx] = {
        ...steps[idx],
        status,
        startedAt: status === 'running' ? new Date().toISOString() : steps[idx].startedAt,
        completedAt: ['done', 'failed'].includes(status) ? new Date().toISOString() : undefined,
        error,
      };
    }
    await prisma.tenantSetup.update({
      where: { tenantId },
      data: { currentStep: stepName, steps: steps as any },
    });
  };

  let temporaryPassword = '';
  let apiKey = '';

  try {
    // Step: CREATE_DATABASE
    await updateStep('CREATE_DATABASE', 'running');
    const dbResult = await executeScript('setupDB.sh', {
      TENANT_SLUG: tenant.slug,
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT || '5432',
      DB_SUPERUSER: process.env.DB_SUPERUSER || 'postgres',
      DB_SUPERPASS: process.env.DB_SUPERPASS || '',
    });
    if (dbResult.exitCode !== 0) {
      await updateStep('CREATE_DATABASE', 'failed', dbResult.stderr);
      throw new Error(`Database setup failed: ${dbResult.stderr}`);
    }
    await updateStep('CREATE_DATABASE', 'done');
    await updateStep('RUN_MIGRATIONS', 'done'); // handled inside setupDB.sh
    await updateStep('SEED_DATA', 'running');

    const seedResult = await executeScript('seedTenant.js', {
      TENANT_SLUG: tenant.slug,
      TENANT_ID: tenant.id,
    });
    if (seedResult.exitCode !== 0) {
      await updateStep('SEED_DATA', 'failed', seedResult.stderr);
      throw new Error(`Seed failed: ${seedResult.stderr}`);
    }
    await updateStep('SEED_DATA', 'done');

    // Step: CREATE_ADMIN_USER
    await updateStep('CREATE_ADMIN_USER', 'running');
    temporaryPassword = generatePassword(16);
    const passwordHash = await hashPassword(temporaryPassword);
    const userResult = await executeScript('setupUser.sh', {
      TENANT_SLUG: tenant.slug,
      ADMIN_EMAIL: tenant.adminEmail,
      ADMIN_NAME: tenant.adminName,
      PASSWORD_HASH: passwordHash,
    });
    if (userResult.exitCode !== 0) {
      await updateStep('CREATE_ADMIN_USER', 'failed', userResult.stderr);
      throw new Error(`User setup failed: ${userResult.stderr}`);
    }
    await updateStep('CREATE_ADMIN_USER', 'done');

    // Step: SETUP_DOMAIN
    await updateStep('SETUP_DOMAIN', 'running');
    const domainResult = await executeScript('setupDomain.sh', {
      TENANT_DOMAIN: tenant.domain,
      TENANT_SLUG: tenant.slug,
    });
    if (domainResult.exitCode !== 0) {
      // Domain setup failure is non-fatal in dev
      console.warn('[SetupService] Domain setup warning:', domainResult.stderr);
    }
    await updateStep('SETUP_DOMAIN', 'done');
    await updateStep('GENERATE_SSL', 'done'); // handled inside setupDomain.sh

    // Step: GENERATE_API_KEY
    await updateStep('GENERATE_API_KEY', 'running');
    const { key, hash, prefix } = generateApiKey();
    apiKey = key;
    await prisma.tenantApiKey.create({
      data: {
        tenantId: tenant.id,
        name: 'Default API Key',
        keyHash: hash,
        keyPrefix: prefix,
        permissions: ['read', 'write'],
        status: 'ACTIVE',
      },
    });
    await updateStep('GENERATE_API_KEY', 'done');

    // Step: SEND_EMAIL
    await updateStep('SEND_EMAIL', 'running');
    try {
      await sendWelcomeEmail({
        to: tenant.adminEmail,
        tenantName: tenant.name,
        adminName: tenant.adminName,
        domain: tenant.domain,
        adminEmail: tenant.adminEmail,
        temporaryPassword,
        apiKey,
      });
    } catch (emailError) {
      console.warn('[SetupService] Email sending failed (non-fatal):', emailError);
    }
    await updateStep('SEND_EMAIL', 'done');

    // Step: MARK_ACTIVE
    await updateStep('MARK_ACTIVE', 'running');
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE' },
    });
    await prisma.tenantSetup.update({
      where: { tenantId },
      data: { currentStep: 'COMPLETED', completedAt: new Date(), steps: steps as any },
    });
    await updateStep('MARK_ACTIVE', 'done');
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'FAILED' } });
    await prisma.tenantSetup.update({
      where: { tenantId },
      data: { errorMessage: message, steps: steps as any },
    });
    try {
      await executeScript('cleanup.sh', { TENANT_SLUG: tenant.slug });
    } catch (cleanupErr) {
      console.error('[SetupService] Cleanup script error:', cleanupErr);
    }
    try {
      await sendFailureNotification(tenant.adminEmail, tenant.name, message);
    } catch {}
    throw error;
  }
}

function getStepMessage(step: string): string {
  const messages: Record<string, string> = {
    CREATE_RECORD: 'Creating tenant record...',
    CREATE_DATABASE: 'Creating database...',
    RUN_MIGRATIONS: 'Running migrations...',
    SEED_DATA: 'Seeding initial data...',
    CREATE_ADMIN_USER: 'Creating admin user...',
    SETUP_DOMAIN: 'Setting up domain...',
    GENERATE_SSL: 'Generating SSL certificate...',
    GENERATE_API_KEY: 'Generating API keys...',
    SEND_EMAIL: 'Sending welcome email...',
    MARK_ACTIVE: 'Finalizing...',
  };
  return messages[step] || step;
}
