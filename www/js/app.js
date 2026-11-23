/* ---------- SPLASH ---------- */
let splashDone = false;
function runSplash(){
  const word = "ExploreTangsel", wm = $("#wordmark");
  wm.innerHTML = [...word].map((ch, i) => `<span style="animation-delay:${2.05 + i * 0.045}s">${ch}</span>`).join("");
  const t = setTimeout(endSplash, reduceMotion ? 900 : 4300);
  $("#skipSplash").onclick = () => { clearTimeout(t); endSplash(); };
}
async function endSplash(){
  if (splashDone) return; splashDone = true;
  const sp = $("#splash"); sp.classList.add("leaving");
  await sleep(reduceMotion ? 0 : 650);
  sp.classList.add("hidden");
  let cur = null;
  try { cur = await Auth.current(); } catch (e) { cur = null; }
  if (cur) enterApp(cur.user, false); else showAuth("login");
}

/* ---------- AUTH SCREENS ---------- */
function showAuth(mode){
  Native.statusBar(true);
  $("#main").classList.add("hidden"); $("#auth").classList.remove("hidden");
  if (!$("#authArt").innerHTML){ $("#authArt").innerHTML = scene("situ", "senja", 7); $("#brandMark").innerHTML = orchidMark(34); }
  const sh = $("#authSheet");
  if (mode === "forgot") return renderForgot(sh);
  const isLogin = mode === "login";
  sh.innerHTML = `
    <div class="seg ${isLogin ? "" : "right"}" role="tablist"><span class="pill"></span>
      <button role="tab" aria-selected="${isLogin}" id="tLogin">Masuk</button><button role="tab" aria-selected="${!isLogin}" id="tReg">Daftar</button></div>
    <div id="authForm"></div>`;
  $("#tLogin").onclick = () => showAuth("login");
  $("#tReg").onclick = () => showAuth("register");
  isLogin ? renderLogin($("#authForm")) : renderRegister($("#authForm"));
}
function socialHTML(){ return `<div class="or">atau</div><button type="button" class="btn line block" id="gBtn">${icon("google")}Lanjutkan dengan Google</button>`; }
async function doGoogle(btn){
  busy(btn, true, "Menghubungkan…");
  try { const u = await Auth.google(); if (u) enterApp(u, true); else busy(btn, false); }
  catch (err){ busy(btn, false); toast(err.message, "warn", 4500); }
}
function bindGoogle(root){
  if (Auth.googleReady()){ $("#gBtn", root).onclick = e => doGoogle(e.currentTarget); return; }
  if (Auth.mode === "firebase"){ $("#gBtn", root).onclick = () => modal(`<h3>Login Google belum aktif</h3><p>Admin aplikasi perlu memasang plugin Google Sign-In dan mengisi Web Client ID di config.js. Sementara itu, masuk dengan email dan password.</p><div class="btns"><button class="btn ghost block" id="gCancel">Mengerti</button></div>`, (b, close) => $("#gCancel", b).onclick = close); return; }
  $("#gBtn", root).onclick = () => modal(`
    <h3>Masuk dengan Google</h3>
    <p>Di aplikasi rilis, tombol ini membuka jendela login resmi Google (OAuth 2.0). ExploreTangsel tidak pernah melihat password Google kamu, hanya nama dan email yang kamu izinkan.</p>
    <p style="margin-top:10px">Prototipe ini belum terhubung ke Client ID Google, jadi kamu bisa mencoba alurnya dengan akun demo.</p>
    <div class="btns"><button class="btn primary block" id="gDemo">${icon("google")}Masuk sebagai akun demo</button><button class="btn ghost block" id="gCancel">Batal</button></div>`,
    (b, close) => {
      $("#gCancel", b).onclick = close;
      $("#gDemo", b).onclick = async e => { await doGoogle(e.currentTarget); close(); };
    });
}
function renderLogin(el){
  el.innerHTML = `<form class="form" novalidate autocomplete="on">
    <div><h2>Selamat datang kembali</h2></div>
    <p class="sub">Masuk untuk menyimpan tempat favorit dan melihat CCTV.</p>
    ${fieldHTML({ id:"lEmail", label:"Email", type:"email", ic:"mail", ph:"nama@email.com", auto:"username", extra:'inputmode="email" maxlength="254"' })}
    ${fieldHTML({ id:"lPw", label:"Password", type:"password", ic:"lock", ph:"Password kamu", auto:"current-password", extra:'maxlength="128"' })}
    <div class="row"><label class="check"><input type="checkbox" id="lRem">Ingat saya 7 hari</label><button type="button" class="link" id="toForgot">Lupa password?</button></div>
    <button class="btn primary block" type="submit" id="lBtn">Masuk</button>
    ${socialHTML()}
    <p class="secure-note">${icon("shield")}Password dienkripsi PBKDF2 dan tidak pernah disimpan apa adanya</p>
  </form>`;
  bindPeek(el); bindGoogle(el);
  $("#toForgot", el).onclick = () => showAuth("forgot");
  const f = $("form", el), btn = $("#lBtn", el);
  let timer;
  f.onsubmit = async e => {
    e.preventDefault();
    const email = $("#lEmail", el).value, pw = $("#lPw", el).value;
    setErr(el, "lEmail"); setErr(el, "lPw");
    if (!EMAIL_RE.test(email.trim())) return setErr(el, "lEmail", "Masukkan email yang valid.");
    if (!pw) return setErr(el, "lPw", "Masukkan password.");
    busy(btn, true, "Memverifikasi…");
    try { const u = await Auth.login(email, pw, $("#lRem", el).checked); enterApp(u, true); }
    catch (err){
      busy(btn, false); setErr(el, "lPw", err.message); $("#lPw", el).value = "";
      if (err.lock){ clearInterval(timer); btn.disabled = true; const tick = () => { const s = Math.ceil((err.lock - Date.now()) / 1000); if (s <= 0){ clearInterval(timer); btn.disabled = false; btn.textContent = "Masuk"; setErr(el, "lPw"); } else btn.textContent = `Coba lagi dalam ${s} dtk`; }; tick(); timer = setInterval(tick, 1000); }
    }
  };
}
function renderRegister(el){
  el.innerHTML = `<form class="form" novalidate>
    <div><h2>Buat akun baru</h2></div>
    <p class="sub">Gratis. Simpan hidden gem dan bagikan foto kunjunganmu.</p>
    ${fieldHTML({ id:"rName", label:"Nama lengkap", ic:"user", ph:"Nama kamu", auto:"name", extra:'maxlength="60"' })}
    ${fieldHTML({ id:"rEmail", label:"Email", type:"email", ic:"mail", ph:"nama@email.com", auto:"email", extra:'inputmode="email" maxlength="254"' })}
    <div>${fieldHTML({ id:"rPw", label:"Password", type:"password", ic:"lock", ph:"Minimal 10 karakter", auto:"new-password", extra:'maxlength="128"' })}${meterHTML("rPw")}</div>
    ${fieldHTML({ id:"rPw2", label:"Ulangi password", type:"password", ic:"lock", ph:"Ketik ulang password", auto:"new-password", extra:'maxlength="128"' })}
    <input class="hp" type="text" id="rWeb" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="check"><input type="checkbox" id="rAgree"><span>Saya setuju dengan ${SITE ? `<a class="link" href="${esc(siteUrl("/privasi/"))}" data-inapp="1" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a>` : "Kebijakan Privasi"} ExploreTangsel</span></label>
    <div class="err" id="e-rAgree"></div>
    <button class="btn primary block" type="submit" id="rBtn">Buat akun</button>
    ${socialHTML()}
  </form>`;
  bindPeek(el); bindGoogle(el); bindMeter(el, "rPw", () => $("#rEmail", el).value);
  const f = $("form", el), btn = $("#rBtn", el), started = Date.now();
  f.onsubmit = async e => {
    e.preventDefault();
    ["rName","rEmail","rPw","rPw2"].forEach(i => setErr(el, i)); $("#e-rAgree", el).textContent = "";
    const name = $("#rName", el).value.trim(), email = $("#rEmail", el).value.trim(), pw = $("#rPw", el).value, pw2 = $("#rPw2", el).value;
    if ($("#rWeb", el).value || Date.now() - started < 1500) return toast("Permintaan ditolak. Coba lagi.", "warn"); // honeypot & bot timing
    let ok = true;
    if (!NAME_RE.test(name)) { setErr(el, "rName", "Nama 2–60 huruf, tanpa angka atau simbol khusus."); ok = false; }
    if (!EMAIL_RE.test(email)) { setErr(el, "rEmail", "Masukkan email yang valid."); ok = false; }
    const pe = pwError(pw, email); if (pe) { setErr(el, "rPw", pe); ok = false; }
    if (pw !== pw2) { setErr(el, "rPw2", "Password tidak sama."); ok = false; }
    if (!$("#rAgree", el).checked) { $("#e-rAgree", el).textContent = "Centang persetujuan untuk melanjutkan."; ok = false; }
    if (!ok) return;
    busy(btn, true, "Mengamankan akun…");
    try { const u = await Auth.register({ name, email, pw }); enterApp(u, true, true); if (Auth.mode === "firebase") setTimeout(() => toast("Kami kirim email verifikasi. Buka tautannya untuk mengaktifkan akun sepenuhnya.", "mail", 6000), 1800); }
    catch (err){ busy(btn, false); setErr(el, "rEmail", err.message); }
  };
}
function renderForgot(sh, step = 1, email = ""){
  const steps = `<div class="steps">${[1,2,3].map(i => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>`;
  const back = `<button type="button" class="link" id="fBack" style="display:inline-flex;align-items:center;gap:4px">${icon("back")}Kembali ke Masuk</button>`;
  if (step === 1){
    sh.innerHTML = `<form class="form" novalidate>${back}${steps}<div><h2>Lupa password</h2></div>
      <p class="sub">${Auth.mode === "firebase" ? "Masukkan email akunmu. Kami kirim tautan untuk membuat password baru." : "Masukkan email akunmu. Kami kirim kode 6 digit yang berlaku 5 menit."}</p>
      ${fieldHTML({ id:"fEmail", label:"Email", type:"email", ic:"mail", ph:"nama@email.com", auto:"email", extra:'inputmode="email"' })}
      <button class="btn primary block" type="submit" id="fBtn">${Auth.mode === "firebase" ? "Kirim tautan reset" : "Kirim kode"}</button></form>`;
    $("#fBack", sh).onclick = () => showAuth("login");
    $("form", sh).onsubmit = async e => {
      e.preventDefault(); const em = $("#fEmail", sh).value.trim();
      if (!EMAIL_RE.test(em)) return setErr(sh, "fEmail", "Masukkan email yang valid.");
      const btn = $("#fBtn", sh); busy(btn, true, "Mengirim…"); await sleep(700);
      let res; try { res = await Auth.sendReset(em); } catch (err){ busy(btn, false); return setErr(sh, "fEmail", err.message); }
      if (res.type === "email-link") return renderForgot(sh, "sent", em);
      const code = res.code;
      toast("Jika email terdaftar, kode verifikasi sudah dikirim.", "ok", 3500);
      if (code){ const d = document.createElement("div"); d.innerHTML = `<b>Kotak masuk demo</b><br>Kode reset ExploreTangsel kamu:<code>${code}</code>`; setTimeout(() => toast(d, "mail", 12000), 900); }
      renderForgot(sh, 2, em);
    };
  } else if (step === "sent"){
    sh.innerHTML = `<div class="form">${back}<div style="width:64px;height:64px;border-radius:22px;background:var(--petal);color:var(--orchid-d);display:grid;place-items:center">${icon("mail")}</div>
      <div><h2>Cek email kamu</h2></div>
      <p class="sub">Jika <b id="fTo"></b> terdaftar, tautan untuk membuat password baru sudah dikirim. Tautan berlaku sementara; cek juga folder spam.</p>
      <p class="sub">Setelah password diganti, semua perangkat lain otomatis keluar.</p>
      <button class="btn primary block" id="fDone">Kembali ke Masuk</button></div>`;
    $("#fTo", sh).textContent = email;
    $("#fBack", sh).onclick = $("#fDone", sh).onclick = () => { showAuth("login"); setTimeout(() => { const i = $("#lEmail"); if (i) i.value = email; }, 50); };
  } else if (step === 2){
    sh.innerHTML = `<form class="form" novalidate>${back}${steps}<div><h2>Masukkan kode</h2></div>
      <p class="sub">Kode dikirim ke <b id="fTo"></b>. Cek juga folder spam.</p>
      <div class="otp" id="otp">${Array.from({length:6},(_,i)=>`<input inputmode="numeric" maxlength="1" aria-label="Digit ${i+1}" autocomplete="${i===0?"one-time-code":"off"}">`).join("")}</div>
      <div class="err" id="e-otp" role="alert"></div>
      <button class="btn primary block" type="submit" id="oBtn">Verifikasi</button>
      <button type="button" class="btn ghost block" id="resend">Kirim ulang kode</button></form>`;
    $("#fTo", sh).textContent = email;
    $("#fBack", sh).onclick = () => showAuth("login");
    const boxes = $$("#otp input", sh);
    boxes.forEach((b, i) => {
      b.addEventListener("input", () => { b.value = b.value.replace(/\D/g, "").slice(0, 1); if (b.value && boxes[i+1]) boxes[i+1].focus(); });
      b.addEventListener("keydown", e => { if (e.key === "Backspace" && !b.value && boxes[i-1]) boxes[i-1].focus(); });
      b.addEventListener("paste", e => { const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (t.length){ e.preventDefault(); [...t].forEach((c, k) => boxes[k] && (boxes[k].value = c)); (boxes[t.length] || boxes[5]).focus(); } });
    });
    boxes[0].focus();
    let cd = 30; const rs = $("#resend", sh); rs.disabled = true;
    const tk = setInterval(() => { cd--; rs.textContent = cd > 0 ? `Kirim ulang dalam ${cd} dtk` : "Kirim ulang kode"; if (cd <= 0){ rs.disabled = false; clearInterval(tk); } }, 1000);
    rs.onclick = async () => { const code = (await Auth.sendReset(email)).code; toast("Kode baru dikirim jika email terdaftar."); if (code){ const d = document.createElement("div"); d.innerHTML = `<b>Kotak masuk demo</b><br>Kode baru:<code>${code}</code>`; setTimeout(() => toast(d, "mail", 12000), 600); } clearInterval(tk); renderForgot(sh, 2, email); };
    $("form", sh).onsubmit = async e => {
      e.preventDefault(); const code = boxes.map(b => b.value).join("");
      if (code.length !== 6) return ($("#e-otp", sh).textContent = "Masukkan 6 digit kode.");
      const btn = $("#oBtn", sh); busy(btn, true, "Memeriksa…");
      try { await Auth.verifyOtp(email, code); clearInterval(tk); renderForgot(sh, 3, email); }
      catch (err){ busy(btn, false); $("#e-otp", sh).textContent = err.message; boxes.forEach(b => b.value = ""); boxes[0].focus(); }
    };
  } else {
    sh.innerHTML = `<form class="form" novalidate>${steps}<div><h2>Buat password baru</h2></div>
      <p class="sub">Semua perangkat lain akan otomatis keluar setelah password diganti.</p>
      <div>${fieldHTML({ id:"nPw", label:"Password baru", type:"password", ic:"lock", auto:"new-password" })}${meterHTML("nPw")}</div>
      ${fieldHTML({ id:"nPw2", label:"Ulangi password baru", type:"password", ic:"lock", auto:"new-password" })}
      <button class="btn primary block" type="submit" id="nBtn">Simpan password</button></form>`;
    bindPeek(sh); bindMeter(sh, "nPw", () => email);
    $("form", sh).onsubmit = async e => {
      e.preventDefault(); const pw = $("#nPw", sh).value, pw2 = $("#nPw2", sh).value;
      setErr(sh, "nPw"); setErr(sh, "nPw2");
      const pe = pwError(pw, email); if (pe) return setErr(sh, "nPw", pe);
      if (pw !== pw2) return setErr(sh, "nPw2", "Password tidak sama.");
      const btn = $("#nBtn", sh); busy(btn, true, "Menyimpan…");
      try { await Auth.resetPassword(email, pw); toast("Password tersimpan. Silakan masuk dengan password baru."); showAuth("login"); setTimeout(() => { const i = $("#lEmail"); if (i) i.value = email; }, 50); }
      catch (err){ busy(btn, false); toast(err.message, "warn"); showAuth("forgot"); }
    };
  }
}

