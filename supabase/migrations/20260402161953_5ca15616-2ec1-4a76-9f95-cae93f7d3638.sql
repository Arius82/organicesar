
-- Allow masters to update any profile
CREATE POLICY "Masters can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'master'));

-- Create atomic function for completing tasks with rewards
CREATE OR REPLACE FUNCTION public.complete_task_with_reward(
  _task_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
BEGIN
  -- Get task details
  SELECT id, titulo, usuario_id, valor_recompensa, status
  INTO _task
  FROM public.tasks
  WHERE id = _task_id;

  IF _task IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF _task.status = 'concluida' THEN
    RAISE EXCEPTION 'Task already completed';
  END IF;

  -- Update task status
  UPDATE public.tasks
  SET status = 'concluida',
      data_conclusao = CURRENT_DATE
  WHERE id = _task_id;

  -- Update user balance and points atomically
  UPDATE public.profiles
  SET saldo = saldo + _task.valor_recompensa,
      pontos = pontos + 10
  WHERE id = _task.usuario_id;

  -- Insert reward record
  INSERT INTO public.rewards (usuario_id, valor, tipo, descricao)
  VALUES (_task.usuario_id, _task.valor_recompensa, 'credito', _task.titulo || ' - concluída');
END;
$$;
