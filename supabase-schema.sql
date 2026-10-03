-- Database voor Mijn Kookboek
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  servings integer default 4,
  time_minutes integer,
  source_url text,
  image_url text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  notes text,
  favorite boolean not null default false,
  made boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists meal_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  recipe_id uuid not null references recipes(id) on delete cascade
);

alter table recipes enable row level security;
alter table shopping_items enable row level security;
alter table meal_plan enable row level security;

create policy "own recipes" on recipes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own shopping" on shopping_items for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own plan" on meal_plan for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Realtime voor automatische updates op andere toestellen.
-- Als deze tabellen al in de publication staan, kun je deze 3 regels overslaan.
alter publication supabase_realtime add table public.recipes;
alter publication supabase_realtime add table public.shopping_items;
alter publication supabase_realtime add table public.meal_plan;
