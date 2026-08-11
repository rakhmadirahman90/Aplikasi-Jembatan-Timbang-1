# Integrasi GST-9700

Aplikasi menggunakan Web Serial API untuk membaca indikator timbangan melalui RS-232/USB-Serial langsung dari browser Chromium.

## Persiapan
1. Hubungkan GST-9700 ke komputer melalui RS-232 atau USB-to-Serial adapter yang dikenali sistem operasi.
2. Pastikan driver adapter terpasang.
3. Gunakan Chrome/Edge versi desktop dan HTTPS (Vercel sudah HTTPS).
4. Buka **Setting Port**, pilih COM yang sesuai, pilih baud rate yang sama dengan konfigurasi serial GST-9700, lalu klik **Connect**.
5. Aplikasi menampilkan data mentah serial untuk membantu verifikasi format komunikasi.

## Parameter
- Baud rate: dapat dipilih 1200, 2400, 4800, 9600, 19200, 38400.
- Data bits: 8.
- Stop bits: 1.
- Parity: none.
- Flow control: none.

Jika indikator dikonfigurasi dengan parameter berbeda, sesuaikan parameter di UI.

## Format data
Parser menerima format ASCII umum indikator timbangan, termasuk angka dengan tanda +/- dan pemisah seperti `+`, `-`, `kg`, `KG`, `ST`, `WT`, serta frame CR/LF. Nilai angka terakhir yang valid digunakan sebagai berat.

## Catatan
Web Serial hanya tersedia pada browser Chromium yang mendukungnya dan harus dijalankan pada secure context (HTTPS atau localhost). Aplikasi tidak lagi menganggap koneksi simulasi sebagai koneksi fisik. Jika Web Serial tidak tersedia, UI akan memberi pesan yang jelas.
