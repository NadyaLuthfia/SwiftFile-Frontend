import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

function DashboardMasterAdmin() {
  const [currentDate, setCurrentDate] = useState('📅 Menghitung tanggal...');
  const [copies, setCopies] = useState(1);
  const [selectedPage, setSelectedPage] = useState('Semua Halaman (All)');

  useEffect(() => {
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
    setCurrentDate(`🔹 ${tanggalSekarang}`);
  }, []);

  const handleUpload = () => alert("Membuka menu upload file template...");
  const handlePrint = () => alert(`Dokumen diprint sebanyak ${copies} rangkap.`);

  return (
    <div 
      className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-blue-200"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Font & Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-6 overflow-y-auto h-full min-w-0">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard <span className="text-blue-600">Master Admin</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Monitoring pusat, manajemen template, dan validasi dokumen.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                <span>+</span> Upload Template
              </button>
              <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm text-xs text-blue-600 font-bold border border-blue-100/60">{currentDate}</div>
            </div>
          </header>

          {/* Statistik */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Master Template', val: '3', unit: 'File' },
              { label: 'Total di Draft', val: '2', unit: 'Berkas' },
              { label: 'Antrean Cetak', val: '1', unit: 'Verifikasi' },
              { label: 'Total Arsip Sah', val: '142', unit: 'Dokumen' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {item.val} <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </section>

          {/* Konfirmasi Dokumen */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Dokumen Siap Cetak</h3>
              <p className="text-xs text-slate-400 mt-1">Validasi berkas rampung. Atur parameter halaman dan jumlah rangkap di sini.</p>
            </div>
            
            <div className="bg-slate-50/50 p-5 rounded-2xl flex flex-wrap items-center gap-6 border border-slate-100">
              <div className="flex items-center space-x-4 flex-1 min-w-[200px]">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-2xl border border-slate-100 shadow-sm">📄</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">001_BTG-VI_BA_Penyerahan.pdf</h4>
                  <p className="text-[11px] text-blue-500 font-semibold uppercase tracking-wide mt-0.5">Terverifikasi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2">👁️ Lihat</button>
                
                <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs shadow-sm outline-none">
                  <option>Semua Halaman (All)</option>
                </select>

                <input 
                  type="number" 
                  value={copies} 
                  min="1" 
                  onChange={(e) => setCopies(e.target.value)} 
                  className="w-16 p-3 bg-white border border-slate-200 rounded-xl font-bold text-center text-xs shadow-sm outline-none" 
                />
                
                <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-200">
                  Print & Arsipkan
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardMasterAdmin;