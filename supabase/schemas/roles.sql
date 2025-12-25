create table roles (
  role_id uuid primary key default gen_random_uuid(),
  role_name text not null unique
);