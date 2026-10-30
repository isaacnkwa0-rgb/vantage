alter table businesses
  add column if not exists store_banner_url text,
  add column if not exists store_welcome_text text;
