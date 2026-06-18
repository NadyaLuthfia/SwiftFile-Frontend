import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

function Dashboard() {
  const [currentDate, setCurrentDate] = useState('📅 Menghitung tanggal...');
  const [copies, setCopies] = useState(2);
  const [selectedPage, setSelectedPage] = useState('Semua Halaman (All)');

  useEffect(() => {
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
    setCurrentDate(`🔹 ${tanggalSekarang}`);
  }, []);

  const handlePrint = () => {
    alert(`Dokumen siap dicetak!\nJumlah: ${copies} Rangkap\nHalaman: ${selectedPage}`);
  };

  return (
    <div 
      className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-blue-200"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Font Injection */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Panggil Sidebar */}
      <Sidebar />

      {/* Area Konten */}
      <main className="flex-1 flex flex-col px-10 py-6 overflow-y-auto h-full min-w-0">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          
          {/* Header Atas */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                SwiftFile Hub <span className="text-blue-600">Sucofindo</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Sistem integrasi arsip dan cetak dokumen digital operasional terpadu.
              </p>
            </div>
            <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm text-xs text-blue-600 font-bold border border-blue-100/60 shadow-blue-100/20">
              {currentDate}
            </div>
          </header>

          {/* Grid Statistik */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Master Template', val: '3', unit: 'File', color: 'border-blue-500' },
              { label: 'Total di Draft', val: '2', unit: 'Berkas', color: 'border-blue-300' },
              { label: 'Antrean Cetak', val: '1', unit: 'Verifikasi', color: 'border-amber-400' },
              { label: 'Total Arsip Sah', val: '142', unit: 'Dokumen', color: 'border-emerald-400' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-b border-r border-t border-slate-100 transition-all hover:shadow-md">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {item.val} <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </section>

          {/* Card Tindakan */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Dokumen Siap Cetak</h3>
              <p className="text-xs text-slate-400 mt-1">Validasi berkas rampung. Silakan atur parameter halaman dan cetak dokumen resmi.</p>
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
                {/* Tombol Lihat File */}
                <button 
                  onClick={() => alert("Membuka pratinjau file...")} 
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <span>👁️</span> Lihat
                </button>

                <select 
                  value={selectedPage} 
                  onChange={(e) => setSelectedPage(e.target.value)} 
                  className="p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option>Semua Halaman (All)</option>
                  <option>Halaman 1 Saja</option>
                </select>
                
                <input 
                  type="number" 
                  value={copies} 
                  min="1" 
                  onChange={(e) => setCopies(e.target.value)} 
                  className="w-16 p-3 bg-white border border-slate-200 rounded-xl font-semibold text-center text-xs shadow-sm outline-none" 
                />
                
                <button 
                  onClick={handlePrint} 
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
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

export default Dashboard;