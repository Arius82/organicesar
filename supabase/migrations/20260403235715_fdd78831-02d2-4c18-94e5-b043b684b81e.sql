
-- 1. Trigger: when shopping item marked as "comprado", update pantry stock
CREATE OR REPLACE FUNCTION public.sync_shopping_to_pantry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status changes to 'comprado'
  IF NEW.status = 'comprado' AND (OLD.status IS NULL OR OLD.status = 'pendente') THEN
    -- Update pantry item quantity if it exists
    UPDATE public.pantry_items
    SET quantidade = quantidade + NEW.quantidade
    WHERE nome_item = NEW.nome_item;
  END IF;
  
  -- If status changes back to 'pendente' from 'comprado', reverse
  IF NEW.status = 'pendente' AND OLD.status = 'comprado' THEN
    UPDATE public.pantry_items
    SET quantidade = GREATEST(0, quantidade - NEW.quantidade)
    WHERE nome_item = NEW.nome_item;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_shopping_to_pantry
AFTER UPDATE ON public.shopping_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_shopping_to_pantry();

-- 2. Function: auto update user level based on points
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_level TEXT;
BEGIN
  IF NEW.pontos >= 301 THEN
    _new_level := 'Mestre da Casa';
  ELSIF NEW.pontos >= 101 THEN
    _new_level := 'Organizado';
  ELSE
    _new_level := 'Iniciante';
  END IF;
  
  IF NEW.nivel IS DISTINCT FROM _new_level THEN
    NEW.nivel := _new_level;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_user_level
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_level();

-- 3. Update complete_task_with_reward to handle streak and recurring tasks
CREATE OR REPLACE FUNCTION public.complete_task_with_reward(_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
  _last_completion DATE;
  _new_date_limite DATE;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = _task_id;

  IF _task IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
  IF _task.status = 'concluida' THEN RAISE EXCEPTION 'Task already completed'; END IF;

  -- Update task status
  UPDATE public.tasks
  SET status = 'concluida', data_conclusao = CURRENT_DATE
  WHERE id = _task_id;

  -- Update user balance and points
  UPDATE public.profiles
  SET saldo = saldo + _task.valor_recompensa,
      pontos = pontos + 10
  WHERE id = _task.usuario_id;

  -- Insert reward record
  INSERT INTO public.rewards (usuario_id, valor, tipo, descricao)
  VALUES (_task.usuario_id, _task.valor_recompensa, 'credito', _task.titulo || ' - concluída');

  -- Update streak
  SELECT MAX(data_conclusao) INTO _last_completion
  FROM public.tasks
  WHERE usuario_id = _task.usuario_id
    AND status = 'concluida'
    AND id != _task_id;

  IF _last_completion = CURRENT_DATE - INTERVAL '1 day' OR _last_completion = CURRENT_DATE THEN
    UPDATE public.profiles
    SET sequencia_dias = sequencia_dias + 1
    WHERE id = _task.usuario_id;
  ELSIF _last_completion IS NULL OR _last_completion < CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles
    SET sequencia_dias = 1
    WHERE id = _task.usuario_id;
  END IF;

  -- Create recurring task if applicable
  IF _task.frequencia = 'diaria' THEN
    _new_date_limite := CURRENT_DATE + INTERVAL '1 day';
  ELSIF _task.frequencia = 'semanal' THEN
    _new_date_limite := CURRENT_DATE + INTERVAL '7 days';
  ELSIF _task.frequencia = 'mensal' THEN
    _new_date_limite := CURRENT_DATE + INTERVAL '1 month';
  END IF;

  IF _new_date_limite IS NOT NULL THEN
    INSERT INTO public.tasks (titulo, descricao, usuario_id, frequencia, valor_recompensa, data_limite, created_by)
    VALUES (_task.titulo, _task.descricao, _task.usuario_id, _task.frequencia, _task.valor_recompensa, _new_date_limite, _task.created_by);
  END IF;
END;
$$;
