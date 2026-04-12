-- Add dias_semana column to tasks table
-- Stores an array of weekday integers: 0=Sunday, 1=Monday, ..., 6=Saturday
-- Only relevant when frequencia is 'diaria' or 'semanal'

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS dias_semana integer[] DEFAULT NULL;

COMMENT ON COLUMN public.tasks.dias_semana IS 'Dias da semana que a tarefa deve ser realizada (0=Dom, 1=Seg, ..., 6=Sáb). Usado com frequencia diaria/semanal.';
