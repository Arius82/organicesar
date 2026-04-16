
-- Refinement of update_task_status RPC
-- Ensures all statuses are handled correctly and transitions follow business rules

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
  -- 1. Fetch task
  SELECT * INTO _task FROM public.tasks WHERE id = _task_id;
  IF _task IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;

  -- 2. Check authorization
  _is_master := has_role(auth.uid(), 'master'::app_role);
  
  -- Verify the caller is the task assignee or a master
  IF _task.usuario_id != auth.uid() AND NOT _is_master THEN
    RAISE EXCEPTION 'Not authorized to update this task';
  END IF;

  -- 3. Validate new status
  IF _new_status NOT IN ('pendente', 'em_progresso', 'aguardando_aprovacao', 'concluida', 'rejeitada') THEN
    RAISE EXCEPTION 'Invalid status: %', _new_status;
  END IF;

  -- 4. Role-based transition rules
  IF NOT _is_master THEN
    -- Simple users can ONLY move from 'pendente' or 'rejeitada' to 'aguardando_aprovacao'
    IF NOT ((_task.status IN ('pendente', 'rejeitada')) AND _new_status = 'aguardando_aprovacao') THEN
      RAISE EXCEPTION 'Simple users can only request approval for tasks';
    END IF;
  END IF;

  -- 5. Execution
  
  -- For completion (approval), delegate to reward function
  IF _new_status = 'concluida' THEN
    IF NOT _is_master THEN
      RAISE EXCEPTION 'Only masters can approve/complete tasks';
    END IF;
    PERFORM complete_task_with_reward(_task_id);
    RETURN;
  END IF;

  -- For rejection, revert to pendente and clear completion date
  IF _new_status = 'rejeitada' THEN
    IF NOT _is_master THEN
      RAISE EXCEPTION 'Only masters can reject tasks';
    END IF;
    UPDATE public.tasks 
    SET status = 'pendente', data_conclusao = NULL 
    WHERE id = _task_id;
    RETURN;
  END IF;

  -- Standard status update (pendente, em_progresso, aguardando_aprovacao)
  UPDATE public.tasks 
  SET status = _new_status,
      data_conclusao = CASE WHEN _new_status = 'concluida' THEN now() ELSE data_conclusao END
  WHERE id = _task_id;
END;
$function$;
