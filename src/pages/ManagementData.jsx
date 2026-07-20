import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';

function ManagementData() {
  // 🔑 Ambil role user yang sedang login dari localStorage (default ke 'user' jika kosong)
  const userRole = localStorage.getItem('role') || 'user';

  // 📦 State Master Data
  const [jabatanList, setJabatanList] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);

  // 📑 State Navigasi Tab ('karyawan', 'jabatan', 'bidang')
  const [activeTab, setActiveTab] = useState('karyawan');

  // 🔍 State Fitur Pencarian Global
  const [searchTerm, setSearchTerm] = useState('');

  // ✨ State Filter Status Karyawan ('1' = Aktif, '0' = Nonaktif)
  const [statusFilter, setStatusFilter] = useState('1');

  // 📦 State Form Input (Tambah Data) dengan Tambahan Field Akun User ✨
  const [inputJabatan, setInputJabatan] = useState('');
  const [inputBidang, setInputBidang] = useState('');
  const [formKaryawan, setFormKaryawan] = useState({
    nama_lengkap: '',
    jabatan_id: '',
    bidang_id: '',
    alamat: '',   
    no_hp: '',    
    email: '',
    buat_akun: false, // ✨ Menentukan apakah mau sekalian bikin akun login
    username: '',     // ✨ Field akun user baru
    password: '',     // ✨ Field akun user baru
    role: 'user'      // ✨ Default role akun user baru
  });

  // ✏️ State Fitur Edit (Modal) dengan Field Akun Tambahan ✨
  const [modalEdit, setModalEdit] = useState({
    isOpen: false,
    tipe: '', // 'karyawan', 'jabatan', 'bidang'
    id: null,
    data: {} 
  });

  // 👁️ State Fitur Rincian Karyawan (Modal Detail)
  const [modalDetail, setModalDetail] = useState({
    isOpen: false,
    data: null
  });

  // 🔄 Ambil data otomatis setiap kali halaman dimuat ATAU statusFilter berubah
  useEffect(() => {
    muatSemuaData();
  }, [statusFilter]);

  const muatSemuaData = () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('http://localhost:8000/api/jabatan', { headers }).then(res => setJabatanList(res.data.data || []));
    axios.get('http://localhost:8000/api/bidang', { headers }).then(res => setBidangList(res.data.data || []));
    
    // 🔍 Sekarang Laravel dikirimi parameter ?status= sesuai dengan mode yang dipilih
    axios.get(`http://localhost:8000/api/karyawan?status=${statusFilter}`, { headers })
      .then(res => setKaryawanList(res.data.data || []));
  };

  // ➕ Fungsi Tambah Data
  const tambahJabatan = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/jabatan', { nama_jabatan: inputJabatan }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setInputJabatan('');
      muatSemuaData();
    }).catch(err => alert(err.response?.data?.message || "Gagal tambah jabatan"));
  };

  const tambahBidang = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/bidang', { nama_bidang: inputBidang }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setInputBidang('');
      muatSemuaData();
    }).catch(err => alert(err.response?.data?.message || "Gagal tambah bidang"));
  };

  const tambahKaryawan = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/karyawan', formKaryawan, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setFormKaryawan({ 
        nama_lengkap: '', 
        jabatan_id: '', 
        bidang_id: '', 
        alamat: '', 
        no_hp: '', 
        email: '',
        buat_akun: false,
        username: '',
        password: '',
        role: 'user'
      });
      muatSemuaData();
    }).catch(err => alert(err.response?.data?.message || "Gagal tambah data karyawan"));
  };

  // ✕ FUNGSI NONAKTIFKAN DATA (SOFT DELETE)
  const hapusData = (id, tipe) => {
    if (window.confirm(`Yakin ingin menonaktifkan data ${tipe} ini?`)) {
      axios.delete(`http://localhost:8000/api/${tipe}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(() => {
        muatSemuaData();
      })
      .catch(err => {
        alert(err.response?.data?.message || `Gagal mengubah status data ${tipe}`);
      });
    }
  };

  // ✅ FUNGSI BARU: PULIHKAN / AKTIFKAN KEMBALI KARYAWAN
  const pulihkanKaryawan = (id) => {
    const karyawan = karyawanList.find(k => k.id === id);
    if (!karyawan) return;

    if (window.confirm(`Yakin ingin mengaktifkan kembali karyawan ${karyawan.nama_lengkap}?`)) {
      const payload = {
        nama_lengkap: karyawan.nama_lengkap,
        jabatan_id: karyawan.jabatan_id,
        bidang_id: karyawan.bidang_id,
        alamat: karyawan.alamat || '',
        no_hp: karyawan.no_hp || '',
        email: karyawan.email || '',
        status_aktif: 1 // Diaktifkan kembali 🚀
      };

      axios.put(`http://localhost:8000/api/karyawan/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(() => {
        muatSemuaData();
      })
      .catch(err => {
        alert(err.response?.data?.message || "Gagal mengaktifkan kembali karyawan");
      });
    }
  };

  // ✏️ Fungsi Buka Modal Edit
  const bukaModalEdit = (item, tipe) => {
    let payload = {};
    if (tipe === 'jabatan') payload = { nama_jabatan: item.nama_jabatan };
    if (tipe === 'bidang') payload = { nama_bidang: item.nama_bidang };
    if (tipe === 'karyawan') {
      payload = { 
        nama_lengkap: item.nama_lengkap, 
        jabatan_id: item.jabatan_id, 
        bidang_id: item.bidang_id,
        alamat: item.alamat || '',
        no_hp: item.no_hp || '',
        email: item.email || '',
        user_id: item.user_id || null, 
        buat_akun: false,              
        username: '',
        password: '',
        role: 'user'
      };
    }

    setModalEdit({
      isOpen: true,
      tipe: tipe,
      id: item.id,
      data: payload
    });
  };

  // 👁️ Buka Modal Detail Karyawan
  const bukaModalDetail = (item) => {
    setModalDetail({
      isOpen: true,
      data: item
    });
  };

  // 💾 Fungsi Simpan Perubahan Edit
  const simpanEdit = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:8000/api/${modalEdit.tipe}/${modalEdit.id}`, modalEdit.data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setModalEdit({ isOpen: false, tipe: '', id: null, data: {} });
      muatSemuaData();
    }).catch(err => alert(err.response?.data?.message || "Gagal mengubah data"));
  };

  // 💡 Filter Pencarian Global
  const filteredKaryawan = karyawanList.filter(k => 
    k.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.jabatan?.nama_jabatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.bidang?.nama_bidang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.alamat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.no_hp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJabatan = jabatanList.filter(j => 
    j.nama_jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBidang = bidangList.filter(b => 
    b.nama_bidang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchTerm('');
    setStatusFilter('1'); // Reset ke data aktif setiap ganti tab agar aman ✨
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-full">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Master Admin</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Management Data</h1>
            </div>

            {/* Kumpulan Kontrol di Sebelah Kanan Atas 🛠️ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
              
              {/* ✨ TOMBOL TOGGLE AKTIF / NONAKTIF (TETAP ADA) */}
              {activeTab === 'karyawan' && (
                <button 
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === '1' ? '0' : '1')}
                  className={`flex items-center justify-center gap-2 px-5 py-3 text-xs md:text-sm font-extrabold rounded-2xl border transition-all shadow-sm cursor-pointer h-12 ${
                    statusFilter === '1' 
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {statusFilter === '1' ? '🚫 Lihat Karyawan Nonaktif' : '👥 Lihat Karyawan Aktif'}
                </button>
              )}

              {/* Input Box Search */}
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none text-base">🔍</span>
                <input 
                  type="text" 
                  placeholder={`Cari data ${activeTab === 'karyawan' ? 'karyawan...' : activeTab === 'jabatan' ? 'jabatan...' : 'bidang...'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-sm md:text-base bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm transition-all text-slate-800 font-medium placeholder-slate-400 h-12"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
                )}
              </div>
            </div>
          </header>

          {/* 🗂️ NAVIGASI TABS */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button onClick={() => handleTabChange('karyawan')} className={`px-6 py-3.5 font-bold text-sm md:text-base rounded-t-2xl transition-all cursor-pointer ${activeTab === 'karyawan' ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-[1px]' : 'text-slate-400 hover:text-slate-600'}`}>👥 Data Karyawan</button>
            <button onClick={() => handleTabChange('jabatan')} className={`px-6 py-3.5 font-bold text-sm md:text-base rounded-t-2xl transition-all cursor-pointer ${activeTab === 'jabatan' ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-[1px]' : 'text-slate-400 hover:text-slate-600'}`}>💼 Master Jabatan</button>
            <button onClick={() => handleTabChange('bidang')} className={`px-6 py-3.5 font-bold text-sm md:text-base rounded-t-2xl transition-all cursor-pointer ${activeTab === 'bidang' ? 'bg-white border-t border-x border-slate-200 text-slate-900 -mb-[1px]' : 'text-slate-400 hover:text-slate-600'}`}>🏢 Master Bidang / Unit</button>
          </div>

          {/* 📋 ISI KONTEN */}
          
          {/* TAB 1: KARYAWAN */}
          {activeTab === 'karyawan' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                👥 Master Data Karyawan {statusFilter === '0' && <span className="text-xs bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full ml-1">Mode Nonaktif</span>}
              </h3>
              
              {/* Form Input Data Karyawan (SUDAH DIPERBESAR DAN LUAS 🚀) */}
              <form onSubmit={tambahKaryawan} className="bg-slate-50/50 p-6 md:p-8 rounded-2xl border border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Nama Lengkap Karyawan</label>
                    <input type="text" value={formKaryawan.nama_lengkap} onChange={e => setFormKaryawan({...formKaryawan, nama_lengkap: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium placeholder-slate-400" placeholder="Nama Karyawan..." required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Pilih Jabatan</label>
                    <select value={formKaryawan.jabatan_id} onChange={e => setFormKaryawan({...formKaryawan, jabatan_id: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium" required>
                      <option value="">-- Pilih Jabatan --</option>
                      {jabatanList.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Pilih Bidang / Unit</label>
                    <select value={formKaryawan.bidang_id} onChange={e => setFormKaryawan({...formKaryawan, bidang_id: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium" required>
                      <option value="">-- Pilih Bidang --</option>
                      {bidangList.map(b => <option key={b.id} value={b.id}>{b.nama_bidang}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Nomor HP</label>
                    <input type="text" value={formKaryawan.no_hp} onChange={e => setFormKaryawan({...formKaryawan, no_hp: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium placeholder-slate-400" placeholder="Contoh: 081234..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Email</label>
                    <input type="email" value={formKaryawan.email} onChange={e => setFormKaryawan({...formKaryawan, email: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium placeholder-slate-400" placeholder="karyawan@email.com..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 tracking-wide">Alamat Rumah</label>
                    <input type="text" value={formKaryawan.alamat} onChange={e => setFormKaryawan({...formKaryawan, alamat: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white shadow-sm transition-all h-13 text-slate-800 font-medium placeholder-slate-400" placeholder="Alamat lengkap rumah..." />
                  </div>
                </div>

                {/* CHECKBOX BUAT AKSES LOGIN APLIKASI */}
                <div className="border-t border-dashed border-slate-200 pt-5 mt-2">
                  <div className="flex items-center gap-3 pb-1">
                    <input 
                      type="checkbox" 
                      id="buat_akun" 
                      checked={formKaryawan.buat_akun} 
                      onChange={e => setFormKaryawan({...formKaryawan, buat_akun: e.target.checked})} 
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer transition-all"
                    />
                    <label htmlFor="buat_akun" className="text-sm font-extrabold text-slate-800 cursor-pointer select-none flex items-center gap-1.5">
                      🔑 Buatkan Akses Login Aplikasi (Akun User)
                    </label>
                  </div>

                  {formKaryawan.buat_akun && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-blue-50/40 p-6 rounded-2xl border border-blue-100/60 mt-4 animate-fade-in">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-blue-600">Username Login</label>
                        <input type="text" value={formKaryawan.username} onChange={e => setFormKaryawan({...formKaryawan, username: e.target.value})} className="w-full border border-blue-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white text-slate-800 h-12 font-medium" placeholder="Ketik username unik..." required={formKaryawan.buat_akun} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-blue-600">Password</label>
                        <input type="password" value={formKaryawan.password} onChange={e => setFormKaryawan({...formKaryawan, password: e.target.value})} className="w-full border border-blue-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white text-slate-800 h-12 font-medium" placeholder="Minimal 6 karakter..." required={formKaryawan.buat_akun} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-blue-600">Hak Akses / Role</label>
                        <select value={formKaryawan.role} onChange={e => setFormKaryawan({...formKaryawan, role: e.target.value})} className="w-full border border-blue-200 rounded-2xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white text-slate-800 h-12 font-bold" required={formKaryawan.buat_akun}>
                          <option value="user">User / Staf Biasa</option>
                          <option value="admin">Admin</option>
                          <option value="master_admin">Master Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="bg-slate-950 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-md cursor-pointer h-12 flex items-center justify-center gap-2">
                    ➕ Simpan Karyawan
                  </button>
                </div>
              </form>

              {/* Tabel Penampil Data Karyawan */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto shadow-sm">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold tracking-wider uppercase text-[11px] sticky top-0 z-10">
                      <th className="p-4 pl-6">Nama Lengkap & Akun</th>
                      <th className="p-4">Jabatan</th>
                      <th className="p-4">Bidang / Unit</th>
                      <th className="p-4">Kontak & Alamat</th>
                      <th className="p-4 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKaryawan.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center p-8 text-slate-400 italic font-medium">
                          {searchTerm ? 'Data karyawan tidak ditemukan.' : 'Tidak ada data karyawan di mode ini.'}
                        </td>
                      </tr>
                    ) : (
                      filteredKaryawan.map((k) => (
                        <tr key={k.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6 text-slate-800">
                            <div className="font-bold text-sm md:text-base">{k.nama_lengkap}</div>
                            {k.user ? (
                              <div className="text-[11px] text-blue-600 font-extrabold flex items-center gap-1.5 mt-1">
                                <span>🔑 {k.user.username}</span> 
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-[6px] text-[9px] uppercase tracking-wider font-extrabold">{k.user.role}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 font-semibold italic mt-1">👤 Tanpa akun login</div>
                            )}
                          </td>
                          <td className="p-4"><span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm">{k.jabatan?.nama_jabatan || 'Tidak ada'}</span></td>
                          <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm">{k.bidang?.nama_bidang || 'Tidak ada'}</span></td>
                          <td className="p-4 text-slate-600 space-y-1 text-xs md:text-sm">
                            <div className="font-semibold">📞 {k.no_hp || '-'}</div>
                            <div className="text-slate-500">✉️ {k.email || '-'}</div>
                            <div className="text-[12px] italic text-slate-400 truncate max-w-[200px]" title={k.alamat}>📍 {k.alamat || '-'}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-4 items-center">
                              <button type="button" onClick={() => bukaModalDetail(k)} className="text-blue-500 hover:text-blue-700 font-bold cursor-pointer transition-transform hover:scale-110 text-base md:text-lg" title="Lihat Rincian">👁️</button>
                              <button type="button" onClick={() => bukaModalEdit(k, 'karyawan')} className="text-amber-500 hover:text-amber-700 font-bold cursor-pointer transition-transform hover:scale-110 text-base md:text-lg" title="Edit Data">✏️</button>
                              
                              {/* ✨ FILTER BUTTON HAPUS / PEMULIHAN - Hanya tampil jika BUKAN admin biasa */}
                              {userRole !== 'admin' && (
                                statusFilter === '1' ? (
                                  <button type="button" onClick={() => hapusData(k.id, 'karyawan')} className="text-red-400 hover:text-red-600 font-bold cursor-pointer transition-transform hover:scale-110 text-base md:text-lg" title="Nonaktifkan Karyawan">✕</button>
                                ) : (
                                  <button type="button" onClick={() => pulihkanKaryawan(k.id)} className="text-emerald-500 hover:text-emerald-700 font-bold cursor-pointer transition-transform hover:scale-110 text-base md:text-lg" title="Aktifkan Kembali">✅</button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: JABATAN */}
          {activeTab === 'jabatan' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <h3 className="font-extrabold text-slate-800 text-lg">💼 Master Jabatan</h3>
              <form onSubmit={tambahJabatan} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <input type="text" value={inputJabatan} onChange={e => setInputJabatan(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white h-12 font-medium" placeholder="Tambah nama Jabatan baru..." required />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shadow-blue-100 cursor-pointer h-12 whitespace-nowrap">➕ Tambah Jabatan</button>
              </form>
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto max-w-2xl shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
                  <tbody>
                    {filteredJabatan.length === 0 ? (
                      <tr><td className="text-center p-6 text-slate-400 italic font-medium">{searchTerm ? 'Jabatan tidak ditemukan.' : 'Belum ada data jabatan.'}</td></tr>
                    ) : (
                      filteredJabatan.map((j) => (
                        <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50/80 flex justify-between items-center p-4">
                          <td className="font-bold text-slate-800 text-sm md:text-base">{j.nama_jabatan}</td>
                          <td className="flex gap-5">
                            <button type="button" onClick={() => bukaModalEdit(j, 'jabatan')} className="text-amber-500 hover:text-amber-700 font-bold cursor-pointer text-base md:text-lg">✏️</button>
                            {/* ✨ Hanya tampil jika BUKAN admin biasa */}
                            {userRole !== 'admin' && (
                              <button type="button" onClick={() => hapusData(j.id, 'jabatan')} className="text-red-400 hover:text-red-600 font-bold cursor-pointer text-base md:text-lg">✕</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BIDANG */}
          {activeTab === 'bidang' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <h3 className="font-extrabold text-slate-800 text-lg">🏢 Master Bidang / Unit</h3>
              <form onSubmit={tambahBidang} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <input type="text" value={inputBidang} onChange={e => setInputBidang(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white h-12 font-medium" placeholder="Tambah nama Bidang baru..." required />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shadow-emerald-100 cursor-pointer h-12 whitespace-nowrap">➕ Tambah Bidang</button>
              </form>
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto max-w-2xl shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
                  <tbody>
                    {filteredBidang.length === 0 ? (
                      <tr><td className="text-center p-6 text-slate-400 italic font-medium">{searchTerm ? 'Bidang tidak ditemukan.' : 'Belum ada data bidang.'}</td></tr>
                    ) : (
                      filteredBidang.map((b) => (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/80 flex justify-between items-center p-4">
                          <td className="font-bold text-slate-800 text-sm md:text-base">{b.nama_bidang}</td>
                          <td className="flex gap-5">
                            <button type="button" onClick={() => bukaModalEdit(b, 'bidang')} className="text-amber-500 hover:text-amber-700 font-bold cursor-pointer text-base md:text-lg">✏️</button>
                            {/* ✨ Hanya tampil jika BUKAN admin biasa */}
                            {userRole !== 'admin' && (
                              <button type="button" onClick={() => hapusData(b.id, 'bidang')} className="text-red-400 hover:text-red-600 font-bold cursor-pointer text-base md:text-lg">✕</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL DETAIL KARYAWAN */}
      {modalDetail.isOpen && modalDetail.data && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-100 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-blue-50 text-blue-600 font-extrabold text-[11px] px-3 py-1 rounded-md uppercase tracking-wider w-fit block mb-1.5">
                  Rincian Data Karyawan
                </span>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                  {modalDetail.data.nama_lengkap}
                </h3>
              </div>
              <button 
                onClick={() => setModalDetail({ isOpen: false, data: null })} 
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-base bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100/80 space-y-4 text-xs md:text-sm font-medium">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">ID Karyawan</span>
                <span className="text-slate-800 font-extrabold">#: {modalDetail.data.id}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">Jabatan</span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-bold text-xs">
                  {modalDetail.data.jabatan?.nama_jabatan || 'Tidak ada'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">Bidang / Unit</span>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md font-bold text-xs">
                  {modalDetail.data.bidang?.nama_bidang || 'Tidak ada'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">Nomor HP</span>
                <span className="text-slate-800 font-bold">📞 {modalDetail.data.no_hp || '-'}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">Email Utama</span>
                <span className="text-slate-800 font-bold">✉️ {modalDetail.data.email || '-'}</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-0.5 border-b border-slate-200/50 pb-3">
                <span className="text-slate-400">Alamat Rumah</span>
                <span className="text-slate-700 font-semibold bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed italic shadow-sm">
                  📍 {modalDetail.data.alamat || 'Alamat belum diisi.'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className="text-slate-400">Akun Sistem / Akses Login</span>
                {modalDetail.data.user ? (
                  <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/50 flex flex-col gap-2 mt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Username:</span>
                      <span className="font-extrabold text-slate-800">{modalDetail.data.user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Hak Akses:</span>
                      <span className="font-extrabold text-blue-700 uppercase bg-blue-100/50 px-2 py-0.5 rounded-md text-[10px]">{modalDetail.data.user.role}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic bg-slate-100/80 p-3 rounded-xl text-center block mt-1 font-bold">
                    Belum dibuatkan akses login aplikasi
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                onClick={() => setModalDetail({ isOpen: false, data: null })} 
                className="bg-slate-950 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-md cursor-pointer transition-all"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT UNIVERSAL (SPACIOUS SELECTION) */}
      {modalEdit.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl border border-slate-100 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg capitalize">✏️ Edit Data {modalEdit.tipe}</h3>
              <button onClick={() => setModalEdit({ isOpen: false, tipe: '', id: null, data: {} })} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-base bg-slate-50 p-1.5 rounded-lg">✕</button>
            </div>
            
            <form onSubmit={simpanEdit} className="space-y-4">
              {modalEdit.tipe === 'jabatan' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs md:text-sm font-bold text-slate-700">Nama Jabatan</label>
                  <input type="text" value={modalEdit.data.nama_jabatan || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_jabatan: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full h-12 font-medium" required />
                </div>
              )}

              {modalEdit.tipe === 'bidang' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs md:text-sm font-bold text-slate-700">Nama Bidang / Unit</label>
                  <input type="text" value={modalEdit.data.nama_bidang || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_bidang: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full h-12 font-medium" required />
                </div>
              )}

              {modalEdit.tipe === 'karyawan' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700">Nama Lengkap</label>
                    <input type="text" value={modalEdit.data.nama_lengkap || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_lengkap: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full h-12 font-medium" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700">Jabatan</label>
                      <select value={modalEdit.data.jabatan_id || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, jabatan_id: e.target.value }})} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full bg-white h-12 font-medium" required>
                        {jabatanList.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700">Bidang / Unit</label>
                      <select value={modalEdit.data.bidang_id || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, bidang_id: e.target.value }})} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full bg-white h-12 font-medium" required>
                        {bidangList.map(b => <option key={b.id} value={b.id}>{b.nama_bidang}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700">Nomor HP</label>
                      <input type="text" value={modalEdit.data.no_hp || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, no_hp: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full bg-white h-12 font-medium" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700">Email</label>
                      <input type="email" value={modalEdit.data.email || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, email: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full bg-white h-12 font-medium" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700">Alamat</label>
                    <input type="text" value={modalEdit.data.alamat || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, alamat: e.target.value }})} className="border border-slate-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 w-full bg-white h-12 font-medium" />
                  </div>

                  {modalEdit.data.user_id ? (
                    <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-xl border border-emerald-100 flex items-center gap-2 mt-2">
                      🛡️ Karyawan ini sudah memiliki akun login sistem terikat.
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-slate-200 pt-4 mt-2">
                      <div className="flex items-center gap-2 pb-1">
                        <input 
                          type="checkbox" 
                          id="edit_buat_akun" 
                          checked={modalEdit.data.buat_akun || false} 
                          onChange={e => setModalEdit({...modalEdit, data: {...modalEdit.data, buat_akun: e.target.checked}})} 
                          className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="edit_buat_akun" className="text-xs md:text-sm font-extrabold text-slate-800 cursor-pointer select-none">
                          🔑 Buatkan Akses Login Sekarang
                        </label>
                      </div>
                      
                      {modalEdit.data.buat_akun && (
                        <div className="space-y-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 mt-3 animate-fade-in">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs md:text-sm font-bold text-blue-600">Username Baru</label>
                            <input type="text" value={modalEdit.data.username || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, username: e.target.value }})} className="border border-blue-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white w-full text-slate-800 h-11" required={modalEdit.data.buat_akun} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs md:text-sm font-bold text-blue-600">Password</label>
                            <input type="password" value={modalEdit.data.password || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, password: e.target.value }})} className="border border-blue-200 rounded-xl px-5 py-3 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white w-full text-slate-800 h-11" placeholder="Minimal 6 karakter..." required={modalEdit.data.buat_akun} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs md:text-sm font-bold text-blue-600">Hak Akses / Role</label>
                            <select value={modalEdit.data.role || 'user'} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, role: e.target.value }})} className="border border-blue-200 rounded-xl px-4 py-2 text-sm md:text-base focus:outline-none focus:border-blue-500 bg-white w-full text-slate-800 font-bold h-11" required={modalEdit.data.buat_akun}>
                              <option value="user">User / Staf Biasa</option>
                              <option value="admin">Admin</option>
                              <option value="master_admin">Master Admin</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setModalEdit({ isOpen: false, tipe: '', id: null, data: {} })} className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold cursor-pointer transition-all">Batal</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-md shadow-blue-100 cursor-pointer transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagementData;