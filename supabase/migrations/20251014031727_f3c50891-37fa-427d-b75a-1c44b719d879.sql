-- Thêm các trường cấu hình mới vào bảng global_settings
ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS quote_code_format TEXT DEFAULT 'BG-YYYYMMDD-###',
ADD COLUMN IF NOT EXISTS quote_notes TEXT,
ADD COLUMN IF NOT EXISTS dashboard_title TEXT DEFAULT 'Dashboard',
ADD COLUMN IF NOT EXISTS dashboard_description TEXT,
ADD COLUMN IF NOT EXISTS payment_emoji TEXT DEFAULT '🎉',
ADD COLUMN IF NOT EXISTS library_title TEXT DEFAULT 'Thư viện Hạng mục',
ADD COLUMN IF NOT EXISTS library_description TEXT DEFAULT 'Quản lý các hạng mục sản phẩm và dịch vụ';

-- Thêm trường discount_percent vào bảng profiles để lưu tỉ lệ chiết khấu của từng người dùng
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;