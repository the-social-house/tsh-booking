alter table "public"."meeting_rooms" add column "is_available" boolean not null default true;

alter table "public"."meeting_rooms" add column "unavailability_reason" text;

alter table "public"."meeting_rooms" add column "unavailable_end_date" date;

alter table "public"."meeting_rooms" add column "unavailable_start_date" date;


