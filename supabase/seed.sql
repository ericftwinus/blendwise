-- =============================================================================
-- BlendWise Seed Script: 1 RD + 10 Patient accounts with realistic test data
-- =============================================================================
-- Run in Supabase SQL Editor (paste the whole file and click "Run").
--
-- Credentials:
--   RD:       rd@blendwise.test       / Test1234!
--   Patients: patient1@blendwise.test  / Test1234!
--             ...
--             patient10@blendwise.test / Test1234!
--
-- Deterministic UUIDs:
--   RD:  11111111-0000-0000-0000-000000000001
--   P1:  22222222-0000-0000-0000-000000000001
--   P2:  22222222-0000-0000-0000-000000000002
--   ... through P10
-- =============================================================================

-- =============================================================================
-- 0a. Ensure RD portal schema exists (safe to re-run — uses IF NOT EXISTS)
-- =============================================================================

-- Add role/email columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'rd', 'admin')),
  ADD COLUMN IF NOT EXISTS email text;

-- RD Profiles table
CREATE TABLE IF NOT EXISTS public.rd_profiles (
  id uuid REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  license_number text,
  license_state text,
  specializations text[] DEFAULT '{}',
  bio text,
  accepting_patients boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.rd_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "RDs can view own rd_profile"   ON public.rd_profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can update own rd_profile"  ON public.rd_profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can insert own rd_profile"  ON public.rd_profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RD-Patient Assignments table
CREATE TABLE IF NOT EXISTS public.rd_patient_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rd_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'discharged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (rd_id, patient_id)
);
ALTER TABLE public.rd_patient_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "RDs can view own assignments"       ON public.rd_patient_assignments FOR SELECT USING (auth.uid() = rd_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can insert assignments"         ON public.rd_patient_assignments FOR INSERT WITH CHECK (auth.uid() = rd_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can update own assignments"     ON public.rd_patient_assignments FOR UPDATE USING (auth.uid() = rd_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Patients can view own assignments"  ON public.rd_patient_assignments FOR SELECT USING (auth.uid() = patient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_rd_for_patient(p_patient_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.rd_patient_assignments
    WHERE rd_id = auth.uid() AND patient_id = p_patient_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS policies for RD access to patient data
DO $$ BEGIN
  CREATE POLICY "RDs can view assigned patient assessments" ON public.assessments FOR SELECT USING (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can update assigned patient assessments" ON public.assessments FOR UPDATE USING (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can view assigned patient targets" ON public.nutrient_targets FOR SELECT USING (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can insert assigned patient targets" ON public.nutrient_targets FOR INSERT WITH CHECK (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can update assigned patient targets" ON public.nutrient_targets FOR UPDATE USING (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can view assigned patient logs" ON public.symptom_logs FOR SELECT USING (public.is_rd_for_patient(user_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "RDs can view assigned patient profiles" ON public.profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.rd_patient_assignments WHERE rd_id = auth.uid() AND patient_id = profiles.id AND status = 'active'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated trigger to store role and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.email
  );
  IF new.raw_user_meta_data->>'role' = 'rd' THEN
    INSERT INTO public.rd_profiles (id, license_number, license_state)
    VALUES (new.id, new.raw_user_meta_data->>'license_number', new.raw_user_meta_data->>'license_state');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Audit columns on assessments and nutrient_targets
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.nutrient_targets
  ADD COLUMN IF NOT EXISTS set_by uuid REFERENCES auth.users;

-- =============================================================================
-- 0b. Clean up previous seed data (idempotent re-run)
-- =============================================================================
DELETE FROM public.nutrient_targets       WHERE user_id IN ('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');
DELETE FROM public.symptom_logs           WHERE user_id IN ('22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');
DELETE FROM public.assessments            WHERE user_id IN ('22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');
DELETE FROM public.rd_patient_assignments WHERE rd_id = '11111111-0000-0000-0000-000000000001';
DELETE FROM public.rd_profiles            WHERE id = '11111111-0000-0000-0000-000000000001';
DELETE FROM public.profiles               WHERE id IN ('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');
DELETE FROM auth.identities               WHERE user_id IN ('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');
DELETE FROM auth.users                    WHERE id IN ('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010');

-- =============================================================================
-- 1. Insert auth.users  (trigger auto-creates profiles + rd_profiles)
-- =============================================================================

-- RD account
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '11111111-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'rd@blendwise.test',
  crypt('Test1234!', gen_salt('bf', 10)),
  now(),
  jsonb_build_object('sub', '11111111-0000-0000-0000-000000000001', 'email', 'rd@blendwise.test', 'email_verified', true, 'phone_verified', false, 'full_name', 'Dr. Sarah Mitchell', 'role', 'rd', 'license_number', 'RD-12345', 'license_state', 'CA'),
  '{"provider":"email","providers":["email"]}'::jsonb,
  now(), now(), '', ''
);

-- Patient accounts
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES
  ('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient1@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000001","email":"patient1@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Alice Johnson","role":"patient"}'::jsonb,    '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient2@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000002","email":"patient2@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Bob Chen","role":"patient"}'::jsonb,         '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient3@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000003","email":"patient3@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Carol Davis","role":"patient"}'::jsonb,      '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient4@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000004","email":"patient4@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"David Kim","role":"patient"}'::jsonb,        '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient5@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000005","email":"patient5@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Emma Rodriguez","role":"patient"}'::jsonb,   '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient6@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000006","email":"patient6@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Frank Nguyen","role":"patient"}'::jsonb,     '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient7@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000007","email":"patient7@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Grace Patel","role":"patient"}'::jsonb,      '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient8@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000008","email":"patient8@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Henry Wilson","role":"patient"}'::jsonb,     '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient9@blendwise.test',  crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000009","email":"patient9@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"Iris Thompson","role":"patient"}'::jsonb,    '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', ''),
  ('22222222-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000','authenticated','authenticated','patient10@blendwise.test', crypt('Test1234!',gen_salt('bf', 10)), now(), '{"sub":"22222222-0000-0000-0000-000000000010","email":"patient10@blendwise.test","email_verified":true,"phone_verified":false,"full_name":"James Lee","role":"patient"}'::jsonb,        '{"provider":"email","providers":["email"]}'::jsonb, now(), now(), '', '');

-- Create identities for each user (required for email/password login)
-- Note: email column is generated from identity_data, so we omit it
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES
  (gen_random_uuid(), '11111111-0000-0000-0000-000000000001', jsonb_build_object('sub', '11111111-0000-0000-0000-000000000001', 'email', 'rd@blendwise.test',         'email_verified', true, 'phone_verified', false), 'email', '11111111-0000-0000-0000-000000000001', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000001', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000001', 'email', 'patient1@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000001', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000002', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000002', 'email', 'patient2@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000002', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000003', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000003', 'email', 'patient3@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000003', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000004', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000004', 'email', 'patient4@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000004', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000005', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000005', 'email', 'patient5@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000005', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000006', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000006', 'email', 'patient6@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000006', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000007', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000007', 'email', 'patient7@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000007', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000008', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000008', 'email', 'patient8@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000008', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000009', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000009', 'email', 'patient9@blendwise.test',   'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000009', now(), now(), now()),
  (gen_random_uuid(), '22222222-0000-0000-0000-000000000010', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000010', 'email', 'patient10@blendwise.test',  'email_verified', true, 'phone_verified', false), 'email', '22222222-0000-0000-0000-000000000010', now(), now(), now());

-- =============================================================================
-- 2. Update RD profile with extra details (trigger already created the row)
-- =============================================================================
UPDATE public.rd_profiles SET
  specializations = ARRAY['Enteral Nutrition', 'Pediatric Nutrition', 'GI Disorders'],
  bio = 'Board-certified dietitian with 12 years of experience in enteral nutrition therapy and blenderized tube feeding.',
  accepting_patients = true
WHERE id = '11111111-0000-0000-0000-000000000001';

-- =============================================================================
-- 3. Assessments — one per patient with varied realistic data
-- =============================================================================
INSERT INTO public.assessments (
  id, user_id,
  diagnosis, tube_type, tube_placement_date, current_formula, feeding_schedule, daily_volume,
  gi_symptoms, gi_notes,
  allergies, intolerances, dietary_preferences, dietary_notes,
  has_blender, blender_type, has_food_storage, has_kitchen_scale,
  feeding_goal, additional_notes,
  payment_method, insurance_provider,
  status, reviewed_by, reviewed_at,
  created_at, updated_at
) VALUES
-- Patient 1: Alice Johnson — gastroparesis, G-tube, full blend goal, APPROVED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000001',
  'Gastroparesis', 'G-tube (PEG)', '2025-06-15', 'Jevity 1.5 Cal', '5 bolus feeds/day', '1500 mL',
  ARRAY['Nausea','Bloating','Early satiety'], 'Symptoms worsen with high-fat foods',
  'Tree nuts', 'Lactose', ARRAY['Whole foods','Organic'], 'Prefers Mediterranean-style meals',
  true, 'Vitamix', true, true,
  'full', 'Eager to transition fully to blended diet. Has been researching recipes online.',
  'insurance', 'Blue Cross Blue Shield',
  'approved', '11111111-0000-0000-0000-000000000001', now() - interval '5 days',
  now() - interval '30 days', now() - interval '5 days'
),
-- Patient 2: Bob Chen — stroke recovery, G-tube, hybrid goal, APPROVED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000002',
  'Dysphagia (post-stroke)', 'G-tube (PEG)', '2025-09-01', 'Osmolite 1.2 Cal', '4 bolus feeds/day', '1200 mL',
  ARRAY['Constipation'], 'Mild constipation, improved with prune juice flushes',
  'None', 'None', ARRAY['High protein'], NULL,
  true, 'Blendtec', true, false,
  'hybrid', 'Caregiver (wife) will prepare meals. Wants to add real food alongside formula.',
  'insurance', 'Aetna',
  'approved', '11111111-0000-0000-0000-000000000001', now() - interval '3 days',
  now() - interval '20 days', now() - interval '3 days'
),
-- Patient 3: Carol Davis — EoE, G-tube, full blend, SUBMITTED (awaiting review)
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000003',
  'Eosinophilic Esophagitis (EoE)', 'G-tube (PEG)', '2024-11-20', 'EleCare', '6 small feeds/day', '1000 mL',
  ARRAY['Abdominal pain','Reflux','Vomiting'], 'Flares with dairy and wheat exposure',
  'Milk, Wheat, Soy, Eggs', 'Corn', ARRAY['Allergen-free','Whole foods'], 'Strict top-8 allergen avoidance',
  true, 'Vitamix', true, true,
  'full', 'Multiple food allergies — needs very careful ingredient selection.',
  'insurance', 'UnitedHealthcare',
  'submitted', NULL, NULL,
  now() - interval '7 days', now() - interval '7 days'
),
-- Patient 4: David Kim — TBI, J-tube, supplement goal, SUBMITTED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000004',
  'Traumatic Brain Injury (TBI)', 'J-tube', '2025-03-10', 'Peptamen 1.5', 'Continuous pump 18h/day', '1800 mL',
  ARRAY['Diarrhea','Cramping'], 'Loose stools with rate >80mL/hr',
  'Shellfish', 'None', ARRAY['High calorie'], NULL,
  false, NULL, true, false,
  'supplement', 'Caregiver interested in supplementing formula with blended meals during daytime bolus windows.',
  'insurance', 'Cigna',
  'submitted', NULL, NULL,
  now() - interval '12 days', now() - interval '12 days'
),
-- Patient 5: Emma Rodriguez — cerebral palsy, G-tube, full blend, APPROVED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000005',
  'Cerebral Palsy', 'G-tube (Mic-Key button)', '2023-08-05', 'Pediasure 1.5', '4 bolus feeds/day', '1000 mL',
  ARRAY['Reflux','Retching'], 'Better when fed upright, 30-min post-feed positioning',
  'None', 'None', ARRAY['Whole foods','Kid-friendly'], 'Mom wants age-appropriate family meals',
  true, 'Ninja Professional', true, true,
  'full', 'Pediatric patient (8yo). Mom is very motivated. Already doing some blends.',
  'insurance', 'Medicaid',
  'approved', '11111111-0000-0000-0000-000000000001', now() - interval '10 days',
  now() - interval '45 days', now() - interval '10 days'
),
-- Patient 6: Frank Nguyen — head/neck cancer, G-tube, hybrid, REVIEWED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000006',
  'Head and Neck Cancer (post-radiation)', 'G-tube (PEG)', '2025-07-22', 'Jevity 1.2 Cal', '3 meals + 2 snack boluses/day', '1400 mL',
  ARRAY['Nausea','Taste changes'], 'Mild nausea from chemo, taste aversion to sweet flavors',
  'None', 'Gluten', ARRAY['Savory','High calorie'], 'Prefers savory blends, no sweet formulas',
  true, 'Vitamix', false, true,
  'hybrid', 'Finishing radiation next month. Wants to incorporate real food as tolerated.',
  'insurance', 'Kaiser Permanente',
  'reviewed', '11111111-0000-0000-0000-000000000001', now() - interval '1 day',
  now() - interval '14 days', now() - interval '1 day'
),
-- Patient 7: Grace Patel — Crohn's disease, NG tube, supplement, SUBMITTED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000007',
  'Crohn''s Disease', 'NG tube (temporary)', '2025-12-01', 'Modulen IBD', 'Overnight continuous + 2 daytime bolus', '1600 mL',
  ARRAY['Abdominal pain','Diarrhea','Bloating'], 'Active flare, on biologics',
  'None', 'Lactose, High-fiber foods', ARRAY['Low residue'], 'Low-residue during flares, expand as tolerated',
  true, 'NutriBullet', false, false,
  'supplement', 'Wants to add some real-food blends to reduce formula dependence.',
  'oop', NULL,
  'submitted', NULL, NULL,
  now() - interval '5 days', now() - interval '5 days'
),
-- Patient 8: Henry Wilson — ALS, G-tube, full blend, APPROVED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000008',
  'Amyotrophic Lateral Sclerosis (ALS)', 'G-tube (PEG)', '2025-01-15', 'Isosource 1.5', '4 gravity feeds/day', '1500 mL',
  ARRAY['Constipation','Bloating'], 'Reduced motility, benefits from high-fiber blends',
  'None', 'None', ARRAY['High fiber','Whole foods'], NULL,
  true, 'Vitamix', true, true,
  'full', 'Progressive condition. Wife is primary caregiver. Both very motivated for BTF.',
  'insurance', 'Medicare',
  'approved', '11111111-0000-0000-0000-000000000001', now() - interval '8 days',
  now() - interval '60 days', now() - interval '8 days'
),
-- Patient 9: Iris Thompson — short bowel syndrome, J-tube, supplement, SUBMITTED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000009',
  'Short Bowel Syndrome', 'J-tube', '2024-05-30', 'Vivonex T.E.N.', 'Continuous pump 20h/day', '2000 mL',
  ARRAY['Diarrhea','Cramping','Dehydration'], 'High-output stoma, requires careful fluid management',
  'Soy', 'FODMAPs', ARRAY['Low FODMAP','Elemental'], 'Extremely limited tolerance — go very slowly',
  false, NULL, true, true,
  'supplement', 'Complex case. Small bolus window. Needs very thin, well-strained blends.',
  'insurance', 'Anthem',
  'submitted', NULL, NULL,
  now() - interval '3 days', now() - interval '3 days'
),
-- Patient 10: James Lee — spinal cord injury, G-tube, full blend, REVIEWED
(
  gen_random_uuid(), '22222222-0000-0000-0000-000000000010',
  'Spinal Cord Injury (C5-C6)', 'G-tube (Mic-Key button)', '2024-09-12', 'Nutren 2.0', '3 bolus feeds/day', '1200 mL',
  ARRAY['Constipation','Bloating'], 'Neurogenic bowel, on bowel program',
  'Peanuts', 'None', ARRAY['High fiber','Whole foods'], 'Needs adequate fiber for bowel program',
  true, 'Blendtec', true, false,
  'full', 'Independent with feeding. Uses adaptive equipment. Very tech-savvy.',
  'oop', NULL,
  'reviewed', '11111111-0000-0000-0000-000000000001', now() - interval '2 days',
  now() - interval '25 days', now() - interval '2 days'
);

