-- =============================================================================
-- BlendWise Seed DATA — assessments, symptom logs, assignments, nutrient targets
-- =============================================================================
-- Run AFTER users are created via Admin API.
-- User UUIDs are from the actual Supabase auth system.
-- =============================================================================

-- UUID mapping:
--   rd@blendwise.test       => 7010d2d7-9747-4013-b33e-779c86507879
--   patient1  (Alice)       => 6bddcfc0-4ecf-44d7-bac3-7629eaaf647d
--   patient2  (Bob)         => 48fecf95-78d0-4e55-add1-8740d953359a
--   patient3  (Carol)       => 3f9c0b04-5979-4481-aa0c-c1892496f05b
--   patient4  (David)       => 5451ebe3-256f-4bba-a6be-6e46e75144cd
--   patient5  (Emma)        => d493dfb8-6b55-49b7-840e-e58b66ebe5ab
--   patient6  (Frank)       => 6283517d-9e1c-4d59-8b77-7184f5243b42
--   patient7  (Grace)       => 17e24631-e3d5-4437-a2d7-21f80e3dd5e3
--   patient8  (Henry)       => 2ddf8c19-e7b3-4840-941d-93058144136b
--   patient9  (Iris)        => fdceef53-8d58-42f7-b9c4-d06aebbb4ef7
--   patient10 (James)       => 6b8a7de8-79fe-46f5-8a3d-d627fafa19f7

-- =============================================================================
-- 1. Update RD profile with extra details (trigger already created the row)
-- =============================================================================
UPDATE public.rd_profiles SET
  specializations = ARRAY['Enteral Nutrition', 'Pediatric Nutrition', 'GI Disorders'],
  bio = 'Board-certified dietitian with 12 years of experience in enteral nutrition therapy and blenderized tube feeding.',
  accepting_patients = true
WHERE id = '7010d2d7-9747-4013-b33e-779c86507879';

-- =============================================================================
-- 2. Assessments — one per patient with varied realistic data
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
-- Patient 1: Alice — gastroparesis, G-tube, full blend, APPROVED
(
  gen_random_uuid(), '6bddcfc0-4ecf-44d7-bac3-7629eaaf647d',
  'Gastroparesis', 'G-tube (PEG)', '2025-06-15', 'Jevity 1.5 Cal', '5 bolus feeds/day', '1500 mL',
  ARRAY['Nausea','Bloating','Early satiety'], 'Symptoms worsen with high-fat foods',
  'Tree nuts', 'Lactose', ARRAY['Whole foods','Organic'], 'Prefers Mediterranean-style meals',
  true, 'Vitamix', true, true,
  'full', 'Eager to transition fully to blended diet. Has been researching recipes online.',
  'insurance', 'Blue Cross Blue Shield',
  'approved', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '5 days',
  now() - interval '30 days', now() - interval '5 days'
),
-- Patient 2: Bob — stroke recovery, hybrid, APPROVED
(
  gen_random_uuid(), '48fecf95-78d0-4e55-add1-8740d953359a',
  'Dysphagia (post-stroke)', 'G-tube (PEG)', '2025-09-01', 'Osmolite 1.2 Cal', '4 bolus feeds/day', '1200 mL',
  ARRAY['Constipation'], 'Mild constipation, improved with prune juice flushes',
  'None', 'None', ARRAY['High protein'], NULL,
  true, 'Blendtec', true, false,
  'hybrid', 'Caregiver (wife) will prepare meals. Wants to add real food alongside formula.',
  'insurance', 'Aetna',
  'approved', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '3 days',
  now() - interval '20 days', now() - interval '3 days'
),
-- Patient 3: Carol — EoE, full blend, SUBMITTED
(
  gen_random_uuid(), '3f9c0b04-5979-4481-aa0c-c1892496f05b',
  'Eosinophilic Esophagitis (EoE)', 'G-tube (PEG)', '2024-11-20', 'EleCare', '6 small feeds/day', '1000 mL',
  ARRAY['Abdominal pain','Reflux','Vomiting'], 'Flares with dairy and wheat exposure',
  'Milk, Wheat, Soy, Eggs', 'Corn', ARRAY['Allergen-free','Whole foods'], 'Strict top-8 allergen avoidance',
  true, 'Vitamix', true, true,
  'full', 'Multiple food allergies — needs very careful ingredient selection.',
  'insurance', 'UnitedHealthcare',
  'submitted', NULL, NULL,
  now() - interval '7 days', now() - interval '7 days'
),
-- Patient 4: David — TBI, supplement, SUBMITTED
(
  gen_random_uuid(), '5451ebe3-256f-4bba-a6be-6e46e75144cd',
  'Traumatic Brain Injury (TBI)', 'J-tube', '2025-03-10', 'Peptamen 1.5', 'Continuous pump 18h/day', '1800 mL',
  ARRAY['Diarrhea','Cramping'], 'Loose stools with rate >80mL/hr',
  'Shellfish', 'None', ARRAY['High calorie'], NULL,
  false, NULL, true, false,
  'supplement', 'Caregiver interested in supplementing formula with blended meals during daytime bolus windows.',
  'insurance', 'Cigna',
  'submitted', NULL, NULL,
  now() - interval '12 days', now() - interval '12 days'
),
-- Patient 5: Emma — cerebral palsy, full blend, APPROVED
(
  gen_random_uuid(), 'd493dfb8-6b55-49b7-840e-e58b66ebe5ab',
  'Cerebral Palsy', 'G-tube (Mic-Key button)', '2023-08-05', 'Pediasure 1.5', '4 bolus feeds/day', '1000 mL',
  ARRAY['Reflux','Retching'], 'Better when fed upright, 30-min post-feed positioning',
  'None', 'None', ARRAY['Whole foods','Kid-friendly'], 'Mom wants age-appropriate family meals',
  true, 'Ninja Professional', true, true,
  'full', 'Pediatric patient (8yo). Mom is very motivated. Already doing some blends.',
  'insurance', 'Medicaid',
  'approved', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '10 days',
  now() - interval '45 days', now() - interval '10 days'
),
-- Patient 6: Frank — head/neck cancer, hybrid, REVIEWED
(
  gen_random_uuid(), '6283517d-9e1c-4d59-8b77-7184f5243b42',
  'Head and Neck Cancer (post-radiation)', 'G-tube (PEG)', '2025-07-22', 'Jevity 1.2 Cal', '3 meals + 2 snack boluses/day', '1400 mL',
  ARRAY['Nausea','Taste changes'], 'Mild nausea from chemo, taste aversion to sweet flavors',
  'None', 'Gluten', ARRAY['Savory','High calorie'], 'Prefers savory blends, no sweet formulas',
  true, 'Vitamix', false, true,
  'hybrid', 'Finishing radiation next month. Wants to incorporate real food as tolerated.',
  'insurance', 'Kaiser Permanente',
  'reviewed', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '1 day',
  now() - interval '14 days', now() - interval '1 day'
),
-- Patient 7: Grace — Crohn's, supplement, SUBMITTED
(
  gen_random_uuid(), '17e24631-e3d5-4437-a2d7-21f80e3dd5e3',
  'Crohn''s Disease', 'NG tube (temporary)', '2025-12-01', 'Modulen IBD', 'Overnight continuous + 2 daytime bolus', '1600 mL',
  ARRAY['Abdominal pain','Diarrhea','Bloating'], 'Active flare, on biologics',
  'None', 'Lactose, High-fiber foods', ARRAY['Low residue'], 'Low-residue during flares, expand as tolerated',
  true, 'NutriBullet', false, false,
  'supplement', 'Wants to add some real-food blends to reduce formula dependence.',
  'oop', NULL,
  'submitted', NULL, NULL,
  now() - interval '5 days', now() - interval '5 days'
),
-- Patient 8: Henry — ALS, full blend, APPROVED
(
  gen_random_uuid(), '2ddf8c19-e7b3-4840-941d-93058144136b',
  'Amyotrophic Lateral Sclerosis (ALS)', 'G-tube (PEG)', '2025-01-15', 'Isosource 1.5', '4 gravity feeds/day', '1500 mL',
  ARRAY['Constipation','Bloating'], 'Reduced motility, benefits from high-fiber blends',
  'None', 'None', ARRAY['High fiber','Whole foods'], NULL,
  true, 'Vitamix', true, true,
  'full', 'Progressive condition. Wife is primary caregiver. Both very motivated for BTF.',
  'insurance', 'Medicare',
  'approved', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '8 days',
  now() - interval '60 days', now() - interval '8 days'
),
-- Patient 9: Iris — short bowel syndrome, supplement, SUBMITTED
(
  gen_random_uuid(), 'fdceef53-8d58-42f7-b9c4-d06aebbb4ef7',
  'Short Bowel Syndrome', 'J-tube', '2024-05-30', 'Vivonex T.E.N.', 'Continuous pump 20h/day', '2000 mL',
  ARRAY['Diarrhea','Cramping','Dehydration'], 'High-output stoma, requires careful fluid management',
  'Soy', 'FODMAPs', ARRAY['Low FODMAP','Elemental'], 'Extremely limited tolerance — go very slowly',
  false, NULL, true, true,
  'supplement', 'Complex case. Small bolus window. Needs very thin, well-strained blends.',
  'insurance', 'Anthem',
  'submitted', NULL, NULL,
  now() - interval '3 days', now() - interval '3 days'
),
-- Patient 10: James — spinal cord injury, full blend, REVIEWED
(
  gen_random_uuid(), '6b8a7de8-79fe-46f5-8a3d-d627fafa19f7',
  'Spinal Cord Injury (C5-C6)', 'G-tube (Mic-Key button)', '2024-09-12', 'Nutren 2.0', '3 bolus feeds/day', '1200 mL',
  ARRAY['Constipation','Bloating'], 'Neurogenic bowel, on bowel program',
  'Peanuts', 'None', ARRAY['High fiber','Whole foods'], 'Needs adequate fiber for bowel program',
  true, 'Blendtec', true, false,
  'full', 'Independent with feeding. Uses adaptive equipment. Very tech-savvy.',
  'oop', NULL,
  'reviewed', '7010d2d7-9747-4013-b33e-779c86507879', now() - interval '2 days',
  now() - interval '25 days', now() - interval '2 days'
);

