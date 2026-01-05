-- ============================================================================
-- INVITES TABLE
-- ============================================================================
-- Stores user invites created by admins before user signup
-- Invites contain encrypted tokens that expire after 24 hours
-- ============================================================================

create table invites (
  invite_id uuid primary key default gen_random_uuid(),
  invite_email text not null,
  invite_company_name text not null,
  invite_subscription_id uuid not null references subscriptions (subscription_id),
  invite_role_id uuid not null references roles (role_id),
  invite_token text not null unique, -- JWT token for secure access
  invite_status text not null default 'pending' check (invite_status in ('pending', 'completed', 'expired')),
  invite_expires_at timestamptz not null, -- 24 hours from creation
  invite_created_at timestamptz default now() not null,
  invite_completed_at timestamptz -- When user completes signup
);

-- Index for fast token lookups
create index idx_invites_token on invites (invite_token);

-- Index for email lookups (to prevent duplicate invites)
create index idx_invites_email on invites (invite_email);

-- Index for status filtering
create index idx_invites_status on invites (invite_status);