-- =============================================================================
-- 4. Symptom Logs — 7-14 days per patient with varied data
-- =============================================================================

-- Patient 1 (Alice) — 14 days of logs
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000001',
  d::date,
  130.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 3
    WHEN 0 THEN ARRAY['Nausea','Bloating']
    WHEN 1 THEN ARRAY['Bloating']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-05'::date) % 3 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.15 THEN true ELSE false END,
  CASE (d::date - '2026-02-05'::date) % 4
    WHEN 0 THEN 'Good day overall, minimal symptoms'
    WHEN 1 THEN 'Some bloating after lunch blend'
    WHEN 2 THEN 'Tried new recipe — sweet potato blend went well'
    ELSE NULL
  END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 2 (Bob) — 10 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000002',
  d::date,
  175.0 + (random() * 3 - 1.5)::numeric(3,1),
  CASE (d::date - '2026-02-09'::date) % 4
    WHEN 0 THEN ARRAY['Constipation']
    WHEN 1 THEN ARRAY['Constipation']
    ELSE ARRAY[]::text[]
  END,
  1,
  true,
  CASE (d::date - '2026-02-09'::date) % 3
    WHEN 0 THEN 'Wife prepared chicken and veggie blend'
    WHEN 1 THEN 'Tolerating blends well alongside formula'
    ELSE NULL
  END
