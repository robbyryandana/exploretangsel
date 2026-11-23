#!/usr/bin/env bash
# Jalankan setelah `npx cap add ios` (di macOS). Aman dijalankan berulang kali.
# Menambahkan teks izin (wajib oleh Apple) ke Info.plist.
set -euo pipefail
PLIST="ios/App/App/Info.plist"
[ -f "$PLIST" ] || { echo "Info.plist tidak ditemukan. Jalankan 'npx cap add ios' dulu."; exit 1; }
PB=/usr/libexec/PlistBuddy

setkey () { # key type value
  if $PB -c "Print :$1" "$PLIST" >/dev/null 2>&1; then $PB -c "Set :$1 $3" "$PLIST"; else $PB -c "Add :$1 $2 $3" "$PLIST"; fi
}
setkey NSLocationWhenInUseUsageDescription string "ExploreTangsel memakai lokasimu untuk mengurutkan hidden gem terdekat dan menampilkan posisimu di peta."
setkey NSCameraUsageDescription string "ExploreTangsel memakai kamera agar kamu bisa memotret tempat yang kamu kunjungi."
setkey NSPhotoLibraryUsageDescription string "ExploreTangsel membuka galeri agar kamu bisa memilih foto kunjungan."
setkey NSPhotoLibraryAddUsageDescription string "ExploreTangsel menyimpan foto kunjungan ke galerimu bila kamu memintanya."
setkey ITSAppUsesNonExemptEncryption bool false
setkey CFBundleDisplayName string "ExploreTangsel"
echo "[patch-ios] Info.plist diperbarui"
