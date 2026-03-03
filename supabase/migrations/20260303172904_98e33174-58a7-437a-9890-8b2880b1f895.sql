
-- Drop all existing restrictive policies and recreate as permissive

-- profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "Users can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can delete roles" ON public.user_roles;
CREATE POLICY "Users can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'master'));
CREATE POLICY "Masters can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- tasks
DROP POLICY IF EXISTS "Authenticated can read all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Masters can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Masters can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Masters can delete tasks" ON public.tasks;
CREATE POLICY "Authenticated can read all tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'master') OR auth.uid() = usuario_id);
CREATE POLICY "Masters can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'master') OR auth.uid() = usuario_id);
CREATE POLICY "Masters can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- rewards
DROP POLICY IF EXISTS "Authenticated can read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Masters can insert rewards" ON public.rewards;
CREATE POLICY "Authenticated can read rewards" ON public.rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters can insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'master'));

-- pantry_items
DROP POLICY IF EXISTS "Authenticated can read pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Authenticated can insert pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Authenticated can update pantry" ON public.pantry_items;
DROP POLICY IF EXISTS "Masters can delete pantry" ON public.pantry_items;
CREATE POLICY "Authenticated can read pantry" ON public.pantry_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pantry" ON public.pantry_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pantry" ON public.pantry_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Masters can delete pantry" ON public.pantry_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'master'));

-- shopping_items
DROP POLICY IF EXISTS "Authenticated can read shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can insert shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can update shopping" ON public.shopping_items;
DROP POLICY IF EXISTS "Authenticated can delete shopping" ON public.shopping_items;
CREATE POLICY "Authenticated can read shopping" ON public.shopping_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shopping" ON public.shopping_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shopping" ON public.shopping_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete shopping" ON public.shopping_items FOR DELETE TO authenticated USING (true);

-- meal_plans
DROP POLICY IF EXISTS "Authenticated can read meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Authenticated can insert meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Authenticated can update meals" ON public.meal_plans;
DROP POLICY IF EXISTS "Masters can delete meals" ON public.meal_plans;
CREATE POLICY "Authenticated can read meals" ON public.meal_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert meals" ON public.meal_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update meals" ON public.meal_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Masters can delete meals" ON public.meal_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'master'));
