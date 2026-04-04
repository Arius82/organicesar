
-- 1. Create RPC for non-master task status updates (only allows status changes)
CREATE OR REPLACE FUNCTION public.update_task_status(_task_id uuid, _new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = _task_id;
  IF _task IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
  
  -- Verify the caller is the task assignee or a master
  IF _task.usuario_id != auth.uid() AND NOT has_role(auth.uid(), 'master'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Only allow valid status transitions
  IF _new_status NOT IN ('pendente', 'em_progresso', 'concluida') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  
  -- For completion, delegate to complete_task_with_reward
  IF _new_status = 'concluida' THEN
    PERFORM complete_task_with_reward(_task_id);
    RETURN;
  END IF;
  
  UPDATE public.tasks SET status = _new_status WHERE id = _task_id;
END;
$$;

-- 2. Restrict tasks UPDATE policy to masters only (non-masters use RPC)
DROP POLICY IF EXISTS "Authenticated can update tasks" ON public.tasks;
CREATE POLICY "Masters can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- 3. Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- 4. Drop existing public SELECT policy on avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 5. Add authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- 6. Ensure upload/update/delete policies exist scoped to user folders
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
