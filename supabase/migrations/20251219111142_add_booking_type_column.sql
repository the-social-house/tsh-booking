-- Add booking_is_type_of_booking column to bookings table
-- This column distinguishes between actual bookings and buffer slots (30 min after each booking)
alter table "public"."bookings" 
  add column "booking_is_type_of_booking" text not null default 'booking';

-- Add check constraint to ensure valid booking types
-- 'booking' = actual booking, 'buffer' = 30-minute buffer slot after a booking
alter table "public"."bookings"
  add constraint "bookings_booking_is_type_of_booking_check" 
  check (
    booking_is_type_of_booking in ('booking', 'buffer')
  );

-- Remove default after adding constraint (so future inserts must specify)
alter table "public"."bookings"
  alter column "booking_is_type_of_booking" drop default;

