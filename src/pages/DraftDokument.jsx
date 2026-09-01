import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// HELPER PENCARIAN BARU: Versi Anti-Bocor
const dapatkanTeksCariPresisiDraft = (file) => {
  if (!file) return '';
  
  let dataInput = file.data_input;
  if (typeof dataInput === 'string') {
    try { dataInput = JSON.parse(dataInput); } catch (e) { dataInput = {}; }
  }
  dataInput = dataInput || {};

  const namaItem = getVal(dataInput, ['item', 'no_item', 'nama_item', 'nama_barang']);
  const namaAlat = getVal(dataInput, ['nama_alat', 'alat']);
  const namaPekerja = getVal(dataInput, ['nama_pekerja', 'pekerja', 'nama', 'petugas', 'nama_petugas']);
  const lokasi = getVal(dataInput, ['lokasi', 'lokasi_kerja', 'tempat', 'tujuan', 'lokasi_pekerjaan']);
  const pengadaan = getVal(dataInput, ['pengadaan', 'nama_draft']);
  const pekerjaanJasa = getVal(dataInput, ['nama_jasa', 'jasa', 'pekerjaan', 'kegiatan']);
  
  let namaDraftVisual = formatNamaDraft(file).toLowerCase();
  const kataAbaikan = ['ba penyerahan', 'ba kerusakan', 'surat tugas', 'tor barang', 'tor jasa', 'draft baru', '-', 'ba', 'tor'];
  kataAbaikan.forEach(kata => {
    namaDraftVisual = namaDraftVisual.replace(new RegExp(kata, 'g'), '');
  });

  return `${namaDraftVisual} ${namaItem} ${namaAlat} ${namaPekerja} ${lokasi} ${pengadaan} ${pekerjaanJasa}`.toLowerCase();
};

function DraftDokumen() {
  const navigate = useNavigate();
  const location = useLocation();

  // State Manajemen Data
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Penyerahan'); 

  // State & Ref untuk Highlight
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  const highlightedRef = useRef(null);

  // STATE POP-UP MODAL REACT
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Deteksi ID penanda
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hId = searchParams.get('highlight_id') || searchParams.get('highlight') || searchParams.get('draft_id') || location.state?.highlightId;
    if (hId) {
      setActiveHighlightId(String(hId));
    }
  }, [location]);

  // Deteksi otomatis kategori dari URL atau state
  useEffect(() => {
    if (location.state?.targetTab === 'tor_barang' || location.pathname.includes('tor-barang')) {
      setKategoriAktif('Tor Barang');
    } else if (location.pathname.includes('penyerahan')) {
      setKategoriAktif('Penyerahan');
    } else if (location.pathname.includes('kerusakan')) {
      setKategoriAktif('Kerusakan');
    } else if (location.pathname.includes('surat-tugas')) {
      setKategoriAktif('Surat Tugas');
    } else if (location.pathname.includes('tor-jasa')) {
      setKategoriAktif('Tor Jasa');
    }
    ambilDaftarDraft();
  }, [location]);

  // Hitung jumlah draf di tiap kategori
  const countPerKategori = useMemo(() => {
    const validDrafts = drafts.filter(file => file.status !== 'siap_cetak');
    
    let penyerahan = 0;
    let kerusakan = 0;
    let suratTugas = 0;
    let torBarang = 0;
    let torJasa = 0;

    validDrafts.forEach(file => {
      const namaTemplate = file.template?.nama || '';
      const jenisId = file.jenis_dokumen_id || file.template?.jenis_dokumen_id;
      
      const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
      const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
      const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
      const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));

      if (isKerusakan) kerusakan++;
      else if (isSuratTugas) suratTugas++;
      else if (isTorBarang) torBarang++;
      else if (isTorJasa) torJasa++;
      else penyerahan++;
    });

    return {
      'Penyerahan': penyerahan,
      'Kerusakan': kerusakan,
      'Surat Tugas': suratTugas,
      'Tor Barang': torBarang,
      'Tor Jasa': torJasa
    };
  }, [drafts]);

  // Auto Scroll jika ada item yang di-highlight
  useEffect(() => {
    if (activeHighlightId && drafts.length > 0) {
      const targetDraft = drafts.find(d => String(d.id) === String(activeHighlightId));
      if (targetDraft) {
        const namaTemplate = targetDraft.template?.nama || '';
        const jenisId = targetDraft.jenis_dokumen_id || targetDraft.template?.jenis_dokumen_id;
        
        const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
        const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
        const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
        const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));

        if (isKerusakan) setKategoriAktif('Kerusakan');
        else if (isSuratTugas) setKategoriAktif('Surat Tugas');
        else if (isTorBarang) setKategoriAktif('Tor Barang');
        else if (isTorJasa) setKategoriAktif('Tor Jasa');
        else setKategoriAktif('Penyerahan');

        setTimeout(() => {
          highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    }
  }, [activeHighlightId, drafts]);

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

  const handleOpenDeleteModal = (draft) => {
    const namaDraftVisual = formatNamaDraft(draft);
    setItemToDelete({ id: draft.id, nama: namaDraftVisual });
    setIsDeleteModalOpen(true);
  };

  const executeHapusDraft = async () => {
    if (!itemToDelete) return;
    setLoadingDelete(true);

    const token = localStorage.getItem('token');

    try {
      await axios.delete(`http://localhost:8000/api/drafts/${itemToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setIsDeleteModalOpen(false);
      setItemToDelete(null);

      setIsSuccessModalOpen(true);
      ambilDaftarDraft();

      setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 1500);

    } catch (err) {
      console.error("Gagal menghapus draft:", err);
      setIsDeleteModalOpen(false);
    } finally {
      setLoadingDelete(false);
    }
  };

  const daftarFileTerfilter = drafts.filter(file => {
    if (file.status === 'siap_cetak') return false;

    const keyword = searchTerm.toLowerCase().trim();
    const teksPresisi = dapatkanTeksCariPresisiDraft(file);
    const cocokNama = keyword === '' ? true : teksPresisi.includes(keyword);

    const namaTemplate = file.template?.nama || '';
    const jenisId = file.jenis_dokumen_id || file.template?.jenis_dokumen_id;
    
    const isKerusakan = jenisId ? (jenisId === 2 || jenisId === '2') : namaTemplate.toLowerCase().includes('kerusakan');
    const isSuratTugas = jenisId ? (jenisId === 3 || jenisId === '3') : namaTemplate.toLowerCase().includes('surat tugas');
    const isTorBarang = jenisId ? (jenisId === 4 || jenisId === '4') : (namaTemplate.toLowerCase().includes('tor barang') || namaTemplate.toLowerCase().includes('tor_barang'));
    const isTorJasa = jenisId ? (jenisId === 5 || jenisId === '5') : (namaTemplate.toLowerCase().includes('tor jasa') || namaTemplate.toLowerCase().includes('tor_jasa'));
    const isPenyerahan = !isKerusakan && !isSuratTugas && !isTorBarang && !isTorJasa;

    if (kategoriAktif === 'Penyerahan') return cocokNama && isPenyerahan;
    if (kategoriAktif === 'Kerusakan') return cocokNama && isKerusakan;
    if (kategoriAktif === 'Surat Tugas') return cocokNama && isSuratTugas;
    if (kategoriAktif === 'Tor Barang') return cocokNama && isTorBarang;
    if (kategoriAktif === 'Tor Jasa') return cocokNama && isTorJasa;
    
    return false;
  });

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <style>{`
        @keyframes pelanBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .animate-pelan {
          animation: pelanBounce 2.4s ease-in-out infinite;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.7); }
          70% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop {
          animation: popIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes drawCheck {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck 0.4s ease-in-out 0.1s forwards;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <section className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Draft <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">{kategoriAktif}</span>
              </h1>
            </div>

            <div className="relative w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
              <input 
                type="text"
                placeholder="Cari nama draft..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-sky-100/90 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100/60 transition-all shadow-xs"
              />
            </div>
          </section>

          {/* TAB FILTER DENGAN BADGE COUNTER */}
          <section className="bg-white p-2.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50">
            <div className="grid grid-cols-5 gap-2 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 w-full">
              {['Penyerahan', 'Kerusakan', 'Surat Tugas', 'Tor Barang', 'Tor Jasa'].map((tab) => {
                const totalCount = countPerKategori[tab] || 0;
                const isTabActive = kategoriAktif === tab;

                const labelTab = tab === 'Penyerahan' 
                  ? '🤝 BA Penyerahan' 
                  : tab === 'Kerusakan' 
                  ? '⚠️ BA Kerusakan' 
                  : tab === 'Surat Tugas' 
                  ? '💼 Surat Tugas'
                  : tab === 'Tor Barang'
                  ? '📦 TOR Barang'
                  : '🛠️ TOR Jasa';

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setKategoriAktif(tab)}
                    className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                      isTabActive 
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.02]' 
                        : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50/60'
                    }`}
                  >
                    <span className="truncate">{labelTab}</span>
                    {totalCount > 0 && (
                      <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-black rounded-full shrink-0 transition-all ${
                        isTabActive 
                          ? 'bg-white text-blue-600 shadow-xs' 
                          : 'bg-indigo-600 text-white shadow-xs'
                      }`}>
                        {totalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* DISPLAY BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-4 shadow-sm shadow-sky-100/50 animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-500 font-bold text-xs tracking-wide">Sedang menyinkronkan data file draf kamu...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-3 shadow-sm shadow-sky-100/50">
              <div className="text-4xl select-none">📭</div>
              <p className="text-slate-500 font-bold text-sm">Belum ada file draft terdaftar untuk kategori ini</p>
              <p className="text-xs text-sky-500/80 font-medium">Kamu bisa buat dokumen baru lewat menu File Template!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md shadow-sky-100/60 p-3 space-y-2">
              
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
                  let warnaBadge = 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-black';

                  if (isKerusakan) {
                    targetRoute = '/draft-kerusakan';
                    teksBadge = '⚠️ Kerusakan';
                    warnaBadge = 'bg-rose-100 text-rose-950 border border-rose-300 font-black';
                  } else if (isSuratTugas) {
                    targetRoute = '/draft-surat-tugas';
                    teksBadge = '💼 Surat Tugas';
                    warnaBadge = 'bg-sky-100 text-sky-950 border border-sky-300 font-black';
                  } else if (isTorBarang) {
                    targetRoute = '/draft-tor-barang';
                    teksBadge = '📦 TOR Barang';
                    warnaBadge = 'bg-amber-100 text-amber-950 border border-amber-300 font-black';
                  } else if (isTorJasa) {
                    targetRoute = '/draft-tor-jasa';
                    teksBadge = '🛠️ TOR Jasa';
                    warnaBadge = 'bg-purple-100 text-purple-950 border border-purple-300 font-black';
                  }

                  const isHighlighted = String(draft.id) === String(activeHighlightId);

                  return (
                    <div 
                      key={draft.id}
                      ref={isHighlighted ? highlightedRef : null}
                      className={`grid grid-cols-12 items-center px-6 py-3.5 rounded-2xl transition-all duration-300 transform group cursor-default ${
                        isHighlighted
                          ? 'bg-[#edf7ff] border-2 border-sky-400 ring-4 ring-sky-200/50 shadow-lg shadow-sky-200/70 animate-pelan'
                          : 'bg-white hover:bg-sky-50/30 border border-sky-100/80 hover:border-sky-300 shadow-xs hover:shadow-lg hover:shadow-sky-100/80 hover:scale-[1.01] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs transition-all duration-300 shrink-0 ${
                          isHighlighted
                            ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 text-amber-300 shadow-md shadow-sky-300/60 border border-sky-300'
                            : 'bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 border border-sky-100 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-sky-200/60'
                        }`}>
                          📄
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p 
                              className={`font-bold transition-colors cursor-pointer text-xs ${
                                isHighlighted ? 'text-slate-900 font-extrabold' : 'text-slate-800 group-hover:text-sky-600'
                              }`}
                              onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                            >
                              {namaDraftFinalVisual}
                            </p>
                            
                            {isHighlighted && (
                              <span className="bg-sky-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                BARU
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                            <span>ID: #{draft.id}</span>
                            <span className="text-sky-200">•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-lg border border-sky-200/60">
                              👤 {draft.user?.name || draft.user?.username || draft.user?.nama || 'Sita'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs ${warnaBadge}`}>
                          {teksBadge}
                        </span>
                      </div>

                      <div className="col-span-2 text-slate-400 text-[11px] font-medium">
                        🕒 {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => navigate(`${targetRoute}?draft_id=${draft.id}`)}
                          className="bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs hover:shadow-md hover:shadow-sky-200/60 transform hover:-translate-y-0.5"
                          title="Edit Data Variabel"
                        >
                          <span>✏️</span> Edit
                        </button>

                        <button 
                          onClick={() => handleOpenDeleteModal(draft)}
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

      {/* POP-UP MODAL KONFIRMASI HAPUS DRAFT */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            <div className="w-14 h-14 bg-amber-100/80 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-amber-200/60 shadow-xs">
              ⚠️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Hapus Draft?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus <br />
                <span className="font-bold text-slate-700">"{itemToDelete?.nama}"</span>?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={executeHapusDraft}
                disabled={loadingDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md shadow-red-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loadingDelete ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL NOTIFIKASI SUKSES */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            <div className="w-14 h-14 bg-emerald-100/90 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/60 shadow-xs">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                <path className="animate-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <div className="space-y-1.5 pb-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Draft Terhapus!
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                File draft berhasil dihapus.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DraftDokumen;