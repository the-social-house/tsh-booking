alter table "public"."meeting_rooms" add column "meeting_room_slug" text not null;

CREATE UNIQUE INDEX meeting_rooms_meeting_room_slug_key ON public.meeting_rooms USING btree (meeting_room_slug);

alter table "public"."meeting_rooms" add constraint "meeting_rooms_meeting_room_slug_key" UNIQUE using index "meeting_rooms_meeting_room_slug_key";


