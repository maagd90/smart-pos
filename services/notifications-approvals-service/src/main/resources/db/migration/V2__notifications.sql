-- Store-manager notification inbox, email action tokens, and device registrations

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    store_id UUID NOT NULL,
    recipient_user_id UUID NOT NULL,
    kind VARCHAR(40) NOT NULL,
    ref_type VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    body VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL,
    decision VARCHAR(10),
    decided_via VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (kind, ref_type, ref_id, recipient_user_id)
);

CREATE INDEX idx_notifications_recipient_status ON notifications(recipient_user_id, status);

CREATE TABLE IF NOT EXISTS action_tokens (
    token_hash BYTEA PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id),
    recipient_user_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_tokens_notification ON action_tokens(notification_id);

CREATE TABLE IF NOT EXISTS device_registrations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL,
    platform VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, expo_push_token)
);

CREATE TABLE IF NOT EXISTS notification_decision_audit (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL,
    recipient_user_id UUID NOT NULL,
    ref_type VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    decision VARCHAR(10) NOT NULL,
    decided_via VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
