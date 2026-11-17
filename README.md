# Piala Guru Besar SK Sungai Tiram

Paparan utama menunjukkan jadual, keputusan dan kedudukan tanpa log masuk. Butang **Log Masuk Guru / Admin** membuka borang log masuk untuk pengurusan. Nama pemain hanya tersedia kepada akaun yang diberi akses.

## 1. Kemas kini Google Apps Script

1. Buka projek Apps Script yang menerbitkan URL `/exec` sedia ada. Gantikan kandungan `Code.gs` dan `Index.html` dengan fail dalam folder `apps-script`. Dalam editor Apps Script, nama fail HTML ialah `Index`.
2. Semak **Project Settings → Script Properties**. Gunakan `ADMIN_PASSWORD` untuk akaun `admin`. Akaun guru menggunakan sifat seperti `GURU_guru1mars` dengan nilai JSON `{"password":"KATA_LALUAN_GURU","kelas":"1 MARS"}`. Tetapan `PGB_SPREADSHEET_ID` tidak diperlukan.
3. Jalankan `setupPialaGuruBesar` dari editor dan beri kebenaran jika diminta. Fungsi ini menyemak tiga tab yang dikonfigurasi. Ia mengisi tajuk lajur sekiranya tab berkenaan kosong.
4. Buka **Deploy → Manage deployments → Edit → New version**. Pilih **Execute as → Me** dan **Who has access → Anyone** untuk sambungan daripada GitHub Pages. Jika polisi organisasi mengehadkan akses kepada akaun sekolah, gunakan pautan Apps Script terus melalui pelayar yang telah log masuk ke akaun sekolah. Untuk pengurusan data, gunakan log masuk admin atau guru dalam sistem.
5. Buka URL `/exec` dengan `?action=health` di hujung. Versi ini memulangkan `{"ok":true,"data":{"version":3}}`. Jika URL deployment berubah, kemas kini nilai `APPS_SCRIPT_URL` dalam `index.html` sebelum commit.

## 2. Terbitkan GitHub Pages

1. Ekstrak ZIP. Letakkan `index.html` (huruf kecil) dan `.nojekyll` terus di aras utama repositori `pialagurubesarskst2026` pada branch `main`. Folder `apps-script` ialah salinan untuk editor Apps Script.
2. Commit fail. Dalam **Settings → Pages**, pilih **Deploy from a branch → main → /(root) → Save**.
3. Selepas penerbitan berjaya, buka pautan di **Settings → Pages**. Uji jadual dan kedudukan dalam tetingkap peribadi, kemudian uji satu log masuk guru dan satu log masuk admin. Semak penapis, penyimpanan, skor 0–0, Cetak A4 dan Muat Turun PDF.
4. Jika GitHub Pages menunjukkan 404, semak nama `index.html`, branch, folder penerbitan dan status deployment di tab **Actions**. Jika laman terbuka tetapi log masuk gagal menyambung, semak `/exec?action=health` dan tetapan akses deployment.

## Sumber data

ID Google Sheet telah diisi dalam `Code.gs`. Apps Script memilih tab melalui GID berikut, dengan nama tab sebagai pilihan jika GID tiada.

| Tab | GID |
| --- | --- |
| PGB_KELAS | 1109624177 |
| PGB_PEMAIN | 996137308 |
| PGB_PERLAWANAN | 422470037 |

GitHub Pages membaca dan menyimpan data melalui Apps Script. Pautan CSV digunakan untuk mengenal pasti GID. Jika penerbitan CSV pemain masih aktif, hentikan penerbitan tab pemain di Google Sheets untuk memastikan senarai nama murid diakses melalui log masuk.
