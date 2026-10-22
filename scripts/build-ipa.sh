#!/usr/bin/env bash
set -e

echo "🚀 Bắt đầu quá trình build IPA cho TrollStore..."

# Kiểm tra Xcode
if ! command -v xcodebuild &> /dev/null || xcode-select -p | grep -q "CommandLineTools"; then
  echo "❌ Lỗi: Máy Mac hiện tại chỉ có Command Line Tools, chưa có ứng dụng Xcode đầy đủ (/Applications/Xcode.app)."
  echo "👉 Để build IPA trực tiếp trên máy Mac, bạn cần cài đặt Xcode từ Mac App Store."
  echo "👉 Hoặc bạn có thể dùng file GitHub Actions (.github/workflows/build-ipa.yml) để build trên đám mây hoàn toàn miễn phí!"
  exit 1
fi

# 1. Tạo native project
if [ ! -d "ios" ]; then
  echo "📦 Đang tạo cấu trúc iOS native bằng Expo Prebuild..."
  npx expo prebuild --platform ios
fi

# Tìm tên scheme trong ios
WORKSPACE=$(find ios -name "*.xcworkspace" -maxdepth 1 | head -n 1)
SCHEME=$(basename "$WORKSPACE" .xcworkspace)

echo "🔨 Đang biên dịch với scheme: $SCHEME ..."
mkdir -p build dist

xcodebuild -workspace "$WORKSPACE" \
           -scheme "$SCHEME" \
           -configuration Release \
           -sdk iphoneos \
           -derivedDataPath build \
           CODE_SIGNING_ALLOWED=NO \
           CODE_SIGNING_REQUIRED=NO \
           CODE_SIGN_IDENTITY="" \
           AD_HOC_CODE_SIGNING_ALLOWED=YES

# 2. Đóng gói Payload
echo "📦 Đang đóng gói thành file IPA..."
rm -rf Payload dist/SonyRemote.ipa
mkdir Payload
cp -r build/Build/Products/Release-iphoneos/*.app Payload/
zip -q -r dist/SonyRemote.ipa Payload
rm -rf Payload

echo "✅ HOÀN TẤT! File IPA đã được tạo tại: dist/SonyRemote.ipa"
echo "👉 Bạn hãy chuyển file này sang iPhone (qua AirDrop / Telegram) và nhấn cài đặt bằng TrollStore!"
