# ExploreTangsel — Android & iOS

Aplikasi untuk menemukan hidden gem di Tangerang Selatan: wisata, kuliner, akses menuju lokasi, peta, galeri foto, dan CCTV jalan. Dibangun dengan **Capacitor 7**: UI web (HTML/CSS/JS tanpa framework) dibungkus jadi aplikasi native Android dan iOS.

## Isi proyek

```
www/                    UI aplikasi (dibungkus ke APK/IPA)
  index.html            kerangka + Content-Security-Policy
  css/app.css           desain (palet Situ & Anggrek)
  js/config.js          ← SEMUA PENGATURAN ada di sini
  js/native.js          jembatan fitur native + fallback web
  js/auth.js            LocalAuth (perangkat) & FirebaseAuth (server)
  js/store.js           penyimpanan (localStorage + Capacitor Preferences)
  js/data.js            data tempat, stasiun KRL, kamera CCTV
  js/app.js             layar: splash, auth, jelajah, detail, peta, galeri, CCTV, profil
assets/                 sumber ikon & splash (dibuat jadi semua ukuran otomatis)
scripts/                copy-vendor, patch-android, patch-ios
site/                   website (GitHub Pages): landing, kebijakan privasi, hapus akun
.github/workflows/      build APK/AAB (Android), iOS, dan deploy website (Pages)
```

## Fitur native

| Fitur | Plugin | Catatan |
|---|---|---|
| Lokasi saya, urut terdekat, jarak | `@capacitor/geolocation` | izin diminta saat tombol ditekan |
| Peta asli + pin + posisi kamu | Leaflet + tile OSM | otomatis kembali ke peta ilustratif saat offline |
| Foto dari kamera/galeri, tersimpan permanen | `@capacitor/camera`, `@capacitor/filesystem` | foto disimpan di folder privat aplikasi |
| Petunjuk arah membuka Google Maps | `@capacitor/app-launcher` | |
| CCTV resmi di in-app browser | `@capacitor/browser` | stream HLS juga didukung (lihat Konfigurasi) |
| Tombol back Android, haptic, status bar, splash, deteksi offline | `app`, `haptics`, `status-bar`, `splash-screen`, `network` | |

## 1. Build otomatis lewat GitHub (tanpa install Android Studio)

1. Buat repository baru di GitHub, lalu upload seluruh isi folder ini (termasuk folder `.github`).
2. Buka tab **Actions** → workflow **Build Android** berjalan otomatis setiap push ke `main`.
3. Setelah selesai (±8–12 menit), buka run tersebut → bagian **Artifacts** → unduh **ExploreTangsel-debug-apk**.
4. Ekstrak zip, salin `app-debug.apk` ke HP Android, buka, izinkan "Instal dari sumber tidak dikenal".

APK debug cocok untuk uji coba. Untuk Play Store butuh APK/AAB rilis bertanda tangan (langkah 2).

## 2. APK/AAB rilis untuk Play Store

Buat keystore sekali saja dan **simpan baik-baik**. Kalau hilang, aplikasi tidak bisa di-update di Play Store.

```bash
keytool -genkeypair -v -keystore exploretangsel.jks -alias exploretangsel \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 exploretangsel.jks > keystore.b64      # macOS: base64 -i exploretangsel.jks -o keystore.b64
```

Di GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | isi file `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | password keystore |
| `ANDROID_KEY_ALIAS` | `exploretangsel` |
| `ANDROID_KEY_PASSWORD` | password key |

Jalankan ulang workflow → artifact **ExploreTangsel-release** berisi `app-release.apk` dan `app-release.aab` (unggah `.aab` ke Play Console). `versionCode` otomatis naik mengikuti nomor run.

## 3. iOS

- Workflow **Build iOS** selalu membuat build **iOS Simulator** (artifact `ExploreTangsel-ios-simulator`) untuk memastikan kode bisa dikompilasi. Build ini tidak bisa dipasang di iPhone asli.
- Untuk memasang di iPhone asli / TestFlight / App Store wajib punya **Apple Developer Program** (berbayar per tahun). Setelah punya:
  1. App Store Connect → Users and Access → Integrations → buat **API Key** (role App Manager/Admin), unduh file `.p8`.
  2. Daftarkan bundle id `id.exploretangsel.app` di developer.apple.com dan buat app di App Store Connect.
  3. Tambah secrets: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64` (isi `base64 -i AuthKey_XXXX.p8`).
  4. Workflow akan membuat **IPA bertanda tangan** (artifact `ExploreTangsel-ios-ipa`). Push tag `v1.0.0` untuk sekaligus upload ke **TestFlight**.

