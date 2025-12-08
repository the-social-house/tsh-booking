create table public.amenities (
  amenity_id bigint primary key generated always as identity,
  amenity_name text not null,
  amenity_price numeric(10, 2) null
);