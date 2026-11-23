/* ---------- UI helpers ---------- */
function toast(msg, kind = "ok", ms = 3200){
  const box = $("#toast"), t = document.createElement("div");
  t.className = "t " + kind;
  const ic = kind === "warn" ? "info" : kind === "mail" ? "mail" : "check";
  t.innerHTML = icon(ic) + "<div></div>";
  if (typeof msg === "string") t.lastChild.textContent = msg; else t.lastChild.append(msg);
  box.append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 380); }, ms);
}
function modal(html, onMount, onDismiss){
  const m = $("#modal"), b = $("#modalBox");
  b.innerHTML = `<div class="grab"></div>` + html;
  m.classList.add("open"); m.setAttribute("aria-hidden", "false");
  const close = () => { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); };
  m.onclick = e => { if (e.target === m){ close(); onDismiss && onDismiss(); } };
  onMount && onMount(b, close);
  setTimeout(() => { const f = b.querySelector("input,button.btn"); f && f.focus(); }, 300);
  return close;
}
document.addEventListener("pointerdown", e => {
  const btn = e.target.closest(".btn"); if (!btn || reduceMotion) return;
  const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement("span");
  d.className = "rip"; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s/2}px;top:${e.clientY - r.top - s/2}px`;
  btn.append(d); setTimeout(() => d.remove(), 650);
});
function busy(btn, on, label){
  if (on){ btn.dataset.l = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${esc(label || "Memproses…")}`; }
  else { btn.disabled = false; btn.innerHTML = btn.dataset.l || btn.innerHTML; }
}
function fieldHTML({ id, label, type = "text", ic, ph = "", auto = "", extra = "" }){
  const peek = type === "password" ? `<button type="button" class="peek" data-peek="${id}" aria-label="Tampilkan password">${icon("eye")}</button>` : "";
  return `<div class="field"><label for="${id}">${label}</label><div class="input" id="w-${id}">${icon(ic)}<input id="${id}" name="${id}" type="${type}" placeholder="${ph}" autocomplete="${auto}" ${extra} spellcheck="false">${peek}</div><div class="err" id="e-${id}" role="alert"></div></div>`;
}
function bindPeek(root){
  $$("[data-peek]", root).forEach(b => b.onclick = () => {
    const i = $("#" + b.dataset.peek, root); const show = i.type === "password";
    i.type = show ? "text" : "password"; b.innerHTML = icon(show ? "eyeoff" : "eye"); b.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
  });
}
function setErr(root, id, msg){ const e = $("#e-" + id, root), w = $("#w-" + id, root); if (e) e.textContent = msg || ""; if (w) w.classList.toggle("bad", !!msg); }
function meterHTML(id){ return `<div class="meter" id="m-${id}"><i></i><i></i><i></i><i></i></div><ul class="rules" id="r-${id}"><li data-k="len">Minimal 10 karakter</li><li data-k="case">Huruf besar & kecil</li><li data-k="num">Mengandung angka</li><li data-k="sym">Mengandung simbol</li></ul>`; }
function bindMeter(root, pwId, emailGetter){
  const inp = $("#" + pwId, root), cols = ["#C2412D","#E0892E","#C9A227","#2F7D6B"];
  const upd = () => {
    const v = inp.value, s = pwScore(v, emailGetter()), c = pwChecks(v, emailGetter());
    $$("#m-" + pwId + " i", root).forEach((el, i) => el.style.background = i < s ? cols[s - 1] : "");
    const m = { len: c.len, case: c.up && c.low, num: c.num, sym: c.sym };
    $$("#r-" + pwId + " li", root).forEach(li => li.classList.toggle("ok", !!m[li.dataset.k]));
  };
  inp.addEventListener("input", upd); upd();
}
function pwError(pw, email){
  const c = pwChecks(pw, email);
  if (!c.len) return "Password minimal 10 karakter.";
  if (!(c.up && c.low)) return "Gunakan kombinasi huruf besar dan kecil.";
  if (!c.num) return "Tambahkan minimal satu angka.";
  if (!c.sym) return "Tambahkan minimal satu simbol, misalnya ! atau #.";
  if (!c.notmail) return "Password tidak boleh memuat nama email kamu.";
  return "";
}

