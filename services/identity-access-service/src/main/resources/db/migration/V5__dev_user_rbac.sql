-- Milestone 2 follow-up: align dev user with bcrypt auth and RBAC role assignment

UPDATE users
SET password_hash = '$2b$10$Q4w9ZdMZUlDq9autaMFhy.6gN.VUOUkwOpNP/PwAc/1lbkZoEqsaa',
    platform_admin = true,
    permissions = ''
WHERE email = 'owner@example.com';

INSERT INTO user_roles (id, user_id, role_id, store_id)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '10000000-0000-0000-0000-000000000001',
    NULL
) ON CONFLICT (user_id, role_id, store_id) DO NOTHING;
