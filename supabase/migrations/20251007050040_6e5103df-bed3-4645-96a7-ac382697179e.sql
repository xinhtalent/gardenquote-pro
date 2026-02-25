-- Update RLS policy for quotes to allow agents to see quotes for their assigned customers
DROP POLICY IF EXISTS "Users can view their own quotes or admins can view all" ON quotes;

CREATE POLICY "Users can view quotes for their assigned customers or admins can view all"
ON quotes
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = quotes.customer_id 
    AND customers.user_id = auth.uid()
  )
);

-- Update RLS policy for quote_items to match the new quotes policy
DROP POLICY IF EXISTS "Users can view quote items for accessible quotes" ON quote_items;

CREATE POLICY "Users can view quote items for accessible quotes"
ON quote_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotes
    LEFT JOIN customers ON customers.id = quotes.customer_id
    WHERE quotes.id = quote_items.quote_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR customers.user_id = auth.uid())
  )
);

-- Update other quote_items policies similarly
DROP POLICY IF EXISTS "Users can insert quote items for accessible quotes" ON quote_items;

CREATE POLICY "Users can insert quote items for accessible quotes"
ON quote_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    LEFT JOIN customers ON customers.id = quotes.customer_id
    WHERE quotes.id = quote_items.quote_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR customers.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update quote items for accessible quotes" ON quote_items;

CREATE POLICY "Users can update quote items for accessible quotes"
ON quote_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quotes
    LEFT JOIN customers ON customers.id = quotes.customer_id
    WHERE quotes.id = quote_items.quote_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR customers.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete quote items for accessible quotes" ON quote_items;

CREATE POLICY "Users can delete quote items for accessible quotes"
ON quote_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM quotes
    LEFT JOIN customers ON customers.id = quotes.customer_id
    WHERE quotes.id = quote_items.quote_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR customers.user_id = auth.uid())
  )
);