import React, { useState } from 'react';

function Login() {
  // Membuat state untuk menyimpan apa yang diketik karyawan
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Nanti di sini tempat menyambungkan ke database asli
    alert(`Selamat Datang kembali!\nUsername: ${username}`);
  };

  return (
    <div className="bg-[#F0F4F8] flex items-center justify-center h-screen antialiased w-full">
      {/* Kartu Login Utama */}
      <div className="bg-white p-10 md:p-14 rounded-[40px] shadow-2xl shadow-blue-100 w-[420px] relative overflow-hidden">
        
        {/* Dekorasi Bulatan Transparan */}
        <div className="absolute -top-10 -right-10 bg-[#E0F2FE] h-32 w-32 rounded-full opacity-60"></div>
        <div className="absolute -bottom-10 -left-10 bg-[#FFEDFA] h-28 w-28 rounded-full opacity-60"></div>

        {/* Header Logo */}
        <div className="text-center relative z-10 mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 text-white h-16 w-16 rounded-3xl mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl font-extrabold">S</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1E293B]">
            Swift<span className="text-blue-500">File</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-light">
            Kelola dokumen cetak jadi lebih <span className="font-semibold text-blue-500">Ceria</span>.
          </p>
        </div>
        
        {/* Form Login */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          
          {/* Input Username */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block pl-2">
              Username atau Email Karyawan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan ID kamu" 
                className="w-full pl-12 p-4 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-full focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition duration-300 placeholder:text-slate-400 text-slate-700"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pl-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <a href="#" className="text-xs text-blue-500 hover:text-blue-700 font-medium">Lupa?</a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-12 p-4 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-full focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition duration-300 text-slate-700"
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button 
            type="submit" 
            className="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full font-bold shadow-lg shadow-blue-100 hover:shadow-xl hover:shadow-blue-200 transform hover:-translate-y-1 transition duration-300 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Ayo Mulai Cetak</span>
            <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-400 relative z-10">
          © 2026 SwiftFile Co. Ltd. · Aplikasi Mempermudah
        </div>
      </div>
    </div>
  );
}

export default Login;