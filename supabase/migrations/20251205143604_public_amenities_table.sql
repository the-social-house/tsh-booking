alter table "public"."amenities" drop constraint "amenities_amenity_name_key";

drop index if exists "public"."amenities_amenity_name_key";

alter table "public"."amenities" alter column "amenity_price" drop not null;


