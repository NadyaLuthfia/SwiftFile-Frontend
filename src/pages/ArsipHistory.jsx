import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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

// Helper kecil cek pengadaan barang
const meGat = (item) => Boolean(dapatkanValueSakti(item, 'PENGADAAN'));

// HELPER PENCARIAN PRESISI DENGAN FILTER KATA BAWAAN KETAT
const dapatkanTeksCariPresisi = (item) => {
  if (!item) return '';

  const kataBawaan = /ba|penyerahan|kerusakan|surat|tugas|tor|barang|jasa|btg|viii|2026|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember/gi;

  const namaDoc = String(item.nama_dokumen || '').replace(kataBawaan, '').trim();
  const nomorDoc = String(item.nomor_dokumen || item.no_dokumen || item.nomor || '').replace(kataBawaan, '').trim();

  const itemVal = dapatkanValueSakti(item, 'ITEM') || dapatkanValueSakti(item, 'NO_ITEM') || dapatkanValueSakti(item, 'NAMA_BARANG') || '';
  const alatVal = dapatkanValueSakti(item, 'NAMA_ALAT') || dapatkanValueSakti(item, 'ALAT') || '';
  const pekerjaVal = dapatkanValueSakti(item, 'PEKERJA') || dapatkanValueSakti(item, 'NAMA_PEKERJA') || dapatkanValueSakti(item, 'PETUGAS') || dapatkanValueSakti(item, 'NAMA_PETUGAS') || '';
  const lokasiVal = dapatkanValueSakti(item, 'LOKASI') || dapatkanValueSakti(item, 'TEMPAT') || dapatkanValueSakti(item, 'TUJUAN') || dapatkanValueSakti(item, 'LOKASI_PEKERJAAN') || '';
  const pengadaanVal = dapatkanValueSakti(item, 'PENGADAAN') || '';
  const pekerjaanVal = dapatkanValueSakti(item, 'NAMA_PEKERJAAN') || dapatkanValueSakti(item, 'PEKERJAAN') || dapatkanValueSakti(item, 'KEGIATAN') || '';

  return `${namaDoc} ${nomorDoc} ${itemVal} ${alatVal} ${pekerjaVal} ${lokasiVal} ${pengadaanVal} ${pekerjaanVal}`.toLowerCase();
};

// HELPER PINTAR KATEGORI: Deteksi akurat 5 jenis dokumen
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

// HELPER PEMBANDING HIGHLIGHT SAKTI
const cekApakahHighlighted = (file, target) => {
  if (!target || !file) return false;
  if (file === target) return true;

  const fileNama = String(file.nama_dokumen || file.nomor_dokumen || '').toLowerCase().trim();
  const targetNama = String(target.nama_dokumen || target.nomor_dokumen || target.nomor || '').toLowerCase().trim();

  if (fileNama && targetNama && fileNama === targetNama) return true;

  const listKeyID = ['id', 'dokumen_id', 'id_dokumen', 'arsip_id', 'id_arsip', 'id_history', 'history_id', 'id_cetak'];
  
  return listKeyID.some(key => 
    file[key] !== undefined && 
    file[key] !== null && 
    target[key] !== undefined && 
    target[key] !== null && 
    String(file[key]).trim() === String(target[key]).trim()
  );
};

