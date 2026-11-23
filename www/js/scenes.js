/* ---------- SCENE ILLUSTRATIONS (SVG "foto") ---------- */
const PAL = {
  pagi:  { s1:"#FFD9BF", s2:"#E3F4EC", sun:"#FFB46B", h1:"#9CC9B4", h2:"#5E9E89", w1:"#A8DCCF", w2:"#2F7D6B", g1:"#8CC3A0", g2:"#4E9A70", trunk:"#6B4F3A", win:0.1 },
  siang: { s1:"#A9DDEA", s2:"#EAF7F2", sun:"#FFE38F", h1:"#78B9A1", h2:"#3E8771", w1:"#86CFCB", w2:"#1D5E58", g1:"#86C59A", g2:"#3F8E63", trunk:"#6B4F3A", win:0.05 },
  senja: { s1:"#E39BC2", s2:"#FFD49E", sun:"#FF8F5E", h1:"#9B7AA8", h2:"#5D4C7E", w1:"#E3A3C0", w2:"#45386A", g1:"#6F7F6E", g2:"#3E5F59", trunk:"#3E2F35", win:0.5 },
  malam: { s1:"#15233F", s2:"#3A3D6B", sun:"#FFF1C4", h1:"#2E3E5C", h2:"#1E2A44", w1:"#2E4A72", w2:"#0F1A30", g1:"#2C4A4A", g2:"#1A3434", trunk:"#151520", win:0.8 }
};
let SC = 0;
function scene(kind, tod = "siang", seed = 1){
  const id = "sc" + (++SC), r = rng(seed * 7919 + kind.length * 31), p = PAL[tod] || PAL.siang;
  const f = n => n.toFixed(1);
  let defs = `<linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.s1}"/><stop offset="1" stop-color="${p.s2}"/></linearGradient>
  <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.w1}"/><stop offset="1" stop-color="${p.w2}"/></linearGradient>
  <radialGradient id="${id}s"><stop offset="0" stop-color="${p.sun}"/><stop offset=".5" stop-color="${p.sun}" stop-opacity=".6"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>`;
  const sky = () => `<rect width="400" height="300" fill="url(#${id}k)"/>` + (tod === "malam" ? Array.from({length:26},()=>`<circle cx="${f(r()*400)}" cy="${f(r()*130)}" r="${f(.5+r()*1.1)}" fill="#fff" opacity="${f(.3+r()*.6)}"/>`).join("") : "");
  const sun = (x, y, rr = 24) => `<circle cx="${x}" cy="${y}" r="${rr*2.6}" fill="url(#${id}s)" opacity=".7"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${p.sun}"/>`;
  const ridge = (y, amp, n, fill, op = 1) => { let d = `M0 ${y}`; const st = 400 / n; for (let i = 0; i < n; i++){ d += ` Q${f(i*st+st/2)} ${f(y-amp*(.4+r()*.9))} ${f((i+1)*st)} ${f(y+(r()-.5)*amp*.25)}`; } return `<path d="${d} L400 300 L0 300Z" fill="${fill}" opacity="${op}"/>`; };
  const trees = (y, n, fill, a, b, x0 = 0, x1 = 400) => { let s = ""; for (let i = 0; i < n; i++){ const x = x0 + r()*(x1-x0), rr = a + r()*(b-a); s += `<rect x="${f(x-1.6)}" y="${f(y-rr*.4)}" width="3.2" height="${f(rr*1.3)}" fill="${p.trunk}"/><circle cx="${f(x)}" cy="${f(y-rr)}" r="${f(rr)}" fill="${fill}"/><circle cx="${f(x-rr*.35)}" cy="${f(y-rr*1.3)}" r="${f(rr*.42)}" fill="#fff" opacity=".13"/>`; } return s; };
  let b = "";
  switch (kind){
    case "situ": {
      const sx = 120 + r()*160;
      b = sky() + sun(sx, 120 + r()*30) + ridge(176, 34, 5, p.h2, .75) + ridge(190, 16, 10, p.h1) + trees(194, 14, p.g2, 5, 10);
      b += `<rect y="196" width="400" height="104" fill="url(#${id}w)"/>`;
      for (let i = 0; i < 7; i++) b += `<rect x="${f(sx-34+i*4+(r()-.5)*8)}" y="${200+i*13}" width="${f(68-i*8)}" height="3" rx="1.5" fill="${p.sun}" opacity="${f(.75-i*.09)}"/>`;
      for (let i = 0; i < 12; i++){ const x = r()*400, y = 210 + r()*85; b += `<path d="M${f(x)} ${f(y)} q8 -3 16 0" stroke="#fff" stroke-width="1.4" fill="none" opacity=".35"/>`; }
      for (let i = 0; i < 9; i++){ const x = 6 + i*7 + r()*4; b += `<path d="M${f(x)} 300 Q${f(x+4)} ${f(250-r()*20)} ${f(x+10+r()*8)} ${f(222-r()*30)}" stroke="${p.g2}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }
      b += `<path d="M300 236 h44 l-6 8 h-32z" fill="${p.trunk}" opacity=".85"/><path d="M322 236 v-16" stroke="${p.trunk}" stroke-width="1.5"/>`;
      break; }
    case "river": {
      b = sky() + sun(110 + r()*40, 88, 20) + ridge(150, 22, 6, p.h2, .8) + trees(153, 16, p.g2, 4, 8);
      b += `<path d="M0 150 L172 150 L60 300 L0 300Z" fill="${p.g1}"/><path d="M228 150 L400 150 L400 300 L340 300Z" fill="${p.g1}"/>`;
      b += `<path d="M152 150 L172 150 L82 300 L28 300Z" fill="#EFE6D6"/><path d="M228 150 L248 150 L372 300 L318 300Z" fill="#EFE6D6"/>`;
      b += `<path d="M172 150 L228 150 L318 300 L82 300Z" fill="url(#${id}w)"/>`;
      for (let i = 0; i < 9; i++){ const t = i/9, y = 158 + t*138, w = 6 + t*30, x = 188 + (r()-.5)*(20+t*120); b += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(1.2+t*2)}" rx="1" fill="#fff" opacity=".45"/>`; }
      for (let k = 0; k < 5; k++){ const t = (k+1)/5, y = 150 + t*150, x = 250 + t*112, h = 8 + t*46; b += `<path d="M${f(x)} ${f(y)} v-${f(h)}" stroke="#3E4B4A" stroke-width="${f(1+t*1.6)}"/><circle cx="${f(x)}" cy="${f(y-h)}" r="${f(2+t*4)}" fill="${p.sun}"/>` + (tod==="senja"||tod==="malam" ? `<circle cx="${f(x)}" cy="${f(y-h)}" r="${f(8+t*14)}" fill="${p.sun}" opacity=".25"/>` : ""); }
      b += trees(250, 3, p.g2, 16, 26, 0, 40);
      break; }
    case "park": {
      b = sky() + sun(300, 80, 22) + ridge(172, 26, 5, p.h1, .8) + trees(176, 10, p.g2, 8, 14) + ridge(208, 18, 4, p.g1);
      b += `<path d="M150 300 C 190 262 168 232 198 208 L212 208 C 192 236 216 266 254 300Z" fill="#EADFC8"/>`;
      b += trees(272, 2, p.g2, 22, 30, 10, 110) + trees(272, 2, p.g2, 22, 30, 290, 390);
      b += `<g transform="translate(272 246)" fill="${p.trunk}"><rect width="40" height="4" rx="2"/><rect y="-9" width="40" height="3" rx="1.5"/><rect x="3" y="4" width="3" height="9"/><rect x="34" y="4" width="3" height="9"/></g>`;
      break; }
    case "kampung": {
      b = sky() + sun(80, 76, 20) + ridge(176, 26, 6, p.h2, .7) + trees(186, 14, p.g2, 7, 13);
      b += `<rect y="200" width="400" height="100" fill="#D8BE8C"/>`;
      for (let i = 0; i < 8; i++) b += `<ellipse cx="${f(r()*400)}" cy="${f(220+r()*70)}" rx="${f(18+r()*30)}" ry="${f(4+r()*5)}" fill="${p.g1}" opacity=".8"/>`;
      b += `<g transform="translate(96 172)"><rect y="0" width="96" height="44" fill="#B07A4F"/>${Array.from({length:9},(_,i)=>`<path d="M${6+i*10.5} 0 v44" stroke="#8A5A36" stroke-width="2"/>`).join("")}<rect x="38" y="16" width="20" height="28" fill="#5B3A22"/><path d="M-14 4 L48 -36 L110 4Z" fill="#7A5A3A"/>${Array.from({length:10},(_,i)=>`<path d="M${-8+i*12} 2 l6 -8" stroke="#5E432A" stroke-width="1.4"/>`).join("")}</g>`;
      b += `<g transform="translate(270 168)" stroke="${p.trunk}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M0 50 L20 0 L40 50M60 50 L80 0 L100 50M20 0 H80"/><path d="M48 0 v30" stroke-width="1.5"/><rect x="40" y="30" width="16" height="4" fill="${p.trunk}"/></g>`;
      b += `<g transform="translate(300 60) rotate(12)"><path d="M0 -22 L16 0 L0 22 L-16 0Z" fill="#B64B8E"/><path d="M0 -22 V22 M-16 0 H16" stroke="#F7DCEA" stroke-width="1.3"/><path d="M0 22 q6 14 -4 26 q-8 12 2 24" stroke="#fff" stroke-width="1.2" fill="none"/></g>`;
      break; }
    case "skyline": {
      b = sky() + sun(200, 156, 30);
      let bl = "", x = -6;
      while (x < 404){ const w = 18 + r()*24, h = 40 + r()*96, y = 200 - h; bl += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${p.h2}"/>`;
        for (let wy = y + 6; wy < 194; wy += 9) for (let wx = x + 4; wx < x + w - 4; wx += 7) if (r() < p.win) bl += `<rect x="${f(wx)}" y="${f(wy)}" width="3" height="4" fill="${p.sun}" opacity=".9"/>`;
        x += w + 3 + r()*5; }
      b += `<g>${bl}</g><rect y="200" width="400" height="100" fill="url(#${id}w)"/><g transform="translate(0 400) scale(1 -1)" opacity=".3">${bl}</g>`;
      for (let i = 0; i < 16; i++) b += `<rect x="${f(r()*380)}" y="${f(206+r()*90)}" width="${f(10+r()*30)}" height="1.5" fill="#fff" opacity=".3"/>`;
      break; }
    case "bowl": {
      defs += `<radialGradient id="${id}b" cx=".45" cy=".4"><stop offset="0" stop-color="#FAD27A"/><stop offset=".7" stop-color="#EFA244"/><stop offset="1" stop-color="#D9832B"/></radialGradient>`;
      const wood = tod === "malam" ? "#6E4B33" : "#C99A6B";
      b = `<rect width="400" height="300" fill="${wood}"/>` + Array.from({length:12},(_,i)=>`<path d="M0 ${i*26+r()*8} Q200 ${i*26+r()*16} 400 ${i*26+r()*8}" stroke="#000" stroke-opacity=".08" stroke-width="2" fill="none"/>`).join("");
      b += `<ellipse cx="206" cy="160" rx="118" ry="112" fill="#000" opacity=".18"/><circle cx="200" cy="150" r="112" fill="#F7F2EA"/><circle cx="200" cy="150" r="104" fill="none" stroke="#2F7D6B" stroke-width="3"/><circle cx="200" cy="150" r="92" fill="url(#${id}b)"/>`;
      for (let i = 0; i < 16; i++){ const a = r()*Math.PI*2, d = r()*58, x = 200+Math.cos(a)*d, y = 150+Math.sin(a)*d; b += `<path d="M${f(x-22)} ${f(y)} c 10 -14, 22 14, 34 -2 s 14 10 18 2" stroke="#FCEBC0" stroke-width="3.6" fill="none" stroke-linecap="round"/>`; }
      for (let i = 0; i < 5; i++){ const a = r()*6.28, d = 30+r()*40; b += `<rect x="${f(200+Math.cos(a)*d-9)}" y="${f(150+Math.sin(a)*d-9)}" width="18" height="18" rx="4" fill="#E2AE5E" transform="rotate(${f(r()*60)} ${f(200+Math.cos(a)*d)} ${f(150+Math.sin(a)*d)})"/>`; }
      b += `<g transform="translate(232 120)"><ellipse rx="20" ry="15" fill="#fff"/><circle r="8" fill="#F5B731"/></g><g transform="translate(168 182)"><ellipse rx="18" ry="13" fill="#fff"/><circle r="7" fill="#F5B731"/></g>`;
      for (let i = 0; i < 14; i++){ const a = r()*6.28, d = r()*70; b += `<ellipse cx="${f(200+Math.cos(a)*d)}" cy="${f(150+Math.sin(a)*d)}" rx="5" ry="2.6" fill="#3F8E50" transform="rotate(${f(r()*180)} ${f(200+Math.cos(a)*d)} ${f(150+Math.sin(a)*d)})"/>`; }
      for (let i = 0; i < 8; i++){ const a = r()*6.28, d = r()*70; b += `<circle cx="${f(200+Math.cos(a)*d)}" cy="${f(150+Math.sin(a)*d)}" r="2.4" fill="#C8341F"/>`; }
      b += `<g transform="rotate(-28 330 70)"><rect x="250" y="62" width="170" height="7" rx="3.5" fill="#5B3A22"/><rect x="250" y="76" width="170" height="7" rx="3.5" fill="#6E4A2E"/></g>`;
      b += `<circle cx="340" cy="244" r="30" fill="#F7F2EA"/><circle cx="340" cy="244" r="22" fill="#B8301C"/><circle cx="334" cy="238" r="5" fill="#E2603F" opacity=".7"/>`;
      break; }
    case "grill": {
      const tbl = tod === "malam" ? "#22332F" : "#38524B";
      b = `<rect width="400" height="300" fill="${tbl}"/><g transform="rotate(-8 200 150)"><ellipse cx="200" cy="155" rx="190" ry="110" fill="#3F8B4E"/><path d="M20 155 H380" stroke="#7FC48C" stroke-width="3"/>${Array.from({length:10},(_,i)=>`<path d="M${50+i*32} 155 l${i%2?18:-18} -70 M${50+i*32} 155 l${i%2?-18:18} 70" stroke="#74B982" stroke-width="1.5" opacity=".7"/>`).join("")}</g>`;
      for (let s = 0; s < 5; s++){ const y = 92 + s*28, x0 = 70 + r()*20; b += `<path d="M${f(x0)} ${y} L${f(x0+250)} ${y-30}" stroke="#D9B98A" stroke-width="3" stroke-linecap="round"/>`;
        for (let c = 0; c < 4; c++){ const cx = x0 + 40 + c*44, cy = y - (cx-x0)*0.12; b += `<rect x="${f(cx-15)}" y="${f(cy-11)}" width="30" height="22" rx="8" fill="#9A5228" transform="rotate(-7 ${f(cx)} ${f(cy)})"/><path d="M${f(cx-9)} ${f(cy-6)} l6 12 M${f(cx+1)} ${f(cy-7)} l6 12" stroke="#4A2615" stroke-width="2.2" stroke-linecap="round"/>`; } }
      b += `<circle cx="320" cy="236" r="30" fill="#F7F2EA"/><circle cx="320" cy="236" r="22" fill="#5B2B1A"/><circle cx="314" cy="232" r="6" fill="#8A4A2A"/>`;
      b += `<g transform="translate(70 238)"><circle r="20" fill="#B9D86A"/><circle r="16" fill="#DDEFA0"/>${Array.from({length:6},(_,i)=>`<path d="M0 0 L${f(Math.cos(i)*16)} ${f(Math.sin(i)*16)}" stroke="#B9D86A" stroke-width="1.5"/>`).join("")}</g>`;
      break; }
    case "market": {
      b = sky() + (tod !== "malam" ? sun(320, 70, 18) : "") + ridge(170, 20, 8, p.h2, .9);
      const L = [];
      b += `<path d="M-10 70 Q100 120 210 78 T420 74" stroke="#2A2A2A" stroke-width="1.4" fill="none" opacity=".6"/>`;
      for (let i = 0; i < 18; i++){ const x = -10 + i*25, t = i/17; const y = t < .5 ? 70 + Math.sin(t*2*Math.PI)*36 : 78 + Math.sin((t-.5)*2*Math.PI)*-4 + (1-Math.abs(t-.75)*4)*20; L.push(`<circle cx="${f(x)}" cy="${f(y+4)}" r="9" fill="${p.sun}" opacity=".25"/><circle cx="${f(x)}" cy="${f(y+4)}" r="3.4" fill="${p.sun}"/>`); }
      b += L.join("");
      const cols = ["#B64B8E","#2F7D6B","#E0892E"];
      for (let s = 0; s < 3; s++){ const x = 10 + s*132, c = cols[s % 3];
        b += `<rect x="${x+8}" y="170" width="110" height="130" fill="${p.h1}"/><rect x="${x}" y="200" width="126" height="56" fill="#F4E7D3"/><rect x="${x}" y="196" width="126" height="8" fill="${p.trunk}"/>`;
        let aw = ""; for (let k = 0; k < 7; k++) aw += `<path d="M${x+k*18} 140 h18 v28 a9 9 0 01-18 0z" fill="${k%2?"#fff":c}"/>`; b += aw;
        for (let w = 0; w < 3; w++) b += `<path d="M${x+30+w*30} 196 q-8 -14 0 -26 q8 -12 0 -24" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>`;
        b += `<circle cx="${x+40}" cy="222" r="10" fill="${c}" opacity=".85"/><circle cx="${x+70}" cy="226" r="8" fill="#E0B25A"/><rect x="${x+88}" y="214" width="22" height="16" rx="3" fill="#C8341F" opacity=".8"/>`; }
      break; }
  }
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${b}</svg>`;
}
function orchidMark(size = 30, color = "#fff"){
  const sep = "M0 0 C 18 -24, 14 -64, 0 -78 C -14 -64, -18 -24, 0 0Z", pet = "M0 0 C 34 -18, 32 -60, 0 -68 C -32 -60, -34 -18, 0 0Z";
  return `<svg viewBox="-90 -90 180 180" width="${size}" height="${size}" aria-hidden="true"><g fill="${color}">
  <path d="${sep}" opacity=".9"/><path d="${sep}" transform="rotate(128)" opacity=".9"/><path d="${sep}" transform="rotate(-128)" opacity=".9"/>
  <path d="${pet}" transform="rotate(64)" opacity=".7"/><path d="${pet}" transform="rotate(-64)" opacity=".7"/></g>
  <path d="M0 4 C 26 8, 30 40, 0 50 C -30 40, -26 8, 0 4Z" fill="#8E2F6E"/><circle r="9" fill="#FFF1C9"/></svg>`;
}

