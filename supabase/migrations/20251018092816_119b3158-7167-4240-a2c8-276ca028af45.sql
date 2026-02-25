-- Add pot_type column to items table (for customizable mode)
ALTER TABLE public.items 
ADD COLUMN pot_type TEXT;

-- Add variant_layers to quote_items (for Baki pots)
ALTER TABLE public.quote_items 
ADD COLUMN variant_layers INTEGER;

-- Create pot_pricing_settings table for admin configuration
CREATE TABLE public.pot_pricing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Material pricing by thickness (in cm)
  price_08cm NUMERIC NOT NULL DEFAULT 20529,
  price_10cm NUMERIC NOT NULL DEFAULT 24262,
  price_12cm NUMERIC NOT NULL DEFAULT 28367,
  price_15cm NUMERIC NOT NULL DEFAULT 35459,
  price_17cm NUMERIC NOT NULL DEFAULT 41058,
  
  -- Pot type multipliers
  multiplier_regular_low NUMERIC NOT NULL DEFAULT 2.4,      -- <150k
  multiplier_regular_mid NUMERIC NOT NULL DEFAULT 2.2,      -- 150k-<300k
  multiplier_regular_high NUMERIC NOT NULL DEFAULT 2.0,     -- ≥300k
  multiplier_curved NUMERIC NOT NULL DEFAULT 3.0,
  multiplier_landscape NUMERIC NOT NULL DEFAULT 3.0,
  multiplier_fence NUMERIC NOT NULL DEFAULT 2.6,
  multiplier_baki NUMERIC NOT NULL DEFAULT 3.0,
  multiplier_fiberglass NUMERIC NOT NULL DEFAULT 1250000,   -- Special: price per 10,000 m²
  multiplier_aquarium NUMERIC NOT NULL DEFAULT 3.5,
  
  -- Price thresholds for regular pots
  threshold_low NUMERIC NOT NULL DEFAULT 150000,
  threshold_high NUMERIC NOT NULL DEFAULT 300000,
  
  -- Minimum charge and rounding
  min_charge NUMERIC NOT NULL DEFAULT 0,
  rounding_mode TEXT NOT NULL DEFAULT '1000' CHECK (rounding_mode IN ('1000', '5000', '10000'))
);

-- Enable RLS
ALTER TABLE public.pot_pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view pot pricing settings"
  ON public.pot_pricing_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert pot pricing settings"
  ON public.pot_pricing_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update pot pricing settings"
  ON public.pot_pricing_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete pot pricing settings"
  ON public.pot_pricing_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_pot_pricing_settings_updated_at
  BEFORE UPDATE ON public.pot_pricing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.pot_pricing_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;