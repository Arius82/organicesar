-- Update tasks table to support recurring tasks with specific weekdays
-- Fixes the issue where tasks were not being saved due to missing columns

ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS dias_semana integer[] DEFAULT NULL;

-- Ensure the insert policy is robust
-- We drop and recreate it to be sure it matches the expected behavior
DROP POLICY IF EXISTS "Masters can insert tasks" ON public.tasks;
CREATE POLICY "Masters can insert tasks" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'master') OR 
  auth.uid() = usuario_id
);

-- Documentation
COMMENT ON COLUMN public.tasks.dias_semana IS 'Array of integers (0-6) representing days of the week for recurring tasks.';