const SITE = /^https:\/\//.test(CONFIG.siteUrl || "") ? CONFIG.siteUrl.replace(/\/$/, "") : "";
const siteUrl = path => SITE ? SITE + path : "";

/* ---------- APP STATE ---------- */
const S = { user: null, tab: "explore", cat: "all", q: "", mapCat: "all", galleryFilter: "all", myPhotos: [], lastActive: Date.now() };
const TABS = [["explore","Jelajah","compass"],["map","Peta","map"],["gallery","Galeri","image"],["cctv","CCTV","cctv"],["profile","Profil","user"]];

function enterApp(user, fresh, isNew){
  S.user = user; S.lastActive = Date.now(); Native.statusBar(false); loadMyPhotos();
  $("#auth").classList.add("hidden"); $("#main").classList.remove("hidden");
  buildTabs(); go("explore");
  if (fresh) setTimeout(() => toast(isNew ? `Akun dibuat. Selamat datang, ${firstName()}!` : `Selamat datang, ${firstName()}!`), 250);
}
const firstName = () => (S.user?.name || "Penjelajah").split(" ")[0];
const initials = () => (S.user?.name || "E").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const isFav = id => (S.user?.favs || []).includes(id);
function toggleFav(id, btn){
  S.user = Auth.updateUser(S.user.email, u => { u.favs = u.favs || []; const i = u.favs.indexOf(id); i >= 0 ? u.favs.splice(i, 1) : u.favs.push(id); });
  const on = isFav(id); Native.haptic(on ? "medium" : "light");
  $$(`[data-fav="${id}"]`).forEach(b => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  if (on && btn && !reduceMotion){ for (let k = 0; k < 7; k++){ const p = document.createElement("i"); p.className = "burst"; p.style.setProperty("--a", (k * 51) + "deg"); btn.append(p); setTimeout(() => p.remove(), 720); } }
  toast(on ? "Disimpan ke favorit" : "Dihapus dari favorit", "ok", 1600);
}

function buildTabs(){
  const tb = $("#tabbar");
  $$(".tab", tb).forEach(t => t.remove());
  TABS.forEach(([k, l, ic]) => { const b = document.createElement("button"); b.className = "tab"; b.setAttribute("role", "tab"); b.dataset.tab = k; b.setAttribute("aria-selected", "false"); b.innerHTML = icon(ic) + `<span>${l}</span>`; b.onclick = () => go(k); tb.append(b); });
}
function go(tab){
  if (S.tab !== tab) Native.haptic();
  S.tab = tab;
  const idx = TABS.findIndex(t => t[0] === tab);
  $("#tabInd").style.transform = `translateX(${idx * 100}%)`;
  $$(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.tab === tab));
  $$(".view").forEach(v => v.classList.remove("active"));
  const v = $("#v-" + tab); v.classList.add("active"); v.scrollTop = 0;
  ({ explore: renderExplore, map: renderMap, gallery: renderGallery, cctv: renderCCTV, profile: renderProfile })[tab](v);
  if (tab !== "cctv") stopThumbs();
}

