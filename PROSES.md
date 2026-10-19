# PROSES

## Persona dan masalahnya 
Saya mahasiswa kos yang mendapat uang bulanan tetap dari orang tua, tetapi uang itu sering habis sebelum akhir bulan. Pengeluaran terbesar saya ada di token listrik, bensin, dan makan, yang kadang sampai empat kali sehari dengan pilihan menu yang cenderung mahal. Masalahnya, saya belum terbiasa mencatat dan membatasi pengeluaran, sehingga sulit menghemat dan mengatur uang bulanan agar cukup sampai akhir bulan. Jadi, saya butuh aplikasi yang menunjukkan berapa jatah harian yang aman.

## 2. Rancangan Struktur Data

Data transaksi disimpan dalam array objek JavaScript.

Setiap transaksi memiliki:
- id: identitas unik transaksi.
- tanggal: tanggal transaksi.
- jenis: pemasukan atau pengeluaran.
- kategori: kategori transaksi.
- nominal: jumlah uang dalam bentuk angka.
- catatan: keterangan tambahan.

Contoh data:

{
  id: 1739251200000,
  tanggal: "2026-10-12",
  jenis: "pengeluaran",
  kategori: "Makan",
  nominal: 25000,
  catatan: "Makan siang"
}

Data disimpan menggunakan JSON.stringify() ke localStorage dan dibaca kembali menggunakan JSON.parse().

Uang bulanan disimpan menggunakan kunci localStorage yang berbeda dari data transaksi.

## 3. Keputusan Desain

Saya menggunakan localStorage karena aplikasi ini tidak memerlukan database atau server. Data tetap tersimpan di browser setelah halaman di-refresh.

Saya juga memisahkan kode HTML, CSS, dan JavaScript agar struktur halaman, tampilan, dan proses pengolahan data lebih mudah dipahami.

## 4. Kendala dan Solusi

### Kendala 1

Daftar transaksi tidak muncul karena beberapa elemen yang dipanggil JavaScript belum tersedia di HTML.

Solusi:
Saya menyesuaikan ID elemen HTML dengan ID yang digunakan dalam JavaScript.

### Kendala 2

Data transaksi perlu tetap tersedia setelah halaman di-refresh.

Solusi:
Saya menggunakan localStorage untuk menyimpan array transaksi dalam format JSON dan memuatnya kembali saat halaman dibuka.
