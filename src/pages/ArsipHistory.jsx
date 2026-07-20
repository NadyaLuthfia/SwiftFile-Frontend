import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios'; 

// ================= SUB-KOMPONEN BARIS DOKUMEN =================
function ArsipRow({ file, statusFilter, printingId, onCetakLagi, onToggleAktif, onBukaModal, userRole }) {
  const [copies, setCopies] = useState(file.copies || 1);
  const [pages, setPages] = useState(file.pages && file.pages !== 'All' ? file.pages : '');

  return (
    <div 
      className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-200/80 hover:shadow-md border-l-4 group ${statusFilter === '1' ? 'border-l-blue-500' : 'border-l-rose-400'}`}
    >
      {/* Info Berkas */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-11 w-11 bg-slate-50 border border-slate-100/70 flex items-center justify-center rounded-xl text-slate-400 text-xl flex-shrink-0 group-hover:bg-blue-50/50 transition-colors">
          📄
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={file.nama_dokumen}>
            {file.nama_dokumen}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Ref ID: <span className="text-slate-600 font-semibold">#{file.id}</span> • Temp ID: <span className="text-slate-600 font-semibold">#{file.template_id || '0'}</span>
          </p>
        </div>
      </div>

      {/* Aksi Kontrol (Cetak Lagi + Lihat) */}
      <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
        
        {/* ✨ CONVEYOR PARAMETER PRINT KUSTOM */}
        {statusFilter === '1' && (
          <div className="flex items-center gap-2 bg-slate-100/60 border border-slate-200/80 p-1.5 rounded-2xl shadow-inner">
            {/* Input Halaman */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-blue-400 transition-colors">
              <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Hal:</span>
              <input 
                type="text" 
                value={pages} 
                placeholder="All"
                onChange={(e) => setPages(e.target.value)} 
                className="w-10 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none placeholder-slate-400" 
              />
            </div>

            {/* Input Rangkap */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-blue-400 transition-colors">
              <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Rkp:</span>
              <input 
                type="number" 
                value={copies} 
                min="1" 
                onChange={(e) => setCopies(parseInt(e.target.value, 10) || 1)} 
                className="w-7 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none" 
              />
            </div>

            {/* Tombol Kirim Print */}
            <button 
              type="button"
              disabled={printingId === file.id}
              onClick={() => onCetakLagi(file.id, copies, pages)} 
              className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50 select-none"
            >
              {printingId === file.id ? 'Loading...' : '🖨️ CETAK FISIK'}
            </button>
          </div>
        )}

        {/* Tombol Lihat Detail */}
        <button 
          type="button"
          onClick={() => onBukaModal(file)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap flex items-center gap-1 select-none"
        >
          👁️ Lihat
        </button>

        {/* 🔒 Tombol X HILANG untuk Admin & User */}
        {userRole !== 'admin' && userRole !== 'user' && (
          <button
            type="button"
            onClick={() => onToggleAktif(file.id)}
            title={statusFilter === '1' ? 'Nonaktifkan Dokumen' : 'Aktifkan Kembali Dokumen'}
            className={`h-9 w-9 flex items-center justify-center rounded-xl font-bold border transition-all cursor-pointer shadow-sm text-xs select-none ${
              statusFilter === '1'
                ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white'
                : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
            }`}
          >
            {statusFilter === '1' ? '✕' : '✓'}
          </button>
        )}
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
  const [statusFilter, setStatusFilter] = useState('1');

  // STATE DILUAR UNTUK MODAL REVIEW
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [dokumenTerpilih, setDokumenTerpilih] = useState(null);

  // 🔑 Ambil Role User dari LocalStorage
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
      ? "Apakah kamu yakin ingin menonaktifkan dokumen ini?" 
      : "Apakah kamu yakin ingin mengaktifkan kembali dokumen ini?";

    if (window.confirm(pesanKonfirmasi)) {
      axios.post(`http://localhost:8000/api/arsip-history/${id}/toggle-aktif`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
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

  const handleCetakLagi = (id, rangkap, halamanRaw) => {
    const halaman = halamanRaw.trim() === '' ? 'All' : halamanRaw;

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
    .then(res => {
      alert(`Sukses! Berhasil dikirim ulang ke printer: ${rangkap} Rangkap (Hal: ${halaman}).`);
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

  // 🔍 PENGECEKAN FOTO TTD (Khusus Surat Tugas Diabaikan)
  const cekFotoTTD = (item) => {
    if (!item) return null;

    const namaDokumen = (item.nama_dokumen || '').toLowerCase();
    if (namaDokumen.includes('tugas')) {
      return null;
    }

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
      className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Dokumentasi & Laporan</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Arsip & History</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Pusat peninjauan dokumen berkas fisik yang telah dicetak maupun yang sudah diarsipkan dengan tanda tangan.
              </p>
            </div>
          </div>

          {/* BAR FILTER TAB & PENCARIAN */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Navigasi 3 Tab */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl self-start flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('ba_penyerahan')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'ba_penyerahan'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-100/80'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                BA Penyerahan 
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'ba_penyerahan' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/60 text-slate-500'}`}>{totalPenyerahan}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ba_kerusakan')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'ba_kerusakan'
                    ? 'bg-white text-rose-600 shadow-sm border border-slate-100/80'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                <span className="h-2 w-2 bg-rose-500 rounded-full"></span>
                BA Kerusakan 
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'ba_kerusakan' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200/60 text-slate-500'}`}>{totalKerusakan}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('surat_tugas')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  activeTab === 'surat_tugas'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100/80'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
                Surat Tugas
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'surat_tugas' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/60 text-slate-500'}`}>{totalSuratTugas}</span>
              </button>
            </div>

            {/* Kontrol Kanan */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                type="button"
                onClick={() => setStatusFilter(statusFilter === '1' ? '0' : '1')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all shadow-sm cursor-pointer whitespace-nowrap flex-shrink-0 select-none ${
                  statusFilter === '1' 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {statusFilter === '1' ? '🚫 Lihat Arsip Nonaktif' : '👥 Lihat Arsip Aktif'}
              </button>

              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari nama dokumen di arsip..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 text-slate-800 text-xs font-medium rounded-xl border border-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* DISPLAY LIST */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-4 shadow-sm animate-pulse">
              <div className="text-4xl text-blue-500 animate-spin inline-block">⏳</div>
              <p className="text-slate-500 font-bold text-sm">Sedang memuat riwayat dokumen...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dataTampil.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-2xl p-16 text-center text-slate-400 text-xs font-medium shadow-sm">
                  <span className="text-2xl block mb-2">📁</span>
                  Tidak ada dokumen berkas arsip pada kategori tab pilihan ini.
                </div>
              ) : (
                dataTampil.map(file => (
                  <ArsipRow 
                    key={file.id}
                    file={file}
                    statusFilter={statusFilter}
                    printingId={printingId}
                    onCetakLagi={handleCetakLagi}
                    onToggleAktif={handleToggleAktif}
                    onBukaModal={bukaModalDetail}
                    userRole={userRole}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL DETAIL DOKUMEN ================= */}
      {modalTerbuka && dokumenTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-wider">
                  Rincian Arsip Dokumen
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[380px]">
                  {dokumenTerpilih.nama_dokumen}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer transition-colors select-none"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="grid grid-cols-3 bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 font-medium">ID Ref</span>
                <span className="col-span-2 text-slate-800 font-bold">#: {dokumenTerpilih.id}</span>
              </div>
              <div className="grid grid-cols-3 bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 font-medium">Template ID</span>
                <span className="col-span-2 text-slate-800 font-bold">#: {dokumenTerpilih.template_id}</span>
              </div>
              <div className="grid grid-cols-3 bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 font-medium">History Print Awal</span>
                <span className="col-span-2 text-slate-800 font-bold">
                  {dokumenTerpilih.copies || 1} Rangkap (Halaman: {dokumenTerpilih.pages || 'All'})
                </span>
              </div>

              {/* Master File Dokumen */}
              <div className="space-y-2 pt-1 border-t border-slate-100/70 mt-2">
                <span className="text-slate-500 font-bold block">Master Berkas & Dokumen:</span>
                <div className="flex flex-wrap gap-2">
                  {cekFotoTTD(dokumenTerpilih) && (
                    <button 
                      type="button" 
                      onClick={() => window.open(`http://localhost:8000/${cekFotoTTD(dokumenTerpilih)}`, '_blank')}
                      className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm select-none"
                    >
                      👁️ Lihat Foto TTD
                    </button>
                  )}
                  <button 
                    type="button" 
                    disabled={downloadingId === dokumenTerpilih.id}
                    onClick={() => handleDownloadAtauLihat(dokumenTerpilih.id)}
                    className="flex items-center gap-1.5 border border-blue-200/60 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm select-none"
                  >
                    📥 {downloadingId === dokumenTerpilih.id ? 'Mengunduh...' : 'Unduh Dokumen Word'}
                  </button>
                </div>
              </div>

              {/* Preview Gambar hanya dirender jika dokumen BUKAN Surat Tugas dan memiliki foto TTD */}
              {cekFotoTTD(dokumenTerpilih) && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-slate-500 font-bold block">Preview Bukti Fisik:</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 max-h-32 flex items-center justify-center">
                    <img 
                      src={`http://localhost:8000/${cekFotoTTD(dokumenTerpilih)}`} 
                      alt="Bukti Dokumen TTD" 
                      className="object-contain w-full h-full max-h-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER MODAL */}
            <div className="pt-3 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-all cursor-pointer select-none"
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