# Sony BRAVIA Smart Remote (KD-49X7500H)

Ứng dụng remote thông minh cho TV **Sony BRAVIA KD-49X7500H (Android TV)**, tối ưu cho **iOS (TrollStore)** và **Android**, xây dựng trên nền tảng **React Native / Expo (TypeScript)**.

---

## 🌟 Tính Năng Nổi Bật

1. **Kết Nối Bằng IP & Pre-Shared Key (PSK)**:
   - Nhập IP trực tiếp từ màn hình Cài đặt, tự động lưu vào bộ nhớ máy.
   - Kiểm tra kết nối tức thì (Hiển thị model TV, trạng thái Online/Offline).
2. **Trackpad Cảm Ứng (Touch Navigation)**:
   - Vuốt đa hướng (Lên / Xuống / Trái / Phải) với độ trễ siêu thấp.
   - Chạm (Tap) để Chọn (OK / Confirm).
   - Nút gọi Bàn phím nhanh trực tiếp trên bề mặt Trackpad.
3. **Đồng Bộ Bàn Phím & Clipboard (Copy-Paste to TV)**:
   - Gõ văn bản trên điện thoại và gửi thẳng vào ô tìm kiếm của TV (YouTube, Netflix, Kodi...).
   - **Nút "Dán Clipboard"**: Đọc nội dung vừa copy trên điện thoại và bắn lên TV chỉ với 1 chạm.
4. **Quick App Launcher (Mở nhanh ứng dụng)**:
   - Tự động lấy danh sách ứng dụng đã cài đặt trên TV Sony qua REST API.
   - Hiển thị lưới ứng dụng kèm icon chính chủ, chạm là mở thẳng trên TV.
5. **Điều Khiển Âm Lượng Bằng Phím Cứng Điện Thoại**:
   - Sử dụng nút bấm âm lượng vật lý (+ / -) của iPhone/Android để tăng giảm âm lượng TV khi đang mở app.
6. **Bàn Phím Số (Numpad) & Phím Màu**:
   - Bàn phím số từ 0 - 9, dấu chấm (`.`), Enter để chuyển kênh và nhập mã PIN.
   - 4 phím màu (Đỏ, Xanh lá, Vàng, Xanh dương) cùng phím phụ đề (CC), ngôn ngữ Audio, Info.
7. **Phản Hồi Rung Haptic (Taptic Engine)**:
   - Rung phản hồi nhẹ khi chạm nút hoặc lướt trackpad tạo cảm giác như cầm remote vật lý.

---

## 📺 Cài Đặt Trên TV Sony KD-49X7500H (Bắt buộc làm 1 lần)

1. Bật TV Sony, dùng remote zin vào **Cài đặt (Settings)** (biểu tượng bánh răng).
2. Chọn **Mạng & Internet (Network & Internet)** $\rightarrow$ **Thiết lập mạng gia đình (Home network setup)**.
3. Chọn **Điều khiển IP (IP control)**:
   - **Điều khiển IP đơn giản (Simple IP Control)**: Chuyển sang **[Bật / ON]**.
   - **Xác thực (Authentication)**: Chọn **[Khóa chia sẻ trước / Pre-Shared Key]**.
   - **Khóa chia sẻ trước (Pre-Shared Key)**: Nhập mật khẩu là `1234` (hoặc mật khẩu bạn muốn).
4. Xem địa chỉ IP của TV tại **Mạng & Internet** $\rightarrow$ **Trạng thái mạng** (Ví dụ: `192.168.1.150`).

---

## 🚀 Hướng Dẫn Chạy & Thử Nghiệm Ngay

### 1. Khởi chạy Dev Server
```bash
npm start
# hoặc
npx expo start
```

### 2. Trải nghiệm trên điện thoại thật
- **iPhone**: Cài app **Expo Go** từ App Store, mở ứng dụng Camera của iPhone quét mã QR trên màn hình terminal.
- **Android**: Cài app **Expo Go** từ CH Play, mở ứng dụng Expo Go và chọn quét mã QR.
*(Lưu ý: Điện thoại và TV Sony phải kết nối chung mạng Wi-Fi)*

---

## 📦 Hướng Dẫn Đóng Gói (Build)

### A. Xuất file IPA cài qua TrollStore (iOS)
TrollStore hỗ trợ cài đặt các file IPA không cần chứng chỉ trả phí (Ad-hoc / Unsigned):

1. Tạo thư mục native iOS:
   ```bash
   npx expo prebuild --platform ios
   ```
2. Build ứng dụng dạng Release (yêu cầu Xcode trên Mac):
   ```bash
   xcodebuild -workspace ios/sonyremote.xcworkspace \
              -scheme sonyremote \
              -configuration Release \
              -sdk iphoneos \
              -derivedDataPath build \
              CODE_SIGNING_ALLOWED=NO
   ```
3. Đóng gói thành file `.ipa`:
   ```bash
   mkdir Payload
   cp -r build/Build/Products/Release-iphoneos/sonyremote.app Payload/
   zip -r SonyRemote.ipa Payload
   rm -rf Payload
   ```
4. Chuyển file `SonyRemote.ipa` sang iPhone qua AirDrop / Telegram / iCloud và nhấn **Install** bằng **TrollStore**.

### B. Xuất file APK (Android)
1. Tạo thư mục native Android:
   ```bash
   npx expo prebuild --platform android
   ```
2. Build file APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   File APK đầu ra sẽ nằm tại: `android/app/build/outputs/apk/release/app-release.apk`.