## 4. Menjalankan di komputer sendiri (opsional)

Butuh Node 20+, Android Studio (Android) dan/atau Xcode 16 di macOS (iOS).

```bash
npm install
npm run build             # salin Leaflet & hls.js ke www/vendor
npm run android:add       # sekali saja: buat folder android + patch izin/signing
npm run ios:add           # sekali saja (macOS)
npm run assets            # buat ikon & splash dari folder assets/
npm run android           # build + jalankan di emulator/HP (USB debugging)
npm run ios               # build + jalankan di simulator/iPhone
```

Mengubah UI cukup edit file di `www/`, lalu `npm run sync`. Untuk iterasi cepat, buka `www/index.html` lewat server lokal (mis. `python3 -m http.server -d www`). Semua fitur punya fallback web.

## 5. Konfigurasi (`www/js/config.js`)

### Login server dengan Firebase (disarankan sebelum rilis)
Tanpa konfigurasi, aplikasi memakai **mode lokal**: akun tersimpan di perangkat (password di-hash PBKDF2), cocok untuk demo. Untuk akun sungguhan:

1. Buat project di console.firebase.google.com → **Authentication → Sign-in method** → aktifkan **Email/Password** (dan **Google** jika perlu).
2. Project settings → salin **Web API Key** → isi `firebase.apiKey`.
3. Batasi API key di Google Cloud Console (API restrictions: *Identity Toolkit API* dan *Token Service API*).
4. Authentication → Templates → atur bahasa email reset password ke Bahasa Indonesia.

Hasilnya: daftar, masuk, email verifikasi, dan **lupa password lewat email asli** langsung aktif, tanpa mengubah UI.

### Login Google native
Login Google tidak bisa memakai popup di dalam WebView, jadi butuh plugin native:
1. `npm install @codetrix-studio/capacitor-google-auth` (pilih versi yang mendukung Capacitor 7, cek README plugin).
2. Buat OAuth Client ID tipe **Web**, **Android** (isi SHA-1 keystore rilis), dan **iOS** di Google Cloud Console.
3. Isi `google.webClientId` di config.js dan ikuti langkah konfigurasi Android/iOS dari README plugin.
4. Tombol "Lanjutkan dengan Google" otomatis memakai plugin itu dan masuk ke Firebase (`signInWithIdp`).

Selama plugin belum dipasang, tombol Google memakai akun demo (mode lokal) atau menampilkan petunjuk (mode Firebase).

### Peta
Default memakai tile OpenStreetMap dengan atribusi. Kebijakan OSM melarang pemakaian berat. Untuk rilis dengan banyak pengguna, ganti `map.tileUrl` ke penyedia ber-API key (MapTiler, Stadia, Thunderforest, dll.).

### CCTV
- Kamera tol membuka portal resmi (BSD Tol, Bina Marga PUPR, Balai Banten) di in-app browser.
- Jika sudah mendapat izin dan alamat stream HLS dari Dishub Tangsel/operator, isi `cctvStreams`, misalnya `"TGS-01": "https://.../index.m3u8"`. Player otomatis memutar siaran langsung, dengan fallback ke simulasi jika stream gagal.

### Foto asli tempat
Taruh foto di `www/img/places/<id-tempat>/` lalu daftarkan di `placePhotos`. Pastikan kamu punya hak memakai foto tersebut (foto sendiri atau berlisensi).

### Ganti identitas aplikasi
`appId` (`id.exploretangsel.app`) dan `appName` ada di `capacitor.config.json`. appId cukup unik di Play Store/App Store dan tidak harus sesuai domain yang kamu miliki. Kalau ingin mengganti (mis. `io.github.usernamekamu.exploretangsel`), lakukan sebelum rilis pertama; setelah terbit, appId tidak bisa diubah.

## 6. Keamanan

