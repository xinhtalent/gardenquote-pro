-- Update RLS policies for items table to allow everyone to view all items
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view items" ON public.items;

-- Create new policy allowing everyone to view all items (no user_id filter)
CREATE POLICY "Everyone can view all items"
ON public.items
FOR SELECT
USING (true);

-- Keep other policies unchanged for insert, update, delete
-- These remain as "Anyone authenticated can..." which is appropriate