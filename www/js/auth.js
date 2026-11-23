"use strict";
/* =========================================================
   AUTH
   - LocalAuth   : akun di perangkat (PBKDF2 600k, lockout, OTP lokal).
                   Dipakai saat ET_CONFIG.firebase.apiKey kosong.
   - FirebaseAuth: Firebase Authentication via REST (email/password,
                   reset lewat email asli, Google via plugin native).
   Keduanya punya method yang sama sehingga UI tidak perlu tahu.
   ========================================================= */
const enc = new TextEncoder();
const ITER = 600000; // PBKDF2-HMAC-SHA256, rekomendasi OWASP
const MAX_FAIL = 5, LOCK_MS = 60_000, IDLE_MS = 15 * 60_000, OTP_TTL = 5 * 60_000;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
const randHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const DUMMY_SALT = randHex(16);
async function sha256(s){ return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }
async function pbkdf2(pw, saltHex, iter = ITER){
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unhex(saltHex), iterations: iter, hash: "SHA-256" }, key, 256));
}
function ctEqual(a, b){ if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }
const normEmail = e => String(e || "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const NAME_RE = /^[\p{L} .'-]{2,60}$/u;
function pwChecks(pw, email = ""){
  const local = normEmail(email).split("@")[0];
  return { len: pw.length >= 10, up: /[A-Z]/.test(pw), low: /[a-z]/.test(pw), num: /\d/.test(pw), sym: /[^A-Za-z0-9]/.test(pw),
    notmail: !(local && local.length > 2 && pw.toLowerCase().includes(local)) };
}
function pwScore(pw, email){ const c = pwChecks(pw, email); let s = [c.len, c.up && c.low, c.num, c.sym].filter(Boolean).length; if (!c.notmail) s = Math.min(s, 1); return pw ? Math.max(1, s) : 0; }
const deviceLabel = () => IS_NATIVE ? (PLATFORM === "ios" ? "iPhone/iPad" : "Android") : (navigator.userAgent.includes("Mobile") ? "Ponsel (web)" : "Desktop (web)");

/* ---- shared: profil lokal (favorit, riwayat) & sesi ---- */
const Profiles = {
  all(){ return Store.get("et_users", {}); },
  save(u){ Store.set("et_users", u); },
  get(email){ return this.all()[normEmail(email)]; },
  update(email, fn){ const all = this.all(), u = all[normEmail(email)]; if (u){ fn(u); this.save(all); } return u; },
  failState(email){ return (Store.get("et_fail", {})[email]) || { n: 0, until: 0 }; },
  setFail(email, st){ const all = Store.get("et_fail", {}); if (st) all[email] = st; else delete all[email]; Store.set("et_fail", all); },
  readSession(){ return Store.get("et_session", null, "sessionStorage") || Store.get("et_session", null, "localStorage"); },
  writeSession(sess){
    Store.del("et_session", "localStorage"); Store.del("et_session", "sessionStorage");
    Store.set("et_session", sess, sess.remember ? "localStorage" : "sessionStorage");
  },
  clearSession(){ Store.del("et_session", "localStorage"); Store.del("et_session", "sessionStorage"); },
  pushHistory(u, method){ u.history = [{ at: Date.now(), method, agent: deviceLabel() }, ...(u.history || [])].slice(0, 8); }
};
function checkLock(email){
  const fs = Profiles.failState(email);
  if (fs.until > Date.now()){ const s = Math.ceil((fs.until - Date.now()) / 1000); throw Object.assign(new Error(`Terlalu banyak percobaan. Coba lagi dalam ${s} detik.`), { lock: fs.until }); }
  return fs;
}
function registerFail(email, fs, baseMsg){
  const n = fs.n + 1, left = MAX_FAIL - n;
  if (left <= 0){ Profiles.setFail(email, { n: 0, until: Date.now() + LOCK_MS }); throw Object.assign(new Error("Akun dikunci sementara selama 60 detik karena 5 kali gagal masuk."), { lock: Date.now() + LOCK_MS }); }
  Profiles.setFail(email, { n, until: 0 });
  throw new Error(`${baseMsg} Sisa ${left} percobaan.`);
}

/* =================== LOCAL =================== */
const LocalAuth = {
  mode: "local",
  googleReady(){ return false; },
  async register({ name, email, pw }){
    email = normEmail(email);
    const users = Profiles.all();
    if (users[email]) throw new Error("Email ini sudah terdaftar. Masuk atau gunakan Lupa password.");
    const salt = randHex(16), hash = await pbkdf2(pw, salt);
    users[email] = { name: name.trim(), email, salt, hash, iter: ITER, provider: "password", created: Date.now(), favs: [], sessions: [], history: [] };
    Profiles.save(users);
    return this.startSession(users[email], false, "Pendaftaran");
  },
  async login(email, pw, remember){
    email = normEmail(email);
    const fs = checkLock(email);
    const u = Profiles.get(email);
    // Hash tetap dihitung walau akun tidak ada agar waktu respons sama (cegah enumerasi akun)
    const h = await pbkdf2(pw, u && u.salt ? u.salt : DUMMY_SALT, (u && u.iter) || ITER);
    if (!u || !u.hash || !ctEqual(h, u.hash)) registerFail(email, fs, "Email atau password salah.");
    Profiles.setFail(email, null);
    return this.startSession(u, remember, "Email & password");
  },
  async startSession(u, remember, method){
    const all = Profiles.all(), rec = all[u.email];
    const token = randHex(32), th = await sha256(token);
    rec.sessions = [th, ...(rec.sessions || [])].slice(0, 5);
    Profiles.pushHistory(rec, method);
    Profiles.save(all);
    Profiles.writeSession({ mode: "local", email: rec.email, token, exp: Date.now() + (remember ? 7 * 864e5 : 12 * 36e5), remember: !!remember });
    return rec;
  },
  async current(){
    const s = Profiles.readSession();
    if (!s || s.mode !== "local" || !s.token || s.exp < Date.now()) return null;
    const u = Profiles.get(s.email); if (!u) return null;
    return (u.sessions || []).includes(await sha256(s.token)) ? { user: u, sess: s } : null;
  },
  async logout(){
    const s = Profiles.readSession();
    if (s && s.mode === "local"){ const th = await sha256(s.token); Profiles.update(s.email, u => u.sessions = (u.sessions || []).filter(x => x !== th)); }
    Profiles.clearSession();
  },
  async logoutAll(email){ Profiles.update(email, u => u.sessions = []); Profiles.clearSession(); },
  async google(){
    // Mode lokal: akun demo. Mode produksi memakai FirebaseAuth.google().
    const email = "demo.google@exploretangsel.app", all = Profiles.all();
    if (!all[email]){ all[email] = { name: "Pengguna Google", email, provider: "google-demo", created: Date.now(), favs: [], sessions: [], history: [] }; Profiles.save(all); }
    return this.startSession(all[email], false, "Google (demo)");
  },
  /* Lupa password lokal: OTP 6 digit. Mengembalikan {type:"otp", code} atau {type:"otp", code:null}. */
  async sendReset(email){
    email = normEmail(email);
    const u = Profiles.get(email);
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, "0");
    if (u && u.hash){ Store.set("et_otp", { email, h: await sha256(code + email), exp: Date.now() + OTP_TTL, tries: 0 }, "sessionStorage"); return { type: "otp", code }; }
    Store.del("et_otp", "sessionStorage"); return { type: "otp", code: null };
  },
  async verifyOtp(email, code){
    const o = Store.get("et_otp", null, "sessionStorage");
    if (!o || o.email !== normEmail(email)) throw new Error("Kode tidak valid. Minta kode baru.");
    if (o.exp < Date.now()){ Store.del("et_otp", "sessionStorage"); throw new Error("Kode sudah kedaluwarsa. Minta kode baru."); }
    if (o.tries >= 3){ Store.del("et_otp", "sessionStorage"); throw new Error("Terlalu banyak kode salah. Minta kode baru."); }
    if (!ctEqual(await sha256(code + o.email), o.h)){ o.tries++; Store.set("et_otp", o, "sessionStorage"); throw new Error(`Kode salah. Sisa ${3 - o.tries} percobaan.`); }
    o.verified = true; Store.set("et_otp", o, "sessionStorage"); return true;
  },
  async resetPassword(email, pw){
    const o = Store.get("et_otp", null, "sessionStorage");
    if (!o || !o.verified || o.email !== normEmail(email) || o.exp < Date.now()) throw new Error("Sesi reset tidak valid. Ulangi dari awal.");
    const all = Profiles.all(), u = all[o.email];
    u.salt = randHex(16); u.hash = await pbkdf2(pw, u.salt); u.iter = ITER; u.sessions = [];
    Profiles.save(all); Store.del("et_otp", "sessionStorage"); Profiles.setFail(o.email, null);
  },
  async changePassword(email, oldPw, newPw){
    const all = Profiles.all(), u = all[email];
    if (!ctEqual(await pbkdf2(oldPw, u.salt, u.iter), u.hash)) throw new Error("Password lama salah.");
    u.salt = randHex(16); u.hash = await pbkdf2(newPw, u.salt); u.iter = ITER;
    const s = Profiles.readSession(); const keep = s ? await sha256(s.token) : null; u.sessions = keep ? [keep] : [];
    Profiles.save(all);
  },
  async deleteAccount(email, pw){
    const all = Profiles.all(), u = all[email];
    if (u.hash && !ctEqual(await pbkdf2(pw, u.salt, u.iter), u.hash)) throw new Error("Password salah.");
    delete all[email]; Profiles.save(all); Profiles.clearSession();
  }
};

