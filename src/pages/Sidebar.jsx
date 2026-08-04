import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  // 🎯 FONT POPPINS TETAP DIJAGA YA SENG!
  const globalFont = { fontFamily: "'Poppins', sans-serif" };
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

  // 🎨 STYLING HELPER: HANYA ANIMASI SAAT TEKAN/KLIK (active:scale-95)
  const getMenuClass = (isActive) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer text-sm transition-transform duration-150 active:scale-95 select-none";
    
    if (isActive) {
      // 🌟 KOTAK GRADASI BIRU DENGAN BAYANGAN ELEGAN
      return `${baseClass} bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-300/50`;
    }
    
    // ⚪ KOTAK INAKTIF
    return `${baseClass} text-slate-600 font-semibold hover:bg-white hover:text-sky-600 hover:shadow-xs border border-transparent hover:border-sky-100/60`;
  };

  return (
    <aside 
      className="w-64 bg-[#F4F8FC] border-r border-sky-100 flex flex-col h-full overflow-hidden shadow-xs"
      style={globalFont}
    >
      {/* LOGO AREA SUCOFINDO (DENGAN OPTICAL ALIGNMENT UNTUK KESAJARAN SIKU VISUAL) */}
      <div className="pt-7 pb-5 px-6 flex flex-col items-center justify-center text-center gap-2.5 select-none mb-2">
        {/* Gambar Logo Sucofindo (Menggunakan translate-x-1.5 agar teks SUCOFINDO lurus sejajar dengan SucoFile) */}
        <img 
          src="/logo-sucofindo.png" 
          alt="Logo Sucofindo" 
          className="h-16 w-auto object-contain drop-shadow-xs translate-x-1.5" 
        />
        {/* Teks SucoFile */}
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
          
          {/* TOMBOL DASHBOARD */}
          <button 
            onClick={handleDashboardRedirect}
            className={getMenuClass(isDashboard)}
          >
            <span className="text-base">🏠</span>
            <span>Dashboard</span>
          </button>
          
          {/* TOMBOL FILE TEMPLATE */}
          <button 
            onClick={() => navigate('/file-template')} 
            className={getMenuClass(isTemplate)}
          >
            <span className="text-base">📁</span>
            <span>File Template</span>
          </button>

          {/* TOMBOL DRAFT DOKUMEN */}
          <button 
            onClick={() => navigate('/draft-dokumen')} 
            className={getMenuClass(isDraftPage)}
          >
            <span className="text-base">📄</span>
            <span>Draft Dokumen</span>
          </button>
        </div>

        {/* STATUS & PROSES */}
        <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
          <p className="text-[10px] font-black text-sky-800 uppercase tracking-[0.15em] px-4 mb-2 select-none">
            Proses Dokumen
          </p>
          
          {/* TOMBOL SIAP CETAK */}
          <button 
            onClick={() => navigate('/siap-cetak')}
            className={getMenuClass(isSiapCetak)}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🖨️</span>
              <span>Siap Cetak</span>
            </div>
          </button>

          {/* TOMBOL ARSIP & HISTORY */}
          <button 
            onClick={() => navigate('/arsip-history')}
            className={getMenuClass(isArsip)}
          >
            <span className="text-base">📚</span>
            <span>Arsip & History</span>
          </button>
        </div>

        {/* 👁️ MENU BARU: MONITORING DATA (Hanya muncul untuk Admin & Master Admin) */}
        {(userRole === 'admin' || userRole === 'master_admin') && (
          <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-4 mb-2 select-none">
              Supervision
            </p>
            <button 
              onClick={() => navigate('/monitoring-data')} 
              className={getMenuClass(isMonitoring)}
            >
              <span className="text-base">🔍</span>
              <span>Monitoring Data</span>
            </button>
          </div>
        )}

        {/* 👑 MENU MANAGEMENT DATA (Hanya Master Admin / Admin) */}
        {(userRole === 'admin' || userRole === 'master_admin') && (
          <div className="pt-3 space-y-1.5 border-t border-sky-100/80">
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] px-4 mb-2 select-none">
              Master Admin
            </p>
            <button 
              onClick={() => navigate('/management-data')} 
              className={getMenuClass(isManagementData)}
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