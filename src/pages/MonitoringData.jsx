import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

// HELPER FORMAT TANGGAL: Mengubah "2026-08-19 23:54:09" jadi "19 Agustus 2026"
const formatTanggalIndo = (dateString) => {
  if (!dateString) return null;
  const safeDateString = dateString.replace(' ', 'T'); 
  const date = new Date(safeDateString);
  
  if (isNaN(date.getTime())) return dateString;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

function MonitoringData() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // STATE UNTUK PRINTING & HIGHLIGHT GLOW
  const [printingId, setPrintingId] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const highlightedRef = useRef(null);

  // STATE UNTUK POP-UP MODAL RINCIAN DOKUMEN
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // STATE POP-UP MODAL REACT (NOTIFIKASI SUKSES, ERROR & KONFIRMASI HAPUS)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ title: '', message: '' });

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const BASE_URL = 'http://localhost:8000/api';

  const triggerSuccessModal = (title, message) => {
    setSuccessModalData({ title, message });
    setIsSuccessModalOpen(true);
    const timer = setTimeout(() => {
      setIsSuccessModalOpen(false);
    }, 1500);
    return () => clearTimeout(timer);
  };

  const triggerErrorModal = (title, message) => {
    setErrorModalData({ title, message });
    setIsErrorModalOpen(true);
    const timer = setTimeout(() => {
      setIsErrorModalOpen(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  const fetchAllFilesForMonitoring = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/monitoring-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.data && response.data.status === 'success') {
        setFileList(response.data.data || []);
      }
    } catch (error) {
      console.error("Gagal memuat data monitoring:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintFisik = async (id) => {
    setPrintingId(id);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(`${BASE_URL}/siap-cetak/${id}/cetak-lagi`, {
        copies: 1,
        pages: 'All'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
        triggerSuccessModal('Mencetak PDF', 'Dokumen siap dicetak dalam tab baru.');
        fetchAllFilesForMonitoring();
      } else {
        triggerErrorModal('URL Tidak Ditemukan', 'Dokumen berhasil diproses, namun URL PDF tidak ditemukan.');
      }
    } catch (error) {
      console.error("Gagal melakukan konversi PDF:", error);
      triggerErrorModal('Gagal Cetak', 'Terjadi kesalahan sistem saat mencoba mengonversi/mencetak dokumen.');
    } finally {
      setPrintingId(null);
    }
  };

  const handleLihatFile = (file) => {
    if (!file || !file.file_path) {
      triggerErrorModal('Berkas Tidak Ditemukan', 'Gagal mendapatkan path berkas dokumen.');
      return;
    }

    const pathFile = file.file_path;
    const urlLengkap = pathFile.startsWith('http') ? pathFile : `http://localhost:8000/${pathFile}`;
    
    window.open(urlLengkap, '_blank');
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${BASE_URL}/monitoring/${id}/toggle-status`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const isNowActive = String(response.data.new_status) === '1' || response.data.new_status === 1;
        setFileList(prevList => prevList.map(file => {
          if (file.id === id) {
            return { ...file, status_aktif: response.data.new_status };
          }
          return file;
        }));
        
        triggerSuccessModal('Status Diperbarui!', `Dokumen berhasil ${isNowActive ? 'diaktifkan kembali' : 'dinonaktifkan'}.`);
      }
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      triggerErrorModal('Gagal Status', 'Terjadi kesalahan saat mengubah status dokumen.');
    }
  };

  const handleOpenDeleteModal = (file) => {
    setItemToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteFile = async () => {
    if (!itemToDelete) return;
    setLoadingDelete(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${BASE_URL}/monitoring/${itemToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setFileList(prevList => prevList.filter(file => file.id !== itemToDelete.id));
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        triggerSuccessModal('Dokumen Dihapus!', 'Dokumen berhasil dihapus secara permanen.');
      } else {
        triggerErrorModal('Gagal Hapus', response.data.message || 'Kesalahan pada server saat menghapus dokumen.');
      }
    } catch (error) {
      console.error("Gagal menghapus dokumen:", error);
      triggerErrorModal('Gagal Sistem', 'Terjadi kesalahan saat menghapus dokumen.');
    } finally {
      setLoadingDelete(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setUserRole(role || '');

    if (!token) {
      navigate('/login');
      return;
    }

    if (role === 'user') {
      navigate('/dashboard');
      return;
    }

    fetchAllFilesForMonitoring();
  }, [navigate]);

  useEffect(() => {
    const paramHighlight = searchParams.get('highlight') || location.state?.highlightId;
    const targetNomor = location.state?.nomorDokumen;

    if (paramHighlight || targetNomor) {
      setActiveHighlight({
        id: paramHighlight,
        nomor: targetNomor
      });
    }
  }, [location, searchParams]);

  const targetHighlightId = useMemo(() => {
    if (!activeHighlight || fileList.length === 0) return null;

    const targetId = activeHighlight.id;
    const targetNomor = activeHighlight.nomor ? String(activeHighlight.nomor).trim().toLowerCase() : '';

    if (targetNomor) {
      const matchNomor = fileList.find(f => 
        (f.nomor_dokumen && String(f.nomor_dokumen).trim().toLowerCase() === targetNomor) ||
        (f.nama_dokumen && f.nama_dokumen.toLowerCase().includes(targetNomor))
      );
      if (matchNomor) return matchNomor.id;
    }

    if (targetId) {
      const matchId = fileList.find(f => String(f.id) === String(targetId));
      if (matchId) return matchId.id;
    }

    return null;
  }, [activeHighlight, fileList]);

  useEffect(() => {
    if (targetHighlightId && highlightedRef.current) {
      const timer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetHighlightId]);

  useEffect(() => {
    const handleRemoveHighlight = () => {
      if (activeHighlight) {
        setActiveHighlight(null);
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener('click', handleRemoveHighlight);
    }, 400);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleRemoveHighlight);
    };
  }, [activeHighlight]);

  // HELPER MENCARI VALUE BERDASARKAN KEYWORD DI OBJECT
  const findValueByKeywords = (obj, exactKeywords, partialKeywords = []) => {
    if (!obj || typeof obj !== 'object') return null;

    const ignoreKeys = ['id', 'user_id', 'template_id', 'created_at', 'updated_at', 'file_path', 'foto_ttd', 'nama_dokumen', 'nama_pembuat', 'role', 'status', 'nama_penerima', 'nama_penyerah', 'pihak_satu', 'pihak_dua'];

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (ignoreKeys.includes(lowerKey)) continue;

      for (const kw of exactKeywords) {
        if (lowerKey === kw.toLowerCase()) {
          const val = obj[key];
          if (val && typeof val !== 'object' && String(val).trim() !== '') {
            return String(val);
          }
        }
      }
    }

    if (partialKeywords.length > 0) {
      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (ignoreKeys.includes(lowerKey)) continue;

        for (const kw of partialKeywords) {
          if (lowerKey.includes(kw.toLowerCase())) {
            const val = obj[key];
            if (val && typeof val !== 'object' && String(val).trim() !== '') {
              return String(val);
            }
          }
        }
      }
    }

    for (const key of Object.keys(obj)) {
      let val = obj[key];
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) {}
      }
      if (val && typeof val === 'object' && val !== null) {
        const found = findValueByKeywords(val, exactKeywords, partialKeywords);
        if (found) return found;
      }
    }

    return null;
  };

  // 🎯 LOGIKA PENCARIAN PRESISI DENGAN FILTER KATA UNTUK INPUT PENDEK
  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return fileList.filter((file) => {
      const matchRole = selectedRole === '' || file.user?.role === selectedRole;
      if (!matchRole) return false;

      if (!query) return true;

      const namaDoc = (file.nama_dokumen || '').toLowerCase();
      const nomorDoc = (file.nomor_dokumen || '').toLowerCase();
      const pembuat = (file.nama_pembuat || '').toLowerCase();
      const jenisTemplate = (file.jenis_dokumen || file.template?.nama || file.nama_template || '').toLowerCase();

      const detailAlat = (findValueByKeywords(file, ['nama_alat', 'alat', 'peralatan', 'mesin'], ['alat', 'barang', 'mesin']) || '').toLowerCase();
      const detailItem = (findValueByKeywords(file, ['nama_barang', 'nama_item', 'item', 'barang', 'objek_penyerahan'], ['item', 'barang', 'objek']) || '').toLowerCase();
      const detailLokasi = (findValueByKeywords(file, ['lokasi', 'lokasi_tugas', 'tempat', 'tujuan'], ['lokasi', 'tempat', 'tujuan']) || '').toLowerCase();
      const detailPekerja = (findValueByKeywords(file, ['nama_pekerja', 'pekerja', 'nama_karyawan', 'petugas'], ['pekerja', 'petugas']) || '').toLowerCase();
      const detailPengadaan = (findValueByKeywords(file, ['nama_pengadaan', 'pengadaan', 'objek_pengadaan'], ['pengadaan']) || '').toLowerCase();
      const detailJasa = (findValueByKeywords(file, ['nama_jasa', 'jasa', 'jenis_jasa', 'pekerjaan', 'nama_pekerjaan'], ['jasa', 'pekerjaan']) || '').toLowerCase();

      // JIKA PENCARIAN SANGAT PENDEK (1-2 KARAKTER), COCOKKAN SECARA PRESISI KATA/NILAI SPESIFIK
      // (Mencegah kata seperti "BA Penyerahan" atau "Masyita" memanggil seluruh berkas)
      if (query.length <= 2) {
        const matchesWordOrExact = (val) => {
          if (!val) return false;
          const words = val.split(/\s+/);
          return words.some(w => w === query || w.startsWith(query));
        };

        return (
          matchesWordOrExact(detailAlat) ||
          matchesWordOrExact(detailItem) ||
          matchesWordOrExact(detailLokasi) ||
          matchesWordOrExact(detailPekerja) ||
          matchesWordOrExact(detailPengadaan) ||
          matchesWordOrExact(detailJasa) ||
          matchesWordOrExact(nomorDoc)
        );
      }

      // UNTUK PENCARIAN DENGAN PANJANG > 2 KARAKTER
      return (
        namaDoc.includes(query) ||
        nomorDoc.includes(query) ||
        pembuat.includes(query) ||
        jenisTemplate.includes(query) ||
        detailAlat.includes(query) ||
        detailItem.includes(query) ||
        detailLokasi.includes(query) ||
        detailPekerja.includes(query) ||
        detailPengadaan.includes(query) ||
        detailJasa.includes(query)
      );
    });
  }, [fileList, searchQuery, selectedRole]);

  const isSuratTugas = selectedFileForModal && (
    selectedFileForModal.template_id === 3 || 
    selectedFileForModal.template_id === '3' || 
    selectedFileForModal.foto_ttd === 'tanpa_ttd' ||
    selectedFileForModal.nama_dokumen?.toLowerCase().includes('tugas')
  );

  const renderDetailDynamic = (file) => {
    const namaDoc = file.nama_dokumen?.toLowerCase() || '';
    const templateId = String(file.template_id || file.template?.id || '');

    if (templateId === '3' || namaDoc.includes('tugas')) {
      const pekerja = findValueByKeywords(file, ['nama_pekerja', 'pekerja', 'nama_karyawan', 'petugas'], ['pekerja', 'karyawan', 'petugas']);
      const lokasi = findValueByKeywords(file, ['lokasi', 'lokasi_tugas', 'tempat', 'tujuan'], ['lokasi', 'tempat', 'tujuan', 'alamat']);

      if (pekerja || lokasi) {
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1.5 shrink-0 truncate max-w-[320px]">
            {pekerja && <span>👤 <strong className="text-slate-700 font-semibold">{pekerja}</strong></span>}
            {pekerja && lokasi && <span className="text-slate-300">•</span>}
            {lokasi && <span>📍 <strong className="text-slate-700 font-semibold">{lokasi}</strong></span>}
          </span>
        );
      }
    }

    if (templateId === '2' || namaDoc.includes('kerusakan')) {
      const alat = findValueByKeywords(
        file, 
        ['nama_alat', 'nama_barang', 'alat', 'peralatan', 'mesin'], 
        ['alat', 'barang', 'mesin']
      );
      if (alat) {
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 truncate max-w-[260px]">
            🛠️ Alat: <strong className="text-slate-700 font-semibold">{alat}</strong>
          </span>
        );
      }
    }

    if (templateId === '1' || namaDoc.includes('penyerahan')) {
      const item = findValueByKeywords(
        file, 
        ['nama_barang', 'nama_item', 'item', 'barang', 'objek_penyerahan', 'jenis_barang'], 
        ['item', 'barang', 'objek']
      );
      if (item) {
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 truncate max-w-[260px]">
            📦 Item: <strong className="text-slate-700 font-semibold">{item}</strong>
          </span>
        );
      }
    }

    if (namaDoc.includes('tor barang') || namaDoc.includes('pengadaan') || namaDoc.includes('barang')) {
      const barang = findValueByKeywords(
        file,
        ['nama_pengadaan', 'pengadaan', 'nama_barang', 'barang', 'objek_pengadaan', 'nama_item', 'item'],
        ['pengadaan', 'barang', 'item']
      );
      if (barang) {
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 truncate max-w-[260px]">
            🛍️ Pengadaan: <strong className="text-slate-700 font-semibold">{barang}</strong>
          </span>
        );
      }
    }

    if (namaDoc.includes('tor jasa') || namaDoc.includes('jasa')) {
      const jasa = findValueByKeywords(
        file,
        ['nama_jasa', 'jasa', 'jenis_jasa', 'pekerjaan', 'nama_pekerjaan', 'uraian_jasa'],
        ['jasa', 'pekerjaan']
      );
      if (jasa) {
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 truncate max-w-[260px]">
            💼 Jasa: <strong className="text-slate-700 font-semibold">{jasa}</strong>
          </span>
        );
      }
    }

    const genericItem = findValueByKeywords(
      file,
      ['nama_barang', 'nama_jasa', 'nama_pengadaan', 'nama_item', 'barang', 'jasa', 'pekerjaan'],
      ['barang', 'jasa', 'item', 'pengadaan', 'pekerjaan']
    );
    if (genericItem) {
      return (
        <span className="text-[10px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 truncate max-w-[260px]">
          📌 Detail: <strong className="text-slate-700 font-semibold">{genericItem}</strong>
        </span>
      );
    }

    return (
      <span className="text-[10px] text-slate-400 font-semibold">
        ID: #{file.id}
      </span>
    );
  };

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
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

      <Sidebar />
      
      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SECTION */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Monitoring <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">File Terbaru </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">Menampilkan riwayat pemantauan dan pengelolaan dokumen arsip terbaru.</p>
            </div>

            {/* BAR PENCARIAN & FILTER ROLE */}
            <div className="flex items-center gap-2 max-w-md w-full md:justify-end">
              <div className="relative w-full max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berkas, nomor, jenis, atau detail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-sky-100 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 transition-all shadow-xs"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 bg-white border border-sky-100 rounded-2xl text-xs font-bold text-slate-700 shadow-xs outline-none cursor-pointer focus:border-sky-400 transition-all"
              >
                <option value=""> Semua Role</option>
                <option value="master_admin">👑 Master Admin</option>
                <option value="admin">👥 Admin</option>
                <option value="user">👤 User</option>
              </select>
            </div>
          </section>

          {/* MAIN CONTAINER FRAME */}
          {loading ? (
            <div className="mt-6 bg-white rounded-[28px] border border-sky-100 p-16 text-center space-y-3 shadow-xl shadow-sky-100/50">
              <div className="text-3xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-600 font-bold text-xs">Sedang memilah berkas dari database...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="mt-6 bg-white rounded-[28px] border border-sky-100 p-16 text-center space-y-2 shadow-xl shadow-sky-100/50">
              <div className="text-3xl select-none">📭</div>
              <p className="text-slate-600 font-bold text-xs">Data berkas tidak ditemukan!</p>
            </div>
          ) : (
            <div className="mt-6 bg-white rounded-[28px] border border-sky-200/70 p-5 shadow-xl shadow-sky-100/60 space-y-3">
              
              <div className="hidden md:flex items-center justify-between bg-[#F4F8FC] px-6 py-3 rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                <div className="flex-1">DETAIL NAMA BERKAS</div>
                <div className="w-36 text-center shrink-0">ROLE</div>
                <div className="shrink-0 text-right w-[280px]">TINDAKAN</div> 
              </div>

              <div className="space-y-3">
                {filteredFiles.map((file) => {
                  const isHighlighted = targetHighlightId !== null && file.id === targetHighlightId;
                  const isActive = file.status_aktif == 1 || file.status_aktif === '1' || file.status_aktif === null || file.status_aktif === undefined;

                  return (
                    <div 
                      key={file.id}
                      ref={isHighlighted ? highlightedRef : null}
                      className={`rounded-2xl p-3.5 md:px-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ease-out transform ${
                        isHighlighted 
                          ? 'bg-emerald-50/50 border-2 border-emerald-400 ring-4 ring-emerald-300/60 shadow-xl shadow-emerald-200/80 scale-[1.015] animate-pulse' 
                          : 'bg-white border border-sky-200/80 shadow-md shadow-sky-100/40 hover:shadow-xl hover:shadow-sky-200/50 hover:border-sky-300 hover:scale-[1.01] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full md:w-auto">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border shadow-xs transition-colors ${
                          isHighlighted ? 'bg-emerald-100 text-emerald-600 border-emerald-300' : 'bg-sky-50 text-sky-500 border-sky-100/80'
                        }`}>
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex flex-col cursor-pointer group"
                              onClick={() => setSelectedFileForModal(file)}
                              title={file.nama_dokumen || file.nomor_dokumen}
                            >
                              {(() => {
                                const rawNomor = file.nama_dokumen || file.nomor_dokumen || '';
                                const splitStr = rawNomor.split(' - ');
                                const judul = splitStr[0] || `Dokumen #${file.id}`;
                                const nomor = splitStr[1] || rawNomor;

                                return (
                                  <>
                                    <p className={`text-sm font-black transition-colors truncate max-w-[320px] ${
                                      isHighlighted ? 'text-emerald-900' : 'text-sky-600 group-hover:text-sky-400'
                                    }`}>
                                      {judul}
                                    </p>
                                    {nomor && judul !== nomor && (
                                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        No. Dokumen: <span className="text-slate-700">{nomor}</span>
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {isHighlighted && (
                              <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider animate-bounce shadow-xs">
                                🟢 DITANDAI DARI DASHBOARD
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {renderDetailDynamic(file)}

                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
                              isHighlighted ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' : 'bg-sky-50/90 text-sky-600 border-sky-100'
                            }`}>
                              👤 {file.nama_pembuat}
                            </span>
                          </div>

                          <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1 truncate max-w-[320px]">
                            <span>🖨️ Tanggal Cetak Terakhir: {file.tanggal_cetak ? formatTanggalIndo(file.tanggal_cetak) : <span className="italic text-slate-400 font-normal">Belum pernah dicetak</span>}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 w-36 text-center flex justify-center">
                        <span className={`text-[9px] px-3 py-1 rounded-xl font-black uppercase tracking-wider inline-block border shadow-2xs whitespace-nowrap ${
                          file.user?.role === 'master_admin' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                          file.user?.role === 'admin' ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {file.user?.role || 'user'}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center justify-end gap-2 w-[280px]">
                        <button
                          type="button"
                          disabled={printingId === file.id}
                          onClick={() => handlePrintFisik(file.id)}
                          className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap select-none active:scale-95 disabled:opacity-50"
                        >
                          {printingId === file.id ? 'Mengonversi PDF...' : '🖨️ CETAK FISIK'}
                        </button>

                        {(userRole === 'master_admin' || userRole === 'admin') && (
                          <button 
                            type="button"
                            onClick={() => handleToggleStatus(file.id)}
                            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95 ${
                              isActive 
                                ? 'bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white' 
                                : 'bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                            }`}
                            title={isActive ? "Nonaktifkan Dokumen" : "Aktifkan Dokumen"}
                          >
                            {isActive ? '🚫 Nonaktifkan' : '✅ Aktifkan'}
                          </button>
                        )}

                        {userRole === 'master_admin' && (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(file)}
                            className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 px-3 py-2 rounded-xl text-[12px] transition-all shadow-2xs cursor-pointer flex items-center justify-center active:scale-95"
                            title="Hapus Dokumen Secara Permanen"
                          >
                            🗑️
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODAL DETAIL DOKUMEN */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4 animate-pop">
            
            <div className="flex justify-between items-start border-b border-sky-100 pb-3">
              <div>
                <span className="text-[10px] font-black bg-sky-50 text-sky-600 px-3 py-1 rounded-xl uppercase tracking-wider border border-sky-100">
                  Rincian Arsip Dokumen
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2 truncate max-w-[380px]" title={selectedFileForModal.nama_dokumen}>
                  {selectedFileForModal.nama_dokumen}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedFileForModal(null)}
                className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-base font-bold cursor-pointer transition-colors select-none"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">ID Ref</span>
                <span className="col-span-2 text-slate-800 font-bold">#{selectedFileForModal.id}</span>
              </div>
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">Template ID</span>
                <span className="col-span-2 text-slate-800 font-bold">#{selectedFileForModal.template_id || '1'}</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-sky-100">
                <span className="text-slate-600 font-bold block text-[11px]">Master Berkas &amp; Dokumen:</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleLihatFile(selectedFileForModal)}
                    className="flex items-center gap-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs select-none"
                  >
                    📥 Unduh Dokumen Word
                  </button>
                </div>
              </div>

              {!isSuratTugas && (
                <div className="space-y-1.5 pt-2 border-t border-sky-100">
                  <span className="text-slate-600 font-bold block text-[11px]">Preview Bukti Fisik TTD:</span>
                  <div className="border border-sky-100 rounded-2xl overflow-hidden bg-slate-50 max-h-36 flex items-center justify-center p-2">
                    <img 
                      src={(() => {
                        if (!selectedFileForModal.foto_ttd) return 'https://placehold.co/150x150?text=Gambar+Kosong';
                        if (selectedFileForModal.foto_ttd.startsWith('http')) return selectedFileForModal.foto_ttd;
                        const pathTtd = selectedFileForModal.foto_ttd.startsWith('/') ? selectedFileForModal.foto_ttd : `/${selectedFileForModal.foto_ttd}`;
                        return `http://localhost:8000${pathTtd}`;
                      })()} 
                      alt="Bukti Dokumen TTD" 
                      className="object-contain w-full h-full max-h-32 rounded-lg"
                      onError={(e) => {
                        if (!e.target.src.includes('placeholder') && !e.target.src.includes('/storage/')) {
                          const backupPath = selectedFileForModal.foto_ttd.replace(/^\/?(storage\/)?/, '');
                          e.target.src = `http://localhost:8000/storage/${backupPath}`;
                        } else {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/150x150?text=Gambar+Tidak+Ada';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-sky-100">
              <button
                type="button"
                onClick={() => setSelectedFileForModal(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-[11px] font-bold hover:bg-slate-900 transition-all cursor-pointer select-none"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POP-UP MODAL KONFIRMASI HAPUS PERMANEN */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 w-full max-w-xs overflow-hidden p-6 text-center space-y-4 animate-pop relative">
            
            <div className="w-14 h-14 bg-gradient-to-tr from-rose-100 to-red-100 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-200/60 shadow-inner">
              🗑️
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Hapus Dokumen?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus dokumen ini secara permanen?<br />
                <span className="font-bold text-slate-700">"{itemToDelete.nama_dokumen || itemToDelete.nomor_dokumen || 'Dokumen'}"</span>
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={executeDeleteFile}
                disabled={loadingDelete}
                className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
                {successModalData.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {successModalData.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL PERINGATAN / ERROR */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            
            <div className="w-14 h-14 bg-rose-100/90 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-200/60 shadow-xs">
              ⚠️
            </div>

            <div className="space-y-1.5 pb-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {errorModalData.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {errorModalData.message}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MonitoringData;