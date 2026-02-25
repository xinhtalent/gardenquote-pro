-- Insert sample items (hạng mục)
INSERT INTO public.items (name, category, price, unit, user_id) VALUES
('Gạch Ceramic 60x60', 'Vật liệu xây dựng', 285000, 'm²', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Sơn nội thất Dulux', 'Sơn', 1250000, 'thùng', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Cửa gỗ công nghiệp HDF', 'Cửa', 2850000, 'cánh', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Tủ bếp Acrylic cao cấp', 'Nội thất', 8500000, 'mét dài', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Đèn LED downlight âm trần', 'Điện', 185000, 'bộ', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Bồn cầu TOTO 1 khối', 'Thiết bị vệ sinh', 4250000, 'bộ', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Xi măng Holcim PCB40', 'Vật liệu xây dựng', 95000, 'bao', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Gỗ công nghiệp MDF chống ẩm', 'Gỗ', 385000, 'tấm', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Điều hòa Daikin 12000BTU', 'Điện lạnh', 9850000, 'máy', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Lavabo treo tường Viglacera', 'Thiết bị vệ sinh', 1850000, 'bộ', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Kính cường lực 8mm', 'Kính', 650000, 'm²', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Khóa cửa thông minh Xiaomi', 'Điện tử', 3250000, 'bộ', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Đá granite nhân tạo', 'Đá', 1850000, 'm²', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Rèm cửa vải cao cấp', 'Nội thất', 450000, 'm²', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Công lắp đặt điện nước', 'Nhân công', 250000, 'ngày', '03484a96-200b-45c3-9e4e-3410b24c4c84');

-- Insert sample customers (khách hàng)
INSERT INTO public.customers (name, phone, address, user_id) VALUES
('Nguyễn Văn An', '0901234567', '123 Nguyễn Huệ, Quận 1, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Trần Thị Bình', '0912345678', '456 Lê Lợi, Quận 3, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Lê Hoàng Cường', '0923456789', '789 Hai Bà Trưng, Quận 1, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Phạm Minh Đức', '0934567890', '321 Võ Văn Tần, Quận 3, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Hoàng Thu Hà', '0945678901', '654 Pasteur, Quận 1, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Vũ Đình Khoa', '0956789012', '987 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Đỗ Thu Lan', '0967890123', '147 Lý Tự Trọng, Quận 1, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Bùi Văn Minh', '0978901234', '258 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Ngô Thị Nga', '0989012345', '369 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Trịnh Quang Phúc', '0990123456', '741 Cách Mạng Tháng 8, Quận 10, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Lý Thanh Quân', '0901987654', '852 Ba Tháng Hai, Quận 10, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84'),
('Cao Thị Rạng', '0912876543', '963 Sư Vạn Hạnh, Quận 10, TP.HCM', '03484a96-200b-45c3-9e4e-3410b24c4c84');

-- Get customer IDs and item IDs for creating quotes
DO $$
DECLARE
  customer_ids uuid[];
  item_ids uuid[];
  quote_id uuid;
  customer_id uuid;
