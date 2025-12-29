create table room_unavailabilities (
  unavailability_id uuid primary key default gen_random_uuid(),
  meeting_room_id uuid not null references meeting_rooms (meeting_room_id) on delete cascade,
  unavailable_start_date date not null,
  unavailable_end_date date not null,
  unavailability_reason text,
  constraint valid_date_range check (unavailable_end_date >= unavailable_start_date)
);

