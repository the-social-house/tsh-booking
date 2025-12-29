create table meeting_room_amenities (
  meeting_room_id uuid references meeting_rooms (meeting_room_id),
  amenity_id uuid references amenities (amenity_id),
  primary key (meeting_room_id, amenity_id)
);