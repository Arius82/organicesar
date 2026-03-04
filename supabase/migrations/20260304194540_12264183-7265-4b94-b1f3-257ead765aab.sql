
-- Fix ALL RLS policies to PERMISSIVE

-- PROFILES
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read all profiles" ON public.profiles
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can delete roles" ON public.user_roles;

CREATE POLICY "Users can read all roles" ON public.user_roles
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Masters can insert roles" ON public.user_roles
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can update roles" ON public.user_roles
AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can delete roles" ON public.user_roles
AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'master'::app_role));

-- TASKS
DROP POLICY IF EXISTS "Authenticated can read all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Masters can delete tasks" ON public.tasks;

CREATE POLICY "Authenticated can read all tasks" ON public.tasks
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert tasks" ON public.tasks
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR auth.uid() = usuario_id);

CREATE POLICY "Authenticated can update tasks" ON public.tasks
AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'master'::app_role) OR auth.uid() = usuario_id);

CREATE POLICY "Masters can delete tasks" ON public.tasks
AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'master'::app_role));

-- REWARDS
DROP POLICY IF EXISTS "Authenticated can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Authenticated can insert rewards" ON public.rewards;

CREATE POLICY "Authenticated can read rewards" ON public.rewards
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert rewards" ON public.rewards
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

-- PANTRY_ITEMS
DROP POLICY IF EXISTS "Authenticated can read pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Authenticated can insert pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Authenticated can update pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Masters can delete pantry" ON public.pantry_items;

CREATE POLICY "Authenticated can read pantry" ON public.pantry_items
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert pantry" ON public.pantry_items
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update pantry" ON public.pantry_items
AS PERMISSIVE FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Masters can delete pantry" ON public.pantry_items
AS PERMISSIVE FOR DELETE TO authenticated USING (true);

-- SHOPPING_ITEMS
DROP POLICY IF EXISTS "Authenticated can read shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can insert shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can update shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can delete shopping" ON public.shopping_items;

CREATE POLICY "Authenticated can read shopping" ON public.shopping_items
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert shopping" ON public.shopping_items
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update shopping" ON public.shopping_items
AS PERMISSIVE FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete shopping" ON public.shopping_items
AS PERMISSIVE FOR DELETE TO authenticated USING (true);

-- MEAL_PLANS
DROP POLICY IF EXISTS "Authenticated can read meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Authenticated can insert meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Authenticated can update meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Masters can delete meals" ON public.meal_plans;

CREATE POLICY "Authenticated can read meals" ON public.meal_plans
AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert meals" ON public.meal_plans
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update meals" ON public.meal_plans
AS PERMISSIVE FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Masters can delete meals" ON public.meal_plans
AS PERMISSIVE FOR DELETE TO authenticated USING (true);
