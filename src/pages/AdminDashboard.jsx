import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState('');
  const [activeTab, setActiveTab] = useState('belum-ttd');
  const [previewFile, setPreviewFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Fitur Search State

  const archiveList = [
    { id: '001', namaFile: '001_BTG-VI_BA_Penyerahan.pdf', statusTTD: 'belum-ttd', tanggal: '17 Juni 2026', tipe: 'BA Penyerahan', detailBarang: 'Laptop Lenovo', jumlah: 2, satuan: 'unit', KeteranganAtauPenerima: 'diserahkan ke Budi', fotoTTD: null },
    { id: '003', namaFile: '003_BTG-VI_Surat_Tugas.pdf', statusTTD: 'sudah-ttd', tanggal: '16 Juni 2026', tipe: 'Surat Tugas', detailBarang: 'Inspeksi Sektor 3', jumlah: 1, satuan: 'kegiatan', KeteranganAtauPenerima: 'Budi Inspector', fotoTTD: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23' },
  ];

  // Logika Filter: Cari berdasarkan status tab DAN kata kunci pencarian
  const filteredData = archiveList.filter(item => 
    item.statusTTD === activeTab && 
    item.namaFile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    setCurrentDate(`🔹 ${tanggalSekarang}`);
  }, []);

  return (
    <div className="bg-[#F4F7FA] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white/90 backdrop-blur-md rounded-[24px] flex flex-col justify-between p-6 m-4 shrink-0 shadow-md border border-blue-50">
        <div>
          <div className="flex items-center space-x-3 px-2 py-3 mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-slate-800 h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md">A</div>
            <span className="text-xl font-black tracking-tight text-slate-800">Swift<span className="text-blue-500">Admin</span></span>
          </div>
          <nav className="space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">View Data</div>
            <div className="flex items-center space-x-3 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold border-l-4 border-blue-500 shadow-sm">
              <span>🖥️</span> <span className="text-xs">Monitoring Global</span>
            </div>
          </nav>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Status Sistem</div>
          <div className="flex items-center gap-2 mt-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-bold text-amber-800">Monitoring Aktif</span></div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col px-8 py-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Panel Monitoring <span className="text-blue-500">Arsip</span></h1>
          </div>
          <div className="bg-white px-5 py-2 rounded-full shadow-sm text-xs text-blue-600 font-bold border border-blue-50">{currentDate}</div>
        </header>

        {/* SEARCH BAR */}
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="🔍 Cari dokumen berdasarkan nama..." 
            className="w-full max-w-lg px-6 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <section className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100">
          {/* Tab buttons ... (sama seperti sebelumnya) */}
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase"><tr><th className="p-3">Nama Dokumen</th><th className="p-3">Kategori</th><th className="p-3">Tanggal</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} onDoubleClick={() => setPreviewFile(item)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="p-3 font-semibold">{item.namaFile}</td>
                  <td className="p-3">{item.tipe}</td>
                  <td className="p-3">{item.tanggal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      
      {/* Modal Preview ... (sama seperti sebelumnya) */}
    </div>
  );
}

export default AdminDashboard;