Sudah diterapkan:
- PBKDF2-SHA256 600.000 iterasi + salt acak (mode lokal), perbandingan constant-time, hash dihitung juga untuk email tak terdaftar (anti enumerasi akun).
- Lockout 60 detik setelah 5 kali gagal, pesan error generik, honeypot + cek waktu isi form.
- OTP reset 6 digit, 5 menit, maks. 3 percobaan (mode lokal) / tautan reset email Firebase (mode server). Semua sesi dicabut setelah reset.
- Sesi dengan masa berlaku, auto-logout 15 menit tidak aktif (juga dicek saat app kembali dari background), keluar dari semua perangkat, riwayat masuk, hapus akun.
- Content-Security-Policy ketat (`script-src 'self'`), semua data ditampilkan ter-escape, tautan non-https diblokir.
- Android: `allowBackup=false`, `usesCleartextTraffic=false`, mixed content dimatikan, WebView debugging hanya di build debug.
- Upload foto divalidasi dari isi file (magic bytes), bukan hanya ekstensi.

Disarankan sebelum rilis publik:
- Pakai mode Firebase (akun di server) dan aktifkan **Firebase App Check**.
- Simpan token sesi di Keychain/Keystore (mis. plugin secure storage) alih-alih Preferences.
- Jika nanti favorit/foto disinkronkan ke server, pasang aturan keamanan database (Firestore/Storage rules) per pengguna.
- Siapkan halaman Kebijakan Privasi (wajib untuk Play Store & App Store karena memakai lokasi dan kamera).

## 7. Website gratis di GitHub Pages (tanpa domain sendiri)

Folder `site/` berisi website resmi yang otomatis di-deploy ke **GitHub Pages** oleh workflow `pages.yml`. Alamatnya mengikuti repo kamu, misalnya repo `rizky/exploretangsel` → `https://rizky.github.io/exploretangsel/`.

| Alamat | Isi |
|---|---|
| `/` | landing page + tombol unduh APK (otomatis mengarah ke GitHub Releases repo kamu) |
| `/app/` | versi web aplikasi (isi folder `www/`) |
| `/privasi/` | Kebijakan Privasi (wajib untuk Play Store & App Store) |
| `/hapus-akun/` | cara hapus akun (wajib diisi di Play Console > Data safety) |

### Langkah mengaktifkan
1. Repo harus **public** (GitHub Pages gratis hanya untuk repo publik pada akun Free).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Opsional tapi disarankan: **Settings → Secrets and variables → Actions → tab Variables → New repository variable** `CONTACT_EMAIL` berisi email kontakmu (mis. Gmail). Email ini tampil di Kebijakan Privasi dan halaman Hapus Akun. Tanpa variabel ini, kontak diarahkan ke GitHub Issues repo.
4. Push ke `main` → workflow **Deploy website** berjalan, alamat website muncul di ringkasan run dan di Settings → Pages.

Alamat website juga otomatis ditanam ke aplikasi saat build APK/iOS, sehingga tautan Kebijakan Privasi di layar Daftar dan Profil langsung mengarah ke sana. Semua ini dikerjakan `scripts/set-site-url.mjs`, jadi kamu tidak perlu mengedit URL manual.

### Untuk Play Console
- Privacy policy: `https://USERNAME.github.io/NAMA-REPO/privasi/`
- Account deletion URL: `https://USERNAME.github.io/NAMA-REPO/hapus-akun/`

Kebijakan Privasi adalah draf berdasarkan fitur aplikasi saat ini. Tinjau ulang sebelum rilis, terutama jika nanti menambah fitur yang mengirim data ke server.

### Kalau suatu hari mau pakai domain sendiri
Beli domain, buat file `site/CNAME` berisi nama domainnya, atur DNS sesuai panduan GitHub Pages, lalu tambahkan repository variable `SITE_URL` (mis. `https://namadomain.id`) agar alamat di aplikasi ikut berubah.

## 8. Troubleshooting

- **Workflow gagal di `cap add android`**: pastikan folder `android/` tidak ter-commit setengah jadi. Hapus lalu push ulang.
- **`patch-android` bilang signing TIDAK terpasang**: format `build.gradle` dari versi Capacitor berbeda. Tambahkan `signingConfigs` manual di `android/app/build.gradle`, lalu commit folder android (hapus `android/` dari `.gitignore`).
- **Peta kosong**: cek koneksi. Tanpa internet, aplikasi otomatis memakai peta ilustratif.
- **Lokasi tidak muncul**: nyalakan GPS dan beri izin lokasi di Pengaturan → Aplikasi → ExploreTangsel.
