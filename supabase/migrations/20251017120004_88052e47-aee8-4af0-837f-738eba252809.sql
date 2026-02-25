-- Add mode column to items table
ALTER TABLE public.items 
ADD COLUMN mode text NOT NULL DEFAULT 'standard'
CHECK (mode IN ('standard', 'auto_quantity', 'customizable'));

-- Add dimension and variant columns to quote_items table
ALTER TABLE public.quote_items 
ADD COLUMN dimension_1 numeric,
ADD COLUMN dimension_2 numeric,
ADD COLUMN dimension_unit_1 text,
ADD COLUMN dimension_unit_2 text,
ADD COLUMN variant_length numeric,
ADD COLUMN variant_width numeric,
ADD COLUMN variant_height numeric,
ADD COLUMN variant_thickness numeric,
ADD COLUMN variant_color text;

-- Add comments for clarity
COMMENT ON COLUMN items.mode IS 'Item calculation mode: standard (manual), auto_quantity (auto from dimensions), customizable (with variants)';
COMMENT ON COLUMN quote_items.dimension_1 IS 'First dimension in meters (for auto_quantity mode)';
COMMENT ON COLUMN quote_items.dimension_2 IS 'Second dimension in meters (for auto_quantity mode)';
COMMENT ON COLUMN quote_items.variant_length IS 'Variant length in meters (for customizable mode)';
COMMENT ON COLUMN quote_items.variant_width IS 'Variant width in meters (for customizable mode)';
COMMENT ON COLUMN quote_items.variant_height IS 'Variant height in meters (for customizable mode)';
COMMENT ON COLUMN quote_items.variant_thickness IS 'Variant thickness in cm (for customizable mode)';
COMMENT ON COLUMN quote_items.variant_color IS 'Variant color (for customizable mode)';