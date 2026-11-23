/* =========================================================
   ExploreTangsel — konfigurasi aplikasi
   Ubah nilai di file ini, lalu build ulang. Jangan menaruh
   secret server (service account, private key) di sini:
   semua isi file ini ikut terkirim ke perangkat pengguna.
   ========================================================= */
window.ET_CONFIG = {
  appVersion: "1.0.0",

  /* Alamat website (kebijakan privasi, hapus akun). Diisi otomatis oleh
     GitHub Actions menjadi https://USERNAME.github.io/NAMA-REPO */
  siteUrl: "__SITE_URL__",

  /* Login server lewat Firebase Authentication (REST).
     Kosong = mode lokal (akun tersimpan di perangkat, untuk demo/uji).
     Isi dengan "Web API Key" dari Firebase Console > Project settings. */
  firebase: {
    apiKey: ""
  },

  /* Login Google native. Butuh plugin @codetrix-studio/capacitor-google-auth
     dan Web Client ID OAuth dari Google Cloud Console (lihat README). */
  google: {
    webClientId: ""
  },

  /* Tile peta. OpenStreetMap gratis untuk pemakaian ringan dengan atribusi.
     Untuk rilis dengan banyak pengguna, pakai penyedia ber-API key
     (mis. MapTiler, Stadia, Thunderforest) sesuai kebijakan tile OSM. */
  map: {
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  },

  /* Siaran CCTV resmi (HLS .m3u8) per ID kamera, jika sudah mendapat izin
     dan alamat stream dari Dishub Tangsel / operator. Contoh:
     "TGS-01": "https://contoh-stream.tangerangselatankota.go.id/cam01/index.m3u8" */
  cctvStreams: {},

  /* Foto asli per tempat (taruh file di www/img/places/<id>/).
     Pastikan kamu punya hak memakai fotonya. Contoh:
     "situ-gintung": ["img/places/situ-gintung/1.jpg", "img/places/situ-gintung/2.jpg"] */
  placePhotos: {}
};
