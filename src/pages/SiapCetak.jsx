import React, { useState } from 'react';
import Sidebar from './Sidebar';

function SiapCetak() {
  const [belumCetak, setBelumCetak] = useState([
    { id: 1, nama: '001_BTG-VI_BA_Penyerahan.pdf', halaman: '1-3', rangkap: 5 },
    { id: 2, nama: '005_BTG-VI_BA_Kerusakan.pdf', halaman: '1-1', rangkap: 2 },
  ]);

  const [menungguUpload, setMenungguUpload] = useState([
    { id: 3, nama: '003_BTG-VI_BA_Selesai.pdf' }
  ]);

  const handlePrintAction = (id) => {
    const file = belumCetak.find(f => f.id === id);
    setMenungguUpload([...menungguUpload, file]);
    setBelumCetak(belumCetak.filter(f => f.id !== id));
  };

  const handleUploadAction = (id) => {
    setMenungguUpload(menungguUpload.filter(f => f.id !== id));
    alert("Bukti TTD berhasil diunggah!");
  };

  return (
    // Memastikan font tetap Plus Jakarta Sans
    <div 
      className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Antrean Siap Cetak</h1>
        </header>

        <div className="grid grid-cols-2 gap-8">
          
          {/* KOLOM 1: BELUM DICETAK */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="h-2 w-2 bg-blue-600 rounded-full"></span> Belum Dicetak
            </h3>
            {belumCetak.map((file) => (
              /* h-20 lebih kecil dari sebelumnya, border-l-blue-500 tetap */
              <div key={file.id} className="h-20 bg-white px-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate w-1/2">{file.nama}</h4>
                <div className="flex items-center gap-2">
                  <input type="text" defaultValue={file.halaman} className="w-12 p-1.5 bg-slate-50 border rounded-md font-bold text-[10px] text-center" />
                  <input type="number" defaultValue={file.rangkap} className="w-10 p-1.5 bg-slate-50 border rounded-md font-bold text-[10px] text-center" />
                  <button onClick={() => handlePrintAction(file.id)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 transition-all">PRINT</button>
                </div>
              </div>
            ))}
          </section>

          {/* KOLOM 2: MENUNGGU UPLOAD */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="h-2 w-2 bg-amber-500 rounded-full"></span> Menunggu Bukti Upload
            </h3>
            {menungguUpload.map((file) => (
              /* h-20 dan border-l-amber-400 */
              <div key={file.id} className="h-20 bg-white px-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-amber-400 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate w-1/2">{file.nama}</h4>
                <label className="cursor-pointer bg-violet-600 text-white px-5 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-violet-700 transition-all">
                  UPLOAD
                  <input type="file" className="hidden" onChange={() => handleUploadAction(file.id)} />
                </label>
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
}

export default SiapCetak;