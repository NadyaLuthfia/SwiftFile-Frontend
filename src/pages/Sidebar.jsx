import React from 'react';

function Sidebar() {
  const globalFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <aside 
      className="w-64 bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden"
      style={globalFont}
    >
      {/* LOGO AREA - Lebih Compact */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-9 w-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200">
          S
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Swift<span className="text-violet-600">File</span>
        </h1>
      </div>

      {/* NAVIGATION - Ukuran Sedang */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        {/* Menu Utama */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 shadow-sm border border-slate-100 transition-all">
            <span className="text-base">🏠</span>
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <span className="text-base">📁</span>
            <span className="text-sm font-bold">File Template</span>
          </button>
        </div>

        {/* SECTION: DRAFT DOKUMEN - Tanpa Titik & Center */}
        <div className="pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-2">
            Draft Dokumen
          </p>
          <div className="space-y-1">
            {["BA Kerusakan", "BA Penyerahan", "Surat Tugas"].map((item) => (
              <button 
                key={item}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white text-center transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* STATUS & PROSES */}
        <div className="pt-4 space-y-1">
          <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-base">🖨️</span>
              <span className="text-sm font-bold">Siap Cetak</span>
            </div>
            <span className="bg-violet-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full">1</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <span className="text-base">📚</span>
            <span className="text-sm font-bold">Arsip & History</span>
          </button>
        </div>
      </nav>

      {/* LOGOUT - Di Bawah */}
      <div className="p-4 border-t border-slate-50">
        <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-orange-600 hover:bg-orange-50 font-bold text-sm transition-all">
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;