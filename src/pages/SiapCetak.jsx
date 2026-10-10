import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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

// Helper kecil cek pengadaan barang
const meGat = (item) => Boolean(dapatkanValueSakti(item, 'PENGADAAN'));

// HELPER TEKS: Menggabungkan seluruh teks dokumen untuk pencocokan kategori
const dapatkanTeksDokumen = (item) => {
  if (!item) return '';
  const namaDoc = item.nama_dokumen || '';
  const namaArsip = item.nama_arsip_display || '';
  const jenisDoc = item.jenis_dokumen || item.kategori || item.tipe || item.nama_draft || '';
  const inputData = typeof item.input_data === 'object' ? JSON.stringify(item.input_data) : (item.input_data || '');
  const stringified = typeof item === 'object' ? JSON.stringify(item) : '';
  return `${namaDoc} ${namaArsip} ${jenisDoc} ${inputData} ${stringified}`.toLowerCase();
};

// HELPER PINTAR KATEGORI: Konsisten dengan ArsipHistory
const dapatkanKategoriDokumen = (item) => {
  if (!item) return 'ba_penyerahan';

  const katEksplisit = (item.kategori || item.jenis_dokumen || item.tipe_dokumen || item.tipe || '').toLowerCase();
  if (katEksplisit.includes('tor_jasa') || katEksplisit === 'jasa') return 'tor_jasa';
  if (katEksplisit.includes('tor_barang') || katEksplisit === 'barang') return 'tor_barang';

  const teks = dapatkanTeksDokumen(item);

  if (teks.includes('penyerahan')) return 'ba_penyerahan';
  if (teks.includes('kerusakan')) return 'ba_kerusakan';
  if (teks.includes('tugas')) return 'surat_tugas';

  const adaIndikasiJasa = 
    teks.includes('jasa') || 
    teks.includes('pekerjaan') || 
    teks.includes('pemeliharaan') || 
    teks.includes('perbaikan') || 
    teks.includes('servis') || 
    teks.includes('service') || 
    teks.includes('kegiatan') ||
    teks.includes('sewa') ||
    Boolean(dapatkanValueSakti(item, 'NAMA_PEKERJAAN')) ||
    Boolean(dapatkanValueSakti(item, 'PEKERJAAN')) ||
    Boolean(dapatkanValueSakti(item, 'NAMA_JASA')) ||
    Boolean(dapatkanValueSakti(item, 'JASA')) ||
    Boolean(dapatkanValueSakti(item, 'KEGIATAN')) ||
    Boolean(dapatkanValueSakti(item, 'NAMA_KEGIATAN'));

  if ((teks.includes('tor') || teks.includes('term of reference') || teks.includes('kak')) && adaIndikasiJasa) {
    return 'tor_jasa';
  }

  if (teks.includes('tor') || teks.includes('term of reference') || teks.includes('kak') || meGat(item) || teks.includes('barang')) {
    return 'tor_barang';
  }

  if (adaIndikasiJasa) return 'tor_jasa';

  return 'ba_penyerahan';
};

const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return '-';
  const safeDateString = String(dateStr).replace(' ', 'T');
  const d = new Date(safeDateString);
  if (isNaN(d.getTime())) return dateStr; 
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

