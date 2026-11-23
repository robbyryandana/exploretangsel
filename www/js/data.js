/* ---------- DATA ---------- */
const CATS = {
  alam:    { label: "Situ & Alam",  icon: "situ",   color: "#2F7D6B", bg: "#DDEFE7" },
  taman:   { label: "Taman",        icon: "leaf",   color: "#3E8B5E", bg: "#E1F1E4" },
  kuliner: { label: "Kuliner",      icon: "bowl",   color: "#C9721C", bg: "#FCEBD6" },
  foto:    { label: "Spot Foto",    icon: "camera", color: "#B64B8E", bg: "#F7DCEA" },
  edukasi: { label: "Edukasi Anak", icon: "kite",   color: "#2F6FA3", bg: "#DDEAF6" }
};
// Koordinat bersifat perkiraan untuk peta ilustratif; petunjuk arah memakai nama tempat.
const PLACES = [
  { id:"situ-gintung", name:"Situ Gintung", cat:"alam", kec:"Ciputat Timur", lat:-6.3047, lng:106.7637, gem:true,
    desc:"Danau tenang di Ciputat Timur yang paling enak dikelilingi pagi hari. Tepiannya cocok untuk jalan santai dan lari ringan, lalu lanjut sarapan di warung-warung sekitar.",
    hours:null, price:null, address:"Cireundeu, Ciputat Timur, Tangerang Selatan",
    tips:["Datang sebelum jam 7 pagi untuk kabut tipis di atas air","Bawa alas duduk; area rumput di tepi situ cukup luas"],
    photos:[["situ","pagi",11,"Kabut pagi di tepi situ"],["situ","senja",12,"Senja dari sisi barat"],["park","siang",13,"Jalur jalan kaki"]] },
  { id:"jaletreng", name:"Jaletreng River Park", cat:"taman", kec:"Setu", lat:-6.3235, lng:106.6705, gem:true,
    desc:"Taman di tepi Sungai Jaletreng, anak Sungai Cisadane. Penataan jalur pejalan kakinya sering dibandingkan dengan Cheonggyecheon di Seoul, dan masuknya gratis.",
    hours:null, price:"Gratis", address:"Kecamatan Setu, Tangerang Selatan",
    tips:["Sore hari lebih teduh untuk foto di jembatan","Pakai sepatu nyaman; jalurnya memanjang mengikuti sungai"],
    photos:[["river","siang",21,"Jalur tepi sungai"],["river","senja",22,"Lampu taman menyala"],["park","pagi",23,"Area hijau"]] },
  { id:"situ-pamulang", name:"Situ Pamulang", cat:"alam", kec:"Pamulang", lat:-6.3430, lng:106.7300, gem:true,
    desc:"Situ di tengah permukiman Pamulang yang jadi tempat warga olahraga sore dan berburu jajanan. Pemandangan airnya lapang dan langitnya cantik menjelang magrib.",
    hours:null, price:null, address:"Pamulang, Tangerang Selatan",
    tips:["Sore hari banyak penjual jajanan di sekitar situ","Parkir motor lebih mudah daripada mobil"],
    photos:[["situ","senja",31,"Langit jingga di atas situ"],["situ","siang",32,"Siang yang lapang"],["market","malam",33,"Jajanan sore"]] },
  { id:"tanah-tingal", name:"Tanah Tingal", cat:"edukasi", kec:"Pondok Aren", lat:-6.2740, lng:106.7240,
    desc:"Ruang bermain dan belajar di alam untuk anak, dengan suasana kampung yang rindang. Cocok untuk keluarga yang ingin anaknya main di luar ruangan.",
    hours:null, price:null, address:"Pondok Aren, Tangerang Selatan",
    tips:["Cek jadwal kegiatan anak sebelum datang","Bawa baju ganti, anak biasanya main kotor-kotoran"],
    photos:[["kampung","pagi",41,"Saung dan kebun"],["kampung","siang",42,"Area bermain"],["park","siang",43,"Pepohonan rindang"]] },
  { id:"taman-kota-2", name:"Taman Kota 2 BSD", cat:"taman", kec:"Serpong", lat:-6.2905, lng:106.6800,
    desc:"Taman luas di BSD dengan pepohonan besar dan jalur lari. Pagi akhir pekan ramai warga olahraga, siang hari kerja terasa seperti hutan kecil.",
    hours:null, price:"Gratis", address:"BSD, Serpong, Tangerang Selatan",
    tips:["Datang hari kerja kalau mau suasana sepi","Ada area teduh untuk piknik kecil"],
    photos:[["park","pagi",51,"Jalur lari pagi"],["park","siang",52,"Pohon-pohon besar"],["situ","pagi",53,"Kolam taman"]] },
  { id:"danau-sunburst", name:"Danau Sunburst BSD", cat:"foto", kec:"Serpong", lat:-6.3015, lng:106.6650,
    desc:"Danau di kawasan bisnis BSD dengan jalur jogging dan pantulan gedung di permukaan air. Paling fotogenik saat lampu gedung mulai menyala.",
    hours:null, price:"Gratis", address:"BSD City, Serpong, Tangerang Selatan",
    tips:["Datang 20 menit sebelum matahari terbenam","Sisi seberang danau memberi pantulan gedung paling utuh"],
    photos:[["skyline","senja",61,"Pantulan gedung saat senja"],["skyline","malam",62,"Lampu kota"],["situ","pagi",63,"Pagi di tepi danau"]] },
  { id:"broadway", name:"Broadway Alam Sutera", cat:"foto", kec:"Serpong Utara", lat:-6.2415, lng:106.6520,
    desc:"Kawasan bernuansa jalanan New York dengan fasad warna-warni dan papan lampu. Seru untuk foto bareng teman, terutama saat malam.",
    hours:null, price:"Sekitar Rp25.000 (cek harga terbaru)", address:"Jl. Alam Sutera Boulevard, Pakulonan, Serpong Utara",
    tips:["Malam hari lampu-lampunya paling meriah","Bawa lensa lebar untuk menangkap fasad bangunan"],
    photos:[["skyline","malam",71,"Lampu malam"],["market","malam",72,"Deretan kios"],["skyline","senja",73,"Fasad saat senja"]] },
  { id:"laksa-masitar", name:"Laksa Benteng Pak Masitar", cat:"kuliner", kec:"Serpong", lat:-6.3006, lng:106.6688, gem:true,
    desc:"Laksa khas Tangerang dengan kuah santan kuning dan mi beras, diracik Pak Masitar yang sudah berjualan puluhan tahun. Lokasinya di dalam Pasar Modern BSD, jadi sekalian jajan pasar.",
    hours:"Setiap hari, 07.00–20.00", price:"Rp15.000–Rp50.000 per orang", address:"Pasar Modern BSD City, Blok R No. 92, Serpong",
    tips:["Coba datang pagi saat kuah baru matang","Lanjut keliling Pasar Modern BSD untuk kue basah"],
    photos:[["bowl","siang",81,"Semangkuk laksa"],["bowl","pagi",82,"Kuah santan kuning"],["market","siang",83,"Lorong Pasar Modern BSD"]] },
  { id:"cah-solo", name:"Cah Solo", cat:"kuliner", kec:"Serpong", lat:-6.3014, lng:106.6699,
    desc:"Warung sarapan sampai makan siang di Pasar Modern BSD dengan menu khas Solo. Buka dari pagi, jadi datang sebelum tengah hari supaya menu masih lengkap.",
    hours:"Setiap hari, 06.00–14.00", price:"Rp18.000–Rp45.000 per orang", address:"Pasar Modern BSD City, Blok K No. 33A–K35, Serpong",
    tips:["Tutup jam 2 siang, jangan kesorean","Akhir pekan antre lebih panjang"],
    photos:[["bowl","pagi",91,"Menu sarapan"],["grill","siang",92,"Lauk pendamping"],["market","pagi",93,"Pagi di pasar"]] },
  { id:"rumah-goa", name:"Rumah Goa", cat:"kuliner", kec:"Pondok Aren", lat:-6.2878, lng:106.7302,
    desc:"Tenant bakaran di sebelah Stasiun Jurangmangu: ayam bakar, bebek bakar, dan sate kulit. Pas untuk makan setelah turun KRL.",
    hours:null, price:null, address:"Dekat Stasiun Jurangmangu, Pondok Aren",
    tips:["Sate kulitnya cocok jadi tambahan","Jalan kaki saja dari stasiun"],
    photos:[["grill","malam",101,"Bakaran malam"],["grill","senja",102,"Sate kulit"],["market","malam",103,"Suasana tenant"]] },
  { id:"rkl", name:"Rumah Kuliner Lengkong", cat:"kuliner", kec:"Serpong", lat:-6.2955, lng:106.6585, gem:true,
    desc:"Pusat kuliner warga Lengkong yang menyajikan masakan khas setempat seperti pecak ikan, plus kue-kue khas Lengkong yang kini makin sulit ditemukan.",
    hours:null, price:null, address:"Lengkong, Serpong, Tangerang Selatan",
    tips:["Tanyakan kue khas Lengkong yang tersedia hari itu","Pecak ikan jadi menu yang paling sering dicari"],
    photos:[["grill","siang",111,"Pecak ikan"],["bowl","siang",112,"Masakan rumahan"],["kampung","siang",113,"Suasana Lengkong"]] },
  { id:"pasar-bintaro", name:"Jajanan Pasar Modern Bintaro", cat:"kuliner", kec:"Pondok Aren", lat:-6.2790, lng:106.7175,
    desc:"Deretan tenant jajanan kekinian di dalam pasar, termasuk sweet potato brulee yang sempat viral. Enak dijelajahi sore hari sambil cari camilan.",
    hours:null, price:null, address:"Bintaro Jaya, Pondok Aren, Tangerang Selatan",
    tips:["Datang lapar dan jajan berbagi dengan teman","Sore hari pilihan tenant paling lengkap"],
    photos:[["market","senja",121,"Lorong jajanan"],["bowl","malam",122,"Camilan hangat"],["market","malam",123,"Lampu tenant"]] }
];
const STATIONS = [
  { name:"Stasiun Serpong", lat:-6.3206, lng:106.6656 },
  { name:"Stasiun Rawa Buntu", lat:-6.3149, lng:106.6764 },
  { name:"Stasiun Sudimara", lat:-6.2969, lng:106.7127 },
  { name:"Stasiun Jurangmangu", lat:-6.2885, lng:106.7290 },
  { name:"Stasiun Pondok Ranji", lat:-6.2768, lng:106.7449 }
];
const KEC = [
  ["Serpong Utara",-6.252,106.668],["Serpong",-6.305,106.675],["Setu",-6.340,106.672],["Pamulang",-6.348,106.727],
  ["Ciputat",-6.318,106.735],["Ciputat Timur",-6.293,106.762],["Pondok Aren",-6.268,106.712]
];
const CAMS = [
  { id:"TGS-01", name:"Jl. Raya Serpong, Alam Sutera", kec:"Serpong Utara", lanes:4, seed:3,  type:"kota" },
  { id:"TGS-02", name:"Simpang Ciater, BSD",          kec:"Serpong",       lanes:4, seed:7,  type:"kota" },
  { id:"TGS-03", name:"Jl. Siliwangi, Pamulang",       kec:"Pamulang",      lanes:2, seed:11, type:"kota" },
  { id:"TGS-04", name:"Pasar Ciputat",                 kec:"Ciputat",       lanes:2, seed:5,  type:"kota" },
  { id:"TGS-05", name:"Boulevard Bintaro Jaya",        kec:"Pondok Aren",   lanes:4, seed:13, type:"kota" },
  { id:"TGS-06", name:"Jl. Raya Puspiptek, Setu",      kec:"Setu",          lanes:2, seed:17, type:"kota" },
  { id:"TOL-01", name:"Tol Jakarta–Serpong (BSD)",     kec:"Ruas tol",      lanes:6, seed:19, type:"tol", src:"https://bsdtol.com/live-cctv", srcName:"Live CCTV BSD Tol" },
  { id:"TOL-02", name:"Tol Kunciran–Serpong",          kec:"Ruas tol",      lanes:6, seed:23, type:"tol", src:"https://binamarga.pu.go.id/contents/cctv_tol", srcName:"CCTV Tol Bina Marga PUPR" },
  { id:"TOL-03", name:"Tol Serpong–Balaraja",          kec:"Ruas tol",      lanes:6, seed:29, type:"tol", src:"https://binamarga.pu.go.id/balai-banten/cilukba/toll", srcName:"CCTV Balai Banten" }
];

/* ---------- utils ---------- */
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function haversine(a, b){ const R=6371, toR=x=>x*Math.PI/180; const dLat=toR(b.lat-a.lat), dLng=toR(b.lng-a.lng); const h=Math.sin(dLat/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function nearestStation(p){ return STATIONS.map(s => ({ ...s, d: haversine(p, s) })).sort((a,b) => a.d - b.d)[0]; }
const gmDir = (p, mode) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.name + ", Tangerang Selatan")}&travelmode=${mode}`;
const gmSearch = p => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ", " + p.kec + ", Tangerang Selatan")}`;

