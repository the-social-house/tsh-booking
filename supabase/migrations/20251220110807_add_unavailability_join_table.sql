
  create table "public"."room_unavailabilities" (
    "unavailability_id" bigint generated always as identity not null,
    "meeting_room_id" bigint not null,
    "unavailable_start_date" date not null,
    "unavailable_end_date" date not null,
    "unavailability_reason" text
      );


CREATE UNIQUE INDEX room_unavailabilities_pkey ON public.room_unavailabilities USING btree (unavailability_id);

alter table "public"."room_unavailabilities" add constraint "room_unavailabilities_pkey" PRIMARY KEY using index "room_unavailabilities_pkey";

alter table "public"."room_unavailabilities" add constraint "room_unavailabilities_meeting_room_id_fkey" FOREIGN KEY (meeting_room_id) REFERENCES public.meeting_rooms(meeting_room_id) ON DELETE CASCADE not valid;

alter table "public"."room_unavailabilities" validate constraint "room_unavailabilities_meeting_room_id_fkey";

alter table "public"."room_unavailabilities" add constraint "valid_date_range" CHECK ((unavailable_end_date >= unavailable_start_date)) not valid;

alter table "public"."room_unavailabilities" validate constraint "valid_date_range";

grant delete on table "public"."room_unavailabilities" to "anon";

grant insert on table "public"."room_unavailabilities" to "anon";

grant references on table "public"."room_unavailabilities" to "anon";

grant select on table "public"."room_unavailabilities" to "anon";

grant trigger on table "public"."room_unavailabilities" to "anon";

grant truncate on table "public"."room_unavailabilities" to "anon";

grant update on table "public"."room_unavailabilities" to "anon";

grant delete on table "public"."room_unavailabilities" to "authenticated";

grant insert on table "public"."room_unavailabilities" to "authenticated";

grant references on table "public"."room_unavailabilities" to "authenticated";

grant select on table "public"."room_unavailabilities" to "authenticated";

grant trigger on table "public"."room_unavailabilities" to "authenticated";

grant truncate on table "public"."room_unavailabilities" to "authenticated";

grant update on table "public"."room_unavailabilities" to "authenticated";

grant delete on table "public"."room_unavailabilities" to "service_role";

grant insert on table "public"."room_unavailabilities" to "service_role";

grant references on table "public"."room_unavailabilities" to "service_role";

grant select on table "public"."room_unavailabilities" to "service_role";

grant trigger on table "public"."room_unavailabilities" to "service_role";

grant truncate on table "public"."room_unavailabilities" to "service_role";

grant update on table "public"."room_unavailabilities" to "service_role";


