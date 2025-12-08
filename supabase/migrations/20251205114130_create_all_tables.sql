
  create table "public"."amenities" (
    "amenity_id" bigint generated always as identity not null,
    "amenity_name" text not null,
    "amenity_price" numeric(10,2) not null
      );



  create table "public"."booking_amenities" (
    "booking_id" bigint not null,
    "amenity_id" bigint not null
      );



  create table "public"."bookings" (
    "booking_id" bigint generated always as identity not null,
    "booking_user_id" bigint not null,
    "booking_meeting_room_id" bigint not null,
    "booking_start_time" timestamp with time zone not null,
    "booking_end_time" timestamp with time zone not null,
    "booking_created_at" timestamp with time zone not null default now(),
    "booking_date" date not null,
    "booking_number_of_people" integer not null,
    "booking_total_price" numeric(10,2) not null,
    "booking_discount" numeric(5,2) default 0,
    "booking_payment_status" text not null default 'pending'::text,
    "booking_stripe_transaction_id" text,
    "booking_receipt_url" text
      );



  create table "public"."meeting_room_amenities" (
    "meeting_room_id" bigint not null,
    "amenity_id" bigint not null
      );



  create table "public"."meeting_rooms" (
    "meeting_room_id" bigint generated always as identity not null,
    "meeting_room_name" text not null,
    "meeting_room_capacity" integer not null,
    "meeting_room_price_per_hour" numeric(10,2) not null,
    "meeting_room_size" numeric(10,2) not null
      );



  create table "public"."roles" (
    "role_id" bigint generated always as identity not null,
    "role_name" text not null
      );



  create table "public"."subscriptions" (
    "subscription_id" bigint generated always as identity not null,
    "subscription_name" text not null,
    "subscription_monthly_price" numeric(10,2) not null,
    "subscription_max_monthly_bookings" integer,
    "subscription_discount_rate" numeric(5,2) not null
      );



  create table "public"."users" (
    "user_id" bigint generated always as identity not null,
    "user_username" text not null,
    "user_email" text not null,
    "user_password" text not null,
    "user_created_at" timestamp with time zone not null default now(),
    "user_role_id" bigint not null,
    "user_subscription_id" bigint not null,
    "user_current_monthly_bookings" integer default 0
      );


CREATE UNIQUE INDEX amenities_amenity_name_key ON public.amenities USING btree (amenity_name);

CREATE UNIQUE INDEX amenities_pkey ON public.amenities USING btree (amenity_id);

CREATE UNIQUE INDEX booking_amenities_pkey ON public.booking_amenities USING btree (booking_id, amenity_id);

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (booking_id);

CREATE UNIQUE INDEX meeting_room_amenities_pkey ON public.meeting_room_amenities USING btree (meeting_room_id, amenity_id);

CREATE UNIQUE INDEX meeting_rooms_meeting_room_name_key ON public.meeting_rooms USING btree (meeting_room_name);

CREATE UNIQUE INDEX meeting_rooms_pkey ON public.meeting_rooms USING btree (meeting_room_id);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (role_id);

CREATE UNIQUE INDEX roles_role_name_key ON public.roles USING btree (role_name);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (subscription_id);

CREATE UNIQUE INDEX subscriptions_subscription_name_key ON public.subscriptions USING btree (subscription_name);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (user_id);

CREATE UNIQUE INDEX users_user_email_key ON public.users USING btree (user_email);

CREATE UNIQUE INDEX users_user_username_key ON public.users USING btree (user_username);

alter table "public"."amenities" add constraint "amenities_pkey" PRIMARY KEY using index "amenities_pkey";

alter table "public"."booking_amenities" add constraint "booking_amenities_pkey" PRIMARY KEY using index "booking_amenities_pkey";

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."meeting_room_amenities" add constraint "meeting_room_amenities_pkey" PRIMARY KEY using index "meeting_room_amenities_pkey";

alter table "public"."meeting_rooms" add constraint "meeting_rooms_pkey" PRIMARY KEY using index "meeting_rooms_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."amenities" add constraint "amenities_amenity_name_key" UNIQUE using index "amenities_amenity_name_key";

alter table "public"."booking_amenities" add constraint "booking_amenities_amenity_id_fkey" FOREIGN KEY (amenity_id) REFERENCES public.amenities(amenity_id) not valid;

