create table subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  subscription_name text not null unique,
  subscription_monthly_price numeric(10, 2) not null,
  subscription_max_monthly_bookings int,
  subscription_discount_rate numeric(5, 2) not null,
  subscription_stripe_product_id text,
  subscription_stripe_price_id text
);