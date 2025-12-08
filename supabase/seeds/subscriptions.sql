-- Seed data for subscriptions table

INSERT INTO subscriptions (subscription_name, subscription_monthly_price, subscription_max_monthly_bookings, subscription_discount_rate) VALUES
  ('Basic', 0.00, 5, 0.00),
  ('Premium', 29.99, 20, 10.00),
  ('Enterprise', 99.99, NULL, 20.00);

