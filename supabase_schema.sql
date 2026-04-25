-- ============================================================
-- MediBook — Supabase SQL Setup
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'PATIENT'
              CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.specialties (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty_id     UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  bio              TEXT,
  experience_years INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Trigger: auto-create profile on auth.users insert ───────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'PATIENT'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own; service role bypasses RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Specialties & Doctors: public read
CREATE POLICY "Specialties are publicly readable"
  ON public.specialties FOR SELECT USING (true);

CREATE POLICY "Doctors are publicly readable"
  ON public.doctors FOR SELECT USING (true);

-- Appointments: patients see their own; doctors see their own
CREATE POLICY "Patients see own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors see their appointments"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT profile_id FROM public.doctors WHERE id = doctor_id
    )
  );

-- NOTE: All write operations go through the Express API using the
-- service role key, which bypasses RLS — no additional write policies needed.

-- ── Seed Data ────────────────────────────────────────────────

INSERT INTO public.specialties (name, description) VALUES
  ('General Practice',    'Primary care for common illnesses and routine check-ups.'),
  ('Cardiology',          'Diagnosis and treatment of heart and blood vessel conditions.'),
  ('Dermatology',         'Care for skin, hair, and nail conditions.'),
  ('Orthopedics',         'Bone, joint, and muscle conditions and injuries.'),
  ('Pediatrics',          'Medical care for infants, children, and adolescents.'),
  ('Neurology',           'Disorders of the brain, spinal cord, and nervous system.'),
  ('Ophthalmology',       'Eye diseases and vision care.'),
  ('ENT',                 'Ear, nose, and throat conditions.'),
  ('Psychiatry',          'Mental health diagnosis and treatment.'),
  ('Gynecology',          'Women''s reproductive health and hormonal conditions.');
