create table meeting_rooms (
  meeting_room_id uuid primary key default gen_random_uuid(),
  meeting_room_name text not null unique,
  meeting_room_slug text not null unique,
  meeting_room_capacity int not null,
  meeting_room_price_per_hour numeric(10, 2) not null,
  meeting_room_size numeric(10, 2) not null,
  meeting_room_images text[] default '{}'
);
