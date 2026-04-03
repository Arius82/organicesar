
CREATE OR REPLACE FUNCTION public.sync_pantry_to_shopping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _deficit INTEGER;
  _existing RECORD;
BEGIN
  -- Calculate deficit
  _deficit := NEW.quantidade_minima - NEW.quantidade;

  IF _deficit > 0 THEN
    -- Check if there's already a pending auto-generated item for this product
    SELECT id, quantidade INTO _existing
    FROM public.shopping_items
    WHERE nome_item = NEW.nome_item
      AND gerado_automaticamente = true
      AND status = 'pendente'
    LIMIT 1;

    IF _existing IS NOT NULL THEN
      -- Update existing item quantity (only if auto-generated, user can still edit to higher)
      UPDATE public.shopping_items
      SET quantidade = GREATEST(_deficit, quantidade)
      WHERE id = _existing.id;
    ELSE
      -- Insert new auto-generated shopping item
      INSERT INTO public.shopping_items (nome_item, quantidade, gerado_automaticamente, status)
      VALUES (NEW.nome_item, _deficit, true, 'pendente');
    END IF;
  ELSE
    -- Stock is sufficient, remove auto-generated pending item if exists
    DELETE FROM public.shopping_items
    WHERE nome_item = NEW.nome_item
      AND gerado_automaticamente = true
      AND status = 'pendente';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on insert and update
CREATE TRIGGER trg_sync_pantry_shopping
AFTER INSERT OR UPDATE ON public.pantry_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_pantry_to_shopping();