// HELPER FORMAT TANGGAL
const formatTanggalIndo = (dateString) => {
  if (!dateString) return null;
  const safeDateString = String(dateString).replace(' ', 'T'); 
  const date = new Date(safeDateString);
  if (isNaN(date.getTime())) return String(dateString);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// ================= SUB-KOMPONEN BARIS DOKUMEN =================
const ArsipRow = React.memo(({ file, printingId, onCetakLagi, onToggleAktif, onBukaModal, activeTab, isHighlighted, highlightedRef, userRole }) => {
  const isAktif = String(file.status_aktif) !== '0' && file.status_aktif !== 0 && file.status_aktif !== false;

  const namaItem = dapatkanValueSakti(file, 'ITEM') || dapatkanValueSakti(file, 'NO_ITEM') || dapatkanValueSakti(file, 'NAMA_BARANG');
  const namaAlat = dapatkanValueSakti(file, 'NAMA_ALAT') || dapatkanValueSakti(file, 'ALAT') || dapatkanValueSakti(file, 'NAMA_BARANG') || dapatkanValueSakti(file, 'ITEM');
  
  const namaPekerja = dapatkanValueSakti(file, 'PEKERJA') || dapatkanValueSakti(file, 'NAMA_PEKERJA') || dapatkanValueSakti(file, 'PETUGAS') || dapatkanValueSakti(file, 'NAMA_PETUGAS') || dapatkanValueSakti(file, 'NAMA');
  const lokasi = dapatkanValueSakti(file, 'LOKASI') || dapatkanValueSakti(file, 'TEMPAT') || dapatkanValueSakti(file, 'TUJUAN') || dapatkanValueSakti(file, 'LOKASI_PEKERJAAN') || dapatkanValueSakti(file, 'LOKASI_TUGAS');

  const pengadaan = dapatkanValueSakti(file, 'PENGADAAN') || dapatkanValueSakti(file, 'NAMA_DRAFT') || dapatkanValueSakti(file, 'NAMA_BARANG');
  const pekerjaanJasa = dapatkanValueSakti(file, 'NAMA_PEKERJAAN') || dapatkanValueSakti(file, 'PEKERJAAN') || dapatkanValueSakti(file, 'KEGIATAN') || dapatkanValueSakti(file, 'NAMA_JASA') || dapatkanValueSakti(file, 'JASA') || dapatkanValueSakti(file, 'NAMA_DRAFT');

  // Khusus Master Admin yang dapat mengakses tombol toggle aktif/nonaktif
  const isMasterAdmin = userRole === 'master_admin';

  return (
    <div 
      ref={isHighlighted ? highlightedRef : null}
      id={`doc-row-${file.id || file.id_dokumen || file.dokumen_id}`}
      className={`grid grid-cols-12 items-center px-6 py-3.5 rounded-2xl transition-all duration-300 transform group cursor-default ${
        isHighlighted 
          ? 'bg-emerald-50/95 border-2 border-emerald-500 shadow-xl shadow-emerald-200/60 animate-melayang-pelan scale-[1.01] ring-4 ring-emerald-300/40 relative z-10' 
          : 'bg-white hover:bg-sky-50/30 border border-sky-100/80 hover:border-sky-300 shadow-xs hover:shadow-lg hover:shadow-sky-100/80 hover:scale-[1.01] hover:-translate-y-0.5'
      }`}
    >
      <div className={`${isMasterAdmin ? 'col-span-5' : 'col-span-7'} flex items-center gap-3.5`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border transition-colors ${
          isHighlighted ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 border-sky-100 group-hover:scale-110'
        }`}>
          📄
        </div>
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <p 
              className={`font-bold transition-colors cursor-pointer text-xs truncate ${
                isHighlighted ? 'text-emerald-950 font-black' : 'text-slate-800 group-hover:text-sky-600'
              }`} 
              onClick={() => onBukaModal(file)}
              title={file.nama_dokumen}
            >
              {file.nama_dokumen}
            </p>

            {isHighlighted && (
              <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse shrink-0">
                SOROTAN
              </span>
            )}
          </div>
          
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

          {activeTab === 'tor_barang' && (
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1 truncate max-w-[320px]">
              <span>📦 Pengadaan: {pengadaan || <span className="italic text-slate-400">[Tidak ada detail pengadaan]</span>}</span>
            </p>
          )}

          {activeTab === 'tor_jasa' && (
            <p className="text-[10px] text-teal-600 font-semibold mt-0.5 flex items-center gap-1 truncate max-w-[320px]">
              <span>🛠️ Pekerjaan/Jasa: {pekerjaanJasa || <span className="italic text-slate-400">[Tidak ada detail pekerjaan]</span>}</span>
            </p>
          )}

          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1 truncate max-w-[320px]">
            <span>🖨️ Cetak Terakhir: {file.tanggal_cetak ? formatTanggalIndo(file.tanggal_cetak) : <span className="italic text-slate-400 font-normal">Belum pernah dicetak</span>}</span>
          </p>
        </div>
      </div>

      <div className="col-span-5 flex items-center justify-center gap-2">
        {isAktif ? (
          <button 
            type="button"
            disabled={printingId === (file.id || file.id_dokumen)}
            onClick={() => onCetakLagi(file.id || file.id_dokumen, 1, 'All')} 
            className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 select-none active:scale-95 transform hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            {printingId === (file.id || file.id_dokumen) ? 'Mengonversi PDF...' : '🖨️ CETAK FISIK'}
          </button>
        ) : (
          <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 uppercase tracking-wider">
            🚫 Dokumen Nonaktif
          </span>
        )}
      </div>

      {isMasterAdmin && (
        <div className="col-span-2 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleAktif(file)}
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
      )}

    </div>
  );
});

// ================= KOMPONEN UTAMA =================
function ArsipHistory() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [antreanList, setAntreanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState(null); 
  const [printingId, setPrintingId] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('ba_penyerahan'); 

  // STATE SUB-TAB FILTER STATUS (Aktif / Nonaktif / Semua)
  const [filterStatus, setFilterStatus] = useState('aktif');

  const [activeHighlight, setActiveHighlight] = useState(null);
  const highlightedRef = useRef(null);

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [dokumenTerpilih, setDokumenTerpilih] = useState(null);

  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);
  const [loadingToggle, setLoadingToggle] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
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

  // INFORMASI AKUN USER & ROLE
  const userRole = useMemo(() => {
    try {
      return localStorage.getItem('role') || JSON.parse(localStorage.getItem('user'))?.role || 'user';
    } catch (e) {
      return 'user';
    }
  }, []);

  const currentUserId = useMemo(() => {
    try {
      const userObj = JSON.parse(localStorage.getItem('user'));
      return userObj?.id || userObj?.user_id || localStorage.getItem('user_id') || null;
    } catch (e) {
      return localStorage.getItem('user_id') || null;
    }
  }, []);

  // 🔒 ATURAN KETAT ARSIP:
  // Siapa pun yang login (Pelapor, Penanggung Jawab, Mengetahui, mau pun Master Admin), 
  // di halaman Arsip HANYA BISA melihat dokumen yang dibuat oleh dirinya sendiri (user_id === currentUserId).
  // Master Admin memantau seluruh berkas secara terpisah di halaman Monitoring Data.
  const listSesuaiRole = useMemo(() => {
    const safeList = Array.isArray(antreanList) ? antreanList : [];
    if (!currentUserId) return safeList;

    return safeList.filter(item => {
      const itemUserId = 
        item.user_id || 
        item.created_by || 
        item.id_user || 
        item.pembuat_id || 
        item.user?.id ||
        dapatkanValueSakti(item, 'user_id') ||
        dapatkanValueSakti(item, 'created_by');

      return String(itemUserId) === String(currentUserId);
    });
  }, [antreanList, currentUserId]);

  const ambilDataHistory = useCallback(() => {
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/arsip-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      const dataArr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAntreanList(dataArr);
      setLoading(false);
    })
    .catch(err => {
      console.error("Gagal mengambil data history:", err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    ambilDataHistory();
  }, [ambilDataHistory]);

  // SESSION STORAGE HIGHLIGHT
  useEffect(() => {
    let rawHighlight = searchParams.get('highlight') || location.state?.highlightId || location.state?.highlight_id || location.state?.id;
    let rawNomor = location.state?.nomorDokumen || location.state?.namaDokumen;
    let targetTabNavigasi = searchParams.get('tab') || location.state?.targetTab || location.state?.activeTab || location.state?.tab || location.state?.kategori;

    if (!rawHighlight && !rawNomor && !targetTabNavigasi) {
      try {
        const savedHighlightStr = sessionStorage.getItem('active_arsip_highlight');
        if (savedHighlightStr) {
          const saved = JSON.parse(savedHighlightStr);
          if (saved && (Date.now() - (saved.timestamp || 0) < 5000)) {
            rawHighlight = saved.highlightId;
            rawNomor = saved.nomorDokumen;
            targetTabNavigasi = saved.targetTab;
          } else {
            sessionStorage.removeItem('active_arsip_highlight');
          }
        }
      } catch (e) {
        console.error("Gagal membaca sessionStorage highlight:", e);
      }
    } else if (rawHighlight || rawNomor) {
      try {
        sessionStorage.setItem('active_arsip_highlight', JSON.stringify({
          highlightId: rawHighlight,
          nomorDokumen: rawNomor,
          targetTab: targetTabNavigasi,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }

    let cleanId = null;
    if (rawHighlight) {
      cleanId = typeof rawHighlight === 'object' ? String(rawHighlight.id || rawHighlight.id_dokumen || rawHighlight) : String(rawHighlight);
    }

    if (targetTabNavigasi) {
      setActiveTab(targetTabNavigasi);
    }

    if (cleanId || rawNomor) {
      setActiveHighlight({
        id: cleanId,
        nomor: rawNomor ? String(rawNomor).trim() : null,
        tab: targetTabNavigasi || null
      });

      const timerHighlight = setTimeout(() => {
        setActiveHighlight(null);
        sessionStorage.removeItem('active_arsip_highlight');
      }, 5000);

      return () => clearTimeout(timerHighlight);
    }
  }, [location, searchParams]);

  // ALGORITMA HIGHLIGHT PRESISI
  const targetHighlightItem = useMemo(() => {
    if (!activeHighlight || listSesuaiRole.length === 0) return null;

    const targetId = activeHighlight.id;
    const targetNomor = activeHighlight.nomor ? activeHighlight.nomor.toLowerCase().trim() : '';
    const preferredTab = activeHighlight.tab || activeTab;

    let listDokumenTarget = listSesuaiRole;
    if (preferredTab) {
      const itemDalamTab = listSesuaiRole.filter(f => dapatkanKategoriDokumen(f) === preferredTab);
      if (itemDalamTab.length > 0) {
        listDokumenTarget = itemDalamTab;
      }
    }

    const cariDokumen = (daftar) => {
      if (targetNomor) {
        const matchExact = daftar.find(f => {
          const nomDoc = String(f.nama_dokumen || f.nomor_dokumen || f.no_dokumen || '').toLowerCase().trim();
          return nomDoc && nomDoc === targetNomor;
        });
        if (matchExact) return matchExact;
      }

      if (targetId) {
        const listKeyID = ['dokumen_id', 'arsip_id', 'id_dokumen', 'id_arsip', 'id', 'id_history', 'history_id', 'id_cetak'];
        
        const matchById = daftar.find(f => 
          listKeyID.some(key => f[key] !== undefined && f[key] !== null && String(f[key]).trim() === String(targetId).trim())
        );
        if (matchById) return matchById;
      }

      if (targetNomor && targetNomor.length > 5) {
        const kataKategoriUmum = ['ba penyerahan', 'ba kerusakan', 'surat tugas', 'tor barang', 'tor jasa'];
        if (!kataKategoriUmum.includes(targetNomor)) {
          const matchPartial = daftar.find(f => {
            const nomDoc = String(f.nama_dokumen || f.nomor_dokumen || f.no_dokumen || '').toLowerCase().trim();
            return nomDoc && (nomDoc.includes(targetNomor) || targetNomor.includes(nomDoc));
          });
          if (matchPartial) return matchPartial;
        }
      }

      return null;
    };

    let hasil = cariDokumen(listDokumenTarget);
    if (!hasil && listDokumenTarget !== listSesuaiRole) {
      hasil = cariDokumen(listSesuaiRole);
    }

    return hasil;
  }, [activeHighlight, listSesuaiRole, activeTab]);

  // DETEKSI OTOMATIS: DOKUMEN NONAKTIF
  const hasNonaktifArsip = useMemo(() => {
    return listSesuaiRole.some(item => String(item.status_aktif) === '0' || item.status_aktif === 0 || item.status_aktif === false);
  }, [listSesuaiRole]);

  // HITUNG JUMLAH STATUS UNTUK SUB-TAB BUTTONS
  const countAktif = useMemo(() => listSesuaiRole.filter(item => String(item.status_aktif) !== '0' && item.status_aktif !== 0 && item.status_aktif !== false).length, [listSesuaiRole]);
  const countNonaktif = useMemo(() => listSesuaiRole.filter(item => String(item.status_aktif) === '0' || item.status_aktif === 0 || item.status_aktif === false).length, [listSesuaiRole]);

  // FILTERING STATUS AKTIF/NONAKTIF & PENCARIAN
  const dataTerfilter = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    return listSesuaiRole.filter(item => {
      const isAktif = String(item.status_aktif) !== '0' && item.status_aktif !== 0 && item.status_aktif !== false;

      if (hasNonaktifArsip) {
        if (filterStatus === 'aktif' && !isAktif) return false;
        if (filterStatus === 'nonaktif' && isAktif) return false;
      }

      if (!lowerSearch) return true;

      const teksGabungan = dapatkanTeksCariPresisi(item);
      return teksGabungan.includes(lowerSearch);
    });
  }, [listSesuaiRole, searchTerm, filterStatus, hasNonaktifArsip]);

  useEffect(() => {
    if (targetHighlightItem) {
      const katDokumen = dapatkanKategoriDokumen(targetHighlightItem);
      if (katDokumen && katDokumen !== activeTab) {
        setActiveTab(katDokumen);
      }
    }
  }, [targetHighlightItem]);

  useEffect(() => {
    if (targetHighlightItem && highlightedRef.current) {
      const scrollTimer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(scrollTimer);
    }
  }, [targetHighlightItem, activeTab]);

  const handleOpenToggleModal = useCallback((file) => {
    const isAktif = String(file.status_aktif) !== '0' && file.status_aktif !== 0 && file.status_aktif !== false;
    setItemToToggle({ id: file.id || file.id_dokumen, isAktif, nama: file.nama_dokumen });
    setIsToggleModalOpen(true);
  }, []);

  const executeToggleAktif = async () => {
    if (!itemToToggle) return;
    setLoadingToggle(true);

    const token = localStorage.getItem('token');

    try {
      await axios.post(`http://localhost:8000/api/arsip-history/${itemToToggle.id}/toggle-aktif`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const statusTeks = itemToToggle.isAktif ? 'dinonaktifkan' : 'diaktifkan kembali';
      setIsToggleModalOpen(false);
      setItemToToggle(null);

      showToast(`Dokumen berhasil ${statusTeks}.`, 'success');

      ambilDataHistory();
    } catch (err) {
      console.error("Gagal mengubah status aktif:", err);
      showToast('Gagal memperbarui status dokumen.', 'error');
    } finally {
      setLoadingToggle(false);
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
        showToast('Gagal mendapatkan link berkas dokumen.', 'info');
      }
      setDownloadingId(null);
    })
    .catch(err => {
      console.error("Gagal memproses berkas:", err);
      showToast('Terjadi kesalahan saat mengambil dokumen Word.', 'error');
      setDownloadingId(null);
    });
  };

  const handleCetakLagi = useCallback((id, rangkap = 1, halaman = 'All') => {
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
      if (res.data && res.data.pdf_url) {
        window.open(res.data.pdf_url, '_blank');
        ambilDataHistory(); 
      } else {
        showToast('Dokumen berhasil dikonversi, namun URL PDF tidak ditemukan.', 'info');
      }
      setPrintingId(null);
    })
    .catch(err => {
      console.error("Gagal melakukan cetak ulang / konversi PDF:", err);
      showToast('Terjadi kesalahan sistem saat mencoba mencetak dokumen.', 'error');
      setPrintingId(null);
    });
  }, [ambilDataHistory, showToast]);

  const totalPenyerahan = useMemo(() => dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === 'ba_penyerahan').length, [dataTerfilter]);
  const totalKerusakan = useMemo(() => dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === 'ba_kerusakan').length, [dataTerfilter]);
  const totalSuratTugas = useMemo(() => dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === 'surat_tugas').length, [dataTerfilter]);
  const totalTorBarang = useMemo(() => dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === 'tor_barang').length, [dataTerfilter]);
  const totalTorJasa = useMemo(() => dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === 'tor_jasa').length, [dataTerfilter]);

  const dataKategori = useMemo(() => {
    return dataTerfilter.filter(item => dapatkanKategoriDokumen(item) === activeTab);
  }, [dataTerfilter, activeTab]);

  const dataDitampilkan = useMemo(() => {
    return dataKategori;
  }, [dataKategori]);

  const bukaModalDetail = useCallback((dokumen) => {
    setDokumenTerpilih(dokumen);
    setModalTerbuka(true);
  }, []);

  const cekFotoTTD = (item) => {
    if (!item) return null;
    const namaDokumen = String(item.nama_dokumen || '').toLowerCase();
    if (namaDokumen.includes('tugas') || namaDokumen.includes('tor')) return null;

    return item.foto_ttd || (item.dokumen_cetak && item.dokumen_cetak.foto_ttd) || null;
  };

  // Pengecekan role khusus master_admin untuk kontrol antarmuka utama
  const isMasterAdmin = userRole === 'master_admin';

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <style>{`
        @keyframes melayangPelan {
          0%, 100% { 
            transform: translateY(0px); 
            border-color: #10b981; 
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25); 
          }
          50% { 
            transform: translateY(-5px); 
            border-color: #059669; 
            box-shadow: 0 10px 22px rgba(5, 150, 105, 0.35); 
          }
        }
        .animate-melayang-pelan {
          animation: melayangPelan 2.2s ease-in-out infinite !important;
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

      {notification.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${
              notification.type === 'success' 
                ? 'bg-emerald-100/90 text-emerald-600 border-emerald-200/60' 
                : notification.type === 'info'
                ? 'bg-sky-100/90 text-sky-600 border-sky-200/60'
                : 'bg-rose-100/90 text-rose-600 border-rose-200/60'
            }`}>
              {notification.type === 'success' ? (
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                  <path className="animate-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : notification.type === 'info' ? (
                <span className="text-2xl">ℹ</span>
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
                Arsip <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">& History Dokumen</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari nomor, item, alat, nama dokumen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-sky-100/90 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100/60 transition-all shadow-xs"
                />
              </div>
            </div>
          </section>

          {/* TOMBOL KATEGORI */}
          <section className="bg-white p-2.5 rounded-3xl border border-sky-100/80 shadow-sm shadow-sky-100/50 space-y-3">
            <div className="grid grid-cols-5 gap-2 bg-[#F4F8FC] p-1.5 rounded-2xl border border-sky-100/60 w-full">
              {[
                { id: 'ba_penyerahan', label: 'BA Penyerahan', icon: '🤝', count: totalPenyerahan, badgeColor: 'bg-sky-500 text-white' },
                { id: 'ba_kerusakan', label: 'BA Kerusakan', icon: '⚠️', count: totalKerusakan, badgeColor: 'bg-sky-500 text-white' },
                { id: 'surat_tugas', label: 'Surat Tugas', icon: '💼', count: totalSuratTugas, badgeColor: 'bg-blue-600 text-white' },
                { id: 'tor_barang', label: 'TOR Barang', icon: '📦', count: totalTorBarang, badgeColor: 'bg-sky-600 text-white' },
                { id: 'tor_jasa', label: 'TOR Jasa', icon: '🛠️', count: totalTorJasa, badgeColor: 'bg-blue-700 text-white' }
              ].map((tab) => {
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

                    {tab.count > 0 && (
                      <span className="relative flex h-4 w-4 items-center justify-center flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className={`relative inline-flex rounded-full h-4 w-4 ${isActive ? 'bg-white text-blue-600' : tab.badgeColor} text-[10px] font-black items-center justify-center shadow-xs`}>
                          {tab.count}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB FILTER STATUS DOKUMEN */}
            {hasNonaktifArsip && (
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit text-xs font-bold border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setFilterStatus('aktif')}
                  className={`px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    filterStatus === 'aktif'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🟢 Dokumen Aktif ({countAktif})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('nonaktif')}
                  className={`px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    filterStatus === 'nonaktif'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  🔴 Dokumen Nonaktif ({countNonaktif})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('semua')}
                  className={`px-4 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    filterStatus === 'semua'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  📋 Semua ({listSesuaiRole.length})
                </button>
              </div>
            )}
          </section>

          {dataDitampilkan.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-3 shadow-sm shadow-sky-100/50">
              <div className="text-4xl select-none">📭</div>
              <p className="text-slate-500 font-bold text-sm">
                Tidak ada dokumen {hasNonaktifArsip && filterStatus !== 'semua' ? filterStatus : ''} yang ditemukan
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sky-200/80 shadow-md shadow-sky-100/60 p-3 space-y-2">
              <div className="grid grid-cols-12 px-6 py-3 bg-[#F4F8FC] rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                <div className={isMasterAdmin ? "col-span-5" : "col-span-7"}>Detail Nama Berkas</div>
                <div className="col-span-5 text-center">Konfigurasi & Cetak Fisik</div>
                {isMasterAdmin && (
                  <div className="col-span-2 text-center">Aksi</div>
                )}
              </div>

              <div className="space-y-2.5">
                {dataDitampilkan.map((file, index) => {
                  const isHighlighted = cekApakahHighlighted(file, targetHighlightItem);

                  return (
                    <ArsipRow 
                      key={file.id || file.id_dokumen || file.dokumen_id || `baris-${index}`}
                      file={file}
                      printingId={printingId}
                      onCetakLagi={handleCetakLagi}
                      onToggleAktif={handleOpenToggleModal}
                      onBukaModal={bukaModalDetail}
                      activeTab={activeTab}
                      isHighlighted={isHighlighted}
                      highlightedRef={isHighlighted ? highlightedRef : null}
                      userRole={userRole}
                    />
                  );
                })}
              </div>

            </div>
          )}
        </div>
      </main>

      {modalTerbuka && dokumenTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-5 animate-pop">
            
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
                <span className="col-span-2 text-slate-800 font-bold">#{dokumenTerpilih.id || dokumenTerpilih.id_dokumen || dokumenTerpilih.dokumen_id}</span>
              </div>
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">Template ID</span>
                <span className="col-span-2 text-slate-800 font-bold">#{dokumenTerpilih.template_id || '-'}</span>
              </div>

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
                    disabled={downloadingId === (dokumenTerpilih.id || dokumenTerpilih.id_dokumen)}
                    onClick={() => handleDownloadAtauLihat(dokumenTerpilih.id || dokumenTerpilih.id_dokumen)}
                    className="flex items-center gap-1.5 border border-sky-200/80 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs select-none"
                  >
                    📥 {downloadingId === (dokumenTerpilih.id || dokumenTerpilih.id_dokumen) ? 'Mengunduh...' : 'Unduh Dokumen Word'}
                  </button>
                </div>
              </div>

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

      {isToggleModalOpen && itemToToggle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 w-full max-w-xs overflow-hidden p-6 text-center space-y-4 animate-pop relative">
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner border ${
              itemToToggle.isAktif 
                ? 'bg-gradient-to-tr from-rose-100 to-amber-100 text-rose-500 border-rose-200/60' 
                : 'bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-600 border-emerald-200/60'
            }`}>
              {itemToToggle.isAktif ? '🚫' : '✓'}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                {itemToToggle.isAktif ? 'Nonaktifkan Dokumen?' : 'Aktifkan Kembali?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin {itemToToggle.isAktif ? 'menonaktifkan' : 'mengaktifkan kembali'} <br />
                <span className="font-bold text-slate-700">"{itemToToggle.nama}"</span>?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsToggleModalOpen(false);
                  setItemToToggle(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={executeToggleAktif}
                disabled={loadingToggle}
                className={`flex-1 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                  itemToToggle.isAktif 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-200' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200'
                }`}
              >
                {loadingToggle ? "Memproses..." : itemToToggle.isAktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ArsipHistory;