function SiapCetak() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 🔒 DETEKSI ID USER LOGIN YANG LEBIH FLEKSIBEL
  const currentUserId = useMemo(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return localStorage.getItem('user_id') || localStorage.getItem('id') || null;
      
      const parsed = JSON.parse(rawUser);
      return parsed?.id || parsed?.user_id || parsed?.id_user || localStorage.getItem('user_id') || null;
    } catch (e) {
      return localStorage.getItem('user_id') || localStorage.getItem('id') || null;
    }
  }, []);

  // 🔒 DETEKSI ROLE USER LOGIN (MASTER ADMIN VS ADMIN BIASA)
  const currentUserRole = useMemo(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return (localStorage.getItem('role') || '').toLowerCase();
      const parsed = JSON.parse(rawUser);
      return (parsed?.role || parsed?.role_name || parsed?.level || localStorage.getItem('role') || '').toLowerCase();
    } catch (e) {
      return (localStorage.getItem('role') || '').toLowerCase();
    }
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || location.state?.targetTab || location.state?.activeTab || location.state?.tab || 'ba_penyerahan';
  }); 

  const [antreanList, setAntreanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [printingId, setPrintingId] = useState(null);
  const [completingId, setCompletingId] = useState(null); 
  const [highlightTarget, setHighlightTarget] = useState(null);
  const highlightedRef = useRef(null);

  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    };
  }, []);

  const isItemMilikUser = useCallback((item) => {
    if (!currentUserId) return true;

    const isMaster = 
      currentUserRole.includes('master') || 
      currentUserRole.includes('super') || 
      currentUserRole === 'admin_master';

    if (isMaster) return true;

    const idPembuat = 
      item.user_id || 
      item.created_by || 
      item.id_user || 
      item.pelapor_id ||
      item.pembuat_id ||
      item.user?.id ||
      dapatkanValueSakti(item, 'user_id') ||
      dapatkanValueSakti(item, 'created_by') ||
      dapatkanValueSakti(item, 'id_user') ||
      dapatkanValueSakti(item, 'id_pelapor');

    const idMengetahui =
      item.mengetahui_id ||
      item.diketahui_oleh ||
      item.penerima_id ||
      item.user_tujuan ||
      dapatkanValueSakti(item, 'mengetahui_id') ||
      dapatkanValueSakti(item, 'diketahui_oleh') ||
      dapatkanValueSakti(item, 'mengetahui') ||
      dapatkanValueSakti(item, 'penerima_id');

    if (!idPembuat && !idMengetahui) return true;

    const isPembuat = String(idPembuat) === String(currentUserId);
    const isMengetahui = String(idMengetahui) === String(currentUserId);

    return isPembuat || isMengetahui;
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    const targetTabInput = searchParams.get('tab') || location.state?.targetTab || location.state?.activeTab || location.state?.tab;
    if (targetTabInput) {
      setActiveTab(targetTabInput);
    }

    const rawTarget = 
      searchParams.get('highlight') || 
      searchParams.get('id') || 
      searchParams.get('highlightId') ||
      location.state?.highlightId || 
      location.state?.highlight_id || 
      location.state?.highlight || 
      location.state?.id || 
      location.state?.documentId || 
      location.state?.document_id ||
      location.state?.nomorDokumen ||
      location.state?.namaDokumen ||
      location.state?.nama_dokumen;

    if (rawTarget) {
      const cleanTarget = typeof rawTarget === 'object' 
        ? (rawTarget.id || rawTarget.nama_dokumen || JSON.stringify(rawTarget)) 
        : String(rawTarget);
        
      setHighlightTarget(cleanTarget);

      const timer = setTimeout(() => {
        setHighlightTarget(null);
      }, 15000); 
      return () => clearTimeout(timer);
    }
  }, [location.state, searchParams]);

  useEffect(() => {
    const tabDiUrl = searchParams.get('tab');
    if (tabDiUrl !== activeTab) {
      setSearchParams(prev => {
        prev.set('tab', activeTab);
        return prev;
      }, { replace: true }); 
    }
  }, [activeTab, searchParams, setSearchParams]);

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

  const isItemHighlighted = useCallback((file) => {
    if (!highlightTarget) return false;
    
    const targetStr = String(highlightTarget).toLowerCase().trim();
    if (!targetStr) return false;

    const fileId = String(file.id || '').toLowerCase().trim();
    const namaDoc = String(file.nama_dokumen || '').toLowerCase().trim();
    const namaArsip = String(file.nama_arsip_display || '').toLowerCase().trim();

    return fileId === targetStr || 
           namaDoc === targetStr || 
           namaArsip === targetStr ||
           (targetStr.length > 2 && (namaDoc.includes(targetStr) || namaArsip.includes(targetStr) || targetStr.includes(namaDoc)));
  }, [highlightTarget]);

  const targetHighlightItem = useMemo(() => {
    if (!highlightTarget || antreanList.length === 0) return null;
    return antreanList.find(f => isItemHighlighted(f)) || null;
  }, [highlightTarget, antreanList, isItemHighlighted]);

  useEffect(() => {
    if (targetHighlightItem) {
      const katDokumen = dapatkanKategoriDokumen(targetHighlightItem);
      setActiveTab(katDokumen);
    }
  }, [targetHighlightItem]);

  useEffect(() => {
    if (targetHighlightItem && highlightedRef.current && !loading) {
      const timer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetHighlightItem, loading, activeTab]);

  const handleEditAction = (file) => {
    const kategori = dapatkanKategoriDokumen(file);
    let targetRoute = '/draft-penyerahan';
    
    if (kategori === 'ba_kerusakan') {
        targetRoute = '/draft-kerusakan';
    } else if (kategori === 'surat_tugas') {
        targetRoute = '/draft-surat-tugas';
    } else if (kategori === 'tor_barang') {
        targetRoute = '/draft-tor-barang';
    } else if (kategori === 'tor_jasa') {
        targetRoute = '/draft-tor-jasa';
    } else if (kategori === 'ba_penyerahan') {
        targetRoute = '/draft-penyerahan';
    }

    navigate(`${targetRoute}?siap_cetak_id=${file.id}`);
  };

  const handlePrintAction = (id, namaDokumen) => {
    setPrintingId(id);
    setHighlightTarget(null);

    axios.put(`${API_BASE_URL}/siap-cetak/${id}/status`, { copies: 1, pages: 'All' }, getAuthConfig())
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
        ambilAntreanCetak(); 
      })
      .catch(err => console.error(err))
      .finally(() => setPrintingId(null));
  };

  const handleSelesaiTanpaTtd = (file) => {
    const id = file.id;
    const namaPresisi = file.nama_arsip_display || file.nomor_dokumen || file.nama_dokumen;
    const targetTabDoc = dapatkanKategoriDokumen(file) || activeTab;

    setCompletingId(id);
    axios.post(`${API_BASE_URL}/siap-cetak/${id}/selesai`, {}, getAuthConfig())
      .then((res) => {
        const idArsipBaru = res.data?.data?.id || res.data?.id || res.data?.arsip_id || res.data?.dokumen_id || id;
        
        const highlightStorage = {
          highlightId: idArsipBaru,
          nomorDokumen: namaPresisi,
          targetTab: targetTabDoc,
          timestamp: Date.now()
        };
        sessionStorage.setItem('active_arsip_highlight', JSON.stringify(highlightStorage));

        navigate('/arsip-history', {
          state: { 
            highlightId: idArsipBaru, 
            nomorDokumen: namaPresisi,
            targetTab: targetTabDoc,
            activeTab: targetTabDoc
          }
        });
      })
      .catch(err => alert("Gagal menyelesaikan dokumen."))
      .finally(() => setCompletingId(null));
  };

  const tabCounts = useMemo(() => {
    const counts = { ba_penyerahan: 0, ba_kerusakan: 0, surat_tugas: 0, tor_barang: 0, tor_jasa: 0 };
    antreanList.forEach(item => {
      if (item.foto_ttd) return;
      if (!isItemMilikUser(item)) return;

      const kat = dapatkanKategoriDokumen(item);
      if (counts[kat] !== undefined) {
        counts[kat]++;
      }
    });
    return counts;
  }, [antreanList, isItemMilikUser]);

  const daftarFileTerfilter = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return antreanList.filter(item => {
      if (item.foto_ttd) return false;
      if (!isItemMilikUser(item)) return false;

      const namaDokumen = (item.nama_dokumen || '').toLowerCase();
      const namaArsipDisplay = (item.nama_arsip_display || '').toLowerCase();
      const cocokPencarian = namaDokumen.includes(lowerSearch) || namaArsipDisplay.includes(lowerSearch);
      if (!cocokPencarian) return false;

      return dapatkanKategoriDokumen(item) === activeTab;
    });
  }, [antreanList, searchTerm, activeTab, isItemMilikUser]);

  return (
    <div id="siap-cetak-wrapper" className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
        
        #siap-cetak-wrapper, #siap-cetak-wrapper * {
          font-family: 'Poppins', sans-serif !important;
        }

        @keyframes animGoyang {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.01); }
        }
        
        .efek-goyang {
          animation: animGoyang 1.6s ease-in-out infinite !important;
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col px-8 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          <section className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Antrean <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">Proses Berkas</span>
              </h1>
            </div>

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

          <section className="bg-white p-2.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50">
            <div className="grid grid-cols-5 gap-2 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 w-full">
              {[
                { id: 'ba_penyerahan', label: 'BA Penyerahan', icon: '🤝', pingColor: 'bg-sky-400', badgeColor: 'bg-sky-500 text-white' },
                { id: 'ba_kerusakan', label: 'BA Kerusakan', icon: '⚠️', pingColor: 'bg-sky-400', badgeColor: 'bg-sky-500 text-white' },
                { id: 'surat_tugas', label: 'Surat Tugas', icon: '💼', pingColor: 'bg-blue-400', badgeColor: 'bg-blue-600 text-white' },
                { id: 'tor_barang', label: 'TOR Barang', icon: '📦', pingColor: 'bg-sky-400', badgeColor: 'bg-sky-600 text-white' },
                { id: 'tor_jasa', label: 'TOR Jasa', icon: '🛠️', pingColor: 'bg-blue-500', badgeColor: 'bg-blue-700 text-white' }
              ].map((tab) => {
                const count = tabCounts[tab.id] || 0;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2.5 px-2 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative active:scale-95 ${
                      isActive 
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/60 scale-[1.02]' 
                        : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50/60'
                    }`}
                  >
                    <span className="truncate">{tab.icon} {tab.label}</span>

                    {count > 0 && (
                      <span className="relative flex h-4 w-4 items-center justify-center flex-shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tab.pingColor} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-4 w-4 ${isActive ? 'bg-white text-blue-600' : tab.badgeColor} text-[10px] font-black items-center justify-center shadow-xs`}>
                          {count}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {loading ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-16 text-center space-y-4 shadow-xs animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-600 font-bold text-xs">Sedang memilah berkas dari database...</p>
            </div>
          ) : daftarFileTerfilter.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-16 text-center space-y-3 shadow-xs">
              <div className="text-4xl">📦</div>
              <p className="text-slate-500 font-bold text-sm">Tab dokumen ini sedang kosong!</p>
              <p className="text-xs text-slate-400">Tidak ada data antrean aktif yang terdeteksi untuk kategori ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-6 py-1 flex items-center justify-between text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
                <span>Detail Nama Berkas</span>
                <span>Aksi Edit, Cetak & Finalisasi</span>
              </div>

              <div className="space-y-2">
                {daftarFileTerfilter.map((file) => {
                  const namaTampilan = file.nama_arsip_display || file.nama_dokumen;
                  const isPrinted = Boolean(file.tanggal_cetak);
                  const isNew = isItemHighlighted(file);

                  const namaItem = dapatkanValueSakti(file, 'ITEM') || dapatkanValueSakti(file, 'NO_ITEM');
                  const namaAlat = dapatkanValueSakti(file, 'NAMA_ALAT') || dapatkanValueSakti(file, 'NAMA_BARANG') || dapatkanValueSakti(file, 'ITEM');
                  const namaJasaOrKegiatan = dapatkanValueSakti(file, 'NAMA_JASA') || dapatkanValueSakti(file, 'JASA') || dapatkanValueSakti(file, 'KEGIATAN') || dapatkanValueSakti(file, 'NAMA_KEGIATAN') || dapatkanValueSakti(file, 'PEKERJAAN') || dapatkanValueSakti(file, 'PENGADAAN');
                  const tglBerangkatInput = dapatkanValueSakti(file, 'TANGGAL_BERANGKAT') || dapatkanValueSakti(file, 'TGL_BERANGKAT') || dapatkanValueSakti(file, 'TANGGAL') || file.tgl_berangkat || file.tanggal_berangkat;

                  return (
                    <div 
                      key={file.id}
                      ref={isNew ? highlightedRef : null}
                      id={`doc-row-${file.id}`}
                      className={`rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-500 cursor-pointer ${
                        isNew 
                          ? 'efek-goyang border-2 border-sky-500 bg-gradient-to-r from-sky-50 via-blue-50 to-sky-50 shadow-lg shadow-sky-200/80 ring-4 ring-sky-200/60' 
                          : 'bg-white border border-sky-100/80 hover:border-sky-300 hover:scale-[1.015] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all ${
                          isNew 
                            ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md border border-sky-300' 
                            : 'bg-sky-50 border border-sky-100'
                        }`}>
                          📄
                        </div>
                        
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[440px]" title={namaTampilan}>
                              {namaTampilan}
                            </p>

                            {isNew && (
                              <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                                BARU
                              </span>
                            )}
                          </div>

                          {activeTab === 'surat_tugas' && (
                            <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-1">
                              📅 Berangkat: {formatTanggalIndo(tglBerangkatInput || file.created_at)}
                            </p>
                          )}

                          {activeTab === 'ba_penyerahan' && (
                            <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                              <span>📦 Item: {namaItem || <span className="italic text-slate-400">[Tidak ada nama item]</span>}</span>
                            </p>
                          )}

                          {activeTab === 'ba_kerusakan' && (
                            <p className="text-[10px] text-sky-700 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                              <span>⚠️ Alat: {namaAlat || <span className="italic text-slate-400">[Tidak ada nama alat]</span>}</span>
                            </p>
                          )}

                          {activeTab === 'tor_barang' && (
                            <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                              <span>📦 Barang: {namaItem || namaAlat || <span className="italic text-slate-400">[Tidak ada nama barang]</span>}</span>
                            </p>
                          )}

                          {activeTab === 'tor_jasa' && (
                            <p className="text-[10px] text-blue-600 font-semibold flex items-center gap-2 truncate max-w-[480px]">
                              <span>🛠️ Kegiatan/Jasa: {namaJasaOrKegiatan || <span className="italic text-slate-400">[Tidak ada detail nama jasa]</span>}</span>
                            </p>
                          )}

                          {file.tanggal_cetak && (
                            <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                              🖨️ Tanggal Cetak Terakhir: {formatTanggalIndo(file.tanggal_cetak)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2.5">
                        {/* ✏️ TOMBOL EDIT BERTEMA GRADASI SKY-BLUE */}
                        <button
                          type="button"
                          onClick={() => handleEditAction(file)}
                          title="Edit/Revisi data berkas ini"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-200/60"
                        >
                          ✏️ EDIT
                        </button>

                        <span className="text-sky-200 text-sm font-light select-none">|</span>

                        <button 
                          type="button"
                          disabled={printingId === file.id}
                          onClick={() => handlePrintAction(file.id, namaTampilan)} 
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            printingId === file.id 
                              ? 'bg-slate-400 text-white cursor-not-allowed animate-pulse' 
                              : 'bg-slate-800 text-white hover:bg-slate-900'
                          }`}
                        >
                          {printingId === file.id ? '⏳ MEMPROSES PDF...' : '🖨️ PRINT FISIK'}
                        </button>

                        <span className="text-sky-200 text-sm font-light select-none">|</span>

                        <button
                          type="button"
                          disabled={!isPrinted || completingId === file.id}
                          onClick={() => handleSelesaiTanpaTtd(file)}
                          title={!isPrinted ? "Cetak/Print dokumen fisik terlebih dahulu!" : "Selesaikan dokumen"}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-xs whitespace-nowrap flex items-center gap-1 ${
                            isPrinted && completingId !== file.id
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-pointer'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 border border-slate-300'
                          }`}
                        >
                          {completingId === file.id ? '⏳ MEMPROSES...' : '✅ SELESAI'}
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

export default SiapCetak;