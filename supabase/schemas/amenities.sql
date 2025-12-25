create table public.amenities (
  amenity_id uuid primary key default gen_random_uuid(),
  amenity_name text not null,
  amenity_price numeric(10, 2) null
);