-- =============================================================================
-- 3. Symptom Logs — 7-14 days per patient
-- =============================================================================

-- Patient 1 (Alice) — 14 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '6bddcfc0-4ecf-44d7-bac3-7629eaaf647d', d::date,
  130.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 3 WHEN 0 THEN ARRAY['Nausea','Bloating'] WHEN 1 THEN ARRAY['Bloating'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-05'::date) % 3 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.15 THEN true ELSE false END,
  CASE (d::date - '2026-02-05'::date) % 4 WHEN 0 THEN 'Good day overall, minimal symptoms' WHEN 1 THEN 'Some bloating after lunch blend' WHEN 2 THEN 'Tried new recipe — sweet potato blend went well' ELSE NULL END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 2 (Bob) — 10 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '48fecf95-78d0-4e55-add1-8740d953359a', d::date,
  175.0 + (random() * 3 - 1.5)::numeric(3,1),
  CASE (d::date - '2026-02-09'::date) % 4 WHEN 0 THEN ARRAY['Constipation'] WHEN 1 THEN ARRAY['Constipation'] ELSE ARRAY[]::text[] END,
  1, true,
  CASE (d::date - '2026-02-09'::date) % 3 WHEN 0 THEN 'Wife prepared chicken and veggie blend' WHEN 1 THEN 'Tolerating blends well alongside formula' ELSE NULL END
FROM generate_series('2026-02-09'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 3 (Carol) — 7 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '3f9c0b04-5979-4481-aa0c-c1892496f05b', d::date,
  95.0 + (random() * 1.5 - 0.75)::numeric(3,1),
  CASE (d::date - '2026-02-12'::date) % 3 WHEN 0 THEN ARRAY['Abdominal pain','Reflux'] WHEN 1 THEN ARRAY['Reflux'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-12'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.2 THEN true ELSE false END,
  CASE (d::date - '2026-02-12'::date) % 3 WHEN 0 THEN 'Bad day — possible allergen exposure at school' WHEN 1 THEN 'Mild reflux after evening feed' ELSE 'Symptom-free day' END
FROM generate_series('2026-02-12'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 4 (David) — 12 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '5451ebe3-256f-4bba-a6be-6e46e75144cd', d::date,
  160.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-07'::date) % 4 WHEN 0 THEN ARRAY['Diarrhea','Cramping'] WHEN 1 THEN ARRAY['Cramping'] WHEN 2 THEN ARRAY['Diarrhea'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-07'::date) % 4 = 0 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-07'::date) % 5 WHEN 0 THEN 'Rate lowered to 70mL/hr — less cramping' WHEN 1 THEN 'Tried small bolus with blend — tolerated 100mL' ELSE NULL END
FROM generate_series('2026-02-07'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 5 (Emma) — 14 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT 'd493dfb8-6b55-49b7-840e-e58b66ebe5ab', d::date,
  52.0 + (random() * 1 - 0.5)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 5 WHEN 0 THEN ARRAY['Reflux','Retching'] WHEN 1 THEN ARRAY['Retching'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-05'::date) % 5 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.1 THEN true ELSE false END,
  CASE (d::date - '2026-02-05'::date) % 4 WHEN 0 THEN 'Mom reports less retching with thicker blends' WHEN 1 THEN 'Good day at school, full feeds tolerated' WHEN 2 THEN 'Mac and cheese blend — she loved it!' ELSE NULL END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 6 (Frank) — 10 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '6283517d-9e1c-4d59-8b77-7184f5243b42', d::date,
  145.0 + (random() * 3 - 1.5)::numeric(3,1),
  CASE (d::date - '2026-02-09'::date) % 3 WHEN 0 THEN ARRAY['Nausea','Taste changes'] WHEN 1 THEN ARRAY['Nausea'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-09'::date) % 3 = 0 THEN 2 ELSE 1 END,
  CASE WHEN random() > 0.25 THEN true ELSE false END,
  CASE (d::date - '2026-02-09'::date) % 4 WHEN 0 THEN 'Nausea worse on chemo days' WHEN 1 THEN 'Savory lentil blend went well' WHEN 2 THEN 'Could not finish afternoon feed' ELSE NULL END
FROM generate_series('2026-02-09'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 7 (Grace) — 7 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '17e24631-e3d5-4437-a2d7-21f80e3dd5e3', d::date,
  120.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-12'::date) % 3 WHEN 0 THEN ARRAY['Abdominal pain','Diarrhea','Bloating'] WHEN 1 THEN ARRAY['Diarrhea'] ELSE ARRAY['Bloating'] END,
  CASE WHEN (d::date - '2026-02-12'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.3 THEN true ELSE false END,
  CASE (d::date - '2026-02-12'::date) % 3 WHEN 0 THEN 'Flare day — stuck to formula only' WHEN 1 THEN 'Slightly better, tried diluted bone broth blend' ELSE 'Improving — biologics seem to be helping' END
FROM generate_series('2026-02-12'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 8 (Henry) — 14 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '2ddf8c19-e7b3-4840-941d-93058144136b', d::date,
  180.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-05'::date) % 4 WHEN 0 THEN ARRAY['Constipation','Bloating'] WHEN 1 THEN ARRAY['Constipation'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-05'::date) % 4 < 2 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-05'::date) % 4 WHEN 0 THEN 'Constipation — added extra prune and flax blend' WHEN 1 THEN 'Wife made a great chicken/veggie blend today' WHEN 2 THEN 'Feeling strong, good energy levels' ELSE NULL END
FROM generate_series('2026-02-05'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 9 (Iris) — 8 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT 'fdceef53-8d58-42f7-b9c4-d06aebbb4ef7', d::date,
  110.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-11'::date) % 3 WHEN 0 THEN ARRAY['Diarrhea','Cramping','Dehydration'] WHEN 1 THEN ARRAY['Diarrhea'] ELSE ARRAY['Cramping'] END,
  CASE WHEN (d::date - '2026-02-11'::date) % 3 = 0 THEN 3 ELSE 2 END,
  CASE WHEN random() > 0.2 THEN true ELSE false END,
  CASE (d::date - '2026-02-11'::date) % 4 WHEN 0 THEN 'High output day — increased ORS' WHEN 1 THEN 'Tried 50mL bolus of strained blend — OK' WHEN 2 THEN 'Stoma output lower today, encouraging' ELSE NULL END
FROM generate_series('2026-02-11'::date, '2026-02-18'::date, '1 day') AS d;

-- Patient 10 (James) — 11 days
INSERT INTO public.symptom_logs (user_id, date, weight, symptoms, severity, intake_completed, notes)
SELECT '6b8a7de8-79fe-46f5-8a3d-d627fafa19f7', d::date,
  155.0 + (random() * 2 - 1)::numeric(3,1),
  CASE (d::date - '2026-02-08'::date) % 4 WHEN 0 THEN ARRAY['Constipation','Bloating'] WHEN 1 THEN ARRAY['Constipation'] ELSE ARRAY[]::text[] END,
  CASE WHEN (d::date - '2026-02-08'::date) % 4 = 0 THEN 2 ELSE 1 END,
  true,
  CASE (d::date - '2026-02-08'::date) % 3 WHEN 0 THEN 'Bowel program going well with high-fiber blends' WHEN 1 THEN 'Made a great oatmeal/banana/PB blend independently' ELSE NULL END
FROM generate_series('2026-02-08'::date, '2026-02-18'::date, '1 day') AS d;

-- =============================================================================
-- 4. RD-Patient Assignments — link all 10 patients to the RD
-- =============================================================================
INSERT INTO public.rd_patient_assignments (rd_id, patient_id, status, created_at)
VALUES
  ('7010d2d7-9747-4013-b33e-779c86507879', '6bddcfc0-4ecf-44d7-bac3-7629eaaf647d', 'active', now() - interval '30 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '48fecf95-78d0-4e55-add1-8740d953359a', 'active', now() - interval '20 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '3f9c0b04-5979-4481-aa0c-c1892496f05b', 'active', now() - interval '7 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '5451ebe3-256f-4bba-a6be-6e46e75144cd', 'active', now() - interval '12 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', 'd493dfb8-6b55-49b7-840e-e58b66ebe5ab', 'active', now() - interval '45 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '6283517d-9e1c-4d59-8b77-7184f5243b42', 'active', now() - interval '14 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '17e24631-e3d5-4437-a2d7-21f80e3dd5e3', 'active', now() - interval '5 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '2ddf8c19-e7b3-4840-941d-93058144136b', 'active', now() - interval '60 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', 'fdceef53-8d58-42f7-b9c4-d06aebbb4ef7', 'active', now() - interval '3 days'),
  ('7010d2d7-9747-4013-b33e-779c86507879', '6b8a7de8-79fe-46f5-8a3d-d627fafa19f7', 'active', now() - interval '25 days');

-- =============================================================================
-- 5. Nutrient Targets — 4 patients with RD-approved targets
-- =============================================================================

-- Patient 1 (Alice)
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '6bddcfc0-4ecf-44d7-bac3-7629eaaf647d', '7010d2d7-9747-4013-b33e-779c86507879',
  1400, 1600, 55, 70, 170, 200, 45, 60, 20, 30, 1500, 2000,
  '5 bolus feeds: 7am, 10am, 12:30pm, 3:30pm, 7pm — 300mL each',
  'Avoid tree nuts. Start new foods one at a time. Keep upright 30min post-feed.',
  'Good candidate for full BTF. Tolerating blends well. Increase fiber gradually.'
);

-- Patient 2 (Bob)
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '48fecf95-78d0-4e55-add1-8740d953359a', '7010d2d7-9747-4013-b33e-779c86507879',
  1800, 2100, 80, 100, 200, 250, 55, 75, 25, 35, 1800, 2200,
  '2 formula feeds (7am, 9pm) + 2 blended meals (12pm, 5pm) — 300mL each',
  'Thicken blends well. Caregiver trained on safe prep. Monitor for aspiration signs.',
  'Hybrid approach: formula for convenience, blends for nutrition variety. Wife is excellent prep partner.'
);

-- Patient 5 (Emma)
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  'd493dfb8-6b55-49b7-840e-e58b66ebe5ab', '7010d2d7-9747-4013-b33e-779c86507879',
  900, 1100, 30, 40, 120, 150, 30, 40, 10, 15, 1000, 1200,
  '4 bolus feeds: 7am, 11:30am, 3:30pm, 7pm — 250mL each',
  'Keep upright 30min post-feed. Watch for retching — reduce volume if needed. No raw honey.',
  'Pediatric patient (8yo). Mom is doing great with blends. Focus on age-appropriate variety.'
);

-- Patient 8 (Henry)
INSERT INTO public.nutrient_targets (
  user_id, set_by,
  calories_min, calories_max, protein_min, protein_max,
  carbs_min, carbs_max, fat_min, fat_max,
  fiber_min, fiber_max, fluids_min, fluids_max,
  feeding_schedule, safety_notes, rd_notes
) VALUES (
  '2ddf8c19-e7b3-4840-941d-93058144136b', '7010d2d7-9747-4013-b33e-779c86507879',
  2000, 2400, 75, 95, 250, 300, 65, 85, 30, 40, 2000, 2500,
  '4 gravity feeds: 7am, 12pm, 5pm, 9pm — 375mL each, 30min per feed',
  'High-calorie needs due to ALS metabolic demands. Monitor weight weekly. High-fiber for constipation.',
  'Progressive condition — prioritize caloric density. Wife prepares all blends. Both very engaged.'
);

-- =============================================================================
-- 6. Reload PostgREST schema cache
-- =============================================================================
NOTIFY pgrst, 'reload schema';
