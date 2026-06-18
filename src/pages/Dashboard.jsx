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

  return (
    // Penyelamat Font: Kita bungkus pakai style font-family "Poppins" (Font sejuta umat halaman login estetik)
    <div 
      className="bg-[#F4F7FA] text-slate-700 flex h-screen w-full overflow-hidden antialiased p-4 selection:bg-blue-200"
      style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
    >
      {/* LINK INJECTOR: Memanggil font login langsung dari Google tanpa ubah file css lain */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ================= SIDEBAR KIRI ================= */}
      <aside className="w-64 bg-white/90 backdrop-blur-md rounded-[24px] flex flex-col justify-between p-6 shrink-0 h-full shadow-md shadow-blue-100/40 border border-blue-50">
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo Brand */}
            <div className="flex items-center space-x-3 px-2 py-3 mb-6">
              <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-400/20">
                S
              </div>
              <span className="text-xl font-black tracking-tight text-slate-800">
                Swift<span className="text-blue-500">File</span>
              </span>
            </div>
            
            {/* Menu Navigasi */}
            <nav className="space-y-1.5">
              <a href="#" className="flex items-center space-x-3 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold transition-all border-l-4 border-blue-500 shadow-sm">
                <span className="text-base">🏠</span> 
                <span className="text-xs tracking-wide">Dashboard</span>
              </a>

              <a href="#" className="flex items-center space-x-3 text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                <span className="text-base">📁</span> 
                <span className="text-xs tracking-wide">File Template</span>
              </a>

              <div className="pt-3">
                <span className="px-4 text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">
                  Draft Dokumen
                </span>
                <div className="space-y-1 pl-2">
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                    <span className="text-blue-500">•</span> <span>BA Kerusakan</span>
                  </a>
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                    <span className="text-blue-500">•</span> <span>BA Penyerahan</span>
                  </a>
                  <a href="#" className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                    <span className="text-blue-500">•</span> <span>Surat Tugas</span>
                  </a>
                </div>
              </div>

              <div className="pt-3">
                <a href="#" className="flex items-center justify-between text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                  <div className="flex items-center space-x-3">
                    <span className="text-base">🖨️</span> 
                    <span className="text-xs tracking-wide">Siap Cetak</span>
                  </div>
                  <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    1
                  </span>
                </a>
              </div>

              <a href="#" className="flex items-center space-x-3 text-slate-900 hover:bg-blue-50/50 hover:text-blue-600 px-4 py-3 rounded-xl font-bold transition-all">
                <span className="text-base">📚</span> 
                <span className="text-xs tracking-wide">Arsip & History</span>
              </a>
            </nav>
          </div>

          {/* Profil Akun Karyawan */}
          <div className="bg-blue-50/60 p-3.5 rounded-xl flex items-center space-x-3 border border-blue-100/50">
            <div className="h-9 w-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              SU
            </div>
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
          
          {/* Header Atas */}
          <header className="flex justify-between items-center shrink-0 pt-2">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                SwiftFile Hub <span className="text-blue-500">Sucofindo</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Sistem integrasi arsip dan cetak dokumen digital operasional terpadu.
              </p>
            </div>
            <div className="bg-white px-5 py-2 rounded-full shadow-sm text-xs text-blue-600 font-bold border border-blue-50 shrink-0">
              {currentDate}
            </div>
          </header>

          {/* Section Grid Informasi Statistik */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-blue-500 transition-all duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Template</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                3 <span className="text-xs font-normal text-slate-400">File</span>
              </p>
            </div>
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-blue-300 transition-all duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total di Draft</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                2 <span className="text-xs font-normal text-slate-400">Berkas</span>
              </p>
            </div>
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-amber-400 transition-all duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Antrean Siap Cetak</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                1 <span className="text-xs font-normal text-slate-400">Verifikasi</span>
              </p>
            </div>
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-emerald-400 transition-all duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Arsip Sah</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                142 <span className="text-xs font-normal text-slate-400">Dokumen</span>
              </p>
            </div>
          </section>

          {/* Section Kartu Tindakan Konfirmasi Cetak */}
          <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 w-full">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <span className="text-blue-500">▪️</span> 
                  <span>Konfirmasi Dokumen Siap Cetak</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Validasi berkas rampung. Silakan atur parameter halaman dan cetak dokumen resmi.
                </p>
              </div>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 shrink-0">
                Otorisasi Berkas
              </span>
            </div>

            {/* Kotak Detail Berkas */}
            <div className="bg-slate-50 p-4 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full border border-slate-100">
              
              {/* 1. Judul Dokumen */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span className="text-xl shrink-0">📄</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title="001_BTG-VI_BA_Penyerahan_Laptop.pdf">
                    001_BTG-VI_BA_Penyerahan_Laptop.pdf
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Berita Acara Penyerahan · Terverifikasi</p>
                </div>
              </div>

              {/* 2. Pilihan Halaman */}
              <div className="w-full xl:w-44 shrink-0">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Pilih Halaman</label>
                <select 
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none text-[11px] shadow-sm focus:border-blue-400"
                >
                  <option>Semua Halaman (All)</option>
                  <option>Halaman 1 Saja</option>
                  <option>Halaman Lampiran Foto</option>
                </select>
              </div>

              {/* 3. Jumlah Rangkap */}
              <div className="w-20 shrink-0">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 text-center">Jumlah</label>
                <input 
                  type="number" 
                  value={copies} 
                  min="1" 
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-center text-slate-700 outline-none text-[11px] shadow-sm focus:border-blue-400"
                />
              </div>

              {/* 4. Tombol Upload TTD */}
              <div className="bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 px-4 h-9 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-sm shrink-0 xl:mt-4">
                <span className="text-xs">📸</span>
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Upload TTD</span>
              </div>

              {/* 5. Tombol Cetak Biru */}
              <button 
                onClick={handlePrint}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 h-9 rounded-lg text-[11px] font-bold shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center justify-center shrink-0 xl:mt-4"
              >
                🖨️ Print &amp; Arsipkan
              </button>

            </div>
          </section>

        </div>
      </main>

    </div>
  );
}

export default Dashboard;