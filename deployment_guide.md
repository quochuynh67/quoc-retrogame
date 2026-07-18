# 🚀 Hướng Dẫn Vận Hành: Run, Build & Deploy

Tài liệu này tổng hợp toàn bộ các bước chi tiết để **Chạy thử (Run)**, **Biên dịch (Build)**, và **Triển khai (Deploy)** cho hai dự án của bạn:
1. **`quoc-porfolio`** (Giao diện chính Flutter Web)
2. **`nostalgist-demo`** (Ứng dụng Vlog ReactJS/Vite)

---

## 💙 1. Dự án `quoc-porfolio` (Flutter Web)

Dự án này là cổng thông tin Portfolio chính thức của bạn, được xây dựng bằng Flutter Web.

### 🔑 Chuẩn bị cấu hình (Local Keys)
Các khóa API được quản lý bảo mật thông qua file `supabase_keys.json` nằm tại thư mục gốc của dự án. File này đã được thêm vào `.gitignore` để tránh bị lộ khóa lên GitHub.

**Cấu trúc file `supabase_keys.json`:**
```json
{
  "SUPABASE_URL": "https://meddohfaywowscwmefxn.supabase.co",
  "SUPABASE_ANON_KEY": "<THAY-BANG-PUBLISHABLE-KEY-CUA-BAN>"
}
```

### 🏃‍♂️ Chạy thử (Local Run)
Để chạy thử ứng dụng trên môi trường Local Chrome, sử dụng lệnh sau:
```bash
# Di chuyển vào thư mục dự án
cd quoc-porfolio

# Khởi chạy trên Chrome với file config chứa API keys
flutter run -d chrome --dart-define-from-file=supabase_keys.json
```

### 📦 Biên dịch (Build Production)
Để tạo bản build hoàn chỉnh, tối ưu hóa hiệu năng Canvaskit cho Web:
```bash
# Biên dịch sang bản web tĩnh
flutter build web --release --dart-define-from-file=supabase_keys.json
```
> Bản build sau khi hoàn tất sẽ nằm tại thư mục `build/web/`.

### 🚀 Triển khai (Deploy Firebase)
Sau khi build xong, bạn có thể triển khai lên Firebase Hosting của Portfolio:
```bash
# Deploy lên Firebase
firebase deploy --only hosting
```

---

## ⚡ 2. Dự án `nostalgist-demo` (ReactJS / Vite)

Dự án này quản lý ứng dụng Vlog, trình chơi game Retro và Emulator, được tích hợp qua iframe vào Portfolio.

### 🔑 Chuẩn bị cấu hình (Environment Variables)
Các cấu hình Supabase được quản lý qua biến môi trường của Vite ở file `.env` tại thư mục gốc.

**Cấu trúc file `.env`:**
```env
VITE_SUPABASE_URL=https://meddohfaywowscwmefxn.supabase.co
VITE_SUPABASE_ANON_KEY=<THAY-BANG-PUBLISHABLE-KEY-CUA-BAN>
```

### 🏃‍♂️ Chạy thử (Local Run)
Để khởi chạy máy chủ phát triển local:
```bash
# Di chuyển vào thư mục dự án
cd nostalgist-demo

# Cài đặt thư viện (nếu cần thiết lần đầu)
npm install

# Chạy server phát triển
npm run dev
```
> Server local thường sẽ chạy tại địa chỉ: `http://localhost:5173/` (hoặc cổng tiếp theo nếu bị trùng).

### 📦 Biên dịch (Build Production)
Để đóng gói ứng dụng ReactJS thành các file HTML/JS tối ưu:
```bash
npm run build
```
> Các file production sẽ được xuất ra thư mục `dist/`.

### 🚀 Triển khai (Deploy Firebase)
Để deploy trực tiếp phiên bản Vlog mới nhất lên Firebase Hosting (`https://quoc-research-retrogame.web.app`):
```bash
# Biên dịch và deploy nhanh trong một lệnh
npm run build && firebase deploy
```

---

## 💡 Mẹo & Kịch bản Hỗ trợ (Database Migration)
Khi bạn cần di chuyển toàn bộ danh sách tệp video hiện tại trong Storage sang Database Supabase để tránh mất mát dữ liệu:
```bash
# Di chuyển vào nostalgist-demo
cd nostalgist-demo

# Chạy file script migration tự động
node migrate_vlogs.js
```
*Script này sẽ tự động đọc toàn bộ file trong bucket `videos`, kiểm tra trùng lặp và đồng bộ hóa an toàn vào database.*