/* =================== FIREBASE (REST) =================== */
const FB_ERR = {
  EMAIL_EXISTS: "Email ini sudah terdaftar. Masuk atau gunakan Lupa password.",
  INVALID_LOGIN_CREDENTIALS: "Email atau password salah.", EMAIL_NOT_FOUND: "Email atau password salah.", INVALID_PASSWORD: "Email atau password salah.",
  USER_DISABLED: "Akun ini dinonaktifkan. Hubungi dukungan ExploreTangsel.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Terlalu banyak percobaan dari perangkat ini. Coba lagi beberapa menit lagi.",
  WEAK_PASSWORD: "Password terlalu lemah.", INVALID_EMAIL: "Masukkan email yang valid.",
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: "Demi keamanan, keluar lalu masuk lagi sebelum melakukan ini.",
  TOKEN_EXPIRED: "Sesi berakhir. Silakan masuk lagi.", INVALID_ID_TOKEN: "Sesi berakhir. Silakan masuk lagi.", USER_NOT_FOUND: "Akun tidak ditemukan.",
  OPERATION_NOT_ALLOWED: "Metode login ini belum diaktifkan di Firebase Console.", INVALID_IDP_RESPONSE: "Login Google gagal diverifikasi. Coba lagi."
};
async function fbPost(url, body, form){
  let r;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json" }, body: form ? new URLSearchParams(body) : JSON.stringify(body) });
  } catch (e) { throw Object.assign(new Error("Tidak ada koneksi internet. Periksa jaringan lalu coba lagi."), { offline: true }); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok){ const code = String((j.error && j.error.message) || "").split(" ")[0]; throw Object.assign(new Error(FB_ERR[code] || "Terjadi kesalahan di server. Coba lagi."), { code }); }
  return j;
}
const fbAcc = (method, body) => fbPost(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(CONFIG.firebase.apiKey)}`, body);

const FirebaseAuth = {
  mode: "firebase",
  googleReady(){ return !!(plug("GoogleAuth") && CONFIG.google && CONFIG.google.webClientId); },
  upsertProfile(email, data){
    email = normEmail(email);
    const all = Profiles.all();
    all[email] = Object.assign({ email, favs: [], history: [], created: Date.now() }, all[email] || {}, data, { sessions: ["server"] });
    Profiles.save(all); return all[email];
  },
  start(j, remember, method, provider){
    const u = this.upsertProfile(j.email, { name: j.displayName || (Profiles.get(j.email) || {}).name || j.email.split("@")[0], uid: j.localId, provider });
    Profiles.update(u.email, x => Profiles.pushHistory(x, method));
    Profiles.writeSession({ mode: "firebase", email: u.email, uid: j.localId, idToken: j.idToken, refreshToken: j.refreshToken,
      tokenExp: Date.now() + (Number(j.expiresIn) || 3600) * 1000, exp: Date.now() + (remember ? 30 * 864e5 : 7 * 864e5), remember: !!remember });
    return Profiles.get(u.email);
  },
  async register({ name, email, pw }){
    const j = await fbAcc("signUp", { email: normEmail(email), password: pw, returnSecureToken: true });
    const up = await fbAcc("update", { idToken: j.idToken, displayName: name.trim(), returnSecureToken: true });
    fbAcc("sendOobCode", { requestType: "VERIFY_EMAIL", idToken: up.idToken || j.idToken }).catch(() => {});
    return this.start(Object.assign({}, j, up, { displayName: name.trim() }), false, "Pendaftaran", "password");
  },
  async login(email, pw, remember){
    email = normEmail(email);
    const fs = checkLock(email);
    try { const j = await fbAcc("signInWithPassword", { email, password: pw, returnSecureToken: true }); Profiles.setFail(email, null); return this.start(j, remember, "Email & password", "password"); }
    catch (e){ if (e.offline || e.code === "TOO_MANY_ATTEMPTS_TRY_LATER" || e.code === "USER_DISABLED") throw e; registerFail(email, fs, "Email atau password salah."); }
  },
  async google(){
    const G = plug("GoogleAuth");
    if (!G) throw new Error("Plugin login Google belum dipasang.");
    await G.initialize({ clientId: CONFIG.google.webClientId, scopes: ["profile", "email"], grantOfflineAccess: false });
    let g; try { g = await G.signIn(); } catch (e) { if (/cancel/i.test(String(e && (e.message || e.error)))) return null; throw new Error("Login Google dibatalkan atau gagal."); }
    const idToken = g && g.authentication && g.authentication.idToken;
    if (!idToken) throw new Error("Google tidak mengirim token. Periksa Web Client ID.");
    const j = await fbAcc("signInWithIdp", { postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`, requestUri: "http://localhost", returnSecureToken: true, returnIdpCredential: true });
    return this.start(Object.assign({}, j, { displayName: j.displayName || j.fullName }), true, "Google", "google");
  },
  async refresh(s){
    const j = await fbPost(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(CONFIG.firebase.apiKey)}`, { grant_type: "refresh_token", refresh_token: s.refreshToken }, true);
    Object.assign(s, { idToken: j.id_token, refreshToken: j.refresh_token, tokenExp: Date.now() + (Number(j.expires_in) || 3600) * 1000 });
    Profiles.writeSession(s); return s;
  },
  async current(){
    let s = Profiles.readSession();
    if (!s || s.mode !== "firebase" || !s.refreshToken || s.exp < Date.now()) return null;
    if (s.tokenExp - Date.now() < 5 * 60_000){
      try { s = await this.refresh(s); }
      catch (e){ if (!e.offline){ Profiles.clearSession(); return null; } } // offline: tetap boleh pakai app
    }
    const u = Profiles.get(s.email); return u ? { user: u, sess: s } : null;
  },
  async logout(){ Profiles.clearSession(); },
  async logoutAll(){ Profiles.clearSession(); }, // pencabutan token semua perangkat dilakukan server saat password diganti
  /* Reset lewat email asli dari Firebase. Respons sama walau email tidak terdaftar. */
  async sendReset(email){
    try { await fbAcc("sendOobCode", { requestType: "PASSWORD_RESET", email: normEmail(email) }); }
    catch (e){ if (e.offline || e.code === "TOO_MANY_ATTEMPTS_TRY_LATER") throw e; }
    return { type: "email-link" };
  },
  async changePassword(email, oldPw, newPw){
    let re; try { re = await fbAcc("signInWithPassword", { email, password: oldPw, returnSecureToken: true }); } catch (e){ if (e.offline) throw e; throw new Error("Password lama salah."); }
    const j = await fbAcc("update", { idToken: re.idToken, password: newPw, returnSecureToken: true });
    const s = Profiles.readSession(); Object.assign(s, { idToken: j.idToken, refreshToken: j.refreshToken, tokenExp: Date.now() + (Number(j.expiresIn) || 3600) * 1000 }); Profiles.writeSession(s);
  },
  async deleteAccount(email, pw){
    const u = Profiles.get(email); let idToken;
    if (u.provider === "password"){ try { idToken = (await fbAcc("signInWithPassword", { email, password: pw, returnSecureToken: true })).idToken; } catch (e){ if (e.offline) throw e; throw new Error("Password salah."); } }
    else idToken = (await this.current())?.sess.idToken;
    await fbAcc("delete", { idToken });
    const all = Profiles.all(); delete all[normEmail(email)]; Profiles.save(all); Profiles.clearSession();
  }
};

const Auth = CONFIG.firebase && CONFIG.firebase.apiKey ? FirebaseAuth : LocalAuth;
Auth.updateUser = (email, fn) => Profiles.update(email, fn);
