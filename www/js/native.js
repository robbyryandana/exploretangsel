"use strict";
/* =========================================================
   ExploreTangsel — helper umum + jembatan fitur native
   (Capacitor). Semua fungsi punya fallback web, jadi app
   tetap jalan di browser biasa untuk pengembangan.
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const CONFIG = window.ET_CONFIG || {};

const CAP = window.Capacitor;
const IS_NATIVE = !!(CAP && typeof CAP.isNativePlatform === "function" && CAP.isNativePlatform());
const PLATFORM = CAP && typeof CAP.getPlatform === "function" ? CAP.getPlatform() : "web";
const plug = name => (IS_NATIVE && CAP.Plugins && CAP.Plugins[name]) || null;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

const Native = {
  online: navigator.onLine !== false,

  async init(){
    document.documentElement.classList.add("plat-" + PLATFORM);
    const sb = plug("StatusBar");
    if (sb){
      // Android: status bar tidak menimpa WebView supaya header tidak tertutup di semua versi WebView
      try { if (PLATFORM === "android"){ await sb.setOverlaysWebView({ overlay: false }); await sb.setBackgroundColor({ color: "#12443F" }); } await sb.setStyle({ style: "DARK" }); } catch (e) {}
    }
    const app = plug("App");
    if (app){
      app.addListener("backButton", () => emit("et:back"));
      app.addListener("resume", () => emit("et:resume"));
    }
    const net = plug("Network");
    if (net){
      try { const s = await net.getStatus(); this.online = s.connected; } catch (e) {}
      net.addListener("networkStatusChange", s => { this.online = s.connected; emit("et:network", s.connected); });
    } else {
      addEventListener("online", () => { this.online = true; emit("et:network", true); });
      addEventListener("offline", () => { this.online = false; emit("et:network", false); });
    }
  },

  hideSplash(){ const s = plug("SplashScreen"); if (s) s.hide({ fadeOutDuration: 250 }).catch(() => {}); },

  /* dark = latar gelap (teks status bar terang) */
  statusBar(dark){
    const sb = plug("StatusBar"); if (!sb) return;
    sb.setStyle({ style: dark ? "DARK" : "LIGHT" }).catch(() => {});
    if (PLATFORM === "android") sb.setBackgroundColor({ color: dark ? "#12443F" : "#EEF5F1" }).catch(() => {});
  },

  haptic(kind = "light"){
    const h = plug("Haptics");
    if (h) h.impact({ style: kind === "medium" ? "MEDIUM" : "LIGHT" }).catch(() => {});
    else if (navigator.vibrate) try { navigator.vibrate(kind === "medium" ? 14 : 8); } catch (e) {}
  },

  async getPosition(){
    const g = plug("Geolocation");
    if (g){
      let st = await g.checkPermissions();
      if (st.location !== "granted" && st.coarseLocation !== "granted"){
        try { st = await g.requestPermissions({ permissions: ["location", "coarseLocation"] }); } catch (e) { throw new Error("Layanan lokasi mati. Nyalakan GPS lalu coba lagi."); }
      }
      if (st.location !== "granted" && st.coarseLocation !== "granted") throw new Error("Izin lokasi ditolak. Aktifkan lewat Pengaturan > Aplikasi > ExploreTangsel > Izin.");
      const p = await g.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
    }
    if (!navigator.geolocation) throw new Error("Perangkat ini tidak mendukung lokasi.");
    return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      e => rej(new Error(e.code === 1 ? "Izin lokasi ditolak. Izinkan lokasi untuk aplikasi ini." : "Lokasi belum didapat. Coba di area terbuka.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }));
  },

  /* Ambil foto dari kamera/galeri dan simpan permanen di folder data aplikasi.
     Mengembalikan {path, url}, null jika batal, atau "web" jika harus pakai input file. */
  async takePhoto(){
    const cam = plug("Camera"), fs = plug("Filesystem");
    if (!cam || !fs) return "web";
    let ph;
    try {
      ph = await cam.getPhoto({ resultType: "base64", source: "PROMPT", quality: 80, width: 1600, correctOrientation: true, saveToGallery: false,
        promptLabelHeader: "Tambah foto", promptLabelPhoto: "Pilih dari galeri", promptLabelPicture: "Ambil foto", promptLabelCancel: "Batal" });
    } catch (e) {
      if (/cancel/i.test(String(e && e.message))) return null;
      if (/denied|permission/i.test(String(e && e.message))) throw new Error("Izin kamera atau galeri ditolak. Aktifkan lewat Pengaturan perangkat.");
      throw new Error("Foto tidak bisa diambil. Coba lagi.");
    }
    const ext = String(ph.format || "jpeg").toLowerCase();
    if (!["jpeg", "jpg", "png", "webp", "heic"].includes(ext)) throw new Error("Format foto tidak didukung.");
    if ((ph.base64String || "").length > 12 * 1024 * 1024) throw new Error("Foto terlalu besar.");
    const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const w = await fs.writeFile({ path, data: ph.base64String, directory: "DATA", recursive: true });
    return { path, url: CAP.convertFileSrc(w.uri) };
  },
  async photoUrl(path){
    const fs = plug("Filesystem"); if (!fs) return null;
    try { const r = await fs.getUri({ path, directory: "DATA" }); return CAP.convertFileSrc(r.uri); } catch (e) { return null; }
  },
  async deletePhoto(path){ const fs = plug("Filesystem"); if (fs) try { await fs.deleteFile({ path, directory: "DATA" }); } catch (e) {} },

  /* Buka tautan https. inApp=true -> Chrome Custom Tabs / SFSafariViewController */
  async openUrl(url, inApp = false){
    if (!/^https:\/\//i.test(url)) return;
    if (IS_NATIVE){
      if (inApp){ const b = plug("Browser"); if (b) return b.open({ url, toolbarColor: "#12443F", presentationStyle: "popover" }); }
      const al = plug("AppLauncher");
      if (al){ try { await al.openUrl({ url }); return; } catch (e) {} }
      const b = plug("Browser"); if (b) return b.open({ url });
    }
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) location.href = url;
  },

  exit(){ const a = plug("App"); if (a) a.exitApp(); }
};
