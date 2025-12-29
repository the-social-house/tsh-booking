create table users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_company_name text not null unique,
  user_email text not null unique,
  user_created_at timestamptz default now() not null,
  user_role_id uuid not null references roles (role_id),
  user_subscription_id uuid not null references subscriptions (subscription_id),
  user_current_monthly_bookings int default 0
);