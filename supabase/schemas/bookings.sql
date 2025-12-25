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