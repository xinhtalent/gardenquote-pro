-- Create categories table for item categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Create units table for item units
CREATE TABLE IF NOT EXISTS public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for units
CREATE POLICY "Everyone can view units"
  ON public.units
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert units"
  ON public.units
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update units"
  ON public.units
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete units"
  ON public.units
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.categories (name, display_order) VALUES
  ('Máy móc thiết bị', 1),
  ('Vật tư xây dựng', 2),
  ('Gạch ốp lát', 3),
  ('Xi măng', 4),
  ('Xây/lát/ốp trát', 5),
  ('Sắt thép', 6),
  ('Đá cát', 7),
  ('Ván khuân', 8),
  ('Cấp thoát nước', 9),
  ('Điện & Điện nhẹ', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert default units
INSERT INTO public.units (name) VALUES
  ('cái'),
  ('chiếc'),
  ('bộ'),
  ('hộp'),
  ('tấn'),
  ('kg'),
  ('g'),
  ('lít'),
  ('m'),
  ('m2'),
  ('m3'),
  ('viên'),
  ('gói'),
  ('thùng'),
  ('bao')
ON CONFLICT (name) DO NOTHING;