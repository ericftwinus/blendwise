# BlendWise Nutrition

A digital health platform empowering tube-fed individuals to safely prepare homemade blenderized tube feedings (BTF) with expert Registered Dietitian guidance.

## Features

- **RD Assessment** — Comprehensive intake form for personalized nutrition planning
- **Nutrient Targets (ENN)** — Personalized calorie, protein, carb, fat, fiber, and fluid goals
- **BTF Recipes** — Curated blenderized tube feeding recipes with search and filtering
- **Automated Grocery Lists** — Weekly lists generated from nutrient targets and preferences
- **Symptom & Weight Tracking** — Daily logging with GI symptom monitoring
- **Educational Library** — Video content on blending techniques, food safety, and more
- **Caregiver Mode** — Family/caregiver access for coordinated care
- **3-Tier Subscriptions** — Clinical Access, Personalized Automation, Full Convenience
- **Insurance-Billable MNT** — Medical Nutrition Therapy billing support

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Supabase** for auth & database
- **Lucide React** for icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL Editor to create all required tables with Row Level Security.

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
