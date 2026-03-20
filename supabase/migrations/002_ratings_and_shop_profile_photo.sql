-- Triple feedback: app + seller (existing stars) + item
alter table public.ratings
  add column if not exists app_stars integer,
  add column if not exists item_stars integer;

update public.ratings
set app_stars = stars, item_stars = stars
where app_stars is null;

alter table public.ratings
  alter column app_stars set not null,
  alter column item_stars set not null;

alter table public.ratings
  add constraint ratings_app_stars_check check (app_stars >= 1 and app_stars <= 5),
  add constraint ratings_item_stars_check check (item_stars >= 1 and item_stars <= 5);

-- Align DB with seller shop UI (profile photo on shop)
alter table public.shops
  add column if not exists profile_photo_url text;
