# MySAU v3 — Ruang kerja harian SAU

Implementasi web dari desain Figma **My-SAU** (Section 1): Beranda, Task, dan Kalender.
Dibuat dengan HTML, CSS, dan JavaScript murni (ES modules), tanpa build step, jadi bisa langsung di-deploy ke Vercel.

## Halaman

| Rute | Isi |
| --- | --- |
| `#/beranda` | Absensi (Clock In/Out, jam WIB live), Task Saya, maskot + notifikasi & task terbaru, kalender mini dengan stiker ulang tahun/catatan, pintasan aplikasi |
| `#/task` | Ringkasan task, prioritas, segera diselesaikan, progres minggu ini, papan **Fokus hari ini**, semua task + riwayat, aktivitas kolaborasi |
| `#/kalender` | Tampilan **Bulan / Minggu / Hari**, kalender mini, filter "Kalender saya", detail agenda, task hari ini, dan modal **Buat agenda** (Event & Task) |

Fitur lain: pencarian global (`⌘K` / `Ctrl+K`), notifikasi, menu profil, toast dengan "Urungkan", dan penyimpanan lokal (absensi, task selesai, agenda/task baru) lewat `localStorage`.

### Satu layar, tanpa scroll
Semua halaman digambar di kanvas 1440×900 seperti frame Figma. Di desktop & laptop (lebar ≥ 1000px, landscape) `js/fit.js` menskalakan kanvas itu agar selalu muat satu layar tanpa scroll, berapa pun resolusinya. Lebar kanvas selalu 100% layar. Layar yang lebih lebar dari 16:10 memperpanjang kanvas ke samping, sedangkan layar yang lebih tinggi memperpanjangnya ke bawah sampai 1100. Di HP & tablet portrait dipakai layout responsif biasa.

### Animasi
Animasi Beranda (cahaya latar, glow & riak, orbit berputar, kilau kuning, maskot melayang, melambai & berkedip, chip melayang, lonceng berdering, ikon matahari, titik "sekarang" di absensi) ada di `css/motion.css`. File ini dibuat otomatis dari keyframe Figma "MySAU · Beranda v9" (node `75:622`), yaitu satu timeline 12 detik yang berulang. Maskot disusun berlapis (badan, lengan, mata) dari aset Figma di `assets/stage/`. Animasi otomatis mati bila pengguna memilih *reduce motion*.

## Struktur

```
index.html          shell: sidebar, header, tab bar (dibungkus .frame)
css/style.css       token warna, glass, layout semua halaman, responsif
css/motion.css      animasi Beranda (dari keyframe Figma)
js/fit.js           skala 1 layar seperti prototype Figma
js/main.js          router (#/beranda, #/task, #/kalender) & shell
js/store.js         state + localStorage + selector
js/data.js          CONTOH DATA (task, agenda, aplikasi, profil) — ganti dengan API
js/ui.js            toast, popover, pencarian, modal Buat agenda
js/pages/*.js       Beranda, Task, Kalender
assets/             favicon
assets/stage/       aset Figma: maskot berlapis, orbit, kilau, cahaya latar
```

## Menjalankan di komputer

```bash
# pilih salah satu
npx serve .
python3 -m http.server 5173
```
Buka `http://localhost:5173` (atau port yang tampil). File harus dibuka lewat server, bukan double-click, karena memakai ES modules.

## Push ke GitHub

```bash
cd my-sau-v3
git remote add origin https://github.com/rezasiregar23/My-SAU-V3.git
git push -u origin main
```
Repo sudah berisi commit pertama. Kalau Git meminta login, pakai akun GitHub Anda (atau Personal Access Token sebagai password).

## Deploy ke Vercel

1. Masuk ke [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pilih `My-SAU-V3`.
2. Framework Preset: **Other**. Build Command: kosongkan. Output Directory: `.` (root).
3. Klik **Deploy**. Setiap `git push` ke `main` selanjutnya otomatis ter-deploy ulang.

Alternatif lewat CLI: `npx vercel` lalu `npx vercel --prod` dari folder proyek.

## Menghubungkan data asli

- **Profil & shift**: `USER` di `js/data.js`.
- **URL aplikasi** (HRIS, Pervorms, dll.): isi `url` di `APPS` (`js/data.js`). Selama masih `'#'`, klik akan menampilkan pemberitahuan.
- **Task, agenda, ulang tahun, notifikasi**: `buildSeed()` di `js/data.js` membuat contoh data relatif terhadap tanggal hari ini. Ganti dengan respons API dengan bentuk objek yang sama.
- Hari peringatan/libur nasional berulang ada di `NATIONAL` (`js/data.js`).

Semua nama, angka, dan agenda saat ini adalah **data contoh**.
