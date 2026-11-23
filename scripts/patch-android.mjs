// Jalankan setelah `npx cap add android`. Aman dijalankan berulang kali.
// - izin lokasi, kamera, galeri
// - nonaktifkan backup otomatis & lalu lintas http (cleartext)
// - signing rilis dari environment variable (dipakai GitHub Actions)
// - versionCode/versionName dari environment variable
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const manifestPath = "android/app/src/main/AndroidManifest.xml";
const gradlePath = "android/app/build.gradle";
if (!existsSync(manifestPath) || !existsSync(gradlePath)) {
  console.error("Folder android belum ada. Jalankan `npx cap add android` dulu.");
  process.exit(1);
}

/* ---------- AndroidManifest.xml ---------- */
let m = readFileSync(manifestPath, "utf8");
const perms = [
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />'
];
for (const p of perms) {
  const name = p.match(/android:name="([^"]+)"/)[1];
  if (!m.includes(`"${name}"`)) m = m.replace("</manifest>", `    ${p}\n</manifest>`);
}
m = m.replace(/android:allowBackup="true"/, 'android:allowBackup="false"');
if (!m.includes("android:usesCleartextTraffic")) m = m.replace("<application", '<application\n        android:usesCleartextTraffic="false"');
writeFileSync(manifestPath, m);
console.log("[patch-android] AndroidManifest.xml diperbarui");

/* ---------- app/build.gradle ---------- */
let g = readFileSync(gradlePath, "utf8");
if (!g.includes("ET_KEYSTORE_PATH")) {
  g = g.replace(/(\n\s*)buildTypes\s*\{/, `$1signingConfigs {
        release {
            if (System.getenv("ET_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ET_KEYSTORE_PATH"))
                storePassword System.getenv("ET_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ET_KEY_ALIAS")
                keyPassword System.getenv("ET_KEY_PASSWORD")
            }
        }
    }$1buildTypes {`);
  g = g.replace(/(release\s*\{\s*\n\s*)(minifyEnabled\s+false)/, `$1if (System.getenv("ET_KEYSTORE_PATH")) { signingConfig signingConfigs.release }\n            $2`);
}
g = g.replace(/versionCode\s+\d+/, 'versionCode Integer.parseInt(System.getenv("ET_VERSION_CODE") ?: "1")');
g = g.replace(/versionName\s+"[^"]*"/, 'versionName(System.getenv("ET_VERSION_NAME") ?: "1.0.0")');
writeFileSync(gradlePath, g);
const ok = g.includes("signingConfigs") && g.includes("signingConfig signingConfigs.release");
console.log(`[patch-android] build.gradle diperbarui (signing ${ok ? "terpasang" : "TIDAK terpasang: cek format build.gradle"})`);
if (!ok) process.exitCode = 1;