/* ---------- EXPLORE ---------- */
function catChips(active, attr){
  return `<button class="chip" ${attr}="all" aria-pressed="${active === "all"}">${icon("gem")}Semua</button>` +
    Object.entries(CATS).map(([k, c]) => `<button class="chip" ${attr}="${k}" aria-pressed="${active === k}">${icon(c.icon)}${c.label}</button>`).join("");
}
function itemHTML(p){
  const c = CATS[p.cat];
  return `<div class="item" role="button" tabindex="0" data-open="${p.id}">
    <div class="thumb">${scene(p.photos[0][0], p.photos[0][1], p.photos[0][2])}</div>
    <div class="meta"><b>${esc(p.name)}</b><small>${icon("pin")}${esc(p.kec)}${S.pos ? ` · ${fmtKm(haversine(S.pos, p))} dari kamu` : ""}</small>
      <span class="tag" style="background:${c.bg};color:${c.color}">${icon(c.icon)}${c.label}</span></div>
    <button class="heart ${isFav(p.id) ? "on" : ""}" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" aria-label="Simpan ${esc(p.name)} ke favorit">${icon("heart")}</button>
  </div>`;
}
function bindOpen(root){
  $$("[data-open]", root).forEach(el => {
    el.onclick = e => { if (e.target.closest("[data-fav]")) return; openDetail(el.dataset.open); };
    el.onkeydown = e => { if ((e.key === "Enter" || e.key === " ") && e.target === el){ e.preventDefault(); openDetail(el.dataset.open); } };
  });
  $$("[data-fav]", root).forEach(b => b.onclick = e => { e.stopPropagation(); toggleFav(b.dataset.fav, b); });
}
const fmtKm = d => d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(1).replace(".", ",")} km`;
function filtered(){
  const q = S.q.trim().toLowerCase();
  const list = PLACES.filter(p => (S.cat === "all" || p.cat === S.cat) && (!q || (p.name + " " + p.kec + " " + CATS[p.cat].label + " " + p.desc).toLowerCase().includes(q)));
  return S.pos ? list.sort((a, b) => haversine(S.pos, a) - haversine(S.pos, b)) : list;
}
async function locateMe(btn, after){
  if (btn) busy(btn, true, "Mencari lokasi…");
  try {
    S.pos = await Native.getPosition();
    const far = haversine(S.pos, { lat: -6.30, lng: 106.71 }) > 25;
    toast(far ? "Lokasimu di luar Tangsel. Jarak tetap dihitung dari posisimu." : "Lokasi ditemukan. Tempat diurutkan dari yang terdekat.");
    after && after();
  } catch (err){ toast(err.message || "Lokasi tidak bisa didapat.", "warn", 4500); }
  finally { if (btn && btn.isConnected) busy(btn, false); }
}
function renderExplore(v){
  const hour = +new Intl.DateTimeFormat("id-ID", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(new Date());
  const greet = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
  const gems = PLACES.filter(p => p.gem);
  v.innerHTML = `
    <div class="top"><div class="hello"><h2 id="hi"></h2><p>Mau menjelajah ke mana hari ini?</p></div><button class="avatar" id="toProfile" aria-label="Profil">${esc(initials())}</button></div>
    <label class="search">${icon("search")}<span class="sr">Cari tempat</span><input id="q" type="search" placeholder="Cari situ, laksa, taman…" maxlength="60" value="${esc(S.q)}"></label>
    <div class="chips" id="cats"><button class="chip" id="nearMe" aria-pressed="${!!S.pos}">${icon("locate")}${S.pos ? "Terdekat" : "Dekat saya"}</button>${catChips(S.cat, "data-cat")}</div>
    <div id="gemsWrap"><div class="sec-title"><h3>Hidden gem pilihan</h3><span>${gems.length} tempat</span></div>
    <div class="carousel">${gems.map(p => `<button class="feat" data-open="${p.id}"><div class="art">${scene(p.photos[0][0], p.photos[0][1], p.photos[0][2] + 500)}</div><span class="gem">${icon("gem")}Hidden gem</span><div class="cap"><b>${esc(p.name)}</b><small>${esc(p.kec)} · ${CATS[p.cat].label}</small></div></button>`).join("")}</div></div>
    <div class="sec-title"><h3 id="listTitle"></h3><span id="listCount"></span></div>
    <div class="list" id="list"></div>
    <p class="note">${icon("info")}Jam buka dan harga diambil dari sumber publik dan bisa berubah. Cek ulang sebelum berangkat.</p>`;
  $("#hi", v).textContent = `${greet}, ${firstName()}`;
  $("#toProfile", v).onclick = () => go("profile");
  bindOpen($("#gemsWrap", v));
  const drawList = () => {
    const items = filtered();
    $("#listTitle", v).textContent = S.cat === "all" ? "Semua tempat" : CATS[S.cat].label;
    $("#listCount", v).textContent = `${items.length} hasil`;
    $("#list", v).innerHTML = items.length ? items.map(itemHTML).join("") : `<div class="empty"><b>Belum ada yang cocok</b>Coba kata lain seperti "situ" atau "laksa", atau pilih kategori Semua.</div>`;
    bindOpen($("#list", v));
    $("#gemsWrap", v).style.display = S.q || S.cat !== "all" ? "none" : "";
  };
  $("#nearMe", v).onclick = () => { if (S.pos){ S.pos = null; return renderExplore(v); } toast("Mencari lokasimu…", "ok", 1800); locateMe(null, () => renderExplore(v)); };
  $("#q", v).oninput = e => { S.q = e.target.value.slice(0, 60); drawList(); };
  $$("[data-cat]", v).forEach(c => c.onclick = () => { S.cat = c.dataset.cat; $$("[data-cat]", v).forEach(x => x.setAttribute("aria-pressed", x === c)); drawList(); });
  drawList();
}

/* ---------- DETAIL ---------- */
function openDetail(id){
  const p = PLACES.find(x => x.id === id); if (!p) return;
  const c = CATS[p.cat], st = nearestStation(p);
  const ojekMin = Math.max(5, Math.round(st.d / 22 * 60 + 4));
  const walk = st.d < 1.2 ? `Jalan kaki ±${Math.round(st.d / 4.5 * 60)} menit dari stasiun` : `Lanjut ojek online ±${ojekMin} menit dari stasiun`;
  const photos = p.photos.map(([k, t, s, cap]) => ({ svg: scene(k, t, s), cap }));
  const mine = S.myPhotos.filter(m => m.place === p.id);
  const real = ((CONFIG.placePhotos || {})[p.id] || []).filter(src => /^img\//.test(src));
  const d = $("#detail");
  d.innerHTML = `
    <div class="d-hero">
      <div class="pager" id="pager">${real.map(src => `<div class="pg"><img alt="${esc(p.name)}" src="${esc(src)}" loading="lazy"></div>`).join("")}${photos.map(ph => `<div class="pg">${ph.svg}</div>`).join("")}${mine.map(m => `<div class="pg"><img alt="Foto kunjungan" src="${m.url}"></div>`).join("")}</div>
      <div class="bar"><button class="round" id="dClose" aria-label="Tutup">${icon("back")}</button><button class="round ${isFav(p.id) ? "on" : ""}" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" aria-label="Simpan ke favorit">${icon("heart")}</button></div>
      <div class="dots" id="dots">${[...real, ...photos, ...mine].map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    </div>
    <div class="d-body">
      <span class="tag" style="background:${c.bg};color:${c.color};margin:0 0 10px">${icon(c.icon)}${c.label}</span>
      <h2>${esc(p.name)}</h2>
      <div class="where">${icon("pin")}Kecamatan ${esc(p.kec)}, Tangerang Selatan</div>
      <p class="desc">${esc(p.desc)}</p>
      <div class="info">
        <div class="r"><div class="ic">${icon("clock")}</div><div><small>Jam buka</small><span class="${p.hours ? "" : "unk"}">${esc(p.hours || "Belum terverifikasi, cek sebelum datang")}</span></div></div>
        <div class="r"><div class="ic">${icon("ticket")}</div><div><small>${p.cat === "kuliner" ? "Kisaran harga" : "Tiket masuk"}</small><span class="${p.price ? "" : "unk"}">${esc(p.price || "Belum terverifikasi")}</span></div></div>
        <div class="r"><div class="ic">${icon("pin")}</div><div><small>Alamat</small><span>${esc(p.address)}</span></div></div>
      </div>
      <h4>Tips dari penjelajah</h4>
      <ul class="tips">${p.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      <h4>Akses ke sana</h4>
      <div class="access">
        <div class="st"><div class="ic">${icon("train")}</div><div><b>${esc(st.name)}</b><small>Stasiun KRL terdekat, sekitar ${st.d.toFixed(1).replace(".", ",")} km (garis lurus)</small></div></div>
        <div class="modes">
          ${S.pos ? `<div class="mode">${icon("locate")}<div><b>Dari lokasimu</b><br>Sekitar ${fmtKm(haversine(S.pos, p))} garis lurus; rute sebenarnya ada di Petunjuk arah</div></div>` : ""}
          <div class="mode">${icon(st.d < 1.2 ? "walk" : "moto")}<div><b>KRL + ${st.d < 1.2 ? "jalan kaki" : "ojek"}</b><br>${walk}</div></div>
          <div class="mode">${icon("car")}<div><b>Mobil pribadi</b><br>Ikuti petunjuk arah; parkir di area resmi sekitar lokasi</div></div>
          <div class="mode">${icon("moto")}<div><b>Ojek online</b><br>Ketik "${esc(p.name)}" sebagai tujuan</div></div>
        </div>
        <div class="acts">
          <a class="btn orchid" href="${gmDir(p, "driving")}" target="_blank" rel="noopener noreferrer">${icon("nav")}Petunjuk arah</a>
          <a class="btn" style="background:rgba(255,255,255,.14);color:#fff" href="${gmDir(p, "transit")}" target="_blank" rel="noopener noreferrer">${icon("train")}Rute umum</a>
        </div>
      </div>
      <div class="acts" style="margin-top:12px">
        <button class="btn ghost" id="dMap">${icon("map")}Lihat di peta</button>
        <button class="btn ghost" id="dPhoto">${icon("camera")}Tambah foto</button>
      </div>
    </div>`;
  d.classList.add("open"); d.setAttribute("aria-hidden", "false"); d.scrollTop = 0;
  $("#dClose", d).onclick = closeDetail;
  bindOpen(d);
  const pager = $("#pager", d), dots = $$("#dots i", d);
  pager.onscroll = () => { const i = Math.round(pager.scrollLeft / pager.clientWidth); dots.forEach((x, k) => x.classList.toggle("on", k === i)); };
  $("#dMap", d).onclick = () => { closeDetail(); S.mapCat = "all"; go("map"); setTimeout(() => focusPin(p.id), 120); };
  $("#dPhoto", d).onclick = () => pickPhoto(p.id, () => openDetail(p.id));
  setTimeout(() => $("#dClose", d).focus(), 300);
}
function closeDetail(){ const d = $("#detail"); d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); }

/* ---------- MAP (ilustratif, tanpa tile eksternal) ---------- */
const MB = { n: -6.215, s: -6.378, w: 106.615, e: 106.795, W: 600, H: 560 };
const proj = (lat, lng) => [ (lng - MB.w) / (MB.e - MB.w) * MB.W, (MB.n - lat) / (MB.n - MB.s) * MB.H ];
function smoothPath(pts, close = true){
  const P = pts.map(([lng, lat]) => proj(lat, lng)), n = P.length;
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  const N = close ? n : n - 1;
  for (let i = 0; i < N; i++){
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const a = close || i > 0 ? p0 : p1, b = close || i + 2 < n ? p3 : p2;
    const c1 = [p1[0] + (p2[0] - a[0]) / 6, p1[1] + (p2[1] - a[1]) / 6], c2 = [p2[0] - (b[0] - p1[0]) / 6, p2[1] - (b[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (close ? "Z" : "");
}
const OUTLINE = [[106.640,-6.228],[106.675,-6.222],[106.703,-6.236],[106.728,-6.246],[106.757,-6.256],[106.777,-6.274],[106.783,-6.300],[106.774,-6.330],[106.760,-6.351],[106.740,-6.366],[106.710,-6.369],[106.684,-6.361],[106.660,-6.353],[106.646,-6.335],[106.640,-6.310],[106.633,-6.285],[106.635,-6.255]];
const MAPV = { k: 1, x: 0, y: 0, sel: null };
let LMAP = null;
function renderMap(v){
  if (LMAP){ try { LMAP.remove(); } catch (e) {} LMAP = null; }
  if (window.L && Native.online && !S.svgMap) return renderMapLeaflet(v);
  renderMapSvg(v);
}
function mapHead(sub){
  return `<div class="map-head"><div class="ttl"><div><b>Peta Tangsel</b><small>${sub}</small></div><span style="color:var(--moss)">${icon("map")}</span></div>
    <div class="chips" id="mapCats">${catChips(S.mapCat, "data-mcat")}</div></div>`;
}
function renderMapLeaflet(v){
  const pins = PLACES.filter(p => S.mapCat === "all" || p.cat === S.mapCat);
  v.innerHTML = `<div class="map-wrap" id="lmap" style="cursor:auto"></div>${mapHead("Ketuk pin untuk detail dan petunjuk arah")}
    <div class="zoom"><button class="round" id="zIn" aria-label="Perbesar">${icon("plus")}</button><button class="round" id="zOut" aria-label="Perkecil">${icon("minus")}</button><button class="round" id="zMe" aria-label="Lokasi saya">${icon("locate")}</button></div>
    <div class="map-card" id="mapCard"></div>`;
  $$("[data-mcat]", v).forEach(c => c.onclick = () => { S.mapCat = c.dataset.mcat; renderMap(v); });
  const m = L.map($("#lmap", v), { zoomControl: false, minZoom: 10, maxBounds: L.latLngBounds([-6.50, 106.50], [-6.10, 106.90]), maxBoundsViscosity: 0.8 });
  const tiles = L.tileLayer(CONFIG.map.tileUrl, { maxZoom: CONFIG.map.maxZoom || 19, attribution: CONFIG.map.attribution }).addTo(m);
  let ok = 0, bad = 0;
  tiles.on("tileload", () => ok++);
  tiles.on("tileerror", () => { bad++; if (bad >= 6 && ok === 0 && !S.svgMap){ S.svgMap = true; toast("Peta online tidak bisa dimuat. Menampilkan peta ilustratif.", "warn"); renderMap(v); } });
  L.polygon(OUTLINE.map(([lng, lat]) => [lat, lng]), { color: "#2F7D6B", weight: 2, dashArray: "6 6", fillColor: "#2F7D6B", fillOpacity: 0.05, interactive: false }).addTo(m);
  L.polyline([[-6.3206,106.6656],[-6.3149,106.6764],[-6.3070,106.6950],[-6.2969,106.7127],[-6.2885,106.7290],[-6.2768,106.7449]], { color: "#12443F", weight: 4, opacity: 0.6, dashArray: "1 8", lineCap: "round", interactive: false }).addTo(m);
  STATIONS.forEach(s => L.circleMarker([s.lat, s.lng], { radius: 6, color: "#12443F", weight: 2.5, fillColor: "#fff", fillOpacity: 1 }).bindTooltip(s.name, { direction: "top", offset: [0, -6] }).addTo(m));
  pins.forEach(p => {
    const c = CATS[p.cat];
    const html = `<div class="lpin ${p.gem ? "gem" : ""}" style="--c:${c.color}"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[c.icon]}</svg></div>`;
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "lpin-wrap", html, iconSize: [36, 44], iconAnchor: [18, 42] }), title: p.name, keyboard: true }).addTo(m)
      .on("click", () => { showMapCard(p.id); m.panTo([p.lat, p.lng]); });
  });
  if (S.pos) addMeMarker(m);
  if (pins.length) m.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng])).pad(0.2)); else m.setView([-6.30, 106.71], 12);
  m.on("click", () => { MAPV.sel = null; $("#mapCard")?.classList.remove("show"); });
  $("#zIn", v).onclick = () => m.zoomIn();
  $("#zOut", v).onclick = () => m.zoomOut();
  $("#zMe", v).onclick = () => locateMe(null, () => { addMeMarker(m); m.flyTo([S.pos.lat, S.pos.lng], 15); });
  LMAP = m; setTimeout(() => m.invalidateSize(), 60);
  if (MAPV.sel && pins.some(p => p.id === MAPV.sel)) showMapCard(MAPV.sel);
}
let ME_MARKER = null;
function addMeMarker(m){
  if (ME_MARKER) try { ME_MARKER.remove(); } catch (e) {}
  ME_MARKER = L.marker([S.pos.lat, S.pos.lng], { icon: L.divIcon({ className: "lpin-wrap", html: '<div class="lme"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), title: "Lokasi kamu", zIndexOffset: 1000 }).addTo(m);
}
function renderMapSvg(v){
  const pins = PLACES.filter(p => S.mapCat === "all" || p.cat === S.mapCat);
  const krl = smoothPath([[106.640,-6.326],[106.6656,-6.3206],[106.6764,-6.3149],[106.6950,-6.3070],[106.7127,-6.2969],[106.7290,-6.2885],[106.7449,-6.2768],[106.790,-6.252]], false);
  const river = smoothPath([[106.664,-6.378],[106.657,-6.350],[106.649,-6.322],[106.645,-6.296],[106.640,-6.266],[106.636,-6.240],[106.628,-6.215]], false);
  const toll1 = smoothPath([[106.640,-6.283],[106.668,-6.288],[106.693,-6.279],[106.712,-6.266],[106.742,-6.259],[106.790,-6.255]], false);
  const toll2 = smoothPath([[106.672,-6.300],[106.705,-6.318],[106.740,-6.330],[106.790,-6.334]], false);
  const situs = [["Situ Gintung",-6.3047,106.7637,9],["Situ Pamulang",-6.3430,106.7300,8],["Danau BSD",-6.3015,106.6650,6]];
  v.innerHTML = `
    <div class="map-wrap" id="mapWrap">
      <svg class="map" id="mapSvg" viewBox="0 0 ${MB.W} ${MB.H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Peta ilustratif Tangerang Selatan">
        <defs><pattern id="dotp" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#B8D4C8"/></pattern>
        <linearGradient id="landg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6FBF8"/><stop offset="1" stop-color="#E7F2EC"/></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#12443F" flood-opacity=".25"/></filter></defs>
        <g id="mapG">
          <rect x="-600" y="-600" width="1800" height="1760" fill="url(#dotp)"/>
          <path d="${smoothPath(OUTLINE)}" fill="url(#landg)" stroke="#2F7D6B" stroke-width="2.5" filter="url(#sh)"/>
          <path d="${river}" fill="none" stroke="#8CCFC9" stroke-width="9" stroke-linecap="round"/>
          <text x="${proj(-6.300,106.643)[0]-10}" y="${proj(-6.300,106.643)[1]}" font-size="10" fill="#4C9C96" font-weight="600" transform="rotate(-80 ${proj(-6.300,106.643)[0]-10} ${proj(-6.300,106.643)[1]})">Sungai Cisadane</text>
          ${situs.map(([n, la, ln, r]) => { const [x, y] = proj(la, ln); return `<ellipse cx="${x}" cy="${y}" rx="${r*1.5}" ry="${r}" fill="#A8DCCF"/>`; }).join("")}
          <path d="${toll1}" fill="none" stroke="#F2B544" stroke-width="6" stroke-linecap="round" opacity=".85"/>
          <path d="${toll2}" fill="none" stroke="#F2B544" stroke-width="6" stroke-linecap="round" opacity=".85"/>
          <path d="${krl}" fill="none" stroke="#12443F" stroke-width="3.5" stroke-linecap="round"/>
          <path d="${krl}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="6 6" stroke-linecap="round"/>
          ${KEC.map(([n, la, ln]) => { const [x, y] = proj(la, ln); return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="700" font-size="15" fill="#12443F" opacity=".22">${n}</text>`; }).join("")}
          ${STATIONS.map(s => { const [x, y] = proj(s.lat, s.lng); return `<g><circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="#12443F" stroke-width="2.5"/><text x="${x+9}" y="${y+16}" font-size="10" font-weight="600" fill="#12443F">${s.name.replace("Stasiun ", "")}</text></g>`; }).join("")}
          ${pins.map(p => { const [x, y] = proj(p.lat, p.lng), c = CATS[p.cat]; return `<g class="pin" data-pin="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}" style="transform-origin:${x}px ${y}px">
              ${p.gem ? `<circle class="pulse" cx="${x}" cy="${y - 16}" r="12" fill="${c.color}" opacity=".5"/>` : ""}
              <path d="M${x} ${y} c-4-6-14-12-14-22a14 14 0 0128 0c0 10-10 16-14 22z" fill="${c.color}" stroke="#fff" stroke-width="2.5"/>
              <g transform="translate(${x - 8} ${y - 30}) scale(.67)" stroke="#fff" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${IC[c.icon]}</g></g>`; }).join("")}
          ${S.pos ? (() => { const [x, y] = proj(S.pos.lat, S.pos.lng); return `<circle cx="${x}" cy="${y}" r="16" fill="#2F6FA3" opacity=".2"/><circle cx="${x}" cy="${y}" r="7" fill="#2F6FA3" stroke="#fff" stroke-width="3"/>`; })() : ""}
        </g>
      </svg>
    </div>
    ${mapHead(Native.online ? "Peta ilustratif. Untuk navigasi, pakai Petunjuk arah" : "Mode offline: peta ilustratif")}
    <div class="zoom"><button class="round" id="zIn" aria-label="Perbesar">${icon("plus")}</button><button class="round" id="zOut" aria-label="Perkecil">${icon("minus")}</button><button class="round" id="zMe" aria-label="Lokasi saya">${icon("nav")}</button><button class="round" id="zReset" aria-label="Atur ulang peta">${icon("locate")}</button></div>
    <div class="legend" id="legend"><span><i style="background:#12443F"></i>Jalur KRL</span><span><i style="background:#F2B544"></i>Jalan tol</span><span><i style="background:#8CCFC9"></i>Sungai & situ</span></div>
    <div class="map-card" id="mapCard"></div>`;
  $$("[data-mcat]", v).forEach(c => c.onclick = () => { S.mapCat = c.dataset.mcat; renderMap(v); });
  $("#zMe", v).onclick = () => locateMe(null, () => { const [x, y] = proj(S.pos.lat, S.pos.lng); if (x < 0 || y < 0 || x > MB.W || y > MB.H) return toast("Kamu berada di luar area peta Tangsel.", "warn"); MAPV.k = 2.2; MAPV.x = MB.W / 2 - x * MAPV.k; MAPV.y = MB.H / 2.4 - y * MAPV.k; renderMapSvg(v); });
  $$("[data-pin]", v).forEach(g => { g.onclick = e => { e.stopPropagation(); focusPin(g.dataset.pin, false); }; g.onkeydown = e => { if (e.key === "Enter") focusPin(g.dataset.pin, false); }; });
  initPanZoom(v);
  if (MAPV.sel && pins.some(p => p.id === MAPV.sel)) showMapCard(MAPV.sel);
}
function applyMap(){ const g = $("#mapG"); if (g) g.setAttribute("transform", `translate(${MAPV.x} ${MAPV.y}) scale(${MAPV.k})`); }
function initPanZoom(v){
  const wrap = $("#mapWrap", v), svg = $("#mapSvg", v);
  applyMap();
  const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(), sc = Math.min(r.width / MB.W, r.height / MB.H), ox = (r.width - MB.W * sc) / 2, oy = (r.height - MB.H * sc) / 2; return [(cx - r.left - ox) / sc, (cy - r.top - oy) / sc]; };
  const zoomAt = (f, sx, sy) => { const k = Math.min(5, Math.max(.8, MAPV.k * f)), real = k / MAPV.k; MAPV.x = sx - (sx - MAPV.x) * real; MAPV.y = sy - (sy - MAPV.y) * real; MAPV.k = k; applyMap(); };
  const P = new Map(); let last = null, pinch = null, moved = false;
  wrap.addEventListener("pointerdown", e => { wrap.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); moved = false; if (P.size === 1) last = [e.clientX, e.clientY]; if (P.size === 2){ const [a, b] = [...P.values()]; pinch = { d: Math.hypot(a[0]-b[0], a[1]-b[1]) }; } wrap.classList.add("drag"); });
  wrap.addEventListener("pointermove", e => {
    if (!P.has(e.pointerId)) return; P.set(e.pointerId, [e.clientX, e.clientY]);
    if (P.size === 2 && pinch){ const [a, b] = [...P.values()], d = Math.hypot(a[0]-b[0], a[1]-b[1]); const [sx, sy] = toSvg((a[0]+b[0])/2, (a[1]+b[1])/2); zoomAt(d / pinch.d, sx, sy); pinch.d = d; moved = true; return; }
    if (last){ const r = svg.getBoundingClientRect(), sc = Math.min(r.width / MB.W, r.height / MB.H); const dx = (e.clientX - last[0]) / sc, dy = (e.clientY - last[1]) / sc; if (Math.abs(dx) + Math.abs(dy) > 1) moved = true; MAPV.x += dx; MAPV.y += dy; last = [e.clientX, e.clientY]; applyMap(); }
  });
  const up = e => { P.delete(e.pointerId); if (P.size < 2) pinch = null; if (!P.size){ last = null; wrap.classList.remove("drag"); } else last = [...P.values()][0]; };
  wrap.addEventListener("pointerup", up); wrap.addEventListener("pointercancel", up);
  wrap.addEventListener("click", e => { if (!moved && !e.target.closest("[data-pin]")) { MAPV.sel = null; $$(".pin").forEach(p => p.classList.remove("sel")); $("#mapCard")?.classList.remove("show"); $("#legend") && ($("#legend").style.opacity = 1); } });
  wrap.addEventListener("wheel", e => { e.preventDefault(); const [sx, sy] = toSvg(e.clientX, e.clientY); zoomAt(e.deltaY < 0 ? 1.15 : 1/1.15, sx, sy); }, { passive: false });
  $("#zIn", v).onclick = () => zoomAt(1.3, MB.W/2, MB.H/2);
  $("#zOut", v).onclick = () => zoomAt(1/1.3, MB.W/2, MB.H/2);
  $("#zReset", v).onclick = () => { Object.assign(MAPV, { k: 1, x: 0, y: 0 }); const g = $("#mapG"); g.style.transition = "transform .5s"; applyMap(); };
}
function focusPin(id, center = true){
  const p = PLACES.find(x => x.id === id); if (!p) return;
  if (LMAP && $("#lmap")){ LMAP.setView([p.lat, p.lng], 16); return showMapCard(id); }
  if (center){ const [x, y] = proj(p.lat, p.lng); MAPV.k = 2.2; MAPV.x = MB.W/2 - x*MAPV.k; MAPV.y = MB.H/2.4 - y*MAPV.k; applyMap(); }
  showMapCard(id);
}
function showMapCard(id){
  const p = PLACES.find(x => x.id === id); MAPV.sel = id;
  $$(".pin").forEach(g => g.classList.toggle("sel", g.dataset.pin === id));
  const card = $("#mapCard"); if (!card) return;
  const st = nearestStation(p);
  card.innerHTML = `<div class="thumb" style="width:72px;height:72px">${scene(p.photos[0][0], p.photos[0][1], p.photos[0][2])}</div>
    <div class="meta" style="flex:1;min-width:0"><b style="display:block">${esc(p.name)}</b><small style="color:var(--ink2);font-size:12.5px">${esc(p.kec)} · ${st.d.toFixed(1).replace(".", ",")} km dari ${esc(st.name.replace("Stasiun ", "St. "))}</small>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn primary" style="padding:8px 12px;font-size:13px" data-open="${p.id}">Lihat detail</button><a class="btn ghost" style="padding:8px 12px;font-size:13px;text-decoration:none" href="${gmSearch(p)}" target="_blank" rel="noopener noreferrer">${icon("ext")}Maps</a></div></div>`;
  card.classList.add("show"); const lg = $("#legend"); if (lg) lg.style.opacity = 0;
  bindOpen(card);
}

/* ---------- GALLERY ---------- */
function allPhotos(){
  const base = PLACES.flatMap(p => p.photos.map(([k, t, s, cap], i) => ({ place: p.id, pname: p.name, cap, k, t, s, tall: (s + i) % 3 === 0 })));
  const mine = S.myPhotos.map(m => ({ ...m, pname: PLACES.find(p => p.id === m.place)?.name || "Tangsel", mine: true }));
  return [...mine, ...base].filter(x => S.galleryFilter === "all" || (S.galleryFilter === "mine" ? x.mine : PLACES.find(p => p.id === x.place)?.cat === S.galleryFilter));
}
function photoNode(x){ return x.mine ? `<img alt="${esc(x.cap)}" src="${x.url}">` : scene(x.k, x.t, x.s).replace('viewBox="0 0 400 300"', x.tall ? 'viewBox="80 0 240 300"' : 'viewBox="0 0 400 300"'); }
function renderGallery(v){
  v.innerHTML = `<div class="top"><div class="hello"><h2>Galeri</h2><p>Potret sudut-sudut Tangsel dari para penjelajah</p></div></div>
    <label class="upload" for="upIn"><div class="ic">${icon("upload")}</div><div><b>Unggah foto kunjunganmu</b><small>${IS_NATIVE ? "Ambil dari kamera atau pilih dari galeri" : "JPG, PNG, atau WebP, maks. 8 MB"}</small></div></label>
    <input type="file" id="upIn" accept="image/jpeg,image/png,image/webp" hidden>
    <div class="chips" style="padding-top:0">${catChips(S.galleryFilter, "data-gcat")}<button class="chip" data-gcat="mine" aria-pressed="${S.galleryFilter === "mine"}">${icon("user")}Foto saya</button></div>
    <div class="masonry" id="mas" style="margin-top:8px"></div>`;
  const items = allPhotos();
  $("#mas", v).innerHTML = items.length ? items.map((x, i) => `<button class="ph ${x.mine ? "mine" : ""}" data-ph="${i}">${photoNode(x)}<span class="lbl">${esc(x.pname)}</span></button>`).join("") : `<div class="empty" style="column-span:all"><b>Belum ada foto</b>Unggah foto dari kunjunganmu dan pilih tempatnya.</div>`;
  $$("[data-ph]", v).forEach(b => b.onclick = () => openLightbox(items, +b.dataset.ph));
  $$("[data-gcat]", v).forEach(c => c.onclick = () => { S.galleryFilter = c.dataset.gcat; renderGallery(v); });
  $("#upIn", v).onchange = e => handleUpload(e.target, null, () => renderGallery(v));
  if (IS_NATIVE) $(".upload", v).onclick = e => { e.preventDefault(); pickPhoto(null, () => renderGallery(v)); };
}
async function loadMyPhotos(){
  S.myPhotos = [];
  if (!IS_NATIVE || !S.user) return;
  const list = Store.get("et_photos", {})[S.user.email] || [];
  S.myPhotos = (await Promise.all(list.map(async x => ({ ...x, url: await Native.photoUrl(x.path) })))).filter(x => x.url);
}
function persistPhotos(){
  if (!IS_NATIVE || !S.user) return;
  const all = Store.get("et_photos", {});
  all[S.user.email] = S.myPhotos.filter(x => x.path).map(({ place, path, cap }) => ({ place, path, cap }));
  Store.set("et_photos", all);
}
function savePhoto(placeId, ph, done){
  const save = pid => { S.myPhotos.unshift({ place: pid, url: ph.url, path: ph.path, cap: "Foto kunjungan" }); persistPhotos(); Native.haptic("medium"); toast("Foto ditambahkan ke galeri"); done && done(); };
  if (placeId) return save(placeId);
  modal(`<h3>Foto ini di mana?</h3><p>Pilih tempat supaya fotomu muncul di halamannya.</p>
    <div class="list" style="padding:0;margin-top:14px;max-height:46vh;overflow:auto">${PLACES.map(p => `<button class="item" data-pick="${p.id}" style="box-shadow:none;border:1.5px solid var(--line)"><div class="thumb" style="width:52px;height:52px">${scene(p.photos[0][0], p.photos[0][1], p.photos[0][2])}</div><div class="meta"><b>${esc(p.name)}</b><small>${esc(p.kec)}</small></div></button>`).join("")}</div>`,
    (b, close) => $$("[data-pick]", b).forEach(x => x.onclick = () => { close(); save(x.dataset.pick); }),
    () => { if (ph.path) Native.deletePhoto(ph.path); });
}
async function pickPhoto(placeId, done){
  if (IS_NATIVE){
    try { const r = await Native.takePhoto(); if (r !== "web"){ if (r) savePhoto(placeId, r, done); return; } }
    catch (err){ return toast(err.message, "warn", 4500); }
  }
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/jpeg,image/png,image/webp";
  inp.onchange = () => handleUpload(inp, placeId, done); inp.click();
}
async function handleUpload(inp, placeId, done){
  const f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast("Format tidak didukung. Gunakan JPG, PNG, atau WebP.", "warn");
  if (f.size > 8 * 1024 * 1024) return toast("Ukuran foto lebih dari 8 MB. Kecilkan dulu lalu unggah lagi.", "warn");
  // Validasi isi file benar-benar gambar (magic bytes), bukan sekadar ekstensi
  const head = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const isJpg = head[0] === 0xFF && head[1] === 0xD8, isPng = head[0] === 0x89 && head[1] === 0x50, isWebp = head[8] === 0x57 && head[9] === 0x45;
  if (!(isJpg || isPng || isWebp)) return toast("File ini bukan gambar yang valid.", "warn");
  savePhoto(placeId, { url: URL.createObjectURL(f) }, done);
}
let LB = { items: [], i: 0 };
function openLightbox(items, i){
  LB = { items, i }; const lb = $("#lightbox");
  $("#lbClose").innerHTML = icon("x"); $("#lbPrev").innerHTML = icon("back"); $("#lbNext").innerHTML = icon("next");
  drawLB(); lb.classList.add("open");
  $("#lbClose").onclick = closeLB; $("#lbPrev").onclick = () => stepLB(-1); $("#lbNext").onclick = () => stepLB(1);
  let sx = null; const st = $("#lbStage");
  st.onpointerdown = e => sx = e.clientX; st.onpointerup = e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) stepLB(e.clientX < sx ? 1 : -1); sx = null; };
  setTimeout(() => $("#lbClose").focus(), 100);
}
function drawLB(){ const x = LB.items[LB.i]; $("#lbStage").innerHTML = x.mine ? `<img alt="${esc(x.cap)}" src="${x.url}" style="object-fit:contain">` : scene(x.k, x.t, x.s); $("#lbCap").textContent = `${x.pname}`; $("#lbCount").textContent = `${x.cap} · ${LB.i + 1}/${LB.items.length}`; }
function stepLB(d){ LB.i = (LB.i + d + LB.items.length) % LB.items.length; drawLB(); }
function closeLB(){ $("#lightbox").classList.remove("open"); }

