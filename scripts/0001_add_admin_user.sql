
INSERT INTO "users" (id, name, email, password, role, "email_verified", "created_at", "updated_at")
VALUES
(
    'cl_admin_00001', 
    'Administrator', 
    'admin@itangbao.top', 
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 
    'admin',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
-- 如果邮箱已存在，则什么都不做，防止重复插入导致报错
ON CONFLICT(email) DO NOTHING;