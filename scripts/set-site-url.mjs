// Mengisi placeholder alamat website GitHub Pages ke file HTML/JS.
// Pemakaian: node scripts/set-site-url.mjs <folder> [folder lain...]
// Environment (otomatis tersedia di GitHub Actions):
//   GITHUB_REPOSITORY  owner/nama-repo
//   SITE_URL           opsional, menimpa alamat otomatis
//   CONTACT_EMAIL      opsional, email kontak untuk Kebijakan Privasi (repository variable)
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const repo = process.env.GITHUB_REPOSITORY || "";
let site = (process.env.SITE_URL || "").trim();
if (!site && repo) {
  const [owner, name] = repo.split("/");
  const host = `${owner.toLowerCase()}.github.io`;
  site = name.toLowerCase() === host ? `https://${host}` : `https://${host}/${name}`;
}
site = site.replace(/\/$/, "");
if (!site) { console.warn("[site-url] GITHUB_REPOSITORY/SITE_URL kosong, placeholder dibiarkan."); process.exit(0); }

const email = (process.env.CONTACT_EMAIL || "").trim();
const okEmail = /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(email);
const contact = okEmail
  ? `<a href="mailto:${email}">${email}</a>`
  : repo ? `<a href="https://github.com/${repo}/issues">GitHub Issues proyek ini</a>` : "halaman GitHub proyek ini";

const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? (f === "vendor" ? [] : walk(p)) : [p]; });
let changed = 0;
for (const dir of process.argv.slice(2)) {
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    if (![".html", ".js"].includes(extname(file))) continue;
    const src = readFileSync(file, "utf8");
    const out = src.replaceAll("__SITE_URL__", site).replaceAll("__REPO__", repo).replaceAll("__CONTACT__", contact);
    if (out !== src) { writeFileSync(file, out); changed++; }
  }
}
console.log(`[site-url] ${site} (kontak: ${okEmail ? email : "GitHub Issues"}) -> ${changed} file diperbarui`);
