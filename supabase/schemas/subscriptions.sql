create table subscriptions (
  subscription_id bigint primary key generated always as identity,
  subscription_name text not null unique,
  subscription_monthly_price numeric(10, 2) not null,
  subscription_max_monthly_bookings int,
  subscription_discount_rate numeric(5, 2) not null
);