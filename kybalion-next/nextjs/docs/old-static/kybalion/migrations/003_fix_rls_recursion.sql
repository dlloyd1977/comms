-- ============================================================
-- Migration 003: Fix infinite recursion in active_members RLS
-- The admin policies were querying active_members inside a
-- policy ON active_members, causing infinite recursion.
-- Fix: Use a SECURITY DEFINER function to check admin status.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Drop the broken recursive policies
DROP POLICY IF EXISTS "Admin full read access" ON active_members;
DROP POLICY IF EXISTS "Admin full write access" ON active_members;

-- 2. Create a SECURITY DEFINER function to check admin status
--    (bypasses RLS so it won't recurse)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM active_members
    WHERE email = auth.jwt() ->> 'email'
      AND "group" = 'admin'
  );
$$;

-- 3. Recreate admin policies using the function (no recursion)
CREATE POLICY "Admin full read access"
  ON active_members
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin full write access"
  ON active_members
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- DONE. Test by saving your profile again.
-- ============================================================
