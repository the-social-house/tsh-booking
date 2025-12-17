alter table "public"."meeting_rooms" add column "meeting_room_images" text[] default '{}'::text[];


  create policy "Public read access for meeting room images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'meeting-room-images'::text));



