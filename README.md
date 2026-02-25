# 🌿 XINH APP – Smart Quotation & Business Management Platform  

> Ứng dụng web mô-đun hoá giúp doanh nghiệp **tạo báo giá, quản lý khách hàng, và trao đổi công việc** nhanh chóng – mọi lúc, mọi nơi.

---

## 🎯 Mục đích
XINH App được thiết kế như **một hệ thống quản lý báo giá và khách hàng thông minh**, hoạt động mượt mà trên cả **máy tính và điện thoại**.  
Mục tiêu: giúp nhân viên và chủ doanh nghiệp **giảm 70% thao tác thủ công**, **tăng tốc độ xử lý báo giá** và **tập trung vào khách hàng** thay vì giấy tờ.

Ứng dụng có thể:
- Tạo và gửi báo giá chuyên nghiệp chỉ trong vài chạm.  
- Quản lý danh sách khách hàng, hạng mục, và lịch sử giao dịch.  
- Tự động tính tạm tính, chiết khấu, VAT, tổng cộng.  
- Làm việc **ngoại tuyến (offline)** và **đồng bộ lại khi có mạng**.  
- Trò chuyện trực tiếp với khách hàng qua **Zalo OA / Facebook Page** ngay trong app.  

---

## ⚙️ Cấu trúc ứng dụng

```
src/
 ├── components/       # Các thành phần UI tái sử dụng (nút, modal, bảng, form...)
 ├── pages/            # Các màn hình chính của ứng dụng (Dashboard, QuoteDetail, Settings...)
 ├── hooks/            # Custom hooks cho logic xử lý trạng thái, API, offline-sync
 ├── lib/              # Các hàm tiện ích (Supabase, PDF, format tiền, ngày tháng)
 ├── assets/           # Icon, logo, font, hình minh họa
 ├── styles/           # File CSS/Tailwind chính và cấu hình giao diện
 └── app.tsx           # Cấu hình router, layout, theme (Light/Dark)
```

---

## 🧩 Chức năng chính

### **1. Cơ bản**
- 🔐 **Đăng nhập & phân quyền** (Admin / Nhân viên).  
- 👤 **Quản lý khách hàng**: thêm, sửa, tìm kiếm, lưu lịch sử báo giá.  
- 🧾 **Tạo báo giá nhanh**: chọn khách, chọn hạng mục, tự tính toán chiết khấu, VAT.  
- 🖨️ **In & tải PDF** đẹp chuẩn thương hiệu.  
- 🌗 **Chế độ sáng/tối** đổi giao diện tức thì.  
- 🏠 **Nút Home nổi** tiện lợi trên di động.  

### **2. Nâng cao**
- 💬 **Chat Zalo / Facebook** ngay trong ứng dụng.  
  → Nhân viên trả lời tin nhắn khách hàng, tạo báo giá trực tiếp từ cuộc hội thoại.  
- 🧠 **Tự động sinh mã báo giá & quản lý trạng thái** (Liên hệ → Đã khảo sát → Đã báo giá → Đã cọc → Hoàn tất).  
- 📊 **Dashboard tổng quan**: thống kê báo giá, khách hàng, tỷ lệ chốt đơn, doanh thu.  
- 🔄 **Offline Sync**: tạo báo giá khi không có mạng, tự đồng bộ khi online.  
- ⚡ **Hiệu năng cao**: điều hướng cử chỉ mượt, tối ưu trải nghiệm di động.  

### **3. Tối thượng / mở rộng**
- 🧾 **Tích hợp thanh toán & VietQR** trong báo giá.  
- 🏢 **Tùy chỉnh thương hiệu** (logo, tên công ty, thông tin ngân hàng).  
- 🌍 **PWA hoàn chỉnh** – cài như ứng dụng native.  
- 📦 **Module mở rộng**: báo cáo doanh thu, quản lý tồn kho, xuất nhập vật tư.  
- 🔑 **Quản lý gói sử dụng** (Free, Pro, Enterprise, Full-code License).  

---

## 💰 Quản lý gói sử dụng (Plans)
| Gói | Tính năng | Giá tham khảo |
|------|------------|----------------|
| **Free / Trial** | Tạo tối đa 5 báo giá, lưu local | 0đ |
| **Pro** | Không giới hạn báo giá, xuất PDF, đồng bộ cloud | 199k–499k/tháng |
| **Business** | Nhiều user, báo cáo, offline sync, domain riêng | 1–3 triệu/tháng |
| **Full-code License** | Giao toàn bộ mã nguồn + hỗ trợ triển khai | 80–150 triệu (trọn đời) |

---

## 🧱 Công nghệ sử dụng
- **React + Vite / Next.js** (frontend SPA)  
- **Supabase** (database, auth, storage, realtime)  
- **TailwindCSS + shadcn/ui** (UI framework)  
- **PWA** (service worker + offline caching)  
- **IndexedDB / localforage** (offline data storage)  
- **Zalo OA API** + **Facebook Messenger API** (tích hợp chat)  

---

## 🚀 Hướng phát triển sắp tới
- [ ] Tích hợp **AI gợi ý báo giá** dựa trên lịch sử khách hàng.  
- [ ] Đồng bộ **Google Drive / Sheets** cho báo cáo.  
- [ ] Gửi **Email / ZNS tự động** khi báo giá mới tạo.  
- [ ] Triển khai **Mobile App bản native** (React Native / Capacitor).  

---

## 🧑‍💼 Liên hệ & Triển khai
- **Website:** https://bancongxinh.vn / https://xinhcrm.vn  
- **Email:** support@xinhcrm.vn  
- **Phiên bản:** 1.0.0 (Beta)  

---
