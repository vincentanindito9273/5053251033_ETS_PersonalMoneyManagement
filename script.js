
const KUNCI = "transaksi";
const KUNCI_UANG = "uangBulanan";

let transaksi = [];
let uangBulanan = 0;

function muatData() {
    try {
        transaksi = JSON.parse(localStorage.getItem(KUNCI)) || [];
    } catch {
        transaksi = [];
    }

    uangBulanan = Number(localStorage.getItem(KUNCI_UANG)) || 0;
}

function simpanData() {
    localStorage.setItem(KUNCI, JSON.stringify(transaksi));
    localStorage.setItem(KUNCI_UANG, String(uangBulanan));
}

function rupiah(angka) {
    return "Rp" + angka.toLocaleString("id-ID");
}

function tanggalHariIni() {
    const sekarang = new Date();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const hari = String(sekarang.getDate()).padStart(2, "0");

    return sekarang.getFullYear() + "-" + bulan + "-" + hari;
}

function renderDaftar() {
    const daftar = document.getElementById("daftarTransaksi");
    daftar.innerHTML = "";

    const urut = transaksi.slice().sort(function(a, b) {
        if (a.tanggal !== b.tanggal) {
            return b.tanggal.localeCompare(a.tanggal);
        }

        return b.id - a.id;
    });

    if (urut.length === 0) {
        const item = document.createElement("li");
        item.className = "kosong";
        item.textContent = "Belum ada transaksi.";
        daftar.appendChild(item);
        return;
    }

    urut.forEach(function(t) {
        const item = document.createElement("li");

        const info = document.createElement("div");
        info.className = "info";

        const nama = document.createElement("strong");
        nama.textContent = t.kategori;

        const detail = document.createElement("small");
        detail.textContent = t.tanggal + (t.catatan ? " - " + t.catatan : "");

        info.appendChild(nama);
        info.appendChild(detail);

        const nominal = document.createElement("span");
        nominal.className = t.jenis;
        nominal.textContent =
            (t.jenis === "pemasukan" ? "+" : "-") + rupiah(t.nominal);

        const tombol = document.createElement("button");
        tombol.className = "hapus";
        tombol.textContent = "Hapus";

        tombol.addEventListener("click", function() {
            if (confirm("Yakin ingin menghapus transaksi ini?")) {
                transaksi = transaksi.filter(function(data) {
                    return data.id !== t.id;
                });

                simpanData();
                renderSemua();
            }
        });

        item.appendChild(info);
        item.appendChild(nominal);
        item.appendChild(tombol);
        daftar.appendChild(item);
    });
}

function hitungJatahHarian() {
    const sekarang = new Date();
    const bulanIni = tanggalHariIni().slice(0, 7);

    let pengeluaran = 0;
    let pemasukan = 0;

    transaksi.forEach(function(t) {
        if (t.tanggal.startsWith(bulanIni)) {
            if (t.jenis === "pengeluaran") {
                pengeluaran += t.nominal;
            } else {
                pemasukan += t.nominal;
            }
        }
    });

    const sisaUang = uangBulanan + pemasukan - pengeluaran;
    const hariDalamBulan = new Date(
        sekarang.getFullYear(),
        sekarang.getMonth() + 1,
        0
    ).getDate();

    const sisaHari = hariDalamBulan - sekarang.getDate() + 1;
    const jatah = Math.max(0, Math.floor(sisaUang / sisaHari));

    document.getElementById("jatahHarian").textContent = rupiah(jatah);
}

function renderSemua() {
    renderDaftar();
    hitungJatahHarian();
}

document.getElementById("formTransaksi").addEventListener("submit", function(event) {
    event.preventDefault();

    const tanggal = document.getElementById("tanggal").value;
    const jenis = document.getElementById("jenis").value;
    const kategori = document.getElementById("kategori").value;
    const nominal = Number(document.getElementById("nominal").value);
    const catatan = document.getElementById("catatan").value.trim();
    const pesan = document.getElementById("pesanError");

    if (!tanggal || !kategori || !Number.isFinite(nominal) || nominal <= 0) {
        pesan.textContent = "Isi semua data wajib dan pastikan nominal lebih dari 0.";
        return;
    }

    pesan.textContent = "";

    transaksi.push({
        id: Date.now(),
        tanggal: tanggal,
        jenis: jenis,
        kategori: kategori,
        nominal: nominal,
        catatan: catatan
    });

    simpanData();
    renderSemua();

    document.getElementById("formTransaksi").reset();
    document.getElementById("tanggal").value = tanggalHariIni();
});

document.getElementById("simpanBulanan").addEventListener("click", function() {
    const input = document.getElementById("uangBulanan");
    const pesan = document.getElementById("pesanBulanan");
    const nilai = Number(input.value);

    if (input.value === "" || !Number.isFinite(nilai) || nilai <= 0) {
        pesan.textContent = "Masukkan uang bulanan lebih dari 0.";
        return;
    }

    uangBulanan = nilai;
    pesan.textContent = "";

    simpanData();
    renderSemua();
});

function mulai() {
    muatData();

    document.getElementById("tanggal").value = tanggalHariIni();
    document.getElementById("uangBulanan").value =
        uangBulanan > 0 ? uangBulanan : "";

    renderSemua();
}

mulai();
