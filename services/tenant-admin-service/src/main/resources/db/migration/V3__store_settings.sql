-- Store operational settings

CREATE TABLE IF NOT EXISTS store_settings (
    store_id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    opening_time VARCHAR(10) NOT NULL DEFAULT '09:00',
    closing_time VARCHAR(10) NOT NULL DEFAULT '22:00',
    timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Dubai',
    monthly_rent NUMERIC(12,2) NOT NULL DEFAULT 0,
    default_markup_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
