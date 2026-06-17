-- Milestone 1: Daily report cache (optional, aggregation done from source services)
-- This table can be used to cache computed reports for performance.

CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    report_date DATE NOT NULL,
    gross_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
    refunds NUMERIC(12,2) NOT NULL DEFAULT 0,
    gross_profit NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(store_id, report_date)
);

CREATE INDEX idx_daily_reports_store_date ON daily_reports(store_id, report_date);
