create table roles (
  role_id bigint primary key generated always as identity,
  role_name text not null unique
);