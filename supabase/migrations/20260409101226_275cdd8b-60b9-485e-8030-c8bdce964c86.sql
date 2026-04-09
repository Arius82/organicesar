
CREATE OR REPLACE FUNCTION public.update_task_status(_task_id uuid, _new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _task RECORD;
  _is_master BOOLEAN;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = _task_id;
  IF _task IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;

  _is_master := has_role(auth.uid(), 'master'::app_role);

  -- Verify the caller is the task assignee or a master
  IF _task.usuario_id != auth.uid() AND NOT _is_master THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate status value
  IF _new_status NOT IN ('pendente', 'em_progresso', 'aguardando_aprovacao', 'concluida', 'rejeitada') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- Role-based transition rules
  IF NOT _is_master THEN
    -- Simple users can only move pendente -> aguardando_aprovacao
    IF NOT (_task.status = 'pendente' AND _new_status = 'aguardando_aprovacao') THEN
      RAISE EXCEPTION 'Not authorized for this status transition';
    END IF;
  END IF;

  -- For completion, delegate to complete_task_with_reward
  IF _new_status = 'concluida' THEN
    PERFORM complete_task_with_reward(_task_id);
    RETURN;
  END IF;

  -- For rejection, revert to pendente
  IF _new_status = 'rejeitada' THEN
    UPDATE public.tasks SET status = 'pendente', data_conclusao = NULL WHERE id = _task_id;
    RETURN;
  END IF;

  UPDATE public.tasks SET status = _new_status WHERE id = _task_id;
END;
$function$;
