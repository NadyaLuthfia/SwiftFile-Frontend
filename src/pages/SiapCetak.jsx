import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';

// Konfigurasi dasar API
const API_BASE_URL = 'http://localhost:8000/api';

function SiapCetak() {
  // 1. STATE UTAMA & NAVIGASI 3 TAB
  const [activeTab, setActiveTab] = useState('ba_penyerahan'); 
  const [antreanList, setAntreanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // STATE PARAMETER: Mengatur rangkap dan halaman berdasarkan ID Dokumen
  const [documentCopies, setDocumentCopies] = useState({});
  const [documentPages, setDocumentPages] = useState({});

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
        setAntreanList(res.data.data || res.data || []);
      })
      .catch(err => {
        console.error("Gagal memuat data antrean cetak:", err);
        alert("❌ Gagal memuat data dari server. Silakan coba beberapa saat lagi.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [getAuthConfig]);

  useEffect(() => {
    ambilAntreanCetak();
  }, [ambilAntreanCetak]);

  // 3. AKSI: DOWNLOAD FILE
  const handleDownloadAction = (id) => {
    axios.get(`${API_BASE_URL}/siap-cetak/${id}/download`, getAuthConfig())
      .then((res) => {
        if (res.data.download_url) {
          const link = document.createElement('a');
          link.href = res.data.download_url;
          link.setAttribute('download', ''); 
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert("❌ URL download tidak ditemukan dalam respon server.");
        }
      })
      .catch(err => {
        console.error("Gagal mengunduh file dokumen:", err);
        alert("❌ Gagal mendownload file dokumen. Pastikan token valid atau file tersedia.");
      });
  };

  // 4. AKSI: PRINT & UPDATE STATUS (SOLUSI TAB BARU ANTI-BLOCK BROWSER)
  const handlePrintAction = (id, namaDokumen) => {
    const rangkap = documentCopies[id] || 1;
    const halamanRaw = documentPages[id] || '';
    const halaman = halamanRaw.trim() === '' ? 'All' : halamanRaw;

    axios.put(`${API_BASE_URL}/siap-cetak/${id}/status`, {
      copies: rangkap,
      pages: halaman
    }, getAuthConfig())
      .then((res) => {
        const pdfUrl = res.data.pdf_url; // Ambil URL PDF dari Laravel

        if (pdfUrl) {
          // 🚀 Buka tab baru dengan URL PDF-nya
          const printWindow = window.open(pdfUrl, '_blank');
          
          if (printWindow) {
            // Tunggu halaman tab baru ter-load, lalu langsung pancing dialog print
            printWindow.onload = () => {
              printWindow.focus();
              printWindow.print();
            };
          } else {
            // Jika browser memblokir pop-up otomatis, ingatkan user
            alert("⚠️ Browser memblokir pop-up. Izinkan pop-up di browser kamu agar dialog cetak bisa terbuka otomatis.");
          }
        } else {
          alert("❌ URL PDF tidak ditemukan dalam respon server.");
        }

        ambilAntreanCetak(); 
      })
      .catch(err => {
        console.error("Gagal memperbarui status cetak:", err);
        alert("❌ Gagal memproses aksi print.");
      });
  };

  // 5. AKSI FINAL A: UNGGAH FOTO BUKTI TANDA TANGAN (Untuk BA Penyerahan / BA Kerusakan)
  const handleUploadAction = (id, event) => {
    const fileTarget = event.target.files[0];
    if (!fileTarget) return;

    const formData = new FormData();
    formData.append('foto_ttd', fileTarget);

    const config = getAuthConfig();

    axios.post(`${API_BASE_URL}/siap-cetak/${id}/upload`, formData, config)
      .then(() => {
        alert("🎉 Foto bukti TTD berhasil diunggah dan dokumen otomatis dipindahkan ke arsip!");
        ambilAntreanCetak(); 
      })
      .catch(err => {
        console.error("Detail Error Upload:", err.response ? err.response.data : err);
        alert("❌ Ups, gagal mengunggah bukti file.");
      });
  };

  // 6. AKSI FINAL B: KHUSUS SURAT TUGAS (Langsung Selesai tanpa Upload, foto_ttd diset 'tanpa_ttd' di backend)
  const handleSelesaiSuratTugas = (id) => {
    const yakin = window.confirm("Apakah Anda yakin ingin menyelesaikan Surat Tugas ini dan memindahkannya ke arsip?");
    if (!yakin) return;

    // Mengirim request ke endpoint baru di Laravel
    axios.post(`${API_BASE_URL}/siap-cetak/${id}/selesai`, {}, getAuthConfig())
      .then(() => {
        alert("🎉 Surat Tugas berhasil diselesaikan dan langsung dipindahkan ke arsip!");
        ambilAntreanCetak(); 
      })
      .catch(err => {
        console.error("Detail Error Selesai Surat Tugas:", err.response ? err.response.data : err);
        alert("❌ Gagal menyelesaikan Surat Tugas. Silakan hubungi admin.");
      });
  };

  // 🛠️ DYNAMIC FILTERING BERDASARKAN KATEGORI TAB & KEYWORD
  const daftarFileTerfilter = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    return antreanList.filter(item => {
      // Jika sudah memiliki 'foto_ttd' (berupa path foto atau 'tanpa_ttd'), keluarkan dari antrean!
      if (item.foto_ttd) return false;

      const namaDokumen = (item.nama_dokumen || '').toLowerCase();
      const namaArsipDisplay = (item.nama_arsip_display || '').toLowerCase();
      
      const cocokPencarian = namaDokumen.includes(lowerSearch) || namaArsipDisplay.includes(lowerSearch);
      if (!cocokPencarian) return false;

      const gabunganTeks = `${namaDokumen} ${namaArsipDisplay}`;
      
      if (activeTab === 'ba_penyerahan' && !gabunganTeks.includes('penyerahan')) return false;
      if (activeTab === 'ba_kerusakan' && !gabunganTeks.includes('kerusakan')) return false;
      if (activeTab === 'surat_tugas' && !gabunganTeks.includes('tugas')) return false;

      return true;
    });
  }, [antreanList, searchTerm, activeTab]);

  const handlePageChange = (id, value) => {
    setDocumentPages(prev => ({ ...prev, [id]: value }));
  };

  const handleCopiesChange = (id, value) => {
    const parsed = parseInt(value, 10);
    setDocumentCopies(prev => ({ ...prev, [id]: isNaN(parsed) || parsed < 1 ? 1 : parsed }));
  };

  const dapatkanWarnaTab = (tabName) => {
    if (activeTab !== tabName) return 'border-transparent text-slate-400 hover:text-slate-600';
    if (tabName === 'ba_penyerahan') return 'border-blue-600 text-blue-600 font-extrabold';
    if (tabName === 'ba_kerusakan') return 'border-amber-500 text-amber-600 font-extrabold';
    if (tabName === 'surat_tugas') return 'border-indigo-600 text-indigo-600 font-extrabold';
    return '';
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
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Pusat Kendali Cetak</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Antrean <span className="text-blue-600">Proses Berkas</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Kelola berkas aktif secara terpusat berdasarkan kategori: sesuaikan kustomisasi cetak fisik, lalu finalisasi dengan upload bukti atau penyelesaian langsung.
              </p>
            </div>

            {/* SEARCH BAR */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">🔍</span>
              <input 
                type="text"
                placeholder="Cari berkas di tab ini..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium shadow-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </section>

          {/* 1. KOTAK INFORMASI / PERINGATAN */}
          <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-800">
            <span className="text-lg select-none mt-0.5">💡</span>
            <div>
              <p className="font-bold mb-0.5">Alur Kerja Operasional Berkas:</p>
              <p className="text-blue-700/90 font-medium">
                Sesuaikan isi parameter <span className="font-bold text-blue-900">Halaman & Rangkap</span>, lakukan <span className="font-bold text-blue-900">PRINT FISIK</span>, dan selesaikan dengan menekan tombol <span className="font-bold text-blue-900">UPLOAD BUKTI TTD</span> (untuk BA) atau langsung tekan tombol <span className="font-bold text-blue-900">SELESAI</span> (khusus Surat Tugas).
              </p>
            </div>
          </section>

          {/* 2. NAVIGASI 3 TAB */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ba_penyerahan')}
              className={`pb-3 px-4 text-xs font-bold tracking-wide transition-all border-b-2 relative ${dapatkanWarnaTab('ba_penyerahan')}`}
            >
              📄 BA Penyerahan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ba_kerusakan')}
              className={`pb-3 px-4 text-xs font-bold tracking-wide transition-all border-b-2 relative ${dapatkanWarnaTab('ba_kerusakan')}`}
            >
              ⚠️ BA Kerusakan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('surat_tugas')}
              className={`pb-3 px-4 text-xs font-bold tracking-wide transition-all border-b-2 relative ${dapatkanWarnaTab('surat_tugas')}`}
            >
              💼 Surat Tugas
            </button>
          </div>

          {/* MAIN DISPLAY DATA BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-4 shadow-sm animate-pulse">
              <div className="text-4xl text-blue-500 animate-spin inline-block">⏳</div>
              <p className="text-slate-500 font-bold text-sm">Sedang memilah berkas dari database...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-3 shadow-sm">
              <div className="text-4xl">✨</div>
              <p className="text-slate-400 font-semibold text-sm">Tab dokumen ini sedang kosong!</p>
              <p className="text-xs text-slate-300">Tidak ada data antrean aktif yang terdeteksi untuk kategori ini.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[35%]">Detail Nama Berkas</th>
                      <th className="py-4 px-4 w-[15%]">Staf Pembuat</th>
                      <th className="py-4 px-6 text-center w-[55%]">Konfigurasi & Finalisasi Cetak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                    {daftarFileTerfilter.map((file) => {
                      const namaTampilan = file.nama_arsip_display || file.nama_dokumen;

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/50 transition-all">
                          
                          {/* 1. DETAIL FILE & DOWNLOAD */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-2xl select-none flex-shrink-0">📄</span>
                                <div className="min-w-0">
                                  <p className="text-slate-900 font-bold truncate max-w-[240px]" title={namaTampilan}>
                                    {namaTampilan}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: #{file.id} | Temp: #{file.template_id}</p>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDownloadAction(file.id)}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-sm whitespace-nowrap mr-2"
                              >
                                📥 Download
                              </button>
                            </div>
                          </td>

                          {/* 2. OPERATOR */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-bold flex items-center gap-1">
                                👤 {file.user?.username || 'Operator Admin'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Penanggungjawab</span>
                            </div>
                          </td>

                          {/* 3. ACTION PIPELINE CONVEYOR */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-3.5">
                              
                              <div className="flex items-center gap-2 bg-slate-100/60 border border-slate-200/80 p-1.5 rounded-2xl shadow-inner">
                                {/* Input Halaman */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-blue-400 transition-colors">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Hal:</span>
                                  <input 
                                    type="text" 
                                    value={documentPages[file.id] ?? ''} 
                                    placeholder="All"
                                    onChange={(e) => handlePageChange(file.id, e.target.value)} 
                                    className="w-12 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none placeholder-slate-400" 
                                  />
                                </div>

                                {/* Input Rangkap */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-blue-400 transition-colors">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Rangkap:</span>
                                  <input 
                                    type="number" 
                                    value={documentCopies[file.id] || 1} 
                                    min="1" 
                                    onChange={(e) => handleCopiesChange(file.id, e.target.value)} 
                                    className="w-6 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none" 
                                  />
                                </div>

                                {/* Tombol Print Fisik */}
                                <button 
                                  type="button"
                                  onClick={() => handlePrintAction(file.id, namaTampilan)} 
                                  className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  🖨️ PRINT FISIK
                                </button>
                              </div>

                              <span className="text-slate-300 text-sm font-light select-none">|</span>

                              {/* TOMBOL AKSI AKHIR KONDISIONAL */}
                              {activeTab === 'surat_tugas' ? (
                                // Tombol Khusus Surat Tugas (Selesai Tanpa Upload File)
                                <button
                                  type="button"
                                  onClick={() => handleSelesaiSuratTugas(file.id)}
                                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                                >
                                  ✅ SELESAI
                                </button>
                              ) : (
                                // Tombol Default untuk BA (Wajib Upload Foto TTD)
                                <label className="inline-block bg-violet-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-violet-700 transition-all shadow-md shadow-violet-100 cursor-pointer whitespace-nowrap">
                                  📤 UPLOAD BUKTI TTD
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleUploadAction(file.id, e)} 
                                  />
                                </label>
                              )}

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