alter table "public"."booking_amenities" validate constraint "booking_amenities_amenity_id_fkey";

alter table "public"."booking_amenities" add constraint "booking_amenities_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) not valid;

alter table "public"."booking_amenities" validate constraint "booking_amenities_booking_id_fkey";

alter table "public"."bookings" add constraint "bookings_booking_meeting_room_id_fkey" FOREIGN KEY (booking_meeting_room_id) REFERENCES public.meeting_rooms(meeting_room_id) not valid;

alter table "public"."bookings" validate constraint "bookings_booking_meeting_room_id_fkey";

alter table "public"."bookings" add constraint "bookings_booking_user_id_fkey" FOREIGN KEY (booking_user_id) REFERENCES public.users(user_id) not valid;

alter table "public"."bookings" validate constraint "bookings_booking_user_id_fkey";

alter table "public"."meeting_room_amenities" add constraint "meeting_room_amenities_amenity_id_fkey" FOREIGN KEY (amenity_id) REFERENCES public.amenities(amenity_id) not valid;

alter table "public"."meeting_room_amenities" validate constraint "meeting_room_amenities_amenity_id_fkey";

alter table "public"."meeting_room_amenities" add constraint "meeting_room_amenities_meeting_room_id_fkey" FOREIGN KEY (meeting_room_id) REFERENCES public.meeting_rooms(meeting_room_id) not valid;

alter table "public"."meeting_room_amenities" validate constraint "meeting_room_amenities_meeting_room_id_fkey";

alter table "public"."meeting_rooms" add constraint "meeting_rooms_meeting_room_name_key" UNIQUE using index "meeting_rooms_meeting_room_name_key";

alter table "public"."roles" add constraint "roles_role_name_key" UNIQUE using index "roles_role_name_key";

alter table "public"."subscriptions" add constraint "subscriptions_subscription_name_key" UNIQUE using index "subscriptions_subscription_name_key";

alter table "public"."users" add constraint "users_user_email_key" UNIQUE using index "users_user_email_key";

alter table "public"."users" add constraint "users_user_role_id_fkey" FOREIGN KEY (user_role_id) REFERENCES public.roles(role_id) not valid;

alter table "public"."users" validate constraint "users_user_role_id_fkey";

alter table "public"."users" add constraint "users_user_subscription_id_fkey" FOREIGN KEY (user_subscription_id) REFERENCES public.subscriptions(subscription_id) not valid;

alter table "public"."users" validate constraint "users_user_subscription_id_fkey";

alter table "public"."users" add constraint "users_user_username_key" UNIQUE using index "users_user_username_key";

grant delete on table "public"."amenities" to "anon";

grant insert on table "public"."amenities" to "anon";

grant references on table "public"."amenities" to "anon";

grant select on table "public"."amenities" to "anon";

grant trigger on table "public"."amenities" to "anon";

grant truncate on table "public"."amenities" to "anon";

grant update on table "public"."amenities" to "anon";

grant delete on table "public"."amenities" to "authenticated";

grant insert on table "public"."amenities" to "authenticated";

grant references on table "public"."amenities" to "authenticated";

grant select on table "public"."amenities" to "authenticated";

grant trigger on table "public"."amenities" to "authenticated";

grant truncate on table "public"."amenities" to "authenticated";

grant update on table "public"."amenities" to "authenticated";

grant delete on table "public"."amenities" to "service_role";

grant insert on table "public"."amenities" to "service_role";

grant references on table "public"."amenities" to "service_role";

grant select on table "public"."amenities" to "service_role";

grant trigger on table "public"."amenities" to "service_role";

grant truncate on table "public"."amenities" to "service_role";

grant update on table "public"."amenities" to "service_role";

grant delete on table "public"."booking_amenities" to "anon";

grant insert on table "public"."booking_amenities" to "anon";

grant references on table "public"."booking_amenities" to "anon";

grant select on table "public"."booking_amenities" to "anon";

grant trigger on table "public"."booking_amenities" to "anon";

grant truncate on table "public"."booking_amenities" to "anon";

grant update on table "public"."booking_amenities" to "anon";

grant delete on table "public"."booking_amenities" to "authenticated";

grant insert on table "public"."booking_amenities" to "authenticated";

grant references on table "public"."booking_amenities" to "authenticated";

grant select on table "public"."booking_amenities" to "authenticated";

grant trigger on table "public"."booking_amenities" to "authenticated";

grant truncate on table "public"."booking_amenities" to "authenticated";

grant update on table "public"."booking_amenities" to "authenticated";

grant delete on table "public"."booking_amenities" to "service_role";

grant insert on table "public"."booking_amenities" to "service_role";

grant references on table "public"."booking_amenities" to "service_role";

grant select on table "public"."booking_amenities" to "service_role";

grant trigger on table "public"."booking_amenities" to "service_role";

grant truncate on table "public"."booking_amenities" to "service_role";

grant update on table "public"."booking_amenities" to "service_role";

grant delete on table "public"."bookings" to "anon";

grant insert on table "public"."bookings" to "anon";

grant references on table "public"."bookings" to "anon";

grant select on table "public"."bookings" to "anon";

grant trigger on table "public"."bookings" to "anon";

grant truncate on table "public"."bookings" to "anon";

grant update on table "public"."bookings" to "anon";

grant delete on table "public"."bookings" to "authenticated";

grant insert on table "public"."bookings" to "authenticated";

grant references on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant trigger on table "public"."bookings" to "authenticated";

grant truncate on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."bookings" to "service_role";

grant insert on table "public"."bookings" to "service_role";

grant references on table "public"."bookings" to "service_role";

grant select on table "public"."bookings" to "service_role";

grant trigger on table "public"."bookings" to "service_role";

grant truncate on table "public"."bookings" to "service_role";

grant update on table "public"."bookings" to "service_role";

grant delete on table "public"."meeting_room_amenities" to "anon";

grant insert on table "public"."meeting_room_amenities" to "anon";

grant references on table "public"."meeting_room_amenities" to "anon";

grant select on table "public"."meeting_room_amenities" to "anon";

grant trigger on table "public"."meeting_room_amenities" to "anon";

grant truncate on table "public"."meeting_room_amenities" to "anon";

grant update on table "public"."meeting_room_amenities" to "anon";

grant delete on table "public"."meeting_room_amenities" to "authenticated";

grant insert on table "public"."meeting_room_amenities" to "authenticated";

grant references on table "public"."meeting_room_amenities" to "authenticated";

grant select on table "public"."meeting_room_amenities" to "authenticated";

grant trigger on table "public"."meeting_room_amenities" to "authenticated";

grant truncate on table "public"."meeting_room_amenities" to "authenticated";

grant update on table "public"."meeting_room_amenities" to "authenticated";

grant delete on table "public"."meeting_room_amenities" to "service_role";

grant insert on table "public"."meeting_room_amenities" to "service_role";

grant references on table "public"."meeting_room_amenities" to "service_role";

grant select on table "public"."meeting_room_amenities" to "service_role";

grant trigger on table "public"."meeting_room_amenities" to "service_role";

grant truncate on table "public"."meeting_room_amenities" to "service_role";

grant update on table "public"."meeting_room_amenities" to "service_role";

grant delete on table "public"."meeting_rooms" to "anon";

grant insert on table "public"."meeting_rooms" to "anon";

grant references on table "public"."meeting_rooms" to "anon";

grant select on table "public"."meeting_rooms" to "anon";

grant trigger on table "public"."meeting_rooms" to "anon";

grant truncate on table "public"."meeting_rooms" to "anon";

grant update on table "public"."meeting_rooms" to "anon";

grant delete on table "public"."meeting_rooms" to "authenticated";

grant insert on table "public"."meeting_rooms" to "authenticated";

grant references on table "public"."meeting_rooms" to "authenticated";

grant select on table "public"."meeting_rooms" to "authenticated";

grant trigger on table "public"."meeting_rooms" to "authenticated";

grant truncate on table "public"."meeting_rooms" to "authenticated";

grant update on table "public"."meeting_rooms" to "authenticated";

grant delete on table "public"."meeting_rooms" to "service_role";

grant insert on table "public"."meeting_rooms" to "service_role";

grant references on table "public"."meeting_rooms" to "service_role";

grant select on table "public"."meeting_rooms" to "service_role";

grant trigger on table "public"."meeting_rooms" to "service_role";

grant truncate on table "public"."meeting_rooms" to "service_role";

grant update on table "public"."meeting_rooms" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


