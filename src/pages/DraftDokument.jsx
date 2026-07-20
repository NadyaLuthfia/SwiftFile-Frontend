import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

function DraftDokumen() {
  const navigate = useNavigate();
  const location = useLocation();

  // State Manajemen Data
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua'); 

  // Deteksi otomatis kategori dari URL jika diakses dari klik Sidebar tertentu
  useEffect(() => {
    if (location.pathname.includes('kerusakan')) {
      setKategoriAktif('Kerusakan');
    } else if (location.pathname.includes('penyerahan')) {
      setKategoriAktif('Penyerahan');
    } else if (location.pathname.includes('surat-tugas')) {
      setKategoriAktif('Surat Tugas');
    } else {
      setKategoriAktif('Semua');
    }
    ambilDaftarDraft();
  }, [location.pathname]);

  // Ambil list semua file draf dari backend
  const ambilDaftarDraft = () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    axios.get('http://localhost:8000/api/drafts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      setDrafts(res.data.data || res.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Gagal memuat list draft:", err);
      setLoading(false);
    });
  };

  // Fungsi Hapus Draft File
  const handleHapusDraft = (id) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus draft dokumen ini?")) return;

    const token = localStorage.getItem('token');
    axios.delete(`http://localhost:8000/api/drafts/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => {
      alert("🗑️ Draft berhasil dihapus!");
      ambilDaftarDraft(); 
    })
    .catch(err => console.error("Gagal menghapus:", err));
  };

  // 🛠️ ENGINE FILTER & PENCARIAN FILE
  const daftarFileTerfilter = drafts.filter(file => {
    const namaTemplate = file.template?.nama || 'Dokumen';
    const dataInput = typeof file.data_input === 'string' 
      ? JSON.parse(file.data_input) 
      : (file.data_input || {});
    
    const jenisId = file.jenis_dokumen_id || file.template?.jenis_dokumen_id;
    const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');

    let namaDraftFinal = file.nama_draft || '';
    
    if (!namaDraftFinal || namaDraftFinal.toLowerCase().includes('draft baru')) {
      if (isSuratTugas) {
        const pekerja = dataInput.nama_pekerja || '';
        const lokasi = dataInput.lokasi || '';
        namaDraftFinal = pekerja || lokasi ? `${namaTemplate} - ${pekerja} ${lokasi}`.trim() : `${namaTemplate} - Draft Baru`;
      } else {
        const pengidentifikasi = dataInput.item || dataInput.nama_alat || '';
        namaDraftFinal = pengidentifikasi ? `${namaTemplate} - ${pengidentifikasi}` : `${namaTemplate} - Draft Baru`;
      }
    }
    
    const cocokNama = namaDraftFinal.toLowerCase().includes(searchTerm.toLowerCase());

    if (kategoriAktif === 'Kerusakan') {
      if (jenisId) return cocokNama && (jenisId === 2 || jenisId === '2');
      return cocokNama && namaDraftFinal.toLowerCase().includes('kerusakan');
    }
    
    if (kategoriAktif === 'Penyerahan') {
      if (jenisId) return cocokNama && (jenisId === 1 || jenisId === '1');
      return cocokNama && !namaDraftFinal.toLowerCase().includes('kerusakan') && !namaDraftFinal.toLowerCase().includes('surat tugas'); 
    }

    if (kategoriAktif === 'Surat Tugas') {
      if (jenisId) return cocokNama && (jenisId === 3 || jenisId === '3');
      return cocokNama && namaDraftFinal.toLowerCase().includes('surat tugas');
    }
    
    return cocokNama;
  });

  return (
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* TOP SECTION HEADER */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Daftar Dokumen Tersimpan</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                File Manager: <span className="text-blue-600">Draft {kategoriAktif !== 'Semua' ? kategoriAktif : 'BA & Surat Tugas'}</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Gunakan halaman ini untuk melihat, mengubah isian data, atau menghapus file draf.</p>
            </div>
          </section>

          {/* FILTER BAR & SEARCH CONTROLLER */}
          <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {['Semua', 'Kerusakan', 'Penyerahan', 'Surat Tugas'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setKategoriAktif(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    kategoriAktif === tab 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'Semua' 
                    ? '📂 Semua Draft' 
                    : tab === 'Kerusakan' 
                    ? '⚠️ BA Kerusakan' 
                    : tab === 'Penyerahan' 
                    ? '🤝 BA Penyerahan' 
                    : '📝 Surat Tugas'}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">🔍</span>
              <input 
                type="text"
                placeholder="Cari nama draft file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </section>

          {/* MAIN FILE DISPLAY BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-4 shadow-sm animate-pulse">
              <div className="text-4xl text-blue-500 animate-spin inline-block">⏳</div>
              <p className="text-slate-500 font-bold text-sm">Sedang sinkronisasi data file draf kamu...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-3 shadow-sm">
              <div className="text-4xl">📂</div>
              <p className="text-slate-400 font-semibold text-sm">Belum ada file draf terdaftar untuk kategori ini.</p>
              <p className="text-xs text-slate-300">Silakan buat dokumen baru lewat menu Master File Template.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6 w-[50%]">Nama Dokumen Draft</th>
                    <th className="py-4 px-4">Kategori</th>
                    <th className="py-4 px-4">Tanggal Diperbarui</th>
                    <th className="py-4 px-6 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                  {daftarFileTerfilter.map((draft) => {
                    const namaTemplate = draft.template?.nama || 'Dokumen';
                    const dataInput = typeof draft.data_input === 'string' 
                      ? JSON.parse(draft.data_input) 
                      : (draft.data_input || {});
                    
                    const jenisId = draft.jenis_dokumen_id || draft.template?.jenis_dokumen_id;
                    const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
                    const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');

                    // ✨ RUTE NAVIGASI DINAMIS (FIX SALAH KAMAR)
                    const targetRoute = isKerusakan 
                      ? '/draft-kerusakan' 
                      : isSuratTugas 
                      ? '/draft-surat-tugas' 
                      : '/draft-penyerahan';

                    let namaDraftFinalVisual = draft.nama_draft || '';
                    if (!namaDraftFinalVisual || namaDraftFinalVisual.toLowerCase().includes('draft baru')) {
                      if (isSuratTugas) {
                        const namaPekerja = dataInput.nama_pekerja || '';
                        const lokasiKerja = dataInput.lokasi ? ` (${dataInput.lokasi})` : '';
                        
                        if (namaPekerja || lokasiKerja) {
                          namaDraftFinalVisual = `${namaTemplate} - ${namaPekerja}${lokasiKerja}`.trim();
                        } else {
                          namaDraftFinalVisual = `${namaTemplate} - Draft Baru`;
                        }
                      } else {
                        const alat = dataInput.item || dataInput.nama_alat || '';
                        namaDraftFinalVisual = alat ? `${namaTemplate} - ${alat}` : `${namaTemplate} - Draft Baru`;
                      }
                    }
                    
                    let teksBadge = 'BA Penyerahan';
                    let warnaBadge = 'bg-blue-50 text-blue-600 border border-blue-100';

                    if (isKerusakan) {
                      teksBadge = 'BA Kerusakan';
                      warnaBadge = 'bg-amber-50 text-amber-600 border border-amber-100';
                    } else if (isSuratTugas) {
                      teksBadge = 'Surat Tugas';
                      warnaBadge = 'bg-purple-50 text-purple-600 border border-purple-100';
                    }

                    return (
                      <tr key={draft.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <span className="text-2xl select-none">📄</span>
                          <div>
                            {/* Klik Judul Menuju Halaman Edit yang Benar */}
                            <p 
                              className="text-slate-900 font-bold hover:text-blue-600 transition-all cursor-pointer" 
                              onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                            >
                              {namaDraftFinalVisual}
                            </p>
                            
                            {/* ✨ SEKSI SUB-INFO BARU: ID REFERENSI & BADGE NAMA PEMBUAT */}
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                              <span>ID Referensi: #{draft.id}</span>
                              <span className="text-slate-200">|</span>
                              <span className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">
                                👤 {draft.user?.name || draft.user?.username || draft.user?.nama || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${warnaBadge}`}>
                            {teksBadge}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-400 font-medium">
                          {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Edit Menuju Halaman Edit yang Benar */}
                            <button 
                              onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                              className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 p-2 px-4 rounded-xl transition-all cursor-pointer font-bold text-xs"
                              title="Edit Data Variabel"
                            >
                              ✏️ Edit
                            </button>

                            <button 
                              onClick={() => handleHapusDraft(draft.id)}
                              className="bg-white border border-red-100 text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default DraftDokumen;