BEGIN
  -- Get all customer IDs
  SELECT ARRAY_AGG(id) INTO customer_ids FROM public.customers WHERE user_id = '03484a96-200b-45c3-9e4e-3410b24c4c84';
  -- Get all item IDs
  SELECT ARRAY_AGG(id) INTO item_ids FROM public.items WHERE user_id = '03484a96-200b-45c3-9e4e-3410b24c4c84';

  -- Create quotes for different customers
  -- Quote 1: Sửa chữa nhà ở
  customer_id := customer_ids[1];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG001', CURRENT_DATE - INTERVAL '5 days', 'confirmed', 15750000, 'Sửa chữa và nâng cấp phòng khách')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[1], 30, 285000, 8550000
  UNION ALL
  SELECT quote_id, item_ids[2], 4, 1250000, 5000000
  UNION ALL
  SELECT quote_id, item_ids[5], 8, 185000, 1480000
  UNION ALL
  SELECT quote_id, item_ids[15], 3, 250000, 750000;

  -- Quote 2: Thi công nhà bếp
  customer_id := customer_ids[2];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG002', CURRENT_DATE - INTERVAL '3 days', 'confirmed', 28900000, 'Thi công tủ bếp và thiết bị')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[4], 3.2, 8500000, 27200000
  UNION ALL
  SELECT quote_id, item_ids[13], 1, 1850000, 1850000;

  -- Quote 3: Lắp đặt hệ thống điện
  customer_id := customer_ids[3];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG003', CURRENT_DATE - INTERVAL '1 day', 'pending', 12850000, 'Lắp đặt điện và điều hòa')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[5], 15, 185000, 2775000
  UNION ALL
  SELECT quote_id, item_ids[9], 1, 9850000, 9850000
  UNION ALL
  SELECT quote_id, item_ids[15], 1, 250000, 250000;

  -- Quote 4: Xây dựng mới
  customer_id := customer_ids[4];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG004', CURRENT_DATE, 'pending', 45850000, 'Xây dựng nhà cấp 4')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[7], 200, 95000, 19000000
  UNION ALL
  SELECT quote_id, item_ids[1], 80, 285000, 22800000
  UNION ALL
  SELECT quote_id, item_ids[3], 5, 2850000, 14250000;

  -- Quote 5: Phòng tắm
  customer_id := customer_ids[5];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG005', CURRENT_DATE - INTERVAL '7 days', 'confirmed', 11350000, 'Sửa chữa phòng tắm')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[6], 2, 4250000, 8500000
  UNION ALL
  SELECT quote_id, item_ids[10], 1, 1850000, 1850000
  UNION ALL
  SELECT quote_id, item_ids[1], 4, 285000, 1140000;

  -- Quote 6: Nhà thông minh
  customer_id := customer_ids[6];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG006', CURRENT_DATE + INTERVAL '2 days', 'pending', 19500000, 'Lắp đặt hệ thống nhà thông minh')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[12], 4, 3250000, 13000000
  UNION ALL
  SELECT quote_id, item_ids[9], 2, 9850000, 19700000;

  -- Quote 7: Cửa kính
  customer_id := customer_ids[7];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG007', CURRENT_DATE - INTERVAL '10 days', 'confirmed', 8950000, 'Lắp cửa kính phòng khách')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[11], 12, 650000, 7800000
  UNION ALL
  SELECT quote_id, item_ids[15], 5, 250000, 1250000;

  -- Quote 8: Nội thất phòng ngủ
  customer_id := customer_ids[8];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG008', CURRENT_DATE - INTERVAL '2 days', 'pending', 7350000, 'Nội thất phòng ngủ')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[14], 12, 450000, 5400000
  UNION ALL
  SELECT quote_id, item_ids[8], 5, 385000, 1925000;

  -- Quote 9: Sửa chữa tổng thể
  customer_id := customer_ids[9];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG009', CURRENT_DATE - INTERVAL '15 days', 'confirmed', 35700000, 'Sửa chữa toàn bộ căn hộ')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[1], 60, 285000, 17100000
  UNION ALL
  SELECT quote_id, item_ids[2], 8, 1250000, 10000000
  UNION ALL
  SELECT quote_id, item_ids[3], 3, 2850000, 8550000;

  -- Quote 10: Mặt bàn bếp
  customer_id := customer_ids[10];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG010', CURRENT_DATE + INTERVAL '5 days', 'pending', 5550000, 'Mặt bàn đá granite')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[13], 3, 1850000, 5550000;

  -- Quote 11: Cải tạo văn phòng
  customer_id := customer_ids[11];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG011', CURRENT_DATE - INTERVAL '4 days', 'pending', 24150000, 'Cải tạo văn phòng làm việc')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[1], 50, 285000, 14250000
  UNION ALL
  SELECT quote_id, item_ids[9], 3, 9850000, 29550000;

  -- Quote 12: Nội thất gỗ
  customer_id := customer_ids[12];
  INSERT INTO public.quotes (customer_id, user_id, quote_code, date, status, total_amount, notes)
  VALUES (customer_id, '03484a96-200b-45c3-9e4e-3410b24c4c84', 'BG012', CURRENT_DATE - INTERVAL '20 days', 'confirmed', 12425000, 'Thi công nội thất gỗ')
  RETURNING id INTO quote_id;
  
  INSERT INTO public.quote_items (quote_id, item_id, quantity, unit_price, total_price)
  SELECT quote_id, item_ids[8], 20, 385000, 7700000
  UNION ALL
  SELECT quote_id, item_ids[3], 6, 2850000, 17100000;

END $$;