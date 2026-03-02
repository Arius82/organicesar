
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('master', 'simples');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  saldo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  pontos INTEGER NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Iniciante',
  sequencia_dias INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only masters can manage roles
CREATE POLICY "Masters can insert roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'master'));
CREATE POLICY "Masters can delete roles" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'master'));

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  frequencia TEXT NOT NULL DEFAULT 'unica',
  valor_recompensa NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_limite DATE,
  data_conclusao DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read all tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters can insert tasks" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'master') OR auth.uid() = usuario_id);
CREATE POLICY "Masters can update tasks" ON public.tasks FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'master') OR auth.uid() = usuario_id);
CREATE POLICY "Masters can delete tasks" ON public.tasks FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'master'));

-- Rewards history table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  data DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read rewards" ON public.rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Masters can insert rewards" ON public.rewards FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Pantry items table
CREATE TABLE public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_item TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT '',
  validade DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pantry" ON public.pantry_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pantry" ON public.pantry_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pantry" ON public.pantry_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Masters can delete pantry" ON public.pantry_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'master'));

-- Shopping items table
CREATE TABLE public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_item TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente',
  gerado_automaticamente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read shopping" ON public.shopping_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shopping" ON public.shopping_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shopping" ON public.shopping_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete shopping" ON public.shopping_items FOR DELETE TO authenticated USING (true);

-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  refeicao TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  ingredientes_relacionados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read meals" ON public.meal_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert meals" ON public.meal_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update meals" ON public.meal_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Masters can delete meals" ON public.meal_plans FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'master'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  
  -- Default role is 'simples'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'simples'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
