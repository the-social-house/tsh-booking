-- ============================================================================
-- CREATE INVITES TABLE
-- ============================================================================
-- Migration: 20260104113708_create_invites_table.sql
-- Description: Creates invites table for admin-created user invites
-- Links to auth.users via invite_auth_user_id (created by inviteUserByEmail)
-- ============================================================================

create table invites (
  invite_id uuid primary key default gen_random_uuid(),
  invite_auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  invite_email text not null,
  invite_company_name text not null,
  invite_subscription_id uuid not null references subscriptions (subscription_id),
  invite_role_id uuid not null references roles (role_id),
  invite_status text not null default 'pending' check (invite_status in ('pending', 'completed', 'expired')),
  invite_created_at timestamptz default now() not null,
  invite_completed_at timestamptz -- When user completes signup
);

-- Index for fast auth user lookups
create index idx_invites_auth_user_id on invites (invite_auth_user_id);

-- Index for email lookups (to prevent duplicate invites)
create index idx_invites_email on invites (invite_email);

-- Index for status filtering
create index idx_invites_status on invites (invite_status);

