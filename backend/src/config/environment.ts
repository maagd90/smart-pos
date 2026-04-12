import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function boolEnv(name: string, defaultValue: boolean): boolean {
  const val = process.env[name];
  if (val === undefined || val === '') return defaultValue;
  return val.toLowerCase() === 'true';
}

export const env = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',

  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),

  databaseUrl: requireEnv('DATABASE_URL'),

  features: {
    aiEnabled: boolEnv('AI_ENABLED', false),
    whatsappEnabled: boolEnv('WHATSAPP_ENABLED', false),
    smsEnabled: boolEnv('SMS_ENABLED', false),
    emailEnabled: boolEnv('EMAIL_ENABLED', false),
    dynamicPricingEnabled: boolEnv('DYNAMIC_PRICING_ENABLED', false),
    inventoryForecastingEnabled: boolEnv('INVENTORY_FORECASTING_ENABLED', false),
    adminPortalEnabled: boolEnv('ADMIN_PORTAL_ENABLED', true),
  },

  llm: {
    type: optionalEnv('LLM_TYPE', 'openai') as 'openai' | 'ollama',
    openaiApiKey: process.env['OPENAI_API_KEY'],
    ollamaBaseUrl: optionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
    ollamaModel: optionalEnv('OLLAMA_MODEL', 'llama2'),
  },

  twilio: {
    accountSid: process.env['TWILIO_ACCOUNT_SID'],
    authToken: process.env['TWILIO_AUTH_TOKEN'],
    whatsappNumber: process.env['TWILIO_WHATSAPP_NUMBER'],
    smsFrom: process.env['TWILIO_SMS_FROM'],
  },

  admin: {
    secretKey: optionalEnv('ADMIN_SECRET_KEY', 'admin-secret-key'),
  },

  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
} as const;

export type Env = typeof env;
