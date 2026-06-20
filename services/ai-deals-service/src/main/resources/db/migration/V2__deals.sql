-- AI deals pending approval

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    store_id UUID NOT NULL,
    offer_summary VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
