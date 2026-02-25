-- Clear existing categories and units that don't match
DELETE FROM public.categories;
DELETE FROM public.units;

-- Insert categories based on actual data in items table
INSERT INTO public.categories (name, display_order) VALUES
  ('Chậu', 1),
  ('Cây & vật tư phụ', 2),
  ('Phụ kiện', 3),
  ('Hệ thống điện decor', 4),
  ('Xây/lát/ốp trát', 5),
  ('Đá cuội decor', 6),
  ('Hệ thống nước', 7),
  ('Vận chuyển + Công thợ', 8),
  ('Bảo hành/bảo dưỡng', 9),
  ('Thiết kế', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert units based on actual data in items table
INSERT INTO public.units (name) VALUES
  ('cây'),
  ('chiếc'),
  ('bao'),
  ('gói'),
  ('set'),
  ('m'),
  ('m2'),
  ('m3'),
  ('VC'),
  ('CT'),
  ('cái'),
  ('bộ'),
  ('hộp'),
  ('tấn'),
  ('kg'),
  ('g'),
  ('lít'),
  ('viên'),
  ('thùng'),
  ('năm')
ON CONFLICT (name) DO NOTHING;