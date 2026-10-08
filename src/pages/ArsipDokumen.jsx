import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios'; 

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

const meGat = (item) => Boolean(dapatkanValueSakti(item, 'PENGADAAN'));

const dapatkanTeksCariPresisi = (item) => {
  if (!item) return '';
  const kataBawaan = /ba|penyerahan|kerusakan|surat|tugas|tor|barang|jasa|btg|viii|2026|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember/gi;

  const namaDoc = String(item.nama_dokumen || '').replace(kataBawaan, '').trim();
  const nomorDoc = String(item.nomor_dokumen || item.no_dokumen || item.nomor || '').replace(kataBawaan, '').trim();

  const pembuatVal = item.user?.name || item.pembuat || dapatkanValueSakti(item, 'PEMBUAT') || '';
  const itemVal = dapatkanValueSakti(item, 'ITEM') || dapatkanValueSakti(item, 'NO_ITEM') || dapatkanValueSakti(item, 'NAMA_BARANG') || '';
  const alatVal = dapatkanValueSakti(item, 'NAMA_ALAT') || dapatkanValueSakti(item, 'ALAT') || '';
  const pekerjaVal = dapatkanValueSakti(item, 'PEKERJA') || dapatkanValueSakti(item, 'NAMA_PEKERJA') || dapatkanValueSakti(item, 'PETUGAS') || dapatkanValueSakti(item, 'NAMA_PETUGAS') || '';
  const lokasiVal = dapatkanValueSakti(item, 'LOKASI') || dapatkanValueSakti(item, 'TEMPAT') || dapatkanValueSakti(item, 'TUJUAN') || dapatkanValueSakti(item, 'LOKASI_PEKERJAAN') || '';
  const pengadaanVal = dapatkanValueSakti(item, 'PENGADAAN') || '';
  const pekerjaanVal = dapatkanValueSakti(item, 'NAMA_PEKERJAAN') || dapatkanValueSakti(item, 'PEKERJAAN') || dapatkanValueSakti(item, 'KEGIATAN') || '';

  return `${namaDoc} ${nomorDoc} ${pembuatVal} ${itemVal} ${alatVal} ${pekerjaVal} ${lokasiVal} ${pengadaanVal} ${pekerjaanVal}`.toLowerCase();
};

const dapatkanKategoriDokumen = (item) => {
  if (!item) return 'ba_penyerahan';

  const katEksplisit = String(item.kategori || item.jenis_dokumen || item.tipe_dokumen || item.tipe || '').toLowerCase();
  if (katEksplisit.includes('tor_jasa') || katEksplisit === 'jasa') return 'tor_jasa';
  if (katEksplisit.includes('tor_barang') || katEksplisit === 'barang') return 'tor_barang';
  if (katEksplisit.includes('ba_kerusakan') || katEksplisit === 'kerusakan') return 'ba_kerusakan';
  if (katEksplisit.includes('ba_penyerahan') || katEksplisit === 'penyerahan') return 'ba_penyerahan';
  if (katEksplisit.includes('surat_tugas') || katEksplisit === 'tugas') return 'surat_tugas';

  const namaDoc = String(item.nama_dokumen || '');
  const nomorDoc = String(item.nomor_dokumen || item.no_dokumen || item.nomor || '');
  const pekerjaanVal = String(dapatkanValueSakti(item, 'NAMA_PEKERJAAN') || dapatkanValueSakti(item, 'PEKERJAAN') || dapatkanValueSakti(item, 'KEGIATAN') || dapatkanValueSakti(item, 'JASA') || '');

  const teks = `${namaDoc} ${nomorDoc} ${pekerjaanVal}`.toLowerCase();

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

const formatTanggalIndo = (dateString) => {
  if (!dateString) return null;
  const safeDateString = String(dateString).replace(' ', 'T'); 
  const date = new Date(safeDateString);
  if (isNaN(date.getTime())) return String(dateString);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const ArsipRowAll = React.memo(({ file, isLoadingPreview, onPreview, onEdit, onBukaModal }) => {
  const pembuatName = file.user?.name || file.pembuat || 'User';

  return (
    <div className="grid grid-cols-12 items-center px-6 py-3.5 bg-white hover:bg-sky-50/30 border border-sky-100/80 hover:border-sky-300 rounded-2xl transition-all shadow-xs hover:shadow-lg">
      <div className="col-span-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 flex items-center justify-center text-lg shrink-0 border border-sky-100">
          📄
        </div>
        <div className="min-w-0 pr-2">
          <p className="font-bold text-slate-800 hover:text-sky-600 text-xs truncate cursor-pointer" onClick={() => onBukaModal(file)}>
            {file.nama_dokumen}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="bg-sky-100 text-sky-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
              👤 Pembuat: {pembuatName}
            </span>
          </div>

          {/* TANGGAL CETAK TERAKHIR */}
          {file.tanggal_cetak && (
            <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              🖨️ Tanggal Cetak Terakhir: {formatTanggalIndo(file.tanggal_cetak)}
            </p>
          )}
        </div>
      </div>

      <div className="col-span-5 flex items-center justify-center gap-2">
        <button 
          type="button"
          disabled={isLoadingPreview === (file.id || file.id_dokumen)}
          onClick={() => onPreview(file.id || file.id_dokumen)} 
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 select-none active:scale-95 transform hover:-translate-y-0.5 flex items-center gap-1.5"
        >
          {isLoadingPreview === (file.id || file.id_dokumen) ? '⏳ MEMUAT PREVIEW...' : '👁️ PREVIEW'}
        </button>
      </div>

      <div className="col-span-2 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onEdit(file)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer bg-amber-500 hover:bg-amber-600 text-white"
        >
          ✏ EDIT
        </button>
      </div>
    </div>
  );
});

function ArsipDokumen() {
  const [antreanList, setAntreanList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Preview
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [modalPreviewTerbuka, setModalPreviewTerbuka] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(null);
  
  const [activeTab, setActiveTab] = useState('ba_penyerahan'); 

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [dokumenTerpilih, setDokumenTerpilih] = useState(null);

  // Router Navigate (opsional untuk redirect halaman edit)
  const navigate = useNavigate();

  // State Notification/Toast
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    
    setNotification({ show: true, message: String(message), type });
    toastTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const userRole = localStorage.getItem('role') || 'admin';

  // 🌐 MENGAMBIL SELURUH DATA TANPA FILTER USER_ID
  const ambilDataHistoryGlobal = useCallback(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:8000/api/arsip-dokumen`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      const dataArr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAntreanList(dataArr);
    })
    .catch(err => console.error("Gagal mengambil arsip global:", err));
  }, []);

  useEffect(() => {
    ambilDataHistoryGlobal();
  }, [ambilDataHistoryGlobal]);

  const dataTerfilter = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    return antreanList.filter(item => {
      if (!lowerSearch) return true;
      return dapatkanTeksCariPresisi(item).includes(lowerSearch);
    });
  }, [antreanList, searchTerm]);

  const dataKategori = useMemo(() => {
    return dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === activeTab);
  }, [dataTerfilter, activeTab]);

  const handlePreviewDokumen = useCallback((id) => {
    setIsLoadingPreview(id);
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/arsip-history/${id}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      if (res.data && res.data.pdf_url) {
        setPreviewPdfUrl(res.data.pdf_url);
        setModalPreviewTerbuka(true);
      } else {
        showToast('Dokumen berhasil disiapkan, namun URL tidak ditemukan.', 'info');
      }
      setIsLoadingPreview(null);
    })
    .catch(err => {
      console.error("Gagal memuat preview PDF:", err);
      showToast('Terjadi kesalahan sistem saat mencoba memuat preview dokumen.', 'error');
      setIsLoadingPreview(null);
    });
  }, [showToast]);

  // ✏️ FUNGSI NAVIGASI UNTUK KLIK TOMBOL EDIT ARSIP
  const handleEditDokumen = (file) => {
    // TENTUKAN TARGET ROUTE
    const namaDoc = (file.nama_dokumen || '').toLowerCase();
    const jenisDoc = (file.jenis_dokumen || file.kategori || file.tipe_dokumen || '').toLowerCase();
    
    let targetRoute = '/draft-penyerahan'; // Default fallback
    
    if (namaDoc.includes('kerusakan') || jenisDoc.includes('kerusakan')) {
        targetRoute = '/draft-kerusakan';
    } else if (namaDoc.includes('surat tugas') || jenisDoc.includes('surat tugas')) {
        targetRoute = '/draft-surat-tugas';
    } else if (namaDoc.includes('tor barang') || jenisDoc.includes('tor barang')) {
        targetRoute = '/draft-tor-barang';
    } else if (namaDoc.includes('tor jasa') || jenisDoc.includes('tor jasa')) {
        targetRoute = '/draft-tor-jasa';
    } else if (namaDoc.includes('penyerahan') || jenisDoc.includes('penyerahan')) {
        targetRoute = '/draft-penyerahan';
    }

    // Ambil ID dengan aman (id atau id_dokumen)
    const targetId = file.id || file.id_dokumen;

    // KITA HANYA MENGIRIM ID MELALUI URL 
    navigate(`${targetRoute}?arsip_id=${targetId}`);
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      <style>{`
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

      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${
              notification.type === 'success' ? 'bg-emerald-100/90 text-emerald-600 border-emerald-200/60' : 
              notification.type === 'info' ? 'bg-sky-100/90 text-sky-600 border-sky-200/60' : 'bg-rose-100/90 text-rose-600 border-rose-200/60'
            }`}>
              {notification.type === 'success' ? (
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                  <path className="animate-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : notification.type === 'info' ? (
                <span className="text-2xl">💡</span>
              ) : (
                <span className="text-2xl">⚠</span>
              )}
            </div>
            <div className="space-y-1.5 pb-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {notification.type === 'success' ? 'Berhasil' : notification.type === 'info' ? 'Informasi' : 'Peringatan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          <section className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Arsip <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">Dokumen</span>
              </h1>
            </div>

            <div className="relative w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sky-400 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Cari pembuat, nomor, nama dokumen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-sky-100 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:border-sky-400 shadow-xs"
              />
            </div>
          </section>

          {/* TAB KATEGORI */}
          <section className="bg-white p-2.5 rounded-3xl border border-sky-100/80 shadow-sm space-y-3">
            <div className="grid grid-cols-5 gap-2 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 w-full">
              {[
                { id: 'ba_penyerahan', label: 'BA Penyerahan', icon: '🤝' },
                { id: 'ba_kerusakan', label: 'BA Kerusakan', icon: '⚠️' },
                { id: 'surat_tugas', label: 'Surat Tugas', icon: '💼' },
                { id: 'tor_barang', label: 'TOR Barang', icon: '📦' },
                { id: 'tor_jasa', label: 'TOR Jasa', icon: '🛠️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-sky-50'
                  }`}
                >
                  <span>{tab.icon} {tab.label}</span>
                </button>
              ))}
            </div>
          </section>

          {dataKategori.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100 p-20 text-center space-y-3">
              <div className="text-4xl">📭</div>
              <p className="text-slate-500 font-bold text-sm">Tidak ada dokumen tersimpan di arsip global</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md p-3 space-y-2">
              <div className="grid grid-cols-12 px-6 py-3 bg-[#F4F8FC] rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase">
                <div className="col-span-5">Detail Berkas & Pembuat</div>
                <div className="col-span-5 text-center">Pratinjau Dokumen</div>
                <div className="col-span-2 text-center">Aksi</div>
              </div>

              <div className="space-y-2.5">
                {dataKategori.map((file, index) => (
                  <ArsipRowAll 
                    key={file.id || file.id_dokumen || `baris-all-${index}`}
                    file={file}
                    isLoadingPreview={isLoadingPreview}
                    onPreview={handlePreviewDokumen}
                    onEdit={handleEditDokumen}
                    onBukaModal={(doc) => { setDokumenTerpilih(doc); setModalTerbuka(true); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PREVIEW DOKUMEN */}
      {modalPreviewTerbuka && previewPdfUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-sky-100 overflow-hidden animate-pop">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-sky-100 bg-[#F4F8FC]">
              <div className="flex items-center gap-3">
                <span className="bg-sky-100 text-sky-600 p-2 rounded-xl text-lg">📄</span>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Preview Dokumen</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Pratinjau langsung tanpa berpindah halaman</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.open(previewPdfUrl, '_blank')}
                  className="text-[11px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors border border-sky-100"
                >
                  ↗ Cetak Dokumen
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setModalPreviewTerbuka(false);
                    setPreviewPdfUrl(null);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer select-none"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200/50 p-2">
              <iframe 
                src={`${previewPdfUrl}#toolbar=0`} 
                className="w-full h-full rounded-2xl border border-slate-200 shadow-inner bg-white" 
                title="Preview Dokumen"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ArsipDokumen;