FROM generate_series('2026-02-09'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 3 (Carol) — 7 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000003',
  d::date,
  95.0 + (random() * 1.5 - 0.75)::numeric(3,1),
  CASE (d::date - '2026-02-12'::date) % 3
    WHEN 0 THEN ARRAY['Abdominal pain','Reflux']
    WHEN 1 THEN ARRAY['Reflux']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-12'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.2 THEN true ELSE false END,
  CASE (d::date - '2026-02-12'::date) % 3
    WHEN 0 THEN 'Bad day — possible allergen exposure at school'
    WHEN 1 THEN 'Mild reflux after evening feed'
    ELSE 'Symptom-free day'
  END
FROM generate_series('2026-02-12'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 4 (David) — 12 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000004',
  d::date,
  160.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-07'::date) % 4
    WHEN 0 THEN ARRAY['Diarrhea','Cramping']
    WHEN 1 THEN ARRAY['Cramping']
    WHEN 2 THEN ARRAY['Diarrhea']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-07'::date) % 4 = 0 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-07'::date) % 5
    WHEN 0 THEN 'Rate lowered to 70mL/hr — less cramping'
    WHEN 1 THEN 'Tried small bolus with blend — tolerated 100mL'
    ELSE NULL
  END
FROM generate_series('2026-02-07'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 5 (Emma) — 14 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000005',
  d::date,
  52.0 + (random() * 1 - 0.5)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 5
    WHEN 0 THEN ARRAY['Reflux','Retching']
    WHEN 1 THEN ARRAY['Retching']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-05'::date) % 5 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.1 THEN true ELSE false END,
  CASE (d::date - '2026-02-05'::date) % 4
    WHEN 0 THEN 'Mom reports less retching with thicker blends'
    WHEN 1 THEN 'Good day at school, full feeds tolerated'
    WHEN 2 THEN 'Mac and cheese blend — she loved it!'
    ELSE NULL
  END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 6 (Frank) — 10 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000006',
  d::date,
  145.0 + (random() * 3 - 1.5)::numeric(3,1),
  CASE (d::date - '2026-02-09'::date) % 3
    WHEN 0 THEN ARRAY['Nausea','Taste changes']
    WHEN 1 THEN ARRAY['Nausea']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-09'::date) % 3 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.25 THEN true ELSE false END,
  CASE (d::date - '2026-02-09'::date) % 4
    WHEN 0 THEN 'Nausea worse on chemo days'
    WHEN 1 THEN 'Savory lentil blend went well'
    WHEN 2 THEN 'Could not finish afternoon feed'
    ELSE NULL
  END
FROM generate_series('2026-02-09'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 7 (Grace) — 7 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000007',
  d::date,
  120.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-12'::date) % 3
    WHEN 0 THEN ARRAY['Abdominal pain','Diarrhea','Bloating']
    WHEN 1 THEN ARRAY['Diarrhea']
    ELSE ARRAY['Bloating']
  END,
  CASE WHEN (d::date - '2026-02-12'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.3 THEN true ELSE false END,
  CASE (d::date - '2026-02-12'::date) % 3
    WHEN 0 THEN 'Flare day — stuck to formula only'
    WHEN 1 THEN 'Slightly better, tried diluted bone broth blend'
    ELSE 'Improving — biologics seem to be helping'
  END
FROM generate_series('2026-02-12'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 8 (Henry) — 14 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000008',
  d::date,
  180.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 4
    WHEN 0 THEN ARRAY['Constipation','Bloating']
    WHEN 1 THEN ARRAY['Constipation']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-05'::date) % 4 < 2 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-05'::date) % 4
    WHEN 0 THEN 'Constipation — added extra prune and flax blend'
    WHEN 1 THEN 'Wife made a great chicken/veggie blend today'
    WHEN 2 THEN 'Feeling strong, good energy levels'
    ELSE NULL
  END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 9 (Iris) — 8 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000009',
  d::date,
  110.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-11'::date) % 3
    WHEN 0 THEN ARRAY['Diarrhea','Cramping','Dehydration']
    WHEN 1 THEN ARRAY['Diarrhea']
    ELSE ARRAY['Cramping']
  END,
  CASE WHEN (d::date - '2026-02-11'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.2 THEN true ELSE false END,
  CASE (d::date - '2026-02-11'::date) % 4
    WHEN 0 THEN 'High output day — increased ORS'
    WHEN 1 THEN 'Tried 50mL bolus of strained blend — OK'
    WHEN 2 THEN 'Stoma output lower today, encouraging'
    ELSE NULL
  END
FROM generate_series('2026-02-11'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 10 (James) — 11 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT
  '22222222-0000-0000-0000-000000000010',
  d::date,
  155.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-08'::date) % 4
    WHEN 0 THEN ARRAY['Constipation','Bloating']
    WHEN 1 THEN ARRAY['Constipation']
    ELSE ARRAY[]::text[]
  END,
  CASE WHEN (d::date - '2026-02-08'::date) % 4 = 0 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-08'::date) % 3
    WHEN 0 THEN 'Bowel program going well with high-fiber blends'
    WHEN 1 THEN 'Made a great oatmeal/banana/PB blend independently'
    ELSE NULL
  END
FROM generate_series('2026-02-08'::date, '2026-02-18'::date, '1 day') AS d;

-- =============================================================================
-- 5. RD-Patient Assignments — link all 10 patients to the RD
-- =============================================================================
INSERT INTO public.rd_patient_assignments (rd_id, patient_id, status, created_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active', now() - interval '30 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'active', now() - interval '20 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'active', now() - interval '7 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 'active', now() - interval '12 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005', 'active', now() - interval '45 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000006', 'active', now() - interval '14 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000007', 'active', now() - interval '5 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000008', 'active', now() - interval '60 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000009', 'active', now() - interval '3 days'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000010', 'active', now() - interval '25 days');

-- =============================================================================
-- 6. Nutrient Targets — 4 patients with RD-approved targets ("RD-Approved")
--    The other 6 patients have no nutrient_targets → "Awaiting Review"
-- =============================================================================

-- Patient 1 (Alice) — full blend, approved targets
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
  1400, 1600, 55, 70,
  170, 200, 45, 60,
  20, 30, 1500, 2000,
  '5 bolus feeds: 7am, 10am, 12:30pm, 3:30pm, 7pm — 300mL each',
  'Avoid tree nuts. Start new foods one at a time. Keep upright 30min post-feed.',
  'Good candidate for full BTF. Tolerating blends well. Increase fiber gradually.'
);

-- Patient 2 (Bob) — hybrid, approved targets
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
  1800, 2100, 80, 100,
  200, 250, 55, 75,
  25, 35, 1800, 2200,
  '2 formula feeds (7am, 9pm) + 2 blended meals (12pm, 5pm) — 300mL each',
  'Thicken blends well. Caregiver trained on safe prep. Monitor for aspiration signs.',
  'Hybrid approach: formula for convenience, blends for nutrition variety. Wife is excellent prep partner.'
);

-- Patient 5 (Emma) — pediatric, approved targets
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
  900, 1100, 30, 40,
  120, 150, 30, 40,
  10, 15, 1000, 1200,
  '4 bolus feeds: 7am, 11:30am, 3:30pm, 7pm — 250mL each',
  'Keep upright 30min post-feed. Watch for retching — reduce volume if needed. No raw honey.',
  'Pediatric patient (8yo). Mom is doing great with blends. Focus on age-appropriate variety.'
);

-- Patient 8 (Henry) — ALS, approved targets
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001',
  2000, 2400, 75, 95,
  250, 300, 65, 85,
  30, 40, 2000, 2500,
  '4 gravity feeds: 7am, 12pm, 5pm, 9pm — 375mL each, 30min per feed',
  'High-calorie needs due to ALS metabolic demands. Monitor weight weekly. High-fiber for constipation.',
  'Progressive condition — prioritize caloric density. Wife prepares all blends. Both very engaged.'
);

-- =============================================================================
-- 7. Reload PostgREST schema cache (required after DDL changes)
-- =============================================================================
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Done! Verify with:
--   SELECT role, count(*) FROM profiles GROUP BY role;
--   SELECT count(*) FROM assessments;
--   SELECT count(*) FROM symptom_logs;
--   SELECT count(*) FROM rd_patient_assignments;
--   SELECT count(*) FROM nutrient_targets WHERE set_by IS NOT NULL;
-- =============================================================================
