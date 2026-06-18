import React, { useState, useEffect } from 'react';

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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      alert(`File "${file.name}" terpilih!\nSistem siap mengunggah ke folder template.`);
    }
  };

  return (
    <div 
      className="bg-[#F4F7FA] text-slate-700 flex h-screen w-full overflow-hidden antialiased p-4 selection:bg-blue-200"
      style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ================= SIDEBAR KIRI ================= */}
      <aside className="w-64 bg-white/90 backdrop-blur-md rounded-[24px] flex flex-col justify-between p-6 shrink-0 h-full shadow-md shadow-blue-100/40 border border-blue-50">
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center space-x-3 px-2 py-3 mb-6">
              <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-400/20">S</div>
              <span className="text-xl font-black tracking-tight text-slate-800">Swift<span className="text-blue-500">File</span></span>
            </div>
            
            <nav className="space-y-1.5">
              <a href="#" className="flex items-center space-x-3 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold transition-all border-l-4 border-blue-500 shadow-sm">
                <span className="text-base">🏠</span> <span className="text-xs tracking-wide">Dashboard</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                <span className="text-base">📁</span> <span className="text-xs tracking-wide">File Template</span>
              </a>

              <div className="pt-3">
                <span className="px-4 text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Draft Dokumen</span>
                <div className="space-y-1 pl-2">
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all"><span className="text-blue-500">•</span> <span>BA Kerusakan</span></a>
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all"><span className="text-blue-500">•</span> <span>BA Penyerahan</span></a>
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all"><span className="text-blue-500">•</span> <span>Surat Tugas</span></a>
                </div>
              </div>

              <div className="pt-3">
                <a href="#" className="flex items-center justify-between text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                  <div className="flex items-center space-x-3"><span className="text-base">🖨️</span> <span className="text-xs tracking-wide">Siap Cetak</span></div>
                  <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">1</span>
                </a>
              </div>

              <a href="#" className="flex items-center space-x-3 text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                <span className="text-base">📚</span> <span className="text-xs tracking-wide">Arsip & History</span>
              </a>

              {/* FITUR BARU: Riwayat Monitoring */}
              <a href="#" className="flex items-center space-x-3 text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                <span className="text-base">📊</span> <span className="text-xs tracking-wide">Riwayat Monitoring</span>
              </a>
            </nav>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-xl flex items-center space-x-3 border border-blue-100/50">
            <div className="h-9 w-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">SU</div>
            <div className="truncate">
              <h4 className="text-xs font-black text-slate-900 truncate">Siti Karyawan</h4>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Divisi Administrasi</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= AREA KONTEN UTAMA ================= */}
      <main className="flex-1 flex flex-col px-8 py-2 overflow-y-auto h-full min-w-0">
        <div className="w-full space-y-6">
          <header className="flex justify-between items-center shrink-0 pt-2">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">SwiftFile Hub <span className="text-blue-500">Sucofindo</span></h1>
              <p className="text-xs text-slate-400 font-medium">Sistem integrasi arsip dan cetak dokumen digital operasional terpadu.</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* FITUR BARU: Tombol Upload Estetik */}
              <label className="cursor-pointer group flex items-center space-x-2 bg-white hover:bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-sm transition-all duration-300">
                <span className="text-blue-500 group-hover:scale-110 transition-transform">📂</span>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 uppercase tracking-wider">Upload Template</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".docx, .pdf" />
              </label>

              <div className="bg-white px-5 py-2 rounded-full shadow-sm text-xs text-blue-600 font-bold border border-blue-50 shrink-0">
                {currentDate}
              </div>
            </div>
          </header>

          {/* Section Statistik (Sama seperti sebelumnya) */}
          {/* ... */}
          
          {/* Section Konfirmasi Cetak */}
          {/* ... */}
          
        </div>
      </main>
    </div>
  );
}

export default Dashboard;