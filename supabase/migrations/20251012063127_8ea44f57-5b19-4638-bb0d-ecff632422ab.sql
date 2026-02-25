-- Add category_order column to quote_items table to store category display order
ALTER TABLE quote_items 
ADD COLUMN category_order integer DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN quote_items.category_order IS 'Display order of the category within the quote';