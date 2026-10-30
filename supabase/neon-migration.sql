-- ============================================================
-- NEON MIGRATION SCRIPT
-- Run this in your Neon database BEFORE deploying the app.
-- This sets up Better Auth tables and fixes Supabase-specific schema.
-- ============================================================

-- ── 1. Better Auth tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user" (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image           TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id              TEXT PRIMARY KEY,
  "expiresAt"     TIMESTAMPTZ NOT NULL,
  token           TEXT NOT NULL UNIQUE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress"     TEXT,
  "userAgent"     TEXT,
  "userId"        TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id                       TEXT PRIMARY KEY,
  "accountId"              TEXT NOT NULL,
  "providerId"             TEXT NOT NULL,
  "userId"                 TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"            TEXT,
  "refreshToken"           TEXT,
  "idToken"                TEXT,
  "accessTokenExpiresAt"   TIMESTAMPTZ,
  "refreshTokenExpiresAt"  TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ
);

-- ── 2. Fix profiles table (remove Supabase auth.users FK) ─────────────────────
-- The original schema has: id UUID REFERENCES auth.users(id)
-- In Neon there is no auth schema, so we recreate profiles without that FK.

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY,   -- matches Better Auth UUID (crypto.randomUUID)
  full_name     TEXT NOT NULL DEFAULT 'Business Owner',
  email         TEXT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  date_of_birth DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Disable RLS (application-level auth replaces it) ───────────────────────
-- If you copied the schema from Supabase, you may need to disable RLS:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- ── 4. Run your existing schema.sql AFTER this file ──────────────────────────
-- Then run all *_migration.sql files to add feature tables.

-- ── 5. Remove Supabase-specific functions (safe to ignore if they error) ──────
-- DROP FUNCTION IF EXISTS auth.uid();
-- DROP FUNCTION IF EXISTS auth.role();

-- ============================================================
-- ENV VARS NEEDED IN .env.local
-- ============================================================
-- DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
-- BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
-- NEXT_PUBLIC_APP_URL=https://yourdomain.com (or http://localhost:3000)
-- GOOGLE_CLIENT_ID=<from Google Cloud Console>
-- GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
-- RESEND_API_KEY=<already in your .env>
--
-- REMOVE these Supabase vars (no longer needed):
-- NEXT_PUBLIC_SUPABASE_URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY
-- SUPABASE_SERVICE_ROLE_KEY
