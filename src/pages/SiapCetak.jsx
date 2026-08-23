import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';

// Konfigurasi dasar API
const API_BASE_URL = 'http://localhost:8000/api';

function SiapCetak() {
  // 1. STATE UTAMA & NAVIGASI 5 TAB
  const [activeTab, setActiveTab] = useState('ba_penyerahan'); 
  const [antreanList, setAntreanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State indikator loading khusus saat proses cetak/PDF berjalan per-baris
  const [printingId, setPrintingId] = useState(null);

  // Helper untuk mengambil token autentikasi
  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    };
  }, []);

  // 2. AMBIL DATA DARI DATABASE
  const ambilAntreanCetak = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/siap-cetak`, getAuthConfig())
      .then(res => {
        const dataHasil = res.data.data || res.data || [];
        setAntreanList(dataHasil);
      })
      .catch(err => {
        console.error("Gagal memuat data antrean cetak:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [getAuthConfig]);

  useEffect(() => {
    ambilAntreanCetak();
  }, [ambilAntreanCetak]);

  // 3. AKSI: PRINT & UPDATE STATUS (Sekaligus Update Tanggal Cetak)
  const handlePrintAction = (id, namaDokumen) => {
    // Kunci tombol cetak untuk baris dokumen ini
    setPrintingId(id);

    axios.put(`${API_BASE_URL}/siap-cetak/${id}/status`, {
      copies: 1,
      pages: 'All'
    }, getAuthConfig())
      .then((res) => {
        const pdfUrl = res.data.pdf_url;

        if (pdfUrl) {
          const printWindow = window.open(pdfUrl, '_blank');
          
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.focus();
              printWindow.print();
            };
          }
        }

        // Refresh antrean agar tanggal_cetak terbaru langsung muncul di tabel UI
        ambilAntreanCetak(); 
      })
      .catch(err => {
        console.error("Gagal memperbarui status cetak:", err);
      })
      .finally(() => {
        // Lepas kembali status loading tombol setelah selesai/gagal
        setPrintingId(null);
      });
  };

  // 4. AKSI FINAL: UNTUK SEMUA JENIS DOKUMEN (UBAH STATUS JADI SELESAI/ARSIP)
  const handleSelesaiTanpaTtd = (id) => {
    axios.post(`${API_BASE_URL}/siap-cetak/${id}/selesai`, {}, getAuthConfig())
      .then(() => {
        ambilAntreanCetak(); 
      })
      .catch(err => {
        console.error("Detail Error Selesai Dokumen:", err.response ? err.response.data : err);
      });
  };

  // HELPER PINTAR REKURSIF: Menggeledah isi objek untuk melacak field variabel form
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

  // DYNAMIC FILTERING
  const daftarFileTerfilter = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    return antreanList.filter(item => {
      if (item.foto_ttd) return false;

      const namaDokumen = (item.nama_dokumen || '').toLowerCase();
      const namaArsipDisplay = (item.nama_arsip_display || '').toLowerCase();
      
      const cocokPencarian = namaDokumen.includes(lowerSearch) || namaArsipDisplay.includes(lowerSearch);
      if (!cocokPencarian) return false;

      const gabunganTeks = `${namaDokumen} ${namaArsipDisplay}`;
      
      if (activeTab === 'ba_penyerahan' && !gabunganTeks.includes('penyerahan')) return false;
      if (activeTab === 'ba_kerusakan' && !gabunganTeks.includes('kerusakan')) return false;
      if (activeTab === 'surat_tugas' && !gabunganTeks.includes('tugas')) return false;
      
      // Filter khusus TOR Barang & TOR Jasa
      if (activeTab === 'tor_barang' && !(gabunganTeks.includes('tor') && gabunganTeks.includes('barang'))) return false;
      if (activeTab === 'tor_jasa' && !(gabunganTeks.includes('tor') && gabunganTeks.includes('jasa'))) return false;

      return true;
    });
  }, [antreanList, searchTerm, activeTab]);

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; 
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div id="siap-cetak-wrapper" className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
        
        #siap-cetak-wrapper, 
        #siap-cetak-wrapper *,
        #siap-cetak-wrapper input,
        #siap-cetak-wrapper button,
        #siap-cetak-wrapper table,
        #siap-cetak-wrapper th,
        #siap-cetak-wrapper td {
          font-family: 'Poppins', sans-serif !important;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col px-8 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SEKSI + SEARCH BAR DI SAMPING KANAN */}
          <section className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Antrean <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">Proses Berkas</span>
              </h1>
            </div>

            {/* INPUT PENCARIAN (Sejajar Judul) */}
            <div className="relative w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
              <input 
                type="text"
                placeholder="Cari berkas di tab ini..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-sky-100/90 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100/60 transition-all shadow-xs"
              />
            </div>
          </section>

          {/* FILTER BAR TAB KATEGORI (Grid 5 Kolom - Modern & Rapih) */}
          <section className="bg-white p-2.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50">
            <div className="grid grid-cols-5 gap-2 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 w-full">
              {[
                { id: 'ba_penyerahan', label: '🤝 BA Penyerahan' },
                { id: 'ba_kerusakan', label: '⚠️ BA Kerusakan' },
                { id: 'surat_tugas', label: '💼 Surat Tugas' },
                { id: 'tor_barang', label: '📦 TOR Barang' },
                { id: 'tor_jasa', label: '🛠️ TOR Jasa' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer text-center truncate active:scale-95 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.02]' 
                      : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* MAIN DISPLAY DATA BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-16 text-center space-y-4 shadow-xs animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-600 font-bold text-xs">Sedang memilah berkas dari database...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-16 text-center space-y-3 shadow-xs">
              <div className="text-4xl">✨</div>
              <p className="text-slate-500 font-bold text-sm">Tab dokumen ini sedang kosong!</p>
              <p className="text-xs text-slate-400">Tidak ada data antrean aktif yang terdeteksi untuk kategori ini.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-100/80 shadow-xs overflow-hidden">
              <div className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-sky-50/70 to-blue-50/50 border-b border-sky-100 text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-[65%]">Detail Nama Berkas</th>
                      <th className="py-3.5 px-4 text-center w-[35%]">Aksi Cetak & Finalisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-50 text-xs font-semibold text-slate-600">
                    {daftarFileTerfilter.map((file) => {
                      const namaTampilan = file.nama_arsip_display || file.nama_dokumen;
                      
                      // 🔍 Cek apakah dokumen ini sudah pernah di-print
                      const isPrinted = Boolean(file.tanggal_cetak);

                      // Mengambil variabel khusus dari form / data_input
                      const namaItem = dapatkanValueSakti(file, 'ITEM') || dapatkanValueSakti(file, 'NO_ITEM');
                      const namaAlat = dapatkanValueSakti(file, 'NAMA_ALAT') || dapatkanValueSakti(file, 'NAMA_BARANG') || dapatkanValueSakti(file, 'ITEM');
                      
                      // Dapatkan Nama Jasa / Kegiatan dengan prioritas Nama Jasa
                      const namaJasaOrKegiatan = 
                        dapatkanValueSakti(file, 'NAMA_JASA') || 
                        dapatkanValueSakti(file, 'JASA') || 
                        dapatkanValueSakti(file, 'KEGIATAN') || 
                        dapatkanValueSakti(file, 'NAMA_KEGIATAN') || 
                        dapatkanValueSakti(file, 'PEKERJAAN') || 
                        dapatkanValueSakti(file, 'PENGADAAN');

                      // Ambil khusus tanggal berangkat dari variabel form
                      const tglBerangkatInput = 
                        dapatkanValueSakti(file, 'TANGGAL_BERANGKAT') || 
                        dapatkanValueSakti(file, 'TGL_BERANGKAT') || 
                        dapatkanValueSakti(file, 'TANGGAL') || 
                        file.tgl_berangkat || 
                        file.tanggal_berangkat;

                      return (
                        <tr 
                          key={file.id} 
                          className="hover:bg-sky-50/50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md hover:z-10 relative cursor-pointer group"
                        >
                          
                          {/* DETAIL FILE */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl select-none flex-shrink-0 transition-transform duration-300 group-hover:scale-110">📄</span>
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-slate-900 font-bold truncate max-w-[480px]" title={namaTampilan}>
                                  {namaTampilan}
                                </p>
                                
                                {/* 1. SURAT TUGAS */}
                                {activeTab === 'surat_tugas' && (
                                  <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-1">
                                    📅 Berangkat: {formatTanggalIndo(tglBerangkatInput || file.created_at)}
                                  </p>
                                )}

                                {/* 2. BA PENYERAHAN */}
                                {activeTab === 'ba_penyerahan' && (
                                  <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                                    <span>📦 Item: {namaItem || <span className="italic text-slate-400">[Tidak ada nama item]</span>}</span>
                                  </p>
                                )}

                                {/* 3. BA KERUSAKAN */}
                                {activeTab === 'ba_kerusakan' && (
                                  <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                                    <span>⚠️ Alat: {namaAlat || <span className="italic text-slate-400">[Tidak ada nama alat]</span>}</span>
                                  </p>
                                )}

                                {/* 4. TOR BARANG */}
                                {activeTab === 'tor_barang' && (
                                  <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                                    <span>📦 Barang: {namaItem || namaAlat || <span className="italic text-slate-400">[Tidak ada nama barang]</span>}</span>
                                  </p>
                                )}

                                {/* 5. TOR JASA */}
                                {activeTab === 'tor_jasa' && (
                                  <p className="text-[10px] text-indigo-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                                    <span>🛠️ Kegiatan/Jasa: {namaJasaOrKegiatan || <span className="italic text-slate-400">[Tidak ada detail nama jasa]</span>}</span>
                                  </p>
                                )}

                                {/* 🖨️ INDIKATOR TANGGAL CETAK TERAKHIR */}
                                {file.tanggal_cetak && (
                                  <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                    🖨️ Tanggal Cetak Terakhir: {formatTanggalIndo(file.tanggal_cetak)}
                                  </p>
                                )}

                              </div>
                            </div>
                          </td>

                          {/* ACTION PIPELINE */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-3">
                              
                              {/* TOMBOL PRINT FISIK DENGAN LOADING STATE */}
                              <button 
                                type="button"
                                disabled={printingId === file.id}
                                onClick={() => handlePrintAction(file.id, namaTampilan)} 
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                                  printingId === file.id 
                                    ? 'bg-slate-400 text-white cursor-not-allowed animate-pulse' 
                                    : 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md cursor-pointer'
                                }`}
                              >
                                {printingId === file.id ? '⏳ MEMPROSES PDF...' : '🖨️ PRINT FISIK'}
                              </button>

                              <span className="text-sky-200 text-sm font-light select-none">|</span>

                              {/* 🌟 TOMBOL SELESAI DINAMIS (Hanya Hijau & Aktif jika Sudah Diprint) */}
                              <button
                                type="button"
                                disabled={!isPrinted}
                                onClick={() => handleSelesaiTanpaTtd(file.id)}
                                title={!isPrinted ? "Cetak/Print dokumen fisik terlebih dahulu!" : "Selesaikan dokumen"}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs whitespace-nowrap flex items-center gap-1 ${
                                  isPrinted
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md cursor-pointer'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 border border-slate-300'
                                }`}
                              >
                                ✅ SELESAI
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default SiapCetak;