import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function MonitoringData() {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // STATE UNTUK POP-UP MODAL RINCIAN
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // STATE PARAMETER: Mengatur konfigurasi cetak per ID dokumen secara dinamis
  const [printConfigs, setPrintConfigs] = useState({});

  const BASE_URL = 'http://localhost:8000/api';

  const fetchAllFilesForMonitoring = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/monitoring-all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setFileList(result.data);
        
        const initialConfigs = {};
        result.data.forEach(file => {
          initialConfigs[file.id] = {
            hal: file.halaman && file.halaman !== '-' ? file.halaman : '',
            rangkap: file.print_rangkap || 1
          };
        });
        setPrintConfigs(initialConfigs);
      }
    } catch (error) {
      console.error("Gagal memuat data monitoring:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (id, field, value) => {
    setPrintConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handlePrintFisik = (id, filename) => {
    const config = printConfigs[id] || { hal: '', rangkap: 1 };
    const halaman = config.hal.trim() === '' ? 'All' : config.hal;
    alert(`🖨️ Mengirim perintah cetak ke mesin printer:\nDokumen: ${filename}\nHalaman: ${halaman}\nJumlah Rangkap: ${config.rangkap}x`);
  };

  const handleLihatFile = (file) => {
    if (!file || !file.file_path) {
      alert("Gagal mendapatkan path berkas dokumen.");
      return;
    }

    const pathFile = file.file_path;
    const urlLengkap = pathFile.startsWith('http') ? pathFile : `http://localhost:8000/${pathFile}`;
    
    window.open(urlLengkap, '_blank');
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
  }, []);

  // FILTERING SISI FRONTEND
  const filteredFiles = fileList.filter((file) => {
    const query = searchQuery.toLowerCase();
    const matchNamaDokumen = file.nama_dokumen?.toLowerCase().includes(query);
    const matchPembuat = file.nama_pembuat?.toLowerCase().includes(query);
    const matchSearch = matchNamaDokumen || matchPembuat;
    const matchRole = selectedRole === '' || file.user?.role === selectedRole;
    
    const sudahMasukArsip = file.foto_ttd && file.foto_ttd !== '';

    return matchSearch && matchRole && sudahMasukArsip;
  });

  // ✨ Deteksi apakah dokumen yang sedang dibuka di modal adalah Surat Tugas
  const isSuratTugas = selectedFileForModal && (
    selectedFileForModal.template_id === 3 || 
    selectedFileForModal.template_id === '3' || 
    selectedFileForModal.foto_ttd === 'tanpa_ttd' ||
    selectedFileForModal.nama_dokumen?.toLowerCase().includes('tugas')
  );

  return (
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SECTION */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Pusat Pengawasan</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Monitoring <span className="text-indigo-600">Semua File</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Hak Akses Supervision: Melihat data riwayat berkas keseluruhan milik User, Admin, maupun Master Admin.
              </p>
            </div>

            {/* BAR PENCARIAN & FILTER ROLE */}
            <div className="flex items-center gap-2 max-w-md w-full md:justify-end">
              <div className="relative w-full max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berkas atau pembuat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium shadow-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none cursor-pointer focus:border-indigo-400 text-slate-700 transition-all"
              >
                <option value="">✨ Semua Role</option>
                <option value="master_admin">👑 Master Admin</option>
                <option value="admin">👥 Admin</option>
                <option value="user">👤 User</option>
              </select>
            </div>
          </section>

          {/* MAIN DISPLAY DATA BOARD */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-4 shadow-sm animate-pulse">
              <div className="text-4xl text-indigo-500 animate-spin inline-block">⏳</div>
              <p className="text-slate-500 font-bold text-sm">Sedang memilah berkas dari database...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-3 shadow-sm">
              <div className="text-4xl">✨</div>
              <p className="text-slate-400 font-semibold text-sm">Data berkas tidak ditemukan!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[35%]">Detail Nama Berkas</th>
                      <th className="py-4 px-4 w-[20%]">Staf Pembuat</th>
                      <th className="py-4 px-4 w-[10%]">Role</th>
                      <th className="py-4 px-6 text-center w-[35%]">Konfigurasi &amp; Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                    {filteredFiles.map((file) => {
                      const currentConfig = printConfigs[file.id] || { hal: '', rangkap: 1 };
                      
                      return (
                        <tr key={file.id} className="hover:bg-slate-50/50 transition-all">
                          
                          {/* 1. DETAIL NAMA BERKAS */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl select-none flex-shrink-0">📄</span>
                              <div className="min-w-0">
                                <p className="text-slate-900 font-bold truncate max-w-[260px]" title={file.nama_dokumen}>
                                  {file.nama_dokumen}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID Berkas: #{file.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* 2. OPERATOR / PEMBUAT */}
                          <td className="py-4 px-4">
                            <span className="text-slate-800 font-bold flex items-center gap-1">
                              👤 {file.nama_pembuat}
                            </span>
                          </td>

                          {/* 4. BADGE ROLE */}
                          <td className="py-4 px-4">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block ${
                              file.user?.role === 'master_admin' ? 'bg-blue-50 text-blue-600' :
                              file.user?.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {file.user?.role || 'user'}
                            </span>
                          </td>
                          
                          {/* 5. ACTIONS & CONFIG WIDGET */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              
                              <button 
                                type="button"
                                onClick={() => setSelectedFileForModal(file)}
                                className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 whitespace-nowrap"
                              >
                                👁️ Lihat
                              </button>

                              {/* PILL CONVEYOR WIDGET */}
                              <div className="flex items-center gap-2 bg-slate-100/60 border border-slate-200/80 p-1.5 rounded-2xl shadow-inner">
                                
                                {/* Input Halaman */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-indigo-400 transition-colors">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Hal:</span>
                                  <input 
                                    type="text" 
                                    value={currentConfig.hal}
                                    placeholder="All"
                                    onChange={(e) => handleConfigChange(file.id, 'hal', e.target.value)}
                                    className="w-12 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none placeholder-slate-400"
                                  />
                                </div>

                                {/* Input Rangkap */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl focus-within:border-indigo-400 transition-colors">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase select-none">Rangkap:</span>
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={currentConfig.rangkap}
                                    onChange={(e) => handleConfigChange(file.id, 'rangkap', parseInt(e.target.value) || 1)}
                                    className="w-6 bg-transparent font-extrabold text-center text-[11px] text-slate-800 outline-none"
                                  />
                                </div>

                                {/* Tombol Print Fisik */}
                                <button
                                  type="button"
                                  onClick={() => handlePrintFisik(file.id, file.nama_dokumen)}
                                  className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  🖨️ Print Fisik
                                </button>
                              </div>

                              {/* Aksi Khusus Master Admin */}
                              {userRole === 'master_admin' && (
                                <button 
                                  type="button"
                                  onClick={() => alert('Arsip dinonaktifkan')}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-xl text-[10px] font-bold transition-colors"
                                  title="Nonaktifkan Dokumen"
                                >
                                  🛑
                                </button>
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

      {/* =======================================================
          ✨ MODAL POP-UP RINCIAN ARSIP DOKUMEN (DENGAN TOMBOL TUTUP, TANPA X)
         ======================================================= */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur Latar Belakang */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFileForModal(null)}
          />

          {/* Kotak Utama Modal */}
          <div className="relative bg-white rounded-[24px] max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 z-10 overflow-hidden">
            
            {/* HEADER MODAL */}
            <div className="p-5 pb-2 flex-shrink-0">
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                Rincian Arsip Dokumen
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-2 tracking-tight leading-snug">
                {selectedFileForModal.nama_dokumen}
              </h3>
            </div>

            {/* AREA TENGAH: SCROLLABLE BODY */}
            <div className="px-5 pb-4 pt-1 overflow-y-auto flex-1 space-y-4 pr-3.5 scrollbar-thin select-none">
              
              {/* List Rincian Parameter */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold">ID Ref</span>
                  <span className="text-slate-800 font-extrabold">#: {selectedFileForModal.id}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold">Template ID</span>
                  <span className="text-slate-800 font-extrabold">#: {selectedFileForModal.template_id || '1'}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold">Parameter Print</span>
                  <span className="text-slate-800 font-extrabold">
                    {printConfigs[selectedFileForModal.id]?.rangkap || 1} Rangkap (Halaman: {printConfigs[selectedFileForModal.id]?.hal || 'All'})
                  </span>
                </div>
              </div>

              {/* Section File Dokumen Jadi */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  File Dokumen Jadi:
                </span>
                <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-sm hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl">📝</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]" title={selectedFileForModal.nama_dokumen}>
                        {selectedFileForModal.nama_dokumen}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Format Word siap cetak</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleLihatFile(selectedFileForModal)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                  >
                    📥 Download
                  </button>
                </div>
              </div>

              {/* Bukti Fisik / Tanda Tangan - ✨ HANYA MUNCUL JIKA BUKAN SURAT TUGAS */}
              {!isSuratTugas && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Bukti Fisik / Tanda Tangan:
                  </span>
                  <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 flex flex-col items-center gap-3">
                    <div className="w-full max-h-36 flex items-center justify-center bg-white rounded-xl overflow-hidden border border-slate-150 p-3 shadow-inner">
                      <img 
                        src={(() => {
                          if (!selectedFileForModal.foto_ttd) return 'https://placehold.co/150x150?text=Gambar+Kosong';
                          
                          if (selectedFileForModal.foto_ttd.startsWith('http')) {
                            return selectedFileForModal.foto_ttd;
                          }
                          
                          const pathTtd = selectedFileForModal.foto_ttd.startsWith('/') 
                            ? selectedFileForModal.foto_ttd 
                            : `/${selectedFileForModal.foto_ttd}`;
                          
                          return `http://localhost:8000${pathTtd}`;
                        })()} 
                        alt="Tanda Tangan" 
                        className="max-h-28 object-contain"
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
                    <button 
                      type="button"
                      onClick={() => {
                        const pathTtd = selectedFileForModal.foto_ttd.startsWith('/') 
                          ? selectedFileForModal.foto_ttd 
                          : `/${selectedFileForModal.foto_ttd}`;
                        
                        const fileUrl = selectedFileForModal.foto_ttd.startsWith('http') 
                          ? selectedFileForModal.foto_ttd 
                          : `http://localhost:8000${pathTtd}`;
                          
                        window.open(fileUrl, '_blank');
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      📥 Download Foto TTD
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER MODAL: TOMBOL TUTUP BALIK LAGI */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFileForModal(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
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

export default MonitoringData;