-- ============================================
-- RD Portal Migration
-- Adds role-based access, RD profiles, patient assignments,
-- and RLS policies for RD access to patient data.
-- ============================================

-- 1. Add role and email columns to profiles
alter table public.profiles
  add column if not exists role text not null default 'patient'
    check (role in ('patient', 'rd', 'admin')),
  add column if not exists email text;

-- 2. RD Profiles — license info, specializations, availability
create table if not exists public.rd_profiles (
  id uuid references public.profiles on delete cascade primary key,
  license_number text,
  license_state text,
  specializations text[] default '{}',
  bio text,
  accepting_patients boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.rd_profiles enable row level security;

create policy "RDs can view own rd_profile"
  on public.rd_profiles for select
  using (auth.uid() = id);

create policy "RDs can update own rd_profile"
  on public.rd_profiles for update
  using (auth.uid() = id);

create policy "RDs can insert own rd_profile"
  on public.rd_profiles for insert
  with check (auth.uid() = id);

-- 3. RD-Patient Assignments — junction table
create table if not exists public.rd_patient_assignments (
  id uuid default gen_random_uuid() primary key,
  rd_id uuid references public.profiles(id) on delete cascade not null,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'paused', 'discharged')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (rd_id, patient_id)
);

alter table public.rd_patient_assignments enable row level security;

-- RDs can see their own assignments
create policy "RDs can view own assignments"
  on public.rd_patient_assignments for select
  using (auth.uid() = rd_id);

-- RDs can insert assignments (assign patients to themselves)
create policy "RDs can insert assignments"
  on public.rd_patient_assignments for insert
  with check (auth.uid() = rd_id);

-- RDs can update their own assignments (change status)
create policy "RDs can update own assignments"
  on public.rd_patient_assignments for update
  using (auth.uid() = rd_id);

-- Patients can see they are assigned
create policy "Patients can view own assignments"
  on public.rd_patient_assignments for select
  using (auth.uid() = patient_id);

-- 4. Helper function: is_rd_for_patient
create or replace function public.is_rd_for_patient(p_patient_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.rd_patient_assignments
    where rd_id = auth.uid()
      and patient_id = p_patient_id
      and status = 'active'
  );
end;
$$ language plpgsql security definer stable;

-- 5. RLS policies — allow RDs to read patient data

-- Assessments: RDs can read for their assigned patients
create policy "RDs can view assigned patient assessments"
  on public.assessments for select
  using (public.is_rd_for_patient(user_id));

-- Assessments: RDs can update (mark reviewed/approved) for assigned patients
create policy "RDs can update assigned patient assessments"
  on public.assessments for update
  using (public.is_rd_for_patient(user_id));

-- Nutrient targets: RDs can read for their assigned patients
create policy "RDs can view assigned patient targets"
  on public.nutrient_targets for select
  using (public.is_rd_for_patient(user_id));

-- Nutrient targets: RDs can insert for their assigned patients
create policy "RDs can insert assigned patient targets"
  on public.nutrient_targets for insert
  with check (public.is_rd_for_patient(user_id));

-- Nutrient targets: RDs can update for their assigned patients
create policy "RDs can update assigned patient targets"
  on public.nutrient_targets for update
  using (public.is_rd_for_patient(user_id));

-- Symptom logs: RDs can read for their assigned patients
create policy "RDs can view assigned patient logs"
  on public.symptom_logs for select
  using (public.is_rd_for_patient(user_id));

-- Profiles: RDs can read profiles of their assigned patients
create policy "RDs can view assigned patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.rd_patient_assignments
      where rd_id = auth.uid()
        and patient_id = profiles.id
        and status = 'active'
    )
  );

-- 6. Update handle_new_user() trigger to store role and email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.email
  );

  -- If signing up as RD, also create rd_profiles row
  if new.raw_user_meta_data->>'role' = 'rd' then
    insert into public.rd_profiles (id, license_number, license_state)
    values (
      new.id,
      new.raw_user_meta_data->>'license_number',
      new.raw_user_meta_data->>'license_state'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 7. Audit trail columns
alter table public.assessments
  add column if not exists reviewed_by uuid references auth.users,
  add column if not exists reviewed_at timestamptz;

alter table public.nutrient_targets
  add column if not exists set_by uuid references auth.users;
