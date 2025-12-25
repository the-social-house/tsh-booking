create table booking_amenities (
  booking_id uuid not null references bookings (booking_id),
  amenity_id uuid not null references amenities (amenity_id),
  primary key (booking_id, amenity_id)
);