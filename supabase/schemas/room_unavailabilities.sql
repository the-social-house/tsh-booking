create table room_unavailabilities (
  unavailability_id bigint primary key generated always as identity,
  meeting_room_id bigint not null references meeting_rooms (meeting_room_id) on delete cascade,
  unavailable_start_date date not null,
  unavailable_end_date date not null,
  unavailability_reason text,
  constraint valid_date_range check (unavailable_end_date >= unavailable_start_date)
);

