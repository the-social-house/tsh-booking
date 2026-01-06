-- 1) Add the new column as nullable so existing rows don't violate NOT NULL
alter table "public"."meeting_rooms" add column "meeting_room_slug" text;

-- 2) Backfill existing rows with a slug derived from the meeting_room_name
update "public"."meeting_rooms"
set "meeting_room_slug" = lower(regexp_replace(meeting_room_name, '\s+', '-', 'g'))
where "meeting_room_slug" is null;

-- 3) Now enforce NOT NULL once all existing rows are populated
alter table "public"."meeting_rooms"
alter column "meeting_room_slug" set not null;

CREATE UNIQUE INDEX meeting_rooms_meeting_room_slug_key ON public.meeting_rooms USING btree (meeting_room_slug);

alter table "public"."meeting_rooms" add constraint "meeting_rooms_meeting_room_slug_key" UNIQUE using index "meeting_rooms_meeting_room_slug_key";


