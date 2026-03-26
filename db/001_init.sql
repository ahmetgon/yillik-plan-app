-- Yillik Plan - Database Schema
-- PostgREST compatible

CREATE SCHEMA IF NOT EXISTS api;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenants (Brands/Clients)
CREATE TABLE api.tenants (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE api.users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES api.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Categories
CREATE TABLE api.categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES api.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    bg_color TEXT NOT NULL DEFAULT '#F3F4F6',
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Cards
CREATE TABLE api.cards (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES api.tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES api.categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES api.users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES api.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log
CREATE TABLE api.activity_log (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES api.users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'moved')),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cards_tenant_month ON api.cards(tenant_id, month);
CREATE INDEX idx_categories_tenant ON api.categories(tenant_id);
CREATE INDEX idx_users_tenant ON api.users(tenant_id);
CREATE INDEX idx_activity_card ON api.activity_log(card_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION api.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cards_updated_at
    BEFORE UPDATE ON api.cards
    FOR EACH ROW
    EXECUTE FUNCTION api.update_timestamp();

-- Login function (PostgREST RPC)
CREATE OR REPLACE FUNCTION api.login(email TEXT, password TEXT)
RETURNS JSON AS $$
DECLARE
    usr api.users%ROWTYPE;
    result JSON;
BEGIN
    SELECT * INTO usr FROM api.users WHERE api.users.email = login.email;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;
    IF usr.password_hash != crypt(login.password, usr.password_hash) THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;
    SELECT json_build_object(
        'token', 'jwt-placeholder',
        'user', json_build_object(
            'id', usr.id,
            'tenant_id', usr.tenant_id,
            'name', usr.name,
            'email', usr.email,
            'role', usr.role,
            'created_at', usr.created_at
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Change password function
CREATE OR REPLACE FUNCTION api.change_password(old_password TEXT, new_password TEXT)
RETURNS VOID AS $$
DECLARE
    usr api.users%ROWTYPE;
    uid INTEGER;
BEGIN
    -- In production, get user_id from JWT claim
    -- For now, this is a simplified version
    RAISE EXCEPTION 'Not implemented - use direct update with proper auth';
END;
$$ LANGUAGE plpgsql;

-- Create user function (admin only)
CREATE OR REPLACE FUNCTION api.create_user(
    tenant_id INTEGER,
    name TEXT,
    email TEXT,
    password TEXT,
    role TEXT DEFAULT 'editor'
)
RETURNS JSON AS $$
DECLARE
    new_user api.users%ROWTYPE;
BEGIN
    INSERT INTO api.users (tenant_id, name, email, password_hash, role)
    VALUES (create_user.tenant_id, create_user.name, create_user.email, crypt(create_user.password, gen_salt('bf')), create_user.role)
    RETURNING * INTO new_user;

    RETURN json_build_object(
        'id', new_user.id,
        'tenant_id', new_user.tenant_id,
        'name', new_user.name,
        'email', new_user.email,
        'role', new_user.role
    );
END;
$$ LANGUAGE plpgsql;

-- Seed: demo tenant
INSERT INTO api.tenants (slug, name, year) VALUES ('demo', 'Demo Marka', 2026);

-- Seed: default categories for demo tenant
INSERT INTO api.categories (tenant_id, name, color, bg_color, sort_order) VALUES
    (1, 'Detaylandirilmasi gereken genel baslik', '#10B981', '#D1FAE5', 1),
    (1, 'Yeni eklenen ozel gun onerileri', '#F97316', '#FFEDD5', 2),
    (1, 'Mevcut ic iletisim ve IK icerikleri', '#EF4444', '#FEE2E2', 3),
    (1, 'Ic iletisime konu edilebilir olanlar', '#3B82F6', '#DBEAFE', 4),
    (1, 'Rutin ve Operasyonel Iletisimler', '#6B7280', '#F3F4F6', 5);

-- Seed: admin user (password: admin123)
INSERT INTO api.users (tenant_id, name, email, password_hash, role)
VALUES (1, 'Admin', 'admin@demo.com', crypt('admin123', gen_salt('bf')), 'admin');
