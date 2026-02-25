-- Fix function search path for security
ALTER FUNCTION public.generate_item_sku() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_item_sku() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user_role() SET search_path = public;
ALTER FUNCTION public.transfer_quotes_on_customer_reassign() SET search_path = public;
ALTER FUNCTION public.auto_expire_pending_quotes() SET search_path = public;
ALTER FUNCTION public.auto_restore_cancelled_quotes() SET search_path = public;