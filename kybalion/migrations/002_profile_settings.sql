-- ============================================================
-- Migration 002: Profile Settings & Enhanced Signup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Add optional profile columns to active_members
-- ────────────────────────────────────────────────────
ALTER TABLE active_members ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE active_members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE active_members ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE active_members ADD COLUMN IF NOT EXISTS middle_initial text;

-- 2. Update the auto-enrollment trigger to capture first/last name from signup metadata
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.active_members (email, first_name, last_name, status, "group", date_created)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'active',
    'member',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET first_name = COALESCE(EXCLUDED.first_name, active_members.first_name),
        last_name  = COALESCE(EXCLUDED.last_name, active_members.last_name);
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS policies for profile self-service
-- ────────────────────────────────────────────────────
-- Enable RLS (safe if already enabled)
ALTER TABLE active_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own row
DROP POLICY IF EXISTS "Members can view own profile" ON active_members;
CREATE POLICY "Members can view own profile"
  ON active_members
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Allow authenticated users to update their own row (profile fields only)
DROP POLICY IF EXISTS "Members can update own profile" ON active_members;
CREATE POLICY "Members can update own profile"
  ON active_members
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Admin full access (select all rows)
DROP POLICY IF EXISTS "Admin full read access" ON active_members;
CREATE POLICY "Admin full read access"
  ON active_members
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM active_members WHERE "group" = 'admin'
    )
  );

-- Admin full write access
DROP POLICY IF EXISTS "Admin full write access" ON active_members;
CREATE POLICY "Admin full write access"
  ON active_members
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM active_members WHERE "group" = 'admin'
    )
  );

-- Service role (trigger) bypass - the trigger uses SECURITY DEFINER so it bypasses RLS
-- No additional policy needed for the trigger.

-- ============================================================
-- DONE. Verify with:
--   SELECT * FROM active_members LIMIT 5;
-- ============================================================
