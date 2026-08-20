alter table public.app_users
  drop constraint app_users_login_id_format,
  add constraint app_users_login_id_format
    check (login_id ~ '^[a-z0-9]{3,20}$');
