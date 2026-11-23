// Salin library pihak ketiga dari node_modules ke www/vendor agar ikut
// terbungkus di aplikasi (tidak bergantung CDN saat runtime).
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const files = [
  ["node_modules/leaflet/dist/leaflet.js", "www/vendor/leaflet/leaflet.js"],
  ["node_modules/leaflet/dist/leaflet.css", "www/vendor/leaflet/leaflet.css"],
  ["node_modules/leaflet/dist/images", "www/vendor/leaflet/images"],
  ["node_modules/hls.js/dist/hls.min.js", "www/vendor/hls/hls.min.js"]
];

let missing = 0;
for (const [src, dst] of files) {
  if (!existsSync(src)) { console.warn(`[vendor] tidak ditemukan: ${src} (jalankan npm install)`); missing++; continue; }
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log(`[vendor] ${src} -> ${dst}`);
}
if (missing) process.exitCode = 1;
