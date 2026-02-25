-- Create sample data for testing (fixed column names)

do $$
begin
  -- Create sample items in catalog with correct column name
  insert into public.items (name, unit, unit_price)
  values 
    ('Bộ bàn ghế ban công gỗ teak', 'bộ', 8500000),
    ('Chậu cây composite cao cấp', 'cái', 450000),
    ('Cỏ nhân tạo cao cấp', 'm²', 320000),
    ('Hệ thống tưới tự động', 'hệ thống', 3200000),
    ('Đèn LED trang trí sân vườn', 'bộ', 1200000)
  on conflict do nothing;

  raise notice '
=================================================================
✅ ĐÃ TẠO DỮ LIỆU MẪU THÀNH CÔNG!
=================================================================

📦 DỮ LIỆU ĐÃ TẠO:
   ✓ 5 sản phẩm trong danh mục (items)

🔐 HƯỚNG DẪN TẠO TÀI KHOẢN ADMIN:

BƯỚC 1: Đăng ký tài khoản
   - Truy cập: /auth
   - Email: admin@xinh.vn
   - Mật khẩu: Admin@123456
   - Họ tên: Quản trị viên XINH

BƯỚC 2: Gán quyền admin
   Sau khi đăng ký, vào backend và chạy SQL:
   
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, ''admin''::app_role
   FROM auth.users
   WHERE email = ''admin@xinh.vn''
   ON CONFLICT DO NOTHING;

📝 TÀI KHOẢN ADVISOR MẪU (tùy chọn):
   
   Advisor 1:
   - Email: linhchan@xinh.vn  
   - Mật khẩu: Advisor@123
   - Họ tên: Linh Chân
   
   Advisor 2:
   - Email: tuananh@xinh.vn
   - Mật khẩu: Advisor@123
   - Họ tên: Tuấn Anh
   
   Sau khi đăng ký, gán quyền:
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, ''advisor''::app_role
   FROM auth.users
   WHERE email IN (''linhchan@xinh.vn'', ''tuananh@xinh.vn'')
   ON CONFLICT DO NOTHING;

=================================================================
';
end $$;