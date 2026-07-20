import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Sidebar from './Sidebar'; // Menggunakan komponen Sidebar yang sama 

function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState('📅 Menghitung tanggal...');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate(); 

  // CONFIG: Menggunakan Localhost API Laravel
  const BASE_URL = 'http://localhost:8000/api';

  // 1. STATE STATS
  const [stats, setStats] = useState([
    { label: 'Master Template', val: 0, unit: 'File' },
    { label: 'Total di Draft', val: 0, unit: 'Berkas' },
    { label: 'Antrean Cetak', val: 0, unit: 'Verifikasi' },
    { label: 'Total Arsip Sah', val: 0, unit: 'Dokumen' }
  ]);

  // 2. STATE ANTREAN
  const [antreanList, setAntreanList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // 3. STATE PARAMETER
  const [documentCopies, setDocumentCopies] = useState({});
  const [documentPages, setDocumentPages] = useState({});

  // 🌟 FUNGSI 1: Ambil data statistik kotak atas dari API Laravel
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.stats) {
        setStats([
          { label: 'Master Template', val: data.stats.total_templates ?? 0, unit: 'File' },
          { label: 'Total di Draft', val: data.stats.total_drafts ?? 0, unit: 'Berkas' },
          { label: 'Antrean Cetak', val: data.stats.total_antrean ?? 0, unit: 'Verifikasi' },
          { label: 'Total Arsip Sah', val: data.stats.total_arsip ?? 0, unit: 'Dokumen' }
        ]);
      }
    } catch (error) {
      console.error("Gagal mengambil data statistik:", error);
    }
  };

  // 🌟 FUNGSI 2: Ambil daftar dokumen siap cetak dari API Laravel
  const fetchAntreanCetak = async () => {
    setLoadingList(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/siap-cetak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const resResult = await response.json();

      if (response.ok && resResult.status === 'success') {
        setAntreanList(resResult.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data antrean:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // 🌟 FUNGSI 3: Download berkas
  const handleLihat = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/siap-cetak/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        window.open(data.download_url, '_blank');
      } else {
        alert(data.message || "Gagal memproses file.");
      }
    } catch (error) {
      console.error("Error download berkas:", error);
      alert("Koneksi bermasalah saat mencoba mengunduh file.");
    }
  };

  // 🌟 FUNGSI 4: Print & Pindahkan ke Arsip
  const handlePrintAndArchive = async (id, namaDokumen) => {
    const jumlahCopy = documentCopies[id] || 1;
    const halamanPilihan = documentPages[id] || 'Semua Halaman (All)';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/siap-cetak/${id}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert(`🎉 Sukses! Berkas "${namaDokumen}" berhasil dicetak sebanyak ${jumlahCopy} rangkap (${halamanPilihan}) dan telah dipindahkan ke Arsip Sah.`);
        
        window.print();

        fetchDashboardStats();
        fetchAntreanCetak();
      } else {
        alert(data.message || "Gagal memperbarui status dokumen.");
      }
    } catch (error) {
      console.error("Error update status arsip:", error);
      alert("Terjadi kesalahan koneksi saat memproses arsip.");
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

    // 🔒 PROTEKSI ROUTE: Jika bukan 'admin', arahkan ke dashboard masing-masing
    if (role !== 'admin') {
      if (role === 'master_admin') {
        navigate('/master-dashboard');
      } else if (role === 'user') {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      return;
    }

    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
    setCurrentDate(`🔹 ${tanggalSekarang}`);

    fetchDashboardStats();
    fetchAntreanCetak();
  }, []);

  return (
    <div 
      className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-blue-200"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Sidebar Global */}
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-6 overflow-y-auto h-full min-w-0">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard <span className="text-blue-600">Admin</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Monitoring arsip masuk, parameter cetak, dan kelola validasi dokumen.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm text-xs text-blue-600 font-bold border border-blue-100/60">{currentDate}</div>
            </div>
          </header>

          {/* Statistik Kotak Atas */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {item.val} <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </section>

          {/* Seksi Konfirmasi Dokumen Siap Cetak */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Dokumen Siap Cetak</h3>
              <p className="text-xs text-slate-400 mt-1">Validasi berkas rampung. Atur parameter halaman dan jumlah rangkap di sini.</p>
            </div>
            
            {loadingList ? (
              <p className="text-sm text-slate-400 italic animate-pulse">Menghubungi server Laravel...</p>
            ) : antreanList.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                📭 Tidak ada berkas baru dalam antrean cetak saat ini.
              </div>
            ) : (
              <div className="space-y-4">
                {antreanList.map((doc) => (
                  <div key={doc.id} className="bg-slate-50/50 p-5 rounded-2xl flex flex-wrap items-center gap-6 border border-slate-100 justify-between">
                    
                    <div className="flex items-center space-x-4 flex-1 min-w-[200px]">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-2xl border border-slate-100 shadow-sm">📄</div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.nama_dokumen}>
                          {doc.nama_dokumen}
                        </h4>
                        <p className="text-[11px] text-blue-500 font-semibold uppercase tracking-wide mt-0.5">
                          {doc.status === 'belum_dicetak' ? 'Terverifikasi' : doc.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button 
                        onClick={() => handleLihat(doc.id)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-colors"
                      >
                        👁️ Lihat
                      </button>
                      
                      <select 
                        value={documentPages[doc.id] || 'Semua Halaman (All)'} 
                        onChange={(e) => setDocumentPages({ ...documentPages, [doc.id]: e.target.value })} 
                        className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs shadow-sm outline-none cursor-pointer focus:border-blue-400"
                      >
                        <option>Semua Halaman (All)</option>
                        <option>Halaman Depan Saja</option>
                        <option>Halaman Belakang Saja</option>
                      </select>

                      <input 
                        type="number" 
                        value={documentCopies[doc.id] || 1} 
                        min="1" 
                        onChange={(e) => setDocumentCopies({ ...documentCopies, [doc.id]: parseInt(e.target.value) || 1 })} 
                        className="w-16 p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs shadow-sm outline-none focus:border-blue-400" 
                      />
                      
                      <button 
                        onClick={() => handlePrintAndArchive(doc.id, doc.nama_dokumen)} 
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-200/50 transition-all"
                      >
                        Print & Arsipkan
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;