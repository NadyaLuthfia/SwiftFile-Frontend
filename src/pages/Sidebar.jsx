import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// FIX PATH: dari ../context ke ../context karena Sidebar ada di src/pages/
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const globalFont = { fontFamily: "'Poppins', sans-serif" };
  const navigate = useNavigate(); 
  const location = useLocation(); 

  const auth = useAuth();
  
  // PERBAIKAN: Ambil role dari Context atau langsung dari localStorage sebagai cadangan
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const rawRole = auth?.role || auth?.user?.role || storedUser?.role || localStorage.getItem('role') || '';
  const userRole = String(rawRole).toLowerCase().trim();

  const handleLogout = () => {
    // 1. Bersihkan semua storage
    localStorage.clear();
    sessionStorage.clear();

    // 2. Panggil auth logout jika ada
    if (auth?.logoutUser) auth.logoutUser();
    else if (auth?.logout) auth.logout();

    // 3. Pakai hard redirect ke /login
    window.location.href = '/login';
  };

  const handleDashboardRedirect = () => {
    if (userRole === 'master_admin' || userRole === 'master admin' || userRole === 'master_user') {
      navigate('/master-dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const getMenuClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer text-sm transition-transform duration-150 active:scale-95 select-none";
    
    if (isActive) {
      return `${baseClass} bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-300/50`;
    }
    
    return `${baseClass} text-slate-600 font-semibold hover:bg-white hover:text-sky-600 hover:shadow-xs border border-transparent hover:border-sky-100/60`;
  };

  // Cek apakah role termasuk admin, master admin, atau master user
  const isAdminOrMaster = ['admin', 'master_admin', 'master admin', 'master_user', 'master user'].includes(userRole);

  return (
    <aside 
      className="w-64 bg-[#F4F8FC] border-r border-sky-100 flex flex-col h-full overflow-hidden shadow-xs"
      style={globalFont}
    >
      {/* LOGO AREA */}
      <div className="pt-7 pb-5 px-6 flex flex-col items-center justify-center text-center gap-2.5 select-none mb-2">
        <img 
          src="/logo-sucofindo.png" 
          alt="Logo Sucofindo" 
          className="h-16 w-auto object-contain drop-shadow-xs translate-x-1.5" 
        />
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Suco<span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">File</span>
        </h1>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar">
        
        {/* Menu Utama */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-sky-800 uppercase tracking-[0.15em] px-4 mb-2 select-none">
            Menu Utama
          </p>
          
          <button 
            type="button"
            onClick={handleDashboardRedirect}
            className={getMenuClass('/dashboard')}
          >
            <span className="text-base">🏠</span>
            <span>Dashboard</span>
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/file-template')} 
            className={getMenuClass('/file-template')}
          >
            <span className="text-base">📁</span>
            <span>File Template</span>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/draft-dokumen')} 
            className={getMenuClass('/draft-dokumen')}
          >
            <span className="text-base">📄</span>
            <span>Draft Dokumen</span>
          </button>
        </div>

        {/* PROSES DOKUMEN */}
        <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
          <p className="text-[10px] font-black text-sky-800 uppercase tracking-[0.15em] px-4 mb-2 select-none">
            Proses Dokumen
          </p>
          
          <button 
            type="button"
            onClick={() => navigate('/siap-cetak')}
            className={getMenuClass('/siap-cetak')}
          >
            <span className="text-base">🖨️</span>
            <span>Siap Cetak</span>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/arsip-history')}
            className={getMenuClass('/arsip-history')}
          >
            <span className="text-base">📚</span>
            <span>Arsip & History</span>
          </button>
        </div>

        {/* MONITORING DATA */}
        {isAdminOrMaster && (
          <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-4 mb-2 select-none">
              Supervision
            </p>
            <button 
              type="button"
              onClick={() => navigate('/monitoring-data')} 
              className={getMenuClass('/monitoring-data')}
            >
              <span className="text-base">🔍</span>
              <span>Monitoring Data</span>
            </button>
          </div>
        )}

        {/* MANAGEMENT DATA */}
        {isAdminOrMaster && (
          <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] px-4 mb-2 select-none">
              Administration
            </p>
            <button 
              type="button"
              onClick={() => navigate('/management-data')} 
              className={getMenuClass('/management-data')}
            >
              <span className="text-base">⚙️</span>
              <span>Management Data</span>
            </button>
          </div>
        )}

      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t border-sky-100/80">
        <button 
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold text-sm transition-transform duration-150 active:scale-95 cursor-pointer border border-transparent hover:border-rose-100 select-none"
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;