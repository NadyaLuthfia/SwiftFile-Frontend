import React, { useState, useRef, useEffect } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔔 State Notifikasi & Timer Ref
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' | 'error' | 'info'
  });
  const toastTimerRef = useRef(null);

  // 💡 Fungsi Bantuan Notifikasi (Otomatis Tutup 2 Detik)
  const showToast = (message, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    
    setNotification({ show: true, message: String(message), type });
    toastTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('user_name', data.user.nama);

        const role = data.user.role;
        
        // ✨ NOTIFIKASI SUKSES (DIPERBARUI)
        showToast('Login berhasil. Sedang mengalihkan...', 'success');
        
        setTimeout(() => {
          if (role === 'master_admin') {
            window.location.href = '/master-dashboard';
          } 
          else if (role === 'admin') {
            window.location.href = '/admin-dashboard'; 
          } 
          else {
            window.location.href = '/dashboard'; 
          }
        }, 1000);

      } else {
        // ✨ NOTIFIKASI GAGAL LOGIN (DIPERBARUI)
        showToast(data.message || 'Login gagal. Pastikan username dan kata sandi yang Anda masukkan benar.', 'error');
      }
    } catch (error) {
      console.error('Kesalahan koneksi:', error);
      // ✨ NOTIFIKASI ERROR SERVER (DIPERBARUI)
      showToast('Koneksi ke server gagal. Silakan hubungi tim IT atau coba beberapa saat lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-[#F4F8FC] flex items-center justify-center min-h-screen antialiased w-full relative overflow-hidden px-4 selection:bg-sky-200"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* 🌟 KEYFRAMES ANIMASI NOTIFIKASI */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.7); }
          70% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop {
          animation: popIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck 0.4s ease-in-out 0.1s forwards;
        }
      `}</style>

      {/* 🌟 MODAL NOTIFIKASI */}
      {notification.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-sky-100 w-[340px] p-6 text-center space-y-4 animate-pop relative">
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${
              notification.type === 'success' 
                ? 'bg-emerald-100/90 text-emerald-600 border-emerald-200/60' 
                : notification.type === 'info'
                ? 'bg-sky-100/90 text-sky-600 border-sky-200/60'
                : 'bg-rose-100/90 text-rose-600 border-rose-200/60'
            }`}>
              {notification.type === 'success' ? (
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                  <path className="animate-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : notification.type === 'info' ? (
                <span className="text-2xl">ℹ️</span>
              ) : (
                <span className="text-2xl">⚠️</span>
              )}
            </div>

            <div className="space-y-1.5 pb-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {notification.type === 'success' ? 'Berhasil' : notification.type === 'info' ? 'Informasi' : 'Peringatan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🌸 DEKORASI LATAR BELAKANG */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-300/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-10 right-1/3 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* 💳 KARTU LOGIN UTAMA */}
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[36px] shadow-xl shadow-sky-100/80 border border-sky-100/80 w-full max-w-[410px] relative z-10 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-200/50">
        
        {/* Header Logo */}
        <div className="text-center relative z-10 mb-8 select-none flex flex-col items-center justify-center">
          
          <div className="flex justify-center items-center mb-6 pl-2.5">
            <img 
              src="/logo-sucofindo.png" 
              alt="Logo Resmi PT Sucofindo" 
              className="h-20 md:h-24 w-auto object-contain drop-shadow-sm pointer-events-none"
            />
          </div>

          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Suco<span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">File</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Kelola dokumen cetak lebih <span className="font-bold text-sky-600">Terstruktur & Praktis</span> 
          </p>
        </div>
        
        {/* Formulir */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          
          {/* 🔍 INPUT NAMA PENGGUNA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block pl-1">
              Username
            </label>
            <div className="relative transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sky-400 select-none pointer-events-none z-10">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda" 
                className="w-full pl-11 pr-4 py-3.5 bg-[#F4F8FC] border border-sky-100 rounded-2xl focus:outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100/60 transition-all duration-200 text-xs font-medium text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
              />
            </div>
          </div>

          {/* 🔐 INPUT KATA SANDI */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1">
              <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
            </div>
            <div className="relative transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sky-400 select-none pointer-events-none z-10">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-11 pr-11 py-3.5 bg-[#F4F8FC] border border-sky-100 rounded-2xl focus:outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100/60 transition-all duration-200 text-xs font-medium text-slate-700 disabled:opacity-50"
              />

              {/* 👁️ TOMBOL VISIBILITAS KATA SANDI */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-sky-400 hover:text-sky-600 focus:outline-none transition-colors duration-200 z-10 cursor-pointer"
                title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 🚀 TOMBOL SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wide shadow-md shadow-sky-300/50 hover:shadow-xl hover:shadow-sky-300/70 hover:scale-[1.02] hover:-translate-y-0.5 transform transition-all duration-200 active:scale-95 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none mt-2 select-none"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="animate-spin text-sm"></span>
                <span>Memproses...</span>
              </div>
            ) : (
              <>
                <span>Masuk</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-slate-400 font-medium relative z-10 select-none">
          © 2026 <span className="font-bold text-sky-600">SucoFile</span> · PT Sucofindo cabang Bontang
        </div>

      </div>
    </div>
  );
}

export default Login;