import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import axios from 'axios';

function FileTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 👑 1. Ambil role user dari localStorage
  const userRole = localStorage.getItem('role');

  // STATE UNTUK FITUR UPLOAD MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaTemplate, setNamaTemplate] = useState('');
  const [jenisDokumenId, setJenisDokumenId] = useState(1); 
  const [fileTemplate, setFileTemplate] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  // Ambil data master template dari API saat halaman dibuka
  useEffect(() => {
    ambilDataTemplate();
  }, []);

  const ambilDataTemplate = () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    axios.get('http://localhost:8000/api/templates', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => {
        console.log("Isi data dari API kamu:", res.data);

        if (res.data && Array.isArray(res.data.data)) {
          setTemplates(res.data.data);
        } else if (Array.isArray(res.data)) {
          setTemplates(res.data);
        } else if (res.data && res.data.templates && Array.isArray(res.data.templates)) {
          setTemplates(res.data.templates);
        } else if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
          setTemplates(res.data.data.data);
        } else {
          setTemplates([]);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error("Waduh eror pas ambil data template:", err);
        setLoading(false);
      });
  };

  // FUNGSI PROSES UPLOAD FILE KE BACKEND
  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    
    if (!fileTemplate) {
      alert("Pilih file .docx-nya dulu ya! 📁");
      return;
    }

    setLoadingUpload(true);
    const token = localStorage.getItem('token');
    
    const formDataToSend = new FormData();
    formDataToSend.append('nama', namaTemplate);
    formDataToSend.append('jenis_dokumen_id', jenisDokumenId);
    formDataToSend.append('file_template', fileTemplate);

    try {
      await axios.post('http://localhost:8000/api/templates', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      setNamaTemplate('');
      setJenisDokumenId(1); 
      setFileTemplate(null);
      setIsModalOpen(false);
      
      ambilDataTemplate();

    } catch (error) {
      console.error("Gagal upload template:", error);
      alert("Aduh gagal upload! Periksa validasi Laravel atau koneksi database kamu ya.");
    } finally {
      setLoadingUpload(false);
    }
  };

  // Fungsi Aksi Hapus Template
  const handleHapus = (id, nama) => {
    if (window.confirm(`Apakah kamu yakin ingin menghapus template "${nama}"?`)) {
      const token = localStorage.getItem('token');

      axios.delete(`http://localhost:8000/api/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
        .then(res => {
          alert("🗑️ Template berhasil dihapus!");
          ambilDataTemplate(); 
        })
        .catch(err => {
          console.error("Gagal menghapus:", err);
          alert("Gagal menghapus template!");
        });
    }
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    const opsi = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', opsi);
  };

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          
          {/* Header Atas */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                File <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">Template</span>
              </h1>
            </div>
            
            {/* 🌟 TOMBOL TAMBAH TEMPLATE */}
            {(userRole === 'master_admin' || userRole === 'admin') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/60 flex items-center gap-2 cursor-pointer relative z-10 transform hover:scale-105 active:scale-95"
              >
                <svg 
                  className="w-4 h-4 stroke-[2.5]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Tambah Template</span>
              </button>
            )}
          </header>

          {/* KONDISI RENDER UTAMA */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-6 rounded-3xl border border-sky-100/60 space-y-4 animate-pulse shadow-xs">
                  <div className="w-12 h-12 bg-sky-50/80 rounded-2xl" />
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="h-9 bg-slate-50 rounded-xl w-full mt-4" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 py-20 text-center space-y-3 shadow-xs">
              <div className="text-5xl select-none">📭</div>
              <p className="text-slate-500 font-bold text-sm">Belum ada file template di database.</p>
              <p className="text-slate-400 font-medium text-xs">Silakan tekan tombol 'Tambah Template' di atas untuk mengunggah berkas baru.</p>
            </div>
          ) : (
            
            /* TAMPILAN GRID CARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-gradient-to-bl from-sky-100/70 via-sky-50/20 to-white rounded-3xl border border-sky-200/80 p-6 shadow-md shadow-sky-100/60 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-200/60 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden cursor-default"
                >
                  <div className="absolute -top-6 -right-6 w-48 h-48 bg-gradient-to-bl from-sky-200/50 via-blue-100/30 to-transparent rounded-full blur-xl pointer-events-none transition-all duration-500 group-hover:scale-125 group-hover:from-sky-300/60" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-gradient-to-br from-sky-100/80 to-blue-50 text-sky-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xs border border-sky-100/80 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-sky-200/80 group-hover:from-sky-200/80 group-hover:to-blue-100/80">
                        📄
                      </div>
                      
                      {/* 🌟 BADGE DEN GAN WARNA SERAGAM BIRU SURAT TUGAS */}
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs bg-sky-100/80 text-sky-700 border-sky-200/60">
                        {t.jenis_dokumen_id === 2 ? '⚠️ Kerusakan' : t.jenis_dokumen_id === 3 ? '💼 Surat Tugas' : '🤝 Penyerahan'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2 text-sm leading-snug min-h-[40px]">
                      {t.nama}
                    </h3>

                    <div className="text-[11px] text-slate-400 font-medium mt-2 mb-6 flex items-center gap-1.5">
                      <span>🕒 Diperbarui:</span>
                      <span className="font-bold text-slate-600">{formatTanggal(t.updated_at || t.created_at)}</span>
                    </div>
                  </div>

                  <div className={`relative z-10 grid ${userRole === 'master_admin' ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 pt-4 border-t border-sky-100/60`}>
                    <button 
                      onClick={() => {
                        if (t.jenis_dokumen_id === 2) {
                          navigate(`/draft-kerusakan?template_id=${t.id}`);
                        } else if (t.jenis_dokumen_id === 3) {
                          navigate(`/draft-surat-tugas?template_id=${t.id}`);
                        } else {
                          navigate(`/draft-penyerahan?template_id=${t.id}`);
                        }
                      }} 
                      className="bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent py-2.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer w-full active:scale-95"
                      title="Pilih template ini untuk membuat dokumen"
                    >
                      Pilih
                    </button>

                    {userRole === 'master_admin' && (
                      <button 
                        onClick={() => handleHapus(t.id, t.nama)}
                        className="bg-rose-50/80 hover:bg-rose-500 text-rose-500 hover:text-white py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-rose-100 hover:border-transparent cursor-pointer active:scale-95"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* POP-UP MODAL UNTUK UPLOAD TEMPLATE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 w-full max-w-md overflow-hidden p-6 space-y-6 relative transform transition-all">
            
            <div className="flex justify-between items-center border-b border-sky-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-sky-600 font-extrabold text-lg">+</span> Tambah Template Baru
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">File Word otomatis di-scan variabel placeholder-nya.</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFileTemplate(null);
                }}
                className="text-slate-400 hover:text-rose-500 text-xs font-bold bg-slate-100 hover:bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadTemplate} className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Template Document</label>
                <input 
                  type="text" 
                  value={namaTemplate} 
                  onChange={(e) => setNamaTemplate(e.target.value)}
                  placeholder="Contoh: BA Serah Terima Aset Kantor" 
                  className="w-full border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-[#F4F8FC]/50 font-medium transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Jenis Dokumen</label>
                <select 
                  value={jenisDokumenId} 
                  onChange={(e) => setJenisDokumenId(Number(e.target.value))} 
                  className="w-full border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white font-medium cursor-pointer transition-all"
                >
                  <option value={1}>BA Penyerahan</option>
                  <option value={2}>BA Kerusakan</option>
                  <option value={3}>Surat Tugas</option>
                </select>
              </div>

              {/* 🌟 FRAME FILE INPUT + TOMBOL HAPUS BERKAS */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">File Microsoft Word (.docx)</label>
                
                {!fileTemplate ? (
                  <input 
                    type="file" 
                    accept=".docx"
                    onChange={(e) => setFileTemplate(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer border border-dashed border-sky-200 p-2 rounded-xl bg-[#F4F8FC]/50 transition-all"
                    required
                  />
                ) : (
                  <div className="flex items-center justify-between border border-sky-200 bg-gradient-to-r from-sky-50/80 to-blue-50/50 p-3 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-sky-200">
                        📄
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={fileTemplate.name}>
                          {fileTemplate.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {(fileTemplate.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFileTemplate(null)}
                      className="bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 hover:border-transparent text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                      title="Hapus file terpilih"
                    >
                      <span>🗑️</span>
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFileTemplate(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingUpload}
                  className="flex-[2] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all disabled:bg-slate-300 shadow-md shadow-sky-200/50 cursor-pointer active:scale-98"
                >
                  {loadingUpload ? "Sedang Memproses... " : "Simpan & Scan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileTemplate;