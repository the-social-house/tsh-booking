create table users (
  user_id bigint primary key generated always as identity,
  user_username text not null unique,
  user_email text not null unique,
  user_password text not null,
  user_created_at timestamptz default now() not null,
  user_role_id bigint not null references roles (role_id),
  user_subscription_id bigint not null references subscriptions (subscription_id),
  user_current_monthly_bookings int default 0
);