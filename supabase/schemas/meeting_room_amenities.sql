create table meeting_room_amenities (
  meeting_room_id bigint references meeting_rooms (meeting_room_id),
  amenity_id bigint references amenities (amenity_id),
  primary key (meeting_room_id, amenity_id)
);