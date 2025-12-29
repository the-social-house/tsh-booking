alter table "public"."users" drop constraint "users_user_username_key";

drop index if exists "public"."users_user_username_key";

alter table "public"."users" drop column "user_username";

alter table "public"."users" add column "user_company_name" text not null;

CREATE UNIQUE INDEX users_user_company_name_key ON public.users USING btree (user_company_name);

alter table "public"."users" add constraint "users_user_company_name_key" UNIQUE using index "users_user_company_name_key";


