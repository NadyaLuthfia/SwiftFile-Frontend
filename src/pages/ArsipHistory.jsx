import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios'; 

// HELPER PINTAR REKURSIF: Menggeledah isi objek untuk melacak field variabel
const dapatkanValueSakti = (inputObj, targetKey) => {
  if (!inputObj) return null;

  let obj = inputObj;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch (e) { return null; }
  }

  if (typeof obj !== 'object' || obj === null) return null;

  const targetLower = targetKey.toLowerCase();

  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === targetLower) {
      const val = obj[key];
      if (val !== null && val !== undefined && val !== '') return val;
    }
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && (typeof val === 'object' || (typeof val === 'string' && val.trim().startsWith('{')))) {
      const hasilDalam = dapatkanValueSakti(val, targetKey);
      if (hasilDalam) return hasilDalam;
    }
  }

  return null;
};

// ================= SUB-KOMPONEN BARIS DOKUMEN (GRID ROW) =================
function ArsipRow({ file, statusFilter, printingId, onCetakLagi, onToggleAktif, onBukaModal, activeTab }) {
  // Pengecekan status apakah sedang di tab/halaman Aktif
  const isAktif = statusFilter === '1';

  // Mengambil data khusus sesuai kategori berkas dari variabel form
  const namaItem = dapatkanValueSakti(file, 'ITEM') || dapatkanValueSakti(file, 'NO_ITEM') || dapatkanValueSakti(file, 'NAMA_BARANG');
  const namaAlat = dapatkanValueSakti(file, 'NAMA_ALAT') || dapatkanValueSakti(file, 'NAMA_BARANG') || dapatkanValueSakti(file, 'ITEM');
  
  const namaPekerja = dapatkanValueSakti(file, 'PEKERJA') || dapatkanValueSakti(file, 'NAMA_PEKERJA') || dapatkanValueSakti(file, 'PETUGAS') || dapatkanValueSakti(file, 'NAMA_PETUGAS') || dapatkanValueSakti(file, 'NAMA');
  const lokasi = dapatkanValueSakti(file, 'LOKASI') || dapatkanValueSakti(file, 'TEMPAT') || dapatkanValueSakti(file, 'TUJUAN') || dapatkanValueSakti(file, 'LOKASI_PEKERJAAN') || dapatkanValueSakti(file, 'LOKASI_TUGAS');

  return (
    <div 
      className="grid grid-cols-12 items-center px-6 py-3.5 bg-white hover:bg-sky-50/30 rounded-2xl border border-sky-100/80 hover:border-sky-300 shadow-xs hover:shadow-lg hover:shadow-sky-100/80 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-0.5 group cursor-default"
    >
      {/* 1. INFORMASI BERKAS (COL SPAN 5) */}
      <div className="col-span-5 flex items-center gap-3.5">
        <div className="bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs border border-sky-100 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-sky-200/60 transition-all duration-300 shrink-0">
          📄
        </div>
        <div className="min-w-0 pr-2">
          <p 
            className="text-slate-800 font-bold group-hover:text-sky-600 transition-colors cursor-pointer text-xs truncate" 
            onClick={() => onBukaModal(file)}
            title={file.nama_dokumen}
          >
            {file.nama_dokumen}
          </p>
          
          {/* INFORMASI DINAMIS BERDASARKAN DOKUMEN */}
          {activeTab === 'ba_penyerahan' && (
            <p className="text-[10px] text-sky-600 font-semibold mt-0.5 flex items-center gap-1 truncate max-w-[320px]">
              <span>📦 Item: {namaItem || <span className="italic text-slate-400">[Tidak ada nama item]</span>}</span>
            </p>
          )}

          {activeTab === 'ba_kerusakan' && (
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1 truncate max-w-[320px]">
              <span>⚠️ Alat: {namaAlat || <span className="italic text-slate-400">[Tidak ada nama alat]</span>}</span>
            </p>
          )}

          {activeTab === 'surat_tugas' && (
            <p className="text-[10px] text-sky-600 font-semibold mt-0.5 flex items-center gap-1.5 truncate max-w-[340px]">
              <span>👤 Pekerja: {namaPekerja || <span className="italic text-slate-400">[Tidak ada nama pekerja]</span>}</span>
              <span className="text-slate-300">•</span>
              <span>📍 Lokasi: {lokasi || <span className="italic text-slate-400">[Tidak ada lokasi]</span>}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. KONFIGURASI & CETAK FISIK (COL SPAN 5) */}
      <div className="col-span-5 flex items-center justify-center">
        {isAktif ? (
          <button 
            type="button"
            disabled={printingId === file.id}
            onClick={() => onCetakLagi(file.id, 1, 'All')} 
            className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 select-none active:scale-95 transform hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            {printingId === file.id ? 'Loading...' : '🖨️ CETAK FISIK'}
          </button>
        ) : (
          <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 uppercase tracking-wider">
            🚫 Dokumen Nonaktif
          </span>
        )}
      </div>

      {/* 3. TOMBOL AKSI (COL SPAN 2) - HANYA TOMBOL STATUS */}
      <div className="col-span-2 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onToggleAktif(file.id)}
          title={isAktif ? 'Nonaktifkan Dokumen' : 'Aktifkan Kembali Dokumen'}
          className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs hover:shadow-md transform hover:-translate-y-0.5 select-none ${
            isAktif
              ? 'bg-rose-50/80 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-transparent'
              : 'bg-emerald-50/80 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-transparent'
          }`}
        >
          {isAktif ? '🚫 Nonaktifkan' : '✓ Aktifkan'}
        </button>
      </div>

    </div>
  );
}


// ================= KOMPONEN UTAMA =================
function ArsipHistory() {
  const [antreanList, setAntreanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState(null); 
  const [printingId, setPrintingId] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('ba_penyerahan'); 
  const [statusFilter, setStatusFilter] = useState('1'); // '1' = Aktif, '0' = Nonaktif

  // STATE UNTUK MODAL REVIEW
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [dokumenTerpilih, setDokumenTerpilih] = useState(null);

  const userRole = localStorage.getItem('role') || JSON.parse(localStorage.getItem('user'))?.role || 'user';

  useEffect(() => {
    ambilDataHistory(statusFilter);
  }, [statusFilter]);

  const ambilDataHistory = (status = statusFilter) => {
    setLoading(true);
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/arsip-history?status_aktif=${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      setAntreanList(res.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Gagal mengambil data history:", err);
      setLoading(false);
    });
  };

  const handleToggleAktif = (id) => {
    const token = localStorage.getItem('token');
    const pesanKonfirmasi = statusFilter === '1' 
      ? "Apakah kamu yakin ingin menonaktifkan dokumen ini? " 
      : "Apakah kamu yakin ingin mengaktifkan kembali dokumen ini? ";

    if (window.confirm(pesanKonfirmasi)) {
      axios.post(`http://localhost:8000/api/arsip-history/${id}/toggle-aktif`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(() => {
        ambilDataHistory(statusFilter);
      })
      .catch(err => {
        console.error("Gagal mengubah status aktif:", err);
        alert("Gagal memperbarui status dokumen.");
      });
    }
  };

  const handleDownloadAtauLihat = (id) => {
    setDownloadingId(id);
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/siap-cetak/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      if (res.data && res.data.download_url) {
        window.open(res.data.download_url, '_blank');
      } else {
        alert("Gagal mendapatkan link berkas dokumen.");
      }
      setDownloadingId(null);
    })
    .catch(err => {
      console.error("Gagal memproses berkas:", err);
      alert("Terjadi kesalahan saat mengambil dokumen Word.");
      setDownloadingId(null);
    });
  };

  const handleCetakLagi = (id, rangkap = 1, halaman = 'All') => {
    setPrintingId(id);
    const token = localStorage.getItem('token');

    axios.post(`http://localhost:8000/api/siap-cetak/${id}/cetak-lagi`, {
      copies: rangkap,
      pages: halaman
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(() => {
      alert(`🎉 Sukses! Berhasil dikirim ulang ke printer.`);
      setPrintingId(null);
    })
    .catch(err => {
      console.error("Gagal melakukan cetak ulang:", err);
      alert("Terjadi kesalahan sistem saat mencoba mencetak ulang berkas.");
      setPrintingId(null);
    });
  };

  const dataTerfilter = antreanList.filter(item => {
    const namaDokumen = (item.nama_dokumen || '').toLowerCase();
    const cocokPencarian = namaDokumen.includes(searchTerm.toLowerCase());
    const statusItem = item.status_aktif === undefined ? '1' : String(item.status_aktif);
    return cocokPencarian && statusItem === statusFilter;
  });

  const cekFotoTTD = (item) => {
    if (!item) return null;
    const namaDokumen = (item.nama_dokumen || '').toLowerCase();
    if (namaDokumen.includes('tugas')) return null;

    return item.foto_ttd || (item.dokumen_cetak && item.dokumen_cetak.foto_ttd) || null;
  };

  const totalPenyerahan = dataTerfilter.filter(item => {
    const teks = `${item.nama_dokumen || ''} ${item.nama_arsip_display || ''}`.toLowerCase();
    return teks.includes('penyerahan');
  }).length;

  const totalKerusakan = dataTerfilter.filter(item => {
    const teks = `${item.nama_dokumen || ''} ${item.nama_arsip_display || ''}`.toLowerCase();
    return teks.includes('kerusakan');
  }).length;

  const totalSuratTugas = dataTerfilter.filter(item => {
    const teks = `${item.nama_dokumen || ''} ${item.nama_arsip_display || ''}`.toLowerCase();
    return teks.includes('tugas');
  }).length;

  const dataTampil = dataTerfilter.filter(item => {
    const gabunganTeks = `${item.nama_dokumen || ''} ${item.nama_arsip_display || ''}`.toLowerCase();
    if (activeTab === 'ba_penyerahan') return gabunganTeks.includes('penyerahan');
    if (activeTab === 'ba_kerusakan') return gabunganTeks.includes('kerusakan');
    if (activeTab === 'surat_tugas') return gabunganTeks.includes('tugas');
    return true; 
  });

  const bukaModalDetail = (dokumen) => {
    setDokumenTerpilih(dokumen);
    setModalTerbuka(true);
  };

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SEKSI */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Arsip <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">& History Dokumen</span>
              </h1>
            </div>
          </section>

          {/* FILTER BAR & SEARCH CONTROLLER */}
          <section className="bg-white p-3.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* TAB KATEGORI */}
            <div className="flex items-center gap-1.5 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60">
              <button
                type="button"
                onClick={() => setActiveTab('ba_penyerahan')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer transform active:scale-95 ${
                  activeTab === 'ba_penyerahan' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.03]' 
                    : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50/60'
                }`}
              >
                🤝 BA Penyerahan ({totalPenyerahan})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ba_kerusakan')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer transform active:scale-95 ${
                  activeTab === 'ba_kerusakan' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.03]' 
                    : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50/60'
                }`}
              >
                ⚠️ BA Kerusakan ({totalKerusakan})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('surat_tugas')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer transform active:scale-95 ${
                  activeTab === 'surat_tugas' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.03]' 
                    : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50/60'
                }`}
              >
                💼 Surat Tugas ({totalSuratTugas})
              </button>
            </div>

            {/* KONTROL KANAN */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
              
              {/* TOMBOL TOGGLE HALAMAN AKTIF / NONAKTIF */}
              <button 
                type="button"
                onClick={() => setStatusFilter(statusFilter === '1' ? '0' : '1')}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl border transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap active:scale-95 ${
                  statusFilter === '1' 
                    ? 'bg-rose-50/80 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-transparent' 
                    : 'bg-emerald-50/80 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-transparent'
                }`}
              >
                {statusFilter === '1' ? '🚫 Lihat Arsip Nonaktif' : '👥 Lihat Arsip Aktif'}
              </button>

              {/* PENCARIAN */}
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari nama dokumen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F4F8FC]/80 border border-sky-100 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
                />
              </div>
            </div>
          </section>

          {/* MAIN FILE DISPLAY BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-4 shadow-sm shadow-sky-100/50 animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-500 font-bold text-xs tracking-wide">Sedang menyinkronkan riwayat arsip dokumen...</p>
            </div>
          ) : dataTampil.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-3 shadow-sm shadow-sky-100/50">
              <div className="text-4xl select-none">📭</div>
              <p className="text-slate-500 font-bold text-sm">Tidak ada dokumen arsip untuk kategori ini</p>
              <p className="text-xs text-sky-500/80 font-medium">Coba gunakan fitur pencarian atau ganti filter status di atas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md shadow-sky-100/60 p-3 space-y-2">
              
              {/* HEADER TABEL */}
              <div className="grid grid-cols-12 px-6 py-3 bg-[#F4F8FC] rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                <div className="col-span-5">Detail Nama Berkas</div>
                <div className="col-span-5 text-center">Konfigurasi & Cetak Fisik</div>
                <div className="col-span-2 text-center">Aksi</div>
              </div>

              {/* LIST FRAME ARSIP */}
              <div className="space-y-2.5">
                {dataTampil.map(file => (
                  <ArsipRow 
                    key={file.id}
                    file={file}
                    statusFilter={statusFilter}
                    printingId={printingId}
                    onCetakLagi={handleCetakLagi}
                    onToggleAktif={handleToggleAktif}
                    onBukaModal={bukaModalDetail}
                    activeTab={activeTab}
                  />
                ))}
              </div>

            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL DETAIL DOKUMEN ================= */}
      {modalTerbuka && dokumenTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start border-b border-sky-100 pb-3.5">
              <div>
                <span className="text-[10px] font-black bg-sky-50 text-sky-600 px-3 py-1 rounded-xl uppercase tracking-wider border border-sky-100/80">
                  Rincian Arsip Dokumen
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2 truncate max-w-[380px]" title={dokumenTerpilih.nama_dokumen}>
                  {dokumenTerpilih.nama_dokumen}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-base font-bold cursor-pointer transition-colors select-none"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">ID Ref</span>
                <span className="col-span-2 text-slate-800 font-bold">#{dokumenTerpilih.id}</span>
              </div>
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">Template ID</span>
                <span className="col-span-2 text-slate-800 font-bold">#{dokumenTerpilih.template_id || '-'}</span>
              </div>

              {/* Master File Dokumen */}
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <span className="text-slate-600 font-bold block text-[11px]">Master Berkas & Dokumen:</span>
                <div className="flex flex-wrap gap-2">
                  {cekFotoTTD(dokumenTerpilih) && (
                    <button 
                      type="button" 
                      onClick={() => window.open(`http://localhost:8000/${cekFotoTTD(dokumenTerpilih)}`, '_blank')}
                      className="flex items-center gap-1.5 border border-sky-100 bg-sky-50/50 hover:bg-sky-100 text-sky-700 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs select-none"
                    >
                      👁️ Lihat Foto TTD
                    </button>
                  )}
                  <button 
                    type="button" 
                    disabled={downloadingId === dokumenTerpilih.id}
                    onClick={() => handleDownloadAtauLihat(dokumenTerpilih.id)}
                    className="flex items-center gap-1.5 border border-sky-200/80 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs select-none"
                  >
                    📥 {downloadingId === dokumenTerpilih.id ? 'Mengunduh...' : 'Unduh Dokumen Word'}
                  </button>
                </div>
              </div>

              {/* Preview Gambar Foto TTD */}
              {cekFotoTTD(dokumenTerpilih) && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-slate-600 font-bold block text-[11px]">Preview Bukti Fisik:</span>
                  <div className="border border-sky-100 rounded-2xl overflow-hidden bg-slate-50 max-h-36 flex items-center justify-center p-2 shadow-inner">
                    <img 
                      src={`http://localhost:8000/${cekFotoTTD(dokumenTerpilih)}`} 
                      alt="Bukti Dokumen TTD" 
                      className="object-contain w-full h-full max-h-32 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER MODAL */}
            <div className="pt-2 flex items-center justify-end border-t border-sky-100">
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-[11px] font-bold hover:bg-slate-900 transition-all cursor-pointer select-none shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArsipHistory;