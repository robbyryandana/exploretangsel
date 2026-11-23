"use strict";
/* ---------- STORAGE ----------
   Baca/tulis sinkron lewat localStorage (cepat untuk UI),
   dan dicerminkan ke Capacitor Preferences di perangkat agar
   tidak hilang saat OS membersihkan cache WebView. */
const MEM = {};
const PERSIST_KEYS = ["et_users", "et_fail", "et_session", "et_photos"];
const Store = {
  async hydrate(){
    const p = plug("Preferences"); if (!p) return;
    for (const k of PERSIST_KEYS){
      try { const { value } = await p.get({ key: k }); if (value !== null && value !== undefined) localStorage.setItem(k, value); } catch (e) {}
    }
  },
  get(k, d, area = "localStorage"){
    try { const v = window[area].getItem(k); return v ? JSON.parse(v) : d; }
    catch (e) { return (area + k) in MEM ? MEM[area + k] : d; }
  },
  set(k, v, area = "localStorage"){
    const raw = JSON.stringify(v);
    try { window[area].setItem(k, raw); } catch (e) { MEM[area + k] = v; }
    if (area === "localStorage"){ const p = plug("Preferences"); if (p) p.set({ key: k, value: raw }).catch(() => {}); }
  },
  del(k, area = "localStorage"){
    try { window[area].removeItem(k); } catch (e) {}
    delete MEM[area + k];
    if (area === "localStorage"){ const p = plug("Preferences"); if (p) p.remove({ key: k }).catch(() => {}); }
  }
};
