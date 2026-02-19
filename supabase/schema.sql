-- BlendWise Nutrition Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- Enable Row Level Security on all tables
-- Users can only access their own data

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  subscription_tier integer default 1, -- 1=Clinical, 2=Automation, 3=Full
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- ASSESSMENTS
-- ============================================
create table if not exists public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  diagnosis text,
  tube_type text,
  tube_placement_date date,
  current_formula text,
  feeding_schedule text,
  daily_volume text,
  gi_symptoms text[] default '{}',
  gi_notes text,
  allergies text,
  intolerances text,
  dietary_preferences text[] default '{}',
  dietary_notes text,
  has_blender boolean default false,
  blender_type text,
  has_food_storage boolean default false,
  has_kitchen_scale boolean default false,
  feeding_goal text,
  additional_notes text,
  payment_method text,
  insurance_provider text,
  status text default 'submitted', -- submitted, reviewed, approved
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.assessments enable row level security;
create policy "Users can view own assessments" on public.assessments for select using (auth.uid() = user_id);
create policy "Users can insert own assessments" on public.assessments for insert with check (auth.uid() = user_id);
create policy "Users can update own assessments" on public.assessments for update using (auth.uid() = user_id);

-- ============================================
-- NUTRIENT TARGETS (ENN)
-- ============================================
create table if not exists public.nutrient_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  calories_min integer,
  calories_max integer,
  protein_min integer,
  protein_max integer,
  carbs_min integer,
  carbs_max integer,
  fat_min integer,
  fat_max integer,
  fiber_min integer,
  fiber_max integer,
  fluids_min integer,
  fluids_max integer,
  feeding_schedule text,
  safety_notes text,
  rd_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nutrient_targets enable row level security;
create policy "Users can view own targets" on public.nutrient_targets for select using (auth.uid() = user_id);

-- ============================================
-- SYMPTOM LOGS
-- ============================================
create table if not exists public.symptom_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date,
  weight numeric(5,1),
  symptoms text[] default '{}',
  severity integer default 1, -- 1=mild, 2=moderate, 3=severe
  intake_completed boolean default true,
  notes text,
  created_at timestamptz default now()
);

alter table public.symptom_logs enable row level security;
create policy "Users can view own logs" on public.symptom_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.symptom_logs for insert with check (auth.uid() = user_id);

-- ============================================
-- GROCERY LISTS
-- ============================================
create table if not exists public.grocery_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start date,
  items jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.grocery_lists enable row level security;
create policy "Users can view own lists" on public.grocery_lists for select using (auth.uid() = user_id);
create policy "Users can insert own lists" on public.grocery_lists for insert with check (auth.uid() = user_id);
create policy "Users can update own lists" on public.grocery_lists for update using (auth.uid() = user_id);

-- ============================================
-- RECIPES (saved/favorited by user)
-- ============================================
create table if not exists public.saved_recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  recipe_name text not null,
  ingredients jsonb default '[]',
  instructions text,
  calories integer,
  protein integer,
  volume_ml integer,
  prep_time text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

alter table public.saved_recipes enable row level security;
create policy "Users can view own recipes" on public.saved_recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.saved_recipes for insert with check (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.saved_recipes for delete using (auth.uid() = user_id);
