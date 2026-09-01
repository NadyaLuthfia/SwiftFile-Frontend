import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Sidebar from './Sidebar';

function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState('📅 Menghitung tanggal...');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate(); 

  const BASE_URL = 'http://localhost:8000/api';

  // 1. STATE STATS (3 Box Statistik)
  const [stats, setStats] = useState([
    { label: 'File Template', val: 0, unit: 'File', route: '/file-template' },
    { label: 'Arsip & History', val: 0, unit: 'Dokumen', route: '/arsip-history' },
    { label: 'Total Dokumen', val: 0, unit: 'Dokumen', route: '/monitoring-data' }
  ]);

  const [templateActivities, setTemplateActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // 🌟 Ambil Statistik & Rekap dalam 1 Request (Mengikuti struktur Master Admin)
  const fetchDashboardData = async () => {
    setLoadingActivities(true);
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

      if (response.ok && data.success) {
        // 1. Set 3 Box Statistik Utama
        if (data.stats) {
          setStats([
            { label: 'File Template', val: data.stats.total_templates ?? 0, unit: 'File', route: '/file-template' },
            { label: 'Arsip & History', val: data.stats.total_arsip ?? 0, unit: 'Dokumen', route: '/arsip-history' },
            { label: 'Total Dokumen', val: data.stats.total_dokumen_tahun ?? 0, unit: 'Dokumen', route: '/monitoring-data' }
          ]);
        }

        // 2. Mapping Data Rekap dari data.rekap
        if (Array.isArray(data.rekap)) {
          const mappedActivities = data.rekap.map((item) => {
            const hasLastDoc = item.nomor_terakhir && item.nomor_terakhir !== 'Belum ada';

            const words = (item.jenis_file || 'DOC').split(' ');
            const generatedCode = words.length > 1 
              ? `${words[0].substring(0, 2).toUpperCase()}-${words[1].substring(0, 3).toUpperCase()}`
              : words[0].substring(0, 4).toUpperCase();

            return {
              id: item.id,
              nama_template: item.jenis_file,
              kode_template: generatedCode,
              total_dibuat: item.total_dicetak ?? 0,
              dokumen_terakhir: hasLastDoc ? {
                id_dokumen: item.id,
                nama_dokumen: item.jenis_file,
                nomor_dokumen: item.nomor_terakhir,
                dikerjakan_oleh: item.pembuat ?? '-',
                waktu_dibuat: item.tanggal_terakhir ?? '-',
              } : null
            };
          });

          setTemplateActivities(mappedActivities);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // 👈 SUDAH DIUBAH: Sekarang mengarah ke Monitoring Data
  const handleGoToMonitoring = (dokumen) => {
    if (!dokumen) return;
    
    navigate(`/monitoring-data?highlight=${dokumen.id_dokumen}`, {
      state: { 
        highlightId: dokumen.id_dokumen,
        nomorDokumen: dokumen.nomor_dokumen 
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const savedNama = localStorage.getItem('user_name');

    setUserRole(role || '');
    if (savedNama) {
      setUserName(savedNama);
    }

    if (!token) {
      navigate('/');
      return;
    }

    if (role !== 'admin') {
      if (role === 'master_admin') {
        navigate('/master-dashboard');
      } else if (role === 'user') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
    setCurrentDate(`🔹 ${tanggalSekarang}`);

    fetchDashboardData();
  }, []);

  const statIcons = ['📁', '📚', '📄'];

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full min-w-0 custom-scrollbar">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">
                Selamat Datang, <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">{userName || 'Admin'}</span> 👋
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white px-5 py-2.5 rounded-2xl shadow-xs text-xs text-sky-600 font-bold border border-sky-100 select-none">
                {currentDate}
              </div>
            </div>
          </header>

          {/* 📊 STATISTIK SECTION (3 Kolom) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((item, index) => (
              <div 
                key={index} 
                onClick={() => item.route && navigate(item.route)}
                title={`Klik untuk menuju halaman ${item.label}`}
                className="bg-white p-6 rounded-3xl shadow-xs border border-sky-100/80 transition-all duration-300 hover:shadow-md hover:border-sky-300 group flex justify-between items-center cursor-pointer transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest transition-colors group-hover:text-sky-600">
                    {item.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {item.val} <span className="text-xs font-semibold text-slate-400 lowercase">{item.unit}</span>
                  </p>
                </div>
                
                <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center text-xl border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 select-none shadow-xs">
                  {statIcons[index]}
                </div>
              </div>
            ))}
          </section>

          {/* 📋 MONITORING AKTIVITAS & PENGGUNAAN TEMPLATE */}
          <section className="bg-white p-8 rounded-3xl shadow-xs border border-sky-100/80">
            <div className="border-b border-sky-100 pb-5 mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Aktivitas & Ringkasan Template Dokumen</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statistik penggunaan template. Klik pada kotak dokumen untuk menuju ke <span className="text-sky-600 font-bold">Monitoring Data</span>.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                  Live Monitoring
                </span>
              </div>
            </div>
            
            {loadingActivities ? (
              <div className="flex items-center gap-2 text-xs text-sky-600 font-bold italic py-8 justify-center">
                <span className="animate-spin">⏳</span> Memuat ringkasan data template...
              </div>
            ) : templateActivities.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-sky-100 rounded-3xl text-slate-400 text-xs bg-[#F4F8FC]/50">
                📭 Belum ada riwayat aktivitas pembuatan dokumen dari template.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {templateActivities.map((tpl) => (
                  <div 
                    key={tpl.id} 
                    className="bg-[#F4F8FC] p-5 rounded-2xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-white hover:shadow-md hover:border-sky-200"
                  >
                    <div className="flex items-start space-x-4 min-w-[240px]">
                      <div className="h-12 w-12 bg-white text-sky-600 rounded-2xl flex items-center justify-center text-2xl border border-sky-100 shadow-xs flex-shrink-0">
                        📑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{tpl.nama_template}</h4>
                          <span className="text-[10px] font-extrabold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md">
                            {tpl.kode_template}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Total Dibuat: <strong className="text-sky-700 font-black">{tpl.total_dibuat} Dokumen</strong>
                        </p>
                      </div>
                    </div>

                    {tpl.dokumen_terakhir ? (
                      <div 
                        onClick={() => handleGoToMonitoring(tpl.dokumen_terakhir)}
                        title="📊 Klik untuk melihat & menandai dokumen ini di Halaman Monitoring Data"
                        className="flex-1 bg-white p-3.5 rounded-xl border border-sky-100 space-y-1.5 shadow-2xs cursor-pointer transform transition-all duration-300 hover:scale-[1.025] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100/80 hover:border-sky-400 hover:ring-2 hover:ring-sky-100/80 active:scale-95 active:translate-y-0 group select-none"
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-b border-sky-50 pb-1">
                          <span className="uppercase text-sky-600 font-extrabold tracking-wider group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                            Pengerjaan Ke-{tpl.total_dibuat} (Terakhir) • 📊 Lihat di Monitoring
                          </span>
                          <span>🕒 {tpl.dokumen_terakhir.waktu_dibuat}</span>
                        </div>
                        
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-xs group-hover:text-sky-600 transition-colors" title={tpl.dokumen_terakhir.nama_dokumen}>
                              {tpl.dokumen_terakhir.nama_dokumen}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              No. Dokumen: <span className="font-mono text-sky-800 font-bold">{tpl.dokumen_terakhir.nomor_dokumen}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-medium text-slate-500 block">Dikerjakan Oleh:</span>
                            <span className="text-xs font-black text-slate-800 bg-sky-50 group-hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-100 inline-block mt-0.5 transition-colors">
                              👤 {tpl.dokumen_terakhir.dikerjakan_oleh}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-xs text-slate-400 italic bg-[#F4F8FC]/50 p-3.5 rounded-xl border border-sky-100/80 text-center">
                        Belum ada dokumen yang dibuat menggunakan template ini.
                      </div>
                    )}

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