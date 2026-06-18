import React, { useState } from 'react';
import Sidebar from './Sidebar';

function ArsipHistory() {
  const [searchTerm, setSearchTerm] = useState("");

  // Data Contoh
  const dataUploadTTD = [
    { id: 1, nama: '001_BTG-VI_BA_Penyerahan.pdf', tanggal: '18 Juni 2026' },
  ];
  const dataRiwayatCetak = [
    { id: 2, nama: '005_BTG-VI_BA_Kerusakan.pdf', tanggal: '17 Juni 2026' },
    { id: 3, nama: '009_BTG-VI_BA_Pemusnahan.pdf', tanggal: '16 Juni 2026' },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Arsip & History</h1>
          </div>
          <input 
            type="text" 
            placeholder="Cari dokumen..." 
            className="px-5 py-3 w-72 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </header>

        {/* LAYOUT GRID 2 KOLOM */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* KOLOM 1: HASIL UPLOAD TTD (SUDAH SELESAI) */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="h-2 w-2 bg-emerald-500 rounded-full"></span> Hasil Upload TTD
            </h3>
            {dataUploadTTD.filter(f => f.nama.toLowerCase().includes(searchTerm.toLowerCase())).map(file => (
              <div key={file.id} className="h-20 bg-white px-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between border-l-4 border-l-emerald-500">
                <h4 className="text-xs font-bold text-slate-900 truncate">{file.nama}</h4>
                <button className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md">Detail</button>
              </div>
            ))}
          </section>

          {/* KOLOM 2: RIWAYAT CETAK (BELUM UPLOAD) */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="h-2 w-2 bg-blue-500 rounded-full"></span> Riwayat Cetak
            </h3>
            {dataRiwayatCetak.filter(f => f.nama.toLowerCase().includes(searchTerm.toLowerCase())).map(file => (
              <div key={file.id} className="h-20 bg-white px-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between border-l-4 border-l-blue-500">
                <h4 className="text-xs font-bold text-slate-900 truncate">{file.nama}</h4>
                <button className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-md">Detail</button>
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
}

export default ArsipHistory;