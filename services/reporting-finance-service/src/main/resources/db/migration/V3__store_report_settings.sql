-- Store report delivery settings

CREATE TABLE IF NOT EXISTS store_report_settings (
    store_id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    channel VARCHAR(40) NOT NULL DEFAULT 'email',
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    send_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Dubai',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
