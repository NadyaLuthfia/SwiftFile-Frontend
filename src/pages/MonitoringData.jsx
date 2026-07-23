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

  // Deteksi Surat Tugas
  const isSuratTugas = selectedFileForModal && (
    selectedFileForModal.template_id === 3 || 
    selectedFileForModal.template_id === '3' || 
    selectedFileForModal.foto_ttd === 'tanpa_ttd' ||
    selectedFileForModal.nama_dokumen?.toLowerCase().includes('tugas')
  );

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <Sidebar />
      
      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER SECTION */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Monitoring <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">Semua File</span>
              </h1>
            </div>

            {/* BAR PENCARIAN & FILTER ROLE */}
            <div className="flex items-center gap-2 max-w-md w-full md:justify-end">
              <div className="relative w-full max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-sky-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berkas atau pembuat..."
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

          {/* MAIN CONTAINER FRAME DENGAN SOFT SHADOW & EFEK ELEGAN */}
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
              
              {/* HEADER BAR BANNER (FLEXBOX ALIGNMENT) */}
              <div className="hidden md:flex items-center justify-between bg-[#F4F8FC] px-6 py-3 rounded-2xl text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                <div className="flex-1">DETAIL NAMA BERKAS</div>
                <div className="w-36 text-center shrink-0">ROLE</div>
                <div className="shrink-0 text-right w-[440px]">KONFIGURASI &amp; TINDAKAN</div>
              </div>

              {/* LIST CARD ROWS PER BERKAS (FLEXBOX ANTI-KETIMPA + ANIMASI ZOOM) */}
              <div className="space-y-3">
                {filteredFiles.map((file) => {
                  const currentConfig = printConfigs[file.id] || { hal: '', rangkap: 1 };

                  return (
                    <div 
                      key={file.id}
                      className="bg-white border border-sky-200/80 rounded-2xl p-3.5 md:px-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md shadow-sky-100/40 hover:shadow-xl hover:shadow-sky-200/50 hover:border-sky-300 transform hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                    >
                      {/* 1. DETAIL NAMA BERKAS (FLEX GROW) */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full md:w-auto">
                        <div className="bg-sky-50 text-sky-500 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border border-sky-100/80 shadow-xs">
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <p 
                            className="text-slate-800 font-bold hover:text-sky-600 transition-colors cursor-pointer text-xs truncate max-w-[260px]" 
                            onClick={() => setSelectedFileForModal(file)}
                            title={file.nama_dokumen}
                          >
                            {file.nama_dokumen}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              ID: #{file.id}
                            </span>
                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50/90 border border-sky-100 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                              👤 {file.nama_pembuat}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. BADGE ROLE (LOCKED WIDTH & SHRINK-0 -> BEBAS BENTROK) */}
                      <div className="shrink-0 w-36 text-center flex justify-center">
                        <span className={`text-[9px] px-3 py-1 rounded-xl font-black uppercase tracking-wider inline-block border shadow-2xs whitespace-nowrap ${
                          file.user?.role === 'master_admin' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                          file.user?.role === 'admin' ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {file.user?.role || 'user'}
                        </span>
                      </div>

                      {/* 3. KONFIGURASI & TINDAKAN (LOCKED SHRINK-0) */}
                      <div className="shrink-0 flex items-center justify-end gap-2 flex-wrap md:flex-nowrap">
                        
                        {/* Tombol Lihat */}
                        <button 
                          type="button"
                          onClick={() => setSelectedFileForModal(file)}
                          className="bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white border border-sky-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1 shadow-2xs whitespace-nowrap"
                        >
                          👁️ Lihat
                        </button>

                        {/* PILL CONVEYOR WIDGET */}
                        <div className="flex items-center gap-1.5 bg-[#F4F8FC] border border-sky-100/90 p-1 rounded-xl shadow-2xs">
                          {/* Input Hal */}
                          <div className="flex items-center gap-1 bg-white border border-sky-100 px-2 py-0.5 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase select-none">Hal:</span>
                            <input 
                              type="text" 
                              value={currentConfig.hal}
                              placeholder="All"
                              onChange={(e) => handleConfigChange(file.id, 'hal', e.target.value)}
                              className="w-8 bg-transparent font-black text-center text-[11px] text-slate-800 outline-none placeholder-slate-300"
                            />
                          </div>

                          {/* Input Rangkap */}
                          <div className="flex items-center gap-1 bg-white border border-sky-100 px-2 py-0.5 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase select-none">Rkp:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={currentConfig.rangkap}
                              onChange={(e) => handleConfigChange(file.id, 'rangkap', parseInt(e.target.value) || 1)}
                              className="w-5 bg-transparent font-black text-center text-[11px] text-slate-800 outline-none"
                            />
                          </div>

                          {/* Tombol Cetak Fisik */}
                          <button
                            type="button"
                            onClick={() => handlePrintFisik(file.id, file.nama_dokumen)}
                            className="bg-slate-900 hover:bg-black text-white px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap select-none"
                          >
                            🖨️ CETAK FISIK
                          </button>
                        </div>

                        {/* AKSI KHUSUS MASTER ADMIN: "Nonaktif" */}
                        {userRole === 'master_admin' && (
                          <button 
                            type="button"
                            onClick={() => alert('Arsip dinonaktifkan')}
                            className="bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1 shadow-2xs whitespace-nowrap"
                            title="Nonaktifkan Dokumen"
                          >
                            🚫 Nonaktif
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

      {/* ================= MODAL DETAIL DOKUMEN ================= */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* HEADER MODAL */}
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

            {/* BODY MODAL */}
            <div className="text-xs space-y-2.5">
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">ID Ref</span>
                <span className="col-span-2 text-slate-800 font-bold">#{selectedFileForModal.id}</span>
              </div>
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">Template ID</span>
                <span className="col-span-2 text-slate-800 font-bold">#{selectedFileForModal.template_id || '1'}</span>
              </div>
              <div className="grid grid-cols-3 bg-[#F4F8FC] p-3 rounded-2xl border border-sky-100/60">
                <span className="text-slate-400 font-medium">Print Awal</span>
                <span className="col-span-2 text-slate-800 font-bold">
                  {printConfigs[selectedFileForModal.id]?.rangkap || 1} Rangkap (Hal: {printConfigs[selectedFileForModal.id]?.hal || 'All'})
                </span>
              </div>

              {/* Master File Dokumen */}
              <div className="space-y-2 pt-2 border-t border-sky-100">
                <span className="text-slate-600 font-bold block text-[11px]">Master Berkas &amp; Dokumen:</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleLihatFile(selectedFileForModal)}
                    className="flex items-center gap-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs select-none"
                  >
                    📥 Unduh Dokumen Word
                  </button>
                </div>
              </div>

              {/* Bukti Fisik / Tanda Tangan */}
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

            {/* FOOTER MODAL */}
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

    </div>
  );
}

export default MonitoringData;