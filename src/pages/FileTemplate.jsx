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
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-6 overflow-y-auto h-full">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          
          {/* Header Atas */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Master <span className="text-blue-600">File Template</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Kelola file master .docx kamu dalam bentuk grid view yang rapi.</p>
            </div>
            
            {/* 🌟 2. AKSES TOMBOL TAMBAH TEMPLATE: Diizinkan untuk master_admin dan admin */}
            {(userRole === 'master_admin' || userRole === 'admin') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 flex items-center gap-2 cursor-pointer relative z-10"
              >
                ➕ Tambah Template
              </button>
            )}
          </header>

          {/* INFO TOTAL FILE */}
          <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              📂 Grid Master Dokumen
            </h3>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">
              {templates.length} Total File Terdeteksi
            </span>
          </div>

          {/* KONDISI RENDER UTAMA */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-50 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center space-y-3 shadow-sm">
              <div className="text-4xl">📭</div>
              <p className="text-slate-400 font-medium">Belum ada file template di database.<br/>Silakan tambah template terlebih dahulu.</p>
            </div>
          ) : (
            
            /* TAMPILAN GRID CARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-all" />

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 text-blue-600 w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm shadow-blue-50">
                        📄
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                        t.jenis_dokumen_id === 2 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : t.jenis_dokumen_id === 3
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {t.jenis_dokumen_id === 2 ? '⚠️ Kerusakan' : t.jenis_dokumen_id === 3 ? '💼 Surat Tugas' : '🤝 Penyerahan'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-all line-clamp-2 text-sm leading-snug min-h-[40px]">
                      {t.nama}
                    </h3>

                    <div className="text-[11px] text-slate-400 font-medium mt-1 mb-6 flex items-center gap-1">
                      <span>🕒 Diperbarui:</span>
                      <span className="font-semibold">{formatTanggal(t.updated_at || t.created_at)}</span>
                    </div>
                  </div>

                  {/* 🌟 3. GRID TOMBOL: Hanya master_admin yang dapat grid 2 kolom karena memiliki tombol Hapus */}
                  <div className={`grid ${userRole === 'master_admin' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-4 border-t border-slate-50`}>
                    
                    {/* 1. TOMBOL PILIH */}
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
                      className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-0.5 cursor-pointer w-full"
                      title="Pilih template ini untuk membuat dokumen"
                    >
                      ✨ Pilih
                    </button>

                    {/* 2. TOMBOL HAPUS: Hanya di-render jika master_admin (Admin biasa tidak akan melihat tombol ini) */}
                    {userRole === 'master_admin' && (
                      <button 
                        onClick={() => handleHapus(t.id, t.nama)}
                        className="bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-0.5 border border-rose-100 hover:border-transparent cursor-pointer"
                      >
                        🗑️ Hapus
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden p-6 space-y-6 relative">
            
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">➕ Tambah Template Baru</h2>
                <p className="text-[11px] text-slate-400 font-medium">File Word otomatis di-scan variabel placeholder-nya.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadTemplate} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500">Nama Template Document</label>
                <input 
                  type="text" 
                  value={namaTemplate} 
                  onChange={(e) => setNamaTemplate(e.target.value)}
                  placeholder="Contoh: BA Serah Terima Aset Kantor" 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500">Jenis Dokumen</label>
                <select 
                  value={jenisDokumenId} 
                  onChange={(e) => setJenisDokumenId(Number(e.target.value))} 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white font-medium cursor-pointer"
                >
                  <option value={1}>🤝 BA Penyerahan</option>
                  <option value={2}>⚠️ BA Kerusakan</option>
                  <option value={3}>💼 Surat Tugas</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500">File Microsoft Word (.docx)</label>
                <input 
                  type="file" 
                  accept=".docx"
                  onChange={(e) => setFileTemplate(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer border border-dashed border-slate-200 p-2 rounded-xl bg-slate-50/20"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingUpload}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all disabled:bg-slate-300 shadow-md shadow-blue-50 cursor-pointer"
                >
                  {loadingUpload ? "Sedang Memproses... 🚀" : "🚀 Simpan & Scan"}
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