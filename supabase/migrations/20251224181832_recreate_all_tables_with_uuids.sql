-- Recreate all tables with UUIDs
-- This migration drops all existing tables and recreates them
-- with UUID primary keys and proper foreign key relationships

-- ============================================================================
-- DROP EXISTING TABLES (reverse order of dependencies)
-- ============================================================================

-- Drop junction tables first
drop table if exists booking_amenities cascade;
drop table if exists meeting_room_amenities cascade;

-- Drop tables with foreign keys
drop table if exists bookings cascade;
drop table if exists users cascade;

-- Drop base tables
drop table if exists roles cascade;
drop table if exists subscriptions cascade;
drop table if exists amenities cascade;
drop table if exists meeting_rooms cascade;

-- ============================================================================
-- BASE TABLES (no foreign key dependencies)
-- ============================================================================

-- Roles table
create table roles (
  role_id uuid primary key default gen_random_uuid(),
  role_name text not null unique
);

-- Subscriptions table
create table subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  subscription_name text not null unique,
  subscription_monthly_price numeric(10, 2) not null,
  subscription_max_monthly_bookings int,
  subscription_discount_rate numeric(5, 2) not null
);

-- Amenities table
create table public.amenities (
  amenity_id uuid primary key default gen_random_uuid(),
  amenity_name text not null,
  amenity_price numeric(10, 2) null
);

-- Meeting rooms table
create table meeting_rooms (
  meeting_room_id uuid primary key default gen_random_uuid(),
  meeting_room_name text not null unique,
  meeting_room_capacity int not null,
  meeting_room_price_per_hour numeric(10, 2) not null,
  meeting_room_size numeric(10, 2) not null,
  meeting_room_images text[] default '{}'
);

-- ============================================================================
-- TABLES WITH FOREIGN KEYS
-- ============================================================================

-- Users table (references roles, subscriptions, and auth.users)
create table users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_username text not null unique,
  user_email text not null unique,
  user_created_at timestamptz default now() not null,
  user_role_id uuid not null references roles (role_id),
  user_subscription_id uuid not null references subscriptions (subscription_id),
  user_current_monthly_bookings int default 0
);

-- Bookings table (references users and meeting_rooms)
create table bookings (
  booking_id uuid primary key default gen_random_uuid(),
  booking_user_id uuid not null references users (user_id),
  booking_meeting_room_id uuid not null references meeting_rooms (meeting_room_id),
  booking_start_time timestamptz not null,
  booking_end_time timestamptz not null,
  booking_created_at timestamptz default now() not null,
  booking_date date not null,
  booking_is_type_of_booking text not null,
  booking_number_of_people int not null,
  booking_total_price numeric(10, 2) not null,
  booking_discount numeric(5, 2) default 0,
  booking_payment_status text not null default 'pending',
  booking_stripe_transaction_id text,
  booking_receipt_url text
);

-- ============================================================================
-- JUNCTION TABLES
-- ============================================================================

-- Booking amenities junction table
create table booking_amenities (
  booking_id uuid not null references bookings (booking_id),
  amenity_id uuid not null references amenities (amenity_id),
  primary key (booking_id, amenity_id)
);

-- Meeting room amenities junction table
create table meeting_room_amenities (
  meeting_room_id uuid references meeting_rooms (meeting_room_id),
  amenity_id uuid references amenities (amenity_id),
  primary key (meeting_room_id, amenity_id)
);


