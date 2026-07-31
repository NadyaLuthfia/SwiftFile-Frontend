import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

// HELPER PINTAR: Mengambil nilai key secara case-insensitive dari object data_input
const getVal = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === k.toLowerCase() && obj[key]) {
        return String(obj[key]).trim();
      }
    }
  }
  return '';
};

// HELPER PINTAR: Penentu format nama draft sesuai kategori
const formatNamaDraft = (file) => {
  let dataInput = file.data_input;
  if (typeof dataInput === 'string') {
    try { dataInput = JSON.parse(dataInput); } catch (e) { dataInput = {}; }
  }
  dataInput = dataInput || {};

  const namaTemplate = file.template?.nama || '';
  const jenisId = file.jenis_dokumen_id || file.template?.jenis_dokumen_id;
  
  const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
  const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
  const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
  const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));

  // 1. BA KERUSAKAN
  if (isKerusakan) {
    const namaAlat = getVal(dataInput, ['nama_alat', 'alat', 'nama_barang']);
    return namaAlat ? `BA Kerusakan - ${namaAlat}` : `BA Kerusakan - Draft Baru`;
  }

  // 2. SURAT TUGAS
  if (isSuratTugas) {
    const pekerja = getVal(dataInput, ['nama_pekerja', 'pekerja', 'nama']);
    const lokasi = getVal(dataInput, ['lokasi', 'lokasi_kerja', 'tempat']);
    if (pekerja && lokasi) return `Surat Tugas - ${pekerja} (${lokasi})`;
    if (pekerja) return `Surat Tugas - ${pekerja}`;
    if (lokasi) return `Surat Tugas - (${lokasi})`;
    return `Surat Tugas - Draft Baru`;
  }

  // 3. TOR BARANG
  if (isTorBarang) {
    const barang = getVal(dataInput, ['nama_barang', 'barang', 'pengadaan']);
    return barang ? `TOR Barang - ${barang}` : `TOR Barang - Draft Baru`;
  }

  // 4. TOR JASA
  if (isTorJasa) {
    const jasa = getVal(dataInput, ['nama_jasa', 'jasa', 'pekerjaan', 'pengadaan']);
    return jasa ? `TOR Jasa - ${jasa}` : `TOR Jasa - Draft Baru`;
  }

  // 5. BA PENYERAHAN
  const item = getVal(dataInput, ['item', 'no_item', 'nama_item', 'nama_barang']);
  return item ? `BA Penyerahan - ${item}` : `BA Penyerahan - Draft Baru`;
};

