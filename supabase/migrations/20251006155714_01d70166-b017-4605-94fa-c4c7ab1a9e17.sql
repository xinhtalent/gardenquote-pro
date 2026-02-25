-- Set admin role for xinhlife@gmail.com
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'xinhlife@gmail.com';
  
  -- Only proceed if user exists
  IF target_user_id IS NOT NULL THEN
    -- Insert or update role to admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) 
    DO NOTHING;
    
    -- Remove agent role if exists
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND role = 'agent'::app_role;
  END IF;
END $$;