/* ---------- CCTV (pratinjau simulasi) ---------- */
function jktTime(){ return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date()).replace(/\./g, ":"); }
function jktHour(){ return +new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "numeric", hourCycle: "h23" }).format(new Date()); }
function makeCamSim(cam){
  const r = rng(cam.seed * 131), bld = Array.from({ length: 14 }, () => ({ w: .04 + r()*.07, h: .08 + r()*.22 }));
  const cars = Array.from({ length: cam.lanes * 2 }, (_, i) => ({ lane: i % cam.lanes, s: r(), sp: .06 + r()*.08, col: ["#E8E8E8","#2B2B2B","#B33A2E","#3A5A8C","#C9C3B8","#1F6F5C"][Math.floor(r()*6)], moto: r() < .35 }));
  const skew = (r() - .5) * .18;
  return { cam, bld, cars, skew };
}
function drawCam(ctx, w, h, sim, dt){
  const night = (() => { const hr = jktHour(); return hr < 6 || hr >= 18; })();
  const vx = w * (.5 + sim.skew), vy = h * .36, L = sim.cam.lanes;
  const g = ctx.createLinearGradient(0, 0, 0, vy);
  g.addColorStop(0, night ? "#0B1424" : "#9DB8C4"); g.addColorStop(1, night ? "#1C2738" : "#D6E0E0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, vy + 2);
  let x = 0; sim.bld.forEach(b => { const bw = b.w * w, bh = b.h * h; ctx.fillStyle = night ? "#121B28" : "#7C8C90"; ctx.fillRect(x, vy - bh, bw - 2, bh); if (night){ ctx.fillStyle = "rgba(255,214,140,.7)"; for (let yy = vy - bh + 4; yy < vy - 3; yy += 6) for (let xx = x + 3; xx < x + bw - 4; xx += 5) if ((xx * 7 + yy * 13) % 5 < 1.3) ctx.fillRect(xx, yy, 2, 2); } x += bw; });
  ctx.fillStyle = night ? "#1A2420" : "#6E8A6E"; ctx.fillRect(0, vy, w, h - vy);
  ctx.fillStyle = night ? "#22272B" : "#5A5E62";
  ctx.beginPath(); ctx.moveTo(vx - 6, vy); ctx.lineTo(vx + 6, vy); ctx.lineTo(w * 1.15, h); ctx.lineTo(-w * .15, h); ctx.closePath(); ctx.fill();
  const bx = k => -w * .15 + (w * 1.3) * (k / L);
  sim.t = (sim.t || 0) + dt * .5;
  ctx.strokeStyle = night ? "rgba(230,230,200,.55)" : "rgba(255,255,255,.8)";
  for (let k = 1; k < L; k++){
    const center = k === L / 2;
    ctx.lineWidth = center ? 2.2 : 1.4;
    for (let s = 0; s < 1; s += .08){ const a = ((s + sim.t * (center ? 0 : 1)) % 1), b2 = Math.min(1, a + (center ? .08 : .035)); const p1 = a ** 1.8, p2 = b2 ** 1.8;
      ctx.beginPath(); ctx.moveTo(vx + (bx(k) - vx) * p1, vy + (h - vy) * p1); ctx.lineTo(vx + (bx(k) - vx) * p2, vy + (h - vy) * p2); ctx.stroke(); }
  }
  const sorted = [...sim.cars].sort((a, b) => a.s - b.s);
  sorted.forEach(c => {
    const away = c.lane < L / 2;
    c.s += (away ? -1 : 1) * c.sp * dt * (.25 + c.s); if (c.s > 1.08) c.s = 0.02; if (c.s < 0.02) c.s = 1.05;
    const p = c.s ** 1.8, lx = (bx(c.lane) + bx(c.lane + 1)) / 2, cx = vx + (lx - vx) * p, cy = vy + (h - vy) * p;
    const sz = (w * 1.3 / L) * p * (c.moto ? .28 : .62), hh = sz * (c.moto ? 1.4 : .7);
    if (sz < 1) return;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(cx - sz / 2, cy - hh * .15, sz, hh * .3);
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - sz / 2, cy - hh, sz, hh, sz * .18) : ctx.rect(cx - sz / 2, cy - hh, sz, hh); ctx.fill();
    if (!c.moto){ ctx.fillStyle = "rgba(20,30,40,.75)"; ctx.fillRect(cx - sz * .36, cy - hh * .86, sz * .72, hh * .32); }
    if (night || away){ ctx.fillStyle = away ? "#FF3B2F" : "#FFF3C4"; const lr = Math.max(1, sz * .07);
      [-.32, .32].forEach(o => { ctx.beginPath(); ctx.arc(cx + sz * o, cy - hh * .22, lr, 0, 7); ctx.fill(); });
      if (night && !away){ ctx.fillStyle = "rgba(255,243,196,.12)"; ctx.beginPath(); ctx.moveTo(cx - sz * .4, cy); ctx.lineTo(cx + sz * .4, cy); ctx.lineTo(cx + sz * 1.2, cy + hh * 2.4); ctx.lineTo(cx - sz * 1.2, cy + hh * 2.4); ctx.fill(); } }
  });
  // grain + vignette
  ctx.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  if (night){ ctx.fillStyle = "rgba(20,60,40,.12)"; ctx.fillRect(0, 0, w, h); }
}
function fitCanvas(cv){ const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); return cv.getContext("2d"); }
let thumbRAF = null;
function stopThumbs(){ cancelAnimationFrame(thumbRAF); thumbRAF = null; }
function renderCCTV(v){
  v.innerHTML = `<div class="top"><div class="hello"><h2>CCTV jalan</h2><p>Cek kondisi jalan sebelum berangkat</p></div></div>
    <div class="banner">${icon("info")}<div>Tayangan di sini adalah <b>pratinjau simulasi</b> untuk desain aplikasi. Untuk siaran langsung, buka tautan sumber resmi di tiap kamera tol.</div></div>
    <div class="sec-title" style="padding-top:4px"><h3>Jalan kota</h3><span>6 titik</span></div>
    <div class="cams" id="camsKota"></div>
    <div class="sec-title"><h3>Ruas tol sekitar Tangsel</h3><span>Ada siaran resmi</span></div>
    <div class="cams toll" id="camsTol"></div>
    <p class="note">${icon("shield")}Di versi rilis, siaran diambil lewat API resmi (ATCS Dishub Tangsel atau operator tol) melalui server kami, bukan langsung dari perangkat kamu.</p>`;
  const card = c => `<button class="cam" data-cam="${c.id}"><div class="scr"><canvas></canvas><span class="live"><i></i>${(CONFIG.cctvStreams || {})[c.id] ? "Siaran langsung" : c.type === "tol" ? "Simulasi · ada siaran resmi" : "Simulasi"}</span></div><div class="cm"><b>${esc(c.name)}</b><small>${esc(c.kec)} · ${c.id}</small></div></button>`;
  $("#camsKota", v).innerHTML = CAMS.filter(c => c.type === "kota").map(card).join("");
  $("#camsTol", v).innerHTML = CAMS.filter(c => c.type === "tol").map(card).join("");
  const sims = [];
  $$("[data-cam]", v).forEach(b => { const c = CAMS.find(x => x.id === b.dataset.cam), cv = $("canvas", b); const ctx = fitCanvas(cv); sims.push({ ctx, cv, sim: makeCamSim(c) }); b.onclick = () => openPlayer(c); });
  stopThumbs(); let lastT = performance.now();
  const loop = t => { const dt = Math.min(.05, (t - lastT) / 1000); lastT = t; sims.forEach(s => drawCam(s.ctx, s.cv.width, s.cv.height, s.sim, dt * .6)); if (!reduceMotion) thumbRAF = requestAnimationFrame(loop); };
  thumbRAF = requestAnimationFrame(loop);
}
let plRAF = null, plClock = null;
let HLS = null;
function stopStream(){ const vd = $("#plVideo"); if (HLS){ try { HLS.destroy(); } catch (e) {} HLS = null; } if (vd){ vd.pause(); vd.removeAttribute("src"); vd.load(); vd.hidden = true; } $("#plCanvas").hidden = false; }
function playStream(url, onFail){
  const vd = $("#plVideo"); vd.hidden = false; $("#plCanvas").hidden = true;
  $("#plBadge").innerHTML = "<i></i>Langsung";
  if (vd.canPlayType("application/vnd.apple.mpegurl")) vd.src = url;
  else if (window.Hls && window.Hls.isSupported()){ HLS = new Hls({ lowLatencyMode: true }); HLS.loadSource(url); HLS.attachMedia(vd); HLS.on(Hls.Events.ERROR, (_, d) => { if (d && d.fatal) onFail(); }); }
  else return onFail();
  vd.onerror = onFail;
  vd.play().catch(() => {});
}
function openPlayer(c){
  const pl = $("#player"); $("#plClose").innerHTML = icon("x");
  pl.classList.add("open"); stopStream(); $("#plBadge").innerHTML = "<i></i>Simulasi";
  const stream = (CONFIG.cctvStreams || {})[c.id];
  $("#plId").textContent = `${c.id} · ${c.name}`;
  $("#plInfo").innerHTML = `<h3>${esc(c.name)}</h3><p>${esc(c.kec)}${c.type === "tol" ? "" : ", Tangerang Selatan"}. ${c.type === "tol" ? "Siaran langsung ruas ini tersedia di portal resmi operator." : (stream ? "Siaran langsung dari sumber resmi yang dikonfigurasi." : "Titik ini disiapkan untuk integrasi ATCS Dishub Kota Tangerang Selatan. Saat ini menampilkan simulasi.")}</p>
    ${c.src ? `<a class="btn orchid block" href="${c.src}" data-inapp="1" target="_blank" rel="noopener noreferrer">${icon("ext")}Buka siaran resmi: ${esc(c.srcName)}</a><p style="font-size:12px">Alamat: ${esc(c.src.replace("https://", ""))}</p>` : `<a class="btn block" style="background:rgba(255,255,255,.1);color:#fff" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + ", Tangerang Selatan")}" target="_blank" rel="noopener noreferrer">${icon("map")}Cek kepadatan di Google Maps</a>`}`;
  if (stream && /^https:\/\//i.test(stream)) playStream(stream, () => { stopStream(); $("#plBadge").innerHTML = "<i></i>Simulasi"; toast("Siaran tidak bisa diputar saat ini. Menampilkan simulasi.", "warn"); startSim(c); });
  else startSim(c);
  const tick = () => $("#plClock").textContent = jktTime() + " WIB"; tick(); clearInterval(plClock); plClock = setInterval(tick, 1000);
  $("#plClose").onclick = closePlayer; setTimeout(() => $("#plClose").focus(), 200);
}
function startSim(c){
  const cv = $("#plCanvas"); requestAnimationFrame(() => {
    const ctx = fitCanvas(cv), sim = makeCamSim(c); let lt = performance.now();
    const loop = t => { const dt = Math.min(.05, (t - lt) / 1000); lt = t; drawCam(ctx, cv.width, cv.height, sim, dt); plRAF = requestAnimationFrame(loop); };
    cancelAnimationFrame(plRAF); plRAF = requestAnimationFrame(loop);
  });
}
function closePlayer(){ $("#player").classList.remove("open"); cancelAnimationFrame(plRAF); clearInterval(plClock); stopStream(); }

/* ---------- PROFILE ---------- */
function fmtDate(t){ return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(t)); }
async function renderProfile(v){
  const cur = await Auth.current(); if (!cur) return forceLogout("Sesi berakhir. Silakan masuk lagi.");
  S.user = cur.user; const u = S.user, favs = (u.favs || []).map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  const left = Math.max(0, cur.sess.exp - Date.now()), hrs = Math.floor(left / 36e5);
  v.innerHTML = `<div class="top"><div class="hello"><h2>Profil</h2><p>Akun dan keamanan</p></div></div>
    <div class="pcard"><svg class="bg" viewBox="-90 -90 180 180">${orchidMark(200).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>
      <div class="avatar">${esc(initials())}</div><h3 id="pName"></h3><p id="pMail"></p>
      <div class="stats"><div><b>${favs.length}</b><small>Favorit</small></div><div><b>${S.myPhotos.length}</b><small>Foto</small></div><div><b>${(u.sessions || []).length}</b><small>Sesi aktif</small></div></div></div>
    <div class="sec-title"><h3>Favorit saya</h3><span>${favs.length} tempat</span></div>
    <div class="list" id="favList">${favs.length ? favs.map(itemHTML).join("") : `<div class="empty" style="background:#fff;border-radius:20px"><b>Belum ada favorit</b>Ketuk ikon hati di tempat yang ingin kamu kunjungi.</div>`}</div>
    <div class="sec-title"><h3>Keamanan</h3></div>
    <div class="menu">
      <div class="mi"><div class="ic">${icon("shield")}</div><div class="t">Login via ${({ password: "email & password", google: "Google", "google-demo": "Google (demo)" })[u.provider] || "email"}<small>Sesi berakhir dalam ${hrs >= 24 ? Math.round(hrs / 24) + " hari" : hrs + " jam"} · keluar otomatis setelah 15 menit tidak aktif</small></div></div>
      ${u.provider === "password" ? `<button id="chPw"><div class="ic">${icon("key")}</div><div class="t">Ganti password<small>Perangkat lain akan otomatis keluar</small></div>${icon("next", "chev")}</button>` : ""}
      <button id="hist"><div class="ic">${icon("history")}</div><div class="t">Riwayat masuk<small>${u.history?.[0] ? "Terakhir " + fmtDate(u.history[0].at) : "Belum ada"}</small></div>${icon("next", "chev")}</button>
      <button id="outAll"><div class="ic">${icon("lock")}</div><div class="t">Keluar dari semua perangkat<small>Cabut semua sesi yang aktif</small></div>${icon("next", "chev")}</button>
    </div>
    <div class="menu">
      <button id="logout"><div class="ic">${icon("logout")}</div><div class="t">Keluar</div></button>
      ${SITE ? `<a class="mi" href="${esc(siteUrl("/privasi/"))}" data-inapp="1" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;font-weight:600"><div class="ic">${icon("info")}</div><div class="t">Kebijakan privasi<small>${esc(SITE.replace("https://", ""))}</small></div>${icon("ext", "chev")}</a>` : ""}
      <button id="delAcc" class="danger"><div class="ic">${icon("trash")}</div><div class="t">Hapus akun<small>Data akun dan favorit dihapus permanen</small></div></button>
    </div>
    <p class="note">${icon("info")}${Auth.mode === "firebase" ? "Akun dikelola Firebase Authentication lewat HTTPS. Favorit, foto, dan riwayat tersimpan di perangkat ini." : "Mode lokal: akun tersimpan di perangkat ini saja. Isi Firebase API key di config.js untuk login lewat server."}</p>
    <p class="note" style="margin-bottom:10px">${icon("shield")}ExploreTangsel v${esc(CONFIG.appVersion || "1.0.0")} untuk ${PLATFORM === "ios" ? "iOS" : PLATFORM === "android" ? "Android" : "web"}</p>`;
  $("#pName", v).textContent = u.name; $("#pMail", v).textContent = u.email;
  bindOpen($("#favList", v));
  $("#logout", v).onclick = async () => { await Auth.logout(); forceLogout("Kamu sudah keluar."); };
  $("#outAll", v).onclick = () => modal(`<h3>Keluar dari semua perangkat?</h3><p>Semua sesi aktif dicabut, termasuk di perangkat ini.</p><div class="btns"><button class="btn primary block" id="ok">Keluar dari semua</button><button class="btn ghost block" id="no">Batal</button></div>`, (b, close) => { $("#no", b).onclick = close; $("#ok", b).onclick = async () => { await Auth.logoutAll(u.email); close(); forceLogout("Semua sesi sudah dicabut."); }; });
  $("#hist", v).onclick = () => modal(`<h3>Riwayat masuk</h3><p>Jika ada yang tidak kamu kenali, ganti password dan keluar dari semua perangkat.</p><div class="menu" style="margin:14px 0 0">${(u.history || []).map(h => `<div class="mi"><div class="ic">${icon(h.method.includes("Google") ? "google" : "lock")}</div><div class="t">${esc(h.method)}<small>${fmtDate(h.at)} · ${esc(h.agent)}</small></div></div>`).join("") || `<div class="mi">Belum ada riwayat</div>`}</div><div class="btns"><button class="btn ghost block" id="no">Tutup</button></div>`, (b, close) => $("#no", b).onclick = close);
  const chPw = $("#chPw", v);
  if (chPw) chPw.onclick = () => modal(`<h3>Ganti password</h3><form class="form" novalidate style="margin-top:10px">
      ${fieldHTML({ id:"cOld", label:"Password lama", type:"password", ic:"lock", auto:"current-password" })}
      <div>${fieldHTML({ id:"cNew", label:"Password baru", type:"password", ic:"lock", auto:"new-password" })}${meterHTML("cNew")}</div>
      ${fieldHTML({ id:"cNew2", label:"Ulangi password baru", type:"password", ic:"lock", auto:"new-password" })}
      <button class="btn primary block" type="submit" id="cBtn">Simpan password</button></form>`, (b, close) => {
      bindPeek(b); bindMeter(b, "cNew", () => u.email);
      $("form", b).onsubmit = async e => { e.preventDefault(); ["cOld","cNew","cNew2"].forEach(i => setErr(b, i));
        const o = $("#cOld", b).value, n = $("#cNew", b).value, n2 = $("#cNew2", b).value;
        if (!o) return setErr(b, "cOld", "Masukkan password lama.");
        const pe = pwError(n, u.email); if (pe) return setErr(b, "cNew", pe);
        if (n === o) return setErr(b, "cNew", "Password baru harus berbeda dari yang lama.");
        if (n !== n2) return setErr(b, "cNew2", "Password tidak sama.");
        const btn = $("#cBtn", b); busy(btn, true, "Menyimpan…");
        try { await Auth.changePassword(u.email, o, n); close(); toast("Password diganti. Perangkat lain sudah dikeluarkan."); renderProfile(v); }
        catch (err){ busy(btn, false); setErr(b, "cOld", err.message); } };
    });
  $("#delAcc", v).onclick = () => modal(`<h3>Hapus akun?</h3><p>Akun, favorit, dan riwayat masuk dihapus permanen dan tidak bisa dikembalikan.</p>
      <form class="form" novalidate style="margin-top:12px">${u.provider === "password" ? fieldHTML({ id:"dPw", label:"Ketik password untuk konfirmasi", type:"password", ic:"lock", auto:"current-password" }) : ""}
      <button class="btn block" style="background:#B23A26;color:#fff" type="submit" id="dBtn">Hapus akun permanen</button><button type="button" class="btn ghost block" id="no">Batal</button></form>`, (b, close) => {
      bindPeek(b); $("#no", b).onclick = close;
      $("form", b).onsubmit = async e => { e.preventDefault(); const btn = $("#dBtn", b); busy(btn, true, "Menghapus…");
        try { await Auth.deleteAccount(u.email, $("#dPw", b)?.value || ""); close(); forceLogout("Akun sudah dihapus."); }
        catch (err){ busy(btn, false); setErr(b, "dPw", err.message); } };
    });
}
function forceLogout(msg){
  S.user = null; S.myPhotos = []; S.pos = null; closeDetail(); closeLB(); closePlayer(); stopThumbs(); $("#modal").classList.remove("open");
  showAuth("login"); if (msg) toast(msg, "ok");
}

/* ---------- idle timeout ---------- */
["pointerdown", "keydown", "scroll", "touchstart"].forEach(ev => document.addEventListener(ev, () => S.lastActive = Date.now(), { passive: true, capture: true }));
setInterval(async () => {
  if (!S.user) return;
  if (Date.now() - S.lastActive > IDLE_MS){ await Auth.logout(); forceLogout("Kamu dikeluarkan otomatis karena 15 menit tidak aktif."); }
}, 15000);
document.addEventListener("keydown", e => {
  if (e.key === "Escape"){ if ($("#modal").classList.contains("open")) $("#modal").classList.remove("open"); else if ($("#lightbox").classList.contains("open")) closeLB(); else if ($("#player").classList.contains("open")) closePlayer(); else if ($("#detail").classList.contains("open")) closeDetail(); }
  if ($("#lightbox").classList.contains("open")){ if (e.key === "ArrowRight") stepLB(1); if (e.key === "ArrowLeft") stepLB(-1); }
});

/* ---------- native events ---------- */
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]"); if (!a) return;
  const href = a.getAttribute("href") || "";
  if (!/^https:\/\//i.test(href)){ if (!href.startsWith("#")) e.preventDefault(); return; } // blokir skema lain (javascript:, intent:, dll.)
  if (IS_NATIVE){ e.preventDefault(); Native.openUrl(href, a.dataset.inapp === "1"); }
});
window.addEventListener("et:back", () => {
  if ($("#modal").classList.contains("open")) return $("#modal").classList.remove("open");
  if ($("#lightbox").classList.contains("open")) return closeLB();
  if ($("#player").classList.contains("open")) return closePlayer();
  if ($("#detail").classList.contains("open")) return closeDetail();
  if (!$("#auth").classList.contains("hidden") && $("#fBack")) return showAuth("login");
  if (S.user && S.tab !== "explore") return go("explore");
  Native.exit();
});
window.addEventListener("et:resume", async () => {
  if (S.user && Date.now() - S.lastActive > IDLE_MS){ await Auth.logout(); forceLogout("Kamu dikeluarkan otomatis karena 15 menit tidak aktif."); }
});
window.addEventListener("et:network", e => toast(e.detail ? "Kembali online." : "Kamu sedang offline. Peta online dan login server butuh internet.", e.detail ? "ok" : "warn"));

/* ---------- boot ---------- */
(async function boot(){
  if (!window.crypto || !crypto.subtle){
    document.body.innerHTML = '<p style="color:#fff;padding:24px;font-family:sans-serif">Perangkat ini tidak mendukung Web Crypto. Perbarui Android System WebView atau iOS ke versi terbaru.</p>';
    return Native.hideSplash();
  }
  try { await Native.init(); } catch (e) {}
  try { await Store.hydrate(); } catch (e) {}
  Native.hideSplash();
  runSplash();
})();