function DraftDokumen() {
  const navigate = useNavigate();
  const location = useLocation();

  // State Manajemen Data (Default ke 'Kerusakan')
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Kerusakan'); 

  // Deteksi otomatis kategori dari URL
  useEffect(() => {
    if (location.pathname.includes('kerusakan')) {
      setKategoriAktif('Kerusakan');
    } else if (location.pathname.includes('penyerahan')) {
      setKategoriAktif('Penyerahan');
    } else if (location.pathname.includes('surat-tugas')) {
      setKategoriAktif('Surat Tugas');
    } else if (location.pathname.includes('tor-barang')) {
      setKategoriAktif('Tor Barang');
    } else if (location.pathname.includes('tor-jasa')) {
      setKategoriAktif('Tor Jasa');
    } else {
      setKategoriAktif('Kerusakan');
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
    const token = localStorage.getItem('token');
    axios.delete(`http://localhost:8000/api/drafts/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => {
      ambilDaftarDraft(); 
    })
    .catch(err => console.error("Gagal menghapus:", err));
  };

  // ENGINE FILTER & PENCARIAN FILE
  const daftarFileTerfilter = drafts.filter(file => {
    const namaDraftFinal = formatNamaDraft(file);
    const cocokNama = namaDraftFinal.toLowerCase().includes(searchTerm.toLowerCase());

    const namaTemplate = file.template?.nama || '';
    const jenisId = file.jenis_dokumen_id || file.template?.jenis_dokumen_id;
    
    const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
    const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
    const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
    const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));
    const isPenyerahan = !isKerusakan && !isSuratTugas && !isTorBarang && !isTorJasa;

    if (kategoriAktif === 'Kerusakan') return cocokNama && isKerusakan;
    if (kategoriAktif === 'Penyerahan') return cocokNama && isPenyerahan;
    if (kategoriAktif === 'Surat Tugas') return cocokNama && isSuratTugas;
    if (kategoriAktif === 'Tor Barang') return cocokNama && isTorBarang;
    if (kategoriAktif === 'Tor Jasa') return cocokNama && isTorJasa;
    
    return false;
  });

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SEKSI */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Draft <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">{kategoriAktif}</span>
              </h1>
            </div>
          </section>

          {/* FILTER BAR & SEARCH CONTROLLER */}
          <section className="bg-white p-3.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* TAB KATEGORI */}
            <div className="flex items-center gap-1.5 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 overflow-x-auto custom-scrollbar">
              {['Kerusakan', 'Penyerahan', 'Surat Tugas', 'Tor Barang', 'Tor Jasa'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setKategoriAktif(tab)}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap transform active:scale-95 ${
                    kategoriAktif === tab 
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.03]' 
                      : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50/60'
                  }`}
                >
                  {tab === 'Kerusakan' 
                    ? '⚠️ BA Kerusakan' 
                    : tab === 'Penyerahan' 
                    ? '🤝 BA Penyerahan' 
                    : tab === 'Surat Tugas' 
                    ? '💼 Surat Tugas'
                    : tab === 'Tor Barang'
                    ? '📦 TOR Barang'
                    : '🛠️ TOR Jasa'}
                </button>
              ))}
            </div>

            {/* INPUT PENCARIAN */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
              <input 
                type="text"
                placeholder="Cari nama draft..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F4F8FC]/80 border border-sky-100 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
              />
            </div>
          </section>

          {/* MAIN FILE DISPLAY BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-4 shadow-sm shadow-sky-100/50 animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-500 font-bold text-xs tracking-wide">Sedang menyinkronkan data file draf kamu...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-3 shadow-sm shadow-sky-100/50">
              <div className="text-4xl select-none">📭</div>
              <p className="text-slate-500 font-bold text-sm">Belum ada file draft terdaftar untuk kategori ini</p>
              <p className="text-xs text-sky-500/80 font-medium">Kamu bisa buat dokumen baru lewat menu Master File Template!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md shadow-sky-100/60 p-3 space-y-2">
              
              {/* HEADER TABEL */}
              <div className="grid grid-cols-12 px-6 py-3 bg-[#F4F8FC] rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                <div className="col-span-6">Nama Dokumen Draft</div>
                <div className="col-span-2">Kategori</div>
                <div className="col-span-2">Diperbarui</div>
                <div className="col-span-2 text-center">Aksi</div>
              </div>

              {/* LIST FRAME DRAFT */}
              <div className="space-y-2.5">
                {daftarFileTerfilter.map((draft) => {
                  const namaDraftFinalVisual = formatNamaDraft(draft);

                  const namaTemplate = draft.template?.nama || 'Dokumen';
                  const jenisId = draft.jenis_dokumen_id || draft.template?.jenis_dokumen_id;
                  
                  const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
                  const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
                  const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
                  const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));

                  let targetRoute = '/draft-penyerahan';
                  let teksBadge = '🤝 Penyerahan';
                  let warnaBadge = 'bg-emerald-50/90 text-emerald-600 border border-emerald-100';

                  if (isKerusakan) {
                    targetRoute = '/draft-kerusakan';
                    teksBadge = '⚠️ Kerusakan';
                    warnaBadge = 'bg-rose-50/90 text-rose-600 border border-rose-100';
                  } else if (isSuratTugas) {
                    targetRoute = '/draft-surat-tugas';
                    teksBadge = '💼 Surat Tugas';
                    warnaBadge = 'bg-sky-100/80 text-sky-700 border border-sky-200/60';
                  } else if (isTorBarang) {
                    targetRoute = '/draft-tor-barang';
                    teksBadge = '📦 TOR Barang';
                    warnaBadge = 'bg-amber-50/90 text-amber-600 border border-amber-100';
                  } else if (isTorJasa) {
                    targetRoute = '/draft-tor-jasa';
                    teksBadge = '🛠️ TOR Jasa';
                    warnaBadge = 'bg-purple-50/90 text-purple-600 border border-purple-100';
                  }

                  return (
                    <div 
                      key={draft.id} 
                      className="grid grid-cols-12 items-center px-6 py-3.5 bg-white hover:bg-sky-50/30 rounded-2xl border border-sky-100/80 hover:border-sky-300 shadow-xs hover:shadow-lg hover:shadow-sky-100/80 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-0.5 group cursor-default"
                    >
                      {/* INFORMASI DRAFT */}
                      <div className="col-span-6 flex items-center gap-3.5">
                        <div className="bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs border border-sky-100 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-sky-200/60 transition-all duration-300 shrink-0">
                          📄
                        </div>
                        <div>
                          <p 
                            className="text-slate-800 font-bold group-hover:text-sky-600 transition-colors cursor-pointer text-xs" 
                            onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                          >
                            {namaDraftFinalVisual}
                          </p>
                          
                          <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                            <span>ID: #{draft.id}</span>
                            <span className="text-sky-200">•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-sky-600 bg-sky-50/80 px-2 py-0.5 rounded-lg border border-sky-100/80">
                              👤 {draft.user?.name || draft.user?.username || draft.user?.nama || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* BADGE KATEGORI */}
                      <div className="col-span-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-block ${warnaBadge}`}>
                          {teksBadge}
                        </span>
                      </div>

                      {/* TANGGAL */}
                      <div className="col-span-2 text-slate-400 text-[11px] font-medium">
                        🕒 {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>

                      {/* TOMBOL AKSI */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                          className="bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs hover:shadow-md hover:shadow-sky-200/60 transform hover:-translate-y-0.5"
                          title="Edit Data Variabel"
                        >
                          <span>✏️</span> Edit
                        </button>

                        <button 
                          onClick={() => handleHapusDraft(draft.id)}
                          className="bg-rose-50/80 hover:bg-rose-500 text-rose-500 hover:text-white p-1.5 rounded-xl border border-rose-100 hover:border-transparent transition-all duration-300 cursor-pointer active:scale-95 transform hover:-translate-y-0.5 shadow-2xs hover:shadow-md hover:shadow-rose-200/50"
                          title="Hapus Dokumen"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default DraftDokumen;