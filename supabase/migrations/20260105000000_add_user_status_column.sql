-- Add user_status column to users table
alter table users
  add column user_status text not null default 'pending' check (user_status in ('pending', 'active', 'banned'));


