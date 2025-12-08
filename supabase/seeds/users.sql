-- Seed data for users table
-- 10 users with references to roles and subscriptions

INSERT INTO users (user_username, user_email, user_password, user_role_id, user_subscription_id, user_current_monthly_bookings) VALUES
  ('admin_user', 'admin@example.com', '$2a$10$example_hashed_password_1', 1, 3, 0),
  ('john_doe', 'john.doe@example.com', '$2a$10$example_hashed_password_2', 2, 2, 3),
  ('jane_smith', 'jane.smith@example.com', '$2a$10$example_hashed_password_3', 2, 2, 5),
  ('bob_wilson', 'bob.wilson@example.com', '$2a$10$example_hashed_password_4', 2, 1, 2),
  ('alice_brown', 'alice.brown@example.com', '$2a$10$example_hashed_password_5', 2, 3, 8),
  ('charlie_davis', 'charlie.davis@example.com', '$2a$10$example_hashed_password_6', 2, 1, 1),
  ('diana_miller', 'diana.miller@example.com', '$2a$10$example_hashed_password_7', 2, 2, 7),
  ('edward_jones', 'edward.jones@example.com', '$2a$10$example_hashed_password_8', 2, 1, 0),
  ('fiona_taylor', 'fiona.taylor@example.com', '$2a$10$example_hashed_password_9', 2, 3, 12),
  ('george_anderson', 'george.anderson@example.com', '$2a$10$example_hashed_password_10', 2, 2, 4);

