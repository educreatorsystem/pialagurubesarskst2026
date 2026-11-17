# Piala Guru Besar SK Sungai Tiram

Sistem Google Apps Script untuk pendaftaran pemain, jadual liga, keputusan dan kedudukan. Senarai pemain, jadual, keputusan dan kedudukan boleh dicetak dalam saiz A4 atau dimuat turun sebagai PDF.

| Fail | Kegunaan |
| --- | --- |
| `Code.gs` | API, akaun, semakan akses dan simpanan Google Sheets |
| `Index.html` | Paparan sistem yang disediakan oleh Apps Script HTML Service |
| `appsscript.json` | Tetapan projek Apps Script dengan zon waktu Malaysia dan runtime V8 |
| `README.md` | Panduan pemasangan dan penerbitan |
| `.gitignore` | Mengecualikan tetapan projek setempat dan fail kelayakan daripada Git |
| `.claspignore` | Mengehadkan fail untuk dihantar ke Apps Script jika menggunakan clasp |

## Muat naik ke GitHub

1. Ekstrak ZIP dan cipta repositori di GitHub.
2. Muat naik kandungan folder ini ke aras utama repositori, termasuk `.gitignore` dan `.claspignore`. Tetapkan File Explorer atau Finder supaya menunjukkan fail tersembunyi jika perlu.
3. Commit fail. Kongsi pautan `/exec` daripada Apps Script dengan guru untuk membuka sistem. GitHub menyimpan kod sumber. Web app, sesi log masuk dan API beroperasi dalam Google Apps Script.

## Pasang dan terbitkan web app

1. Buka Google Sheet kejohanan dan pilih **Extensions → Apps Script**. Gantikan kandungan `Code.gs` dengan fail pakej. Tambah fail jenis **HTML** bernama `Index`, kemudian tampal kandungan `Index.html`.
2. Untuk projek baharu, aktifkan pilihan **Show “appsscript.json” manifest file in editor** di **Project Settings** jika mahu menyalin manifest pakej. Bagi projek sedia ada, kekalkan tetapan lain yang digunakan oleh projek tersebut dan semak zon waktu serta runtime.
3. Dalam **Project Settings → Script Properties**, tambah tetapan berikut di Apps Script.

| Sifat | Nilai |
| --- | --- |
| `PGB_SPREADSHEET_ID` | ID daripada URL Google Sheet kejohanan, di antara `/d/` dan `/edit` |
| `ADMIN_PASSWORD` | Kata laluan bagi nama pengguna `admin` |
| `GURU_cikguali` | Contoh format JSON `{"password":"KATA_LALUAN_GURU","kelas":"4 MARS"}` |

4. Cipta satu sifat `GURU_<nama_pengguna>` untuk setiap guru. Gunakan huruf kecil pada nama sifat selepas `GURU_` dan isikan nama kelas yang sepadan dengan `PGB_KELAS`.
5. Jalankan `setupPialaGuruBesar` dari editor Apps Script dan beri kebenaran apabila diminta. Fungsi ini menyediakan `PGB_KELAS`, `PGB_PEMAIN` dan `PGB_PERLAWANAN`.
6. Dalam `PGB_KELAS`, isi nama kelas unik di lajur `kelas` dan nombor `1` hingga `6` di lajur `tahun`, mulai baris kedua. Gunakan hanya dua lajur tersebut jika menyalin daripada CSV kelas. Simpan rekod pemain dalam Google Sheet projek.
7. Pilih **Deploy → New deployment → Web app**. Pilih **Execute as → Me** dan tetapkan akses yang sesuai untuk guru sekolah. Klik **Deploy** dan salin URL yang berakhir dengan `/exec`.
8. Uji log masuk admin dan satu akaun guru. Semak pendaftaran kelas, skor 0–0 dan satu laporan cetak/PDF. Apabila kod dikemas kini, buka **Deploy → Manage deployments** dan terbitkan versi baharu pada deployment yang sama untuk menggunakan pautan `/exec` sedia ada.

Pendaftaran dan jadual sedia ada terus digunakan apabila sifat `PGB_SPREADSHEET_ID` menunjuk kepada Google Sheet yang sama. Simpan ID spreadsheet, kata laluan dan konfigurasi guru dalam Script Properties.
