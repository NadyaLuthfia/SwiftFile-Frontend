import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState('📅 Menghitung tanggal...');
  const [activeTab, setActiveTab] = useState('belum-ttd');
  const [previewFile, setPreviewFile] = useState(null);

  // DATA DATABASE: Bersih tanpa pengenal akun pengirim (Fokus murni ke konten dokumen)
  const [archiveList] = useState([
    { 
      id: '001', 
      namaFile: '001_BTG-VI_BA_Penyerahan_Laptop.pdf', 
      statusTTD: 'belum-ttd', 
      tanggal: '17 Juni 2026', 
      tipe: 'BA Penyerahan',
      detailBarang: 'Laptop merk Lenovo',
      jumlah: 2,
      satuan: 'unit',
      KeteranganAtauPenerima: 'diserahkan kepada Budi Santoso',
      fotoTTD: null 
    },
    { 
      id: '003', 
      namaFile: '003_BTG-VI_Surat_Tugas_Balikpapan_SIGNED.pdf', 
      statusTTD: 'sudah-ttd', 
      tanggal: '16 Juni 2026', 
      tipe: 'Surat Tugas',
      detailBarang: 'Inspeksi Lapangan Sektor 3',
      jumlah: 1,
      satuan: 'kegiatan',
      KeteranganAtauPenerima: 'ditugaskan kepada Budi Inspector',
      fotoTTD: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop' 
    },
    { 
      id: '004', 
      namaFile: '004_BTG-VI_BA_Kerusakan_PC_SIGNED.pdf', 
      statusTTD: 'sudah-ttd', 
      tanggal: '15 Juni 2026', 
      tipe: 'BA Kerusakan',
      detailBarang: 'PC Desktop iMac v5',
      jumlah: 1,
      satuan: 'unit',
      KeteranganAtauPenerima: 'mengalami kerusakan pada layar monitor',
      fotoTTD: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'
    },
  ]);

  useEffect(() => {
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
    setCurrentDate(`🔹 ${tanggalSekarang}`);
  }, []);

  const filteredData = archiveList.filter(item => item.statusTTD === activeTab);
  const countBelumTTD = archiveList.filter(item => item.statusTTD === 'belum-ttd').length;
  const countSudahTTD = archiveList.filter(item => item.statusTTD === 'sudah-ttd').length;

  return (
    <div className="bg-[#F4F7FA] text-slate-700 flex h-screen w-full overflow-hidden antialiased p-4 relative" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside className="w-64 bg-white/90 backdrop-blur-md rounded-[24px] flex flex-col justify-between p-6 shrink-0 h-full shadow-md shadow-blue-100/40 border border-blue-50">
        <div>
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-slate-800 h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md">A</div>
            <span className="text-xl font-black tracking-tight text-slate-800">Swift<span className="text-blue-500">Admin</span></span>
          </div>
          <nav className="space-y-1.5">
            <a href="#" className="flex items-center space-x-3 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold border-l-4 border-blue-500 shadow-sm">
              <span>🖥️</span> <span className="text-xs tracking-wide">Monitoring Global</span>
            </a>
          </nav>
        </div>
        <div className="bg-amber-50 p-3.5 rounded-xl flex items-center border border-amber-100">
          <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Shared Monitoring Account</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-8 py-2 overflow-y-auto h-full min-w-0">
        <div className="w-full space-y-6">
          <header className="flex justify-between items-center pt-2">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel Monitoring <span className="text-blue-500">Arsip</span></h1>
              <p className="text-xs text-slate-400 font-medium">💡 Klik 2 kali pada baris file untuk melihat rangkuman kalimat database &amp; bukti fisik.</p>
            </div>
            <div className="bg-white px-5 py-2 rounded-full shadow-sm text-xs text-blue-600 font-bold border border-blue-50">{currentDate}</div>
          </header>

          {/* Statistik */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-blue-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Master Data</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{archiveList.length} Berkas</p>
            </div>
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-amber-400">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum TTD</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{countBelumTTD} Dokumen</p>
            </div>
            <div className="bg-white p-5 rounded-[16px] shadow-sm border-l-4 border-emerald-400">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sah (Sudah TTD Real)</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{countSudahTTD} Dokumen</p>
            </div>
          </section>

          {/* Area Tabel */}
          <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 w-full">
            <div className="flex space-x-2 border-b border-slate-100 pb-4 mb-4">
              <button onClick={() => setActiveTab('belum-ttd')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'belum-ttd' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>⏳ Belum di-TTD ({countBelumTTD})</button>
              <button onClick={() => setActiveTab('sudah-ttd')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'sudah-ttd' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>✅ Arsip Sah / TTD Real ({countSudahTTD})</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] border-b border-slate-100">
                    <th className="p-3 font-bold w-12 text-center">No</th>
                    <th className="p-3 font-bold">Nama Dokumen Berkas (Klik 2x)</th>
                    <th className="p-3 font-bold">Kategori Dokumen</th>
                    <th className="p-3 font-bold">Tanggal Pembuatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr key={item.id} onClick={() => setPreviewFile(item)} className="hover:bg-slate-50/50 cursor-pointer select-none">
                        <td className="p-3 text-center text-slate-400 font-medium">{index + 1}</td>
                        <td className="p-3 font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                          {activeTab === 'sudah-ttd' ? '🔏' : '📄'} <span className="truncate max-w-[300px]">{item.namaFile}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-500">{item.tipe}</td>
                        <td className="p-3 text-slate-400">{item.tanggal}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">Tidak ada arsip di kategori ini, sayang. ✨</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Pop-up Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 truncate max-w-[350px]">{previewFile.namaFile}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tanggal Input: {previewFile.tanggal}</p>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {/* Kalimat Kronologi Otomatis dari Database */}
            <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl mb-4">
              <span className="text-[9px] font-bold text-blue-500 uppercase block mb-1">📝 Rangkuman Database Dokumen:</span>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                "{previewFile.detailBarang}, jumlah {previewFile.jumlah} {previewFile.satuan}, yang {previewFile.KeteranganAtauPenerima} pada tanggal {previewFile.tanggal}."
              </p>
            </div>

            {/* Gambar Lampiran */}
            {previewFile.fotoTTD ? (
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                <img src={previewFile.fotoTTD} alt="Bukti Tanda Tangan" className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-sm">BUKTI VALID TTD REAL</span>
              </div>
            ) : (
              <div className="bg-amber-50/50 border border-dashed border-amber-200 text-amber-700 p-4 rounded-xl text-center text-[11px] font-semibold">
                📭 Berkas ini baru draf digital mentah, belum ada upload scan tanda tangan fisiknya.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;