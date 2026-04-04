
-- 1. Restrict rewards INSERT to masters only (complete_task_with_reward uses SECURITY DEFINER and bypasses RLS)
DROP POLICY IF EXISTS "Authenticated can insert rewards" ON public.rewards;
CREATE POLICY "Masters can insert rewards"
  ON public.rewards FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- 2. Tighten pantry_items DELETE to masters only
DROP POLICY IF EXISTS "Masters can delete pantry" ON public.pantry_items;
CREATE POLICY "Masters can delete pantry"
  ON public.pantry_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- 3. Tighten meal_plans DELETE to masters only
DROP POLICY IF EXISTS "Masters can delete meals" ON public.meal_plans;
CREATE POLICY "Masters can delete meals"
  ON public.meal_plans FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- 4. Tighten shopping_items DELETE to masters only
DROP POLICY IF EXISTS "Authenticated can delete shopping" ON public.shopping_items;
CREATE POLICY "Masters can delete shopping"
  ON public.shopping_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));
