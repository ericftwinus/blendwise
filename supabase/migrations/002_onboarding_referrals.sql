-- ============================================
-- Onboarding & Referrals Migration
-- Adds patient_consents, expanded doctor_referrals,
-- fax_logs, profile fields, and referral-documents storage.
-- ============================================

-- 1. Patient Consents
create table if not exists public.patient_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  consent_type text not null check (consent_type in (
    'hipaa_telehealth', 'btf_risk_waiver', 'sanitation_agreement',
    'payment_terms', 'ai_disclosure'
  )),
  consented boolean not null default false,
  initials text,
  signed_at timestamptz,
  consent_version text default '1.0',
  ip_address inet,
  user_agent text,
  created_at timestamptz default now(),
  unique (user_id, consent_type)
);

alter table public.patient_consents enable row level security;

drop policy if exists "Patients can insert own consents" on public.patient_consents;
create policy "Patients can insert own consents"
  on public.patient_consents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Patients can read own consents" on public.patient_consents;
create policy "Patients can read own consents"
  on public.patient_consents for select
  using (auth.uid() = user_id);

drop policy if exists "Patients can update own consents" on public.patient_consents;
create policy "Patients can update own consents"
  on public.patient_consents for update
  using (auth.uid() = user_id);

drop policy if exists "RDs can read assigned patient consents" on public.patient_consents;
create policy "RDs can read assigned patient consents"
  on public.patient_consents for select
  using (public.is_rd_for_patient(user_id));

-- 2. Doctor Referrals (expanded)
create table if not exists public.doctor_referrals (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,

  -- Doctor info (from NPI lookup)
  doctor_name text not null,
  doctor_fax text,
  doctor_phone text,
  doctor_email text,
  doctor_practice text,
  doctor_npi text,
  doctor_credential text,
  doctor_taxonomy text,
  doctor_address_line1 text,
  doctor_address_city text,
  doctor_address_state text,
  doctor_address_zip text,

  -- Patient clinical snapshot
  patient_diagnosis text,
  patient_dob text,
  patient_tube_type text,
  clinical_goal text,
  current_formula text,
  daily_volume text,
  gi_symptoms text[],
  insurance text,
  policy_number text,

  -- ICD-10 codes (auto-mapped)
  icd10_codes text[] default '{}',
  primary_diagnosis_icd10 text,
  supporting_info_codes text[] default '{}',

  -- PDF and fax tracking
  pdf_storage_path text,
  signed_pdf_storage_path text,
  fax_attempts integer default 0,
  last_fax_attempt_at timestamptz,
  fax_provider_id text,

  -- Status workflow
  referral_status text not null default 'pending' check (referral_status in (
    'pending', 'generating', 'ready', 'sent', 'signed',
    'expired', 'declined', 'fax_failed'
  )),
  referral_sent_at timestamptz,
  referral_signed_at timestamptz,

  -- Metadata
  notes text,
  rd_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (patient_id)
);

alter table public.doctor_referrals enable row level security;

drop policy if exists "Patients can insert own referrals" on public.doctor_referrals;
create policy "Patients can insert own referrals"
  on public.doctor_referrals for insert
  with check (auth.uid() = patient_id);

drop policy if exists "Patients can read own referrals" on public.doctor_referrals;
create policy "Patients can read own referrals"
  on public.doctor_referrals for select
  using (auth.uid() = patient_id);

drop policy if exists "Patients can update own referrals" on public.doctor_referrals;
create policy "Patients can update own referrals"
  on public.doctor_referrals for update
  using (auth.uid() = patient_id);

drop policy if exists "RDs can read assigned patient referrals" on public.doctor_referrals;
create policy "RDs can read assigned patient referrals"
  on public.doctor_referrals for select
  using (public.is_rd_for_patient(patient_id));

-- Allow RDs to read ALL referrals (including unassigned patients) so new
-- onboarding referrals are visible immediately without requiring assignment first
drop policy if exists "RDs can read all referrals" on public.doctor_referrals;
create policy "RDs can read all referrals"
  on public.doctor_referrals for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'rd'
  );

drop policy if exists "RDs can update assigned patient referrals" on public.doctor_referrals;
create policy "RDs can update assigned patient referrals"
  on public.doctor_referrals for update
  using (public.is_rd_for_patient(patient_id));

-- 3. Fax Logs — audit trail for every fax event
create table if not exists public.fax_logs (
  id uuid default gen_random_uuid() primary key,
  referral_id uuid references public.doctor_referrals(id) on delete set null,
  event_type text not null check (event_type in (
    'send_attempt', 'delivered', 'failed', 'received', 'retry'
  )),
  provider_job_id text,
  to_number text,
  from_number text,
  pages integer,
  error_message text,
  webhook_payload jsonb,
  attempt_number integer default 1,
  created_at timestamptz default now()
);

alter table public.fax_logs enable row level security;

drop policy if exists "RDs can read fax logs for assigned patients" on public.fax_logs;
create policy "RDs can read fax logs for assigned patients"
  on public.fax_logs for select
  using (
    exists (
      select 1 from public.doctor_referrals dr
      where dr.id = fax_logs.referral_id
        and public.is_rd_for_patient(dr.patient_id)
    )
  );

-- 4. Extend profiles with patient contact & onboarding fields
alter table public.profiles
  add column if not exists phone text,
  add column if not exists address_line1 text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_zip text,
  add column if not exists date_of_birth text,
  add column if not exists mrn text,
  add column if not exists onboarding_completed boolean default false;

-- 5. Storage bucket for referral PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'referral-documents',
  'referral-documents',
  false,
  10485760,  -- 10MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Storage RLS: RDs can upload and read referral documents
drop policy if exists "RDs can upload referral documents" on storage.objects;
create policy "RDs can upload referral documents"
  on storage.objects for insert
  with check (
    bucket_id = 'referral-documents'
    and (
      select role from public.profiles where id = auth.uid()
    ) = 'rd'
  );

drop policy if exists "RDs can read referral documents" on storage.objects;
create policy "RDs can read referral documents"
  on storage.objects for select
  using (
    bucket_id = 'referral-documents'
    and (
      select role from public.profiles where id = auth.uid()
    ) in ('rd', 'admin')
  );

drop policy if exists "Patients can read own referral documents" on storage.objects;
create policy "Patients can read own referral documents"
  on storage.objects for select
  using (
    bucket_id = 'referral-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
