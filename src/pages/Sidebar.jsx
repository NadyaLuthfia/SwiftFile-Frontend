import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const globalFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const navigate = useNavigate(); 
  const location = useLocation(); 

  // 🚪 FUNGSI LOGOUT: Bersihkan data & langsung pindah rute secara fisik ke /login
  const handleLogout = () => {
    localStorage.clear(); 
    window.location.href = '/login'; 
  };

  // 👑 Mengambil role user yang sedang login dari localStorage
  const userRole = localStorage.getItem('role'); 

  const isDashboard = 
    location.pathname === '/dashboard' || 
    location.pathname === '/admin-dashboard' || 
    location.pathname === '/master-dashboard' || 
    location.pathname === '/';
    
  const isTemplate = location.pathname === '/file-template';
  const isDraftPage = location.pathname === '/draft-dokumen'; 
  const isSiapCetak = location.pathname === '/siap-cetak'; 
  const isArsip = location.pathname === '/arsip-history'; 
  const isManagementData = location.pathname === '/management-data'; 
  
  // 🔍 Indikator halaman monitoring aktif
  const isMonitoring = location.pathname === '/monitoring-data'; 

  // 🌟 FIX LOGIKA REDIRECT: Arahkan ke halaman dashboard yang pas dengan role-nya
  const handleDashboardRedirect = () => {
    if (userRole === 'master_admin') {
      navigate('/master-dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <aside 
      className="w-64 bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden"
      style={globalFont}
    >
      {/* LOGO AREA */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200">
          S
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Swift<span className="text-blue-600">File</span>
        </h1>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        {/* Menu Utama */}
        <div className="space-y-1">
          
          {/* TOMBOL DASHBOARD */}
          <button 
            onClick={handleDashboardRedirect}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isDashboard 
                ? 'bg-slate-50 text-slate-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
            }`}
          >
            <span className="text-base">🏠</span>
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          {/* TOMBOL FILE TEMPLATE */}
          <button 
            onClick={() => navigate('/file-template')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isTemplate 
                ? 'bg-slate-50 text-slate-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
            }`}
          >
            <span className="text-base">📁</span>
            <span className="text-sm font-bold">File Template</span>
          </button>

          {/* TOMBOL DRAFT DOKUMEN */}
          <button 
            onClick={() => navigate('/draft-dokumen')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isDraftPage 
                ? 'bg-slate-50 text-slate-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
            }`}
          >
            <span className="text-base">📄</span>
            <span className="text-sm font-bold">Draft Dokumen</span>
          </button>
        </div>

        {/* STATUS & PROSES */}
        <div className="pt-4 space-y-1 border-t border-slate-100/60">
          
          {/* TOMBOL SIAP CETAK */}
          <button 
            onClick={() => navigate('/siap-cetak')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isSiapCetak 
                ? 'bg-slate-50 text-slate-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🖨️</span>
              <span className="text-sm font-bold">Siap Cetak</span>
            </div>
          </button>

          {/* TOMBOL ARSIP & HISTORY */}
          <button 
            onClick={() => navigate('/arsip-history')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              isArsip 
                ? 'bg-slate-50 text-slate-900 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
            }`}
          >
            <span className="text-base">📚</span>
            <span className="text-sm font-bold">Arsip & History</span>
          </button>
        </div>

        {/* 👁️ MENU BARU: MONITORING DATA (Hanya muncul untuk Admin & Master Admin) */}
        {(userRole === 'admin' || userRole === 'master_admin') && (
          <div className="pt-4 border-t border-slate-100/60 mt-2">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-4 mb-2">
              Supervision
            </p>
            <button 
              onClick={() => navigate('/monitoring-data')} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                isMonitoring 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
              }`}
            >
              <span className="text-base">🔍</span>
              <span className="text-sm font-bold">Monitoring Data</span>
            </button>
          </div>
        )}

        {/* 👑 MENU MANAGEMENT DATA (Hanya Master Admin) */}
        {(userRole === 'admin' || userRole === 'master_admin') && (
          <div className="pt-2">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-4 mb-2">
              Master Admin
            </p>
            <button 
              onClick={() => navigate('/management-data')} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                isManagementData 
                  ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' 
              }`}
            >
              <span className="text-base">⚙️</span>
              <span className="text-sm font-bold">Management Data</span>
            </button>
          </div>
        )}

      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-orange-600 hover:bg-orange-50 font-bold text-sm transition-all cursor-pointer"
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;