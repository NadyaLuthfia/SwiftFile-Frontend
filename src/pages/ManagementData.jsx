import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';

function ManagementData() {
  const userRole = localStorage.getItem('role') || 'user';

  // State Master Data
  const [jabatanList, setJabatanList] = useState([]);
  const [bidangList, setBidangList] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);

  // State Navigasi Tab
  const [activeTab, setActiveTab] = useState('karyawan');

  // State Pencarian Global
  const [searchTerm, setSearchTerm] = useState('');

  // State Notification & Timer Ref
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const toastTimerRef = useRef(null);

  // State Modal Konfirmasi Custom
  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'danger',
    onConfirm: null
  });

  // State Form Input
  const [inputJabatan, setInputJabatan] = useState('');
  const [inputBidang, setInputBidang] = useState('');
  const [formKaryawan, setFormKaryawan] = useState({
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

  // State Fitur Edit Modal
  const [modalEdit, setModalEdit] = useState({
    isOpen: false,
    tipe: '', 
    id: null,
    data: {} 
  });

  // State Fitur Rincian Karyawan Modal
  const [modalDetail, setModalDetail] = useState({
    isOpen: false,
    data: null
  });

  // State Fitur Toggle Password (Mata)
  const [showPasswordAdd, setShowPasswordAdd] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  const parseErrorMessage = (err, defaultMsg) => {
    if (!err.response) return err.message || defaultMsg;
    const data = err.response.data;
    
    if (typeof data === 'string') return data;
    if (data?.message && typeof data.message === 'string') return data.message;
    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && data.errors[firstKey][0]) {
        return data.errors[firstKey][0];
      }
    }
    return defaultMsg;
  };

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const safeMessage = typeof message === 'object' ? JSON.stringify(message) : String(message);

    setNotification({ show: true, message: safeMessage, type });
    toastTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 1500);
  };

  useEffect(() => {
    muatSemuaData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const muatSemuaData = () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('http://localhost:8000/api/jabatan', { headers })
      .then(res => setJabatanList(res.data.data || []))
      .catch(err => console.error(err));
    axios.get('http://localhost:8000/api/bidang', { headers })
      .then(res => setBidangList(res.data.data || []))
      .catch(err => console.error(err));
    axios.get('http://localhost:8000/api/karyawan', { headers })
      .then(res => setKaryawanList(res.data.data || []))
      .catch(err => console.error(err));
  };

  const tambahJabatan = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/jabatan', { nama_jabatan: inputJabatan }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setInputJabatan('');
      muatSemuaData();
      showToast('Jabatan baru berhasil ditambahkan!', 'success');
    }).catch(err => showToast(parseErrorMessage(err, "Gagal tambah jabatan"), 'error'));
  };

  const tambahBidang = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/api/bidang', { nama_bidang: inputBidang }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setInputBidang('');
      muatSemuaData();
      showToast('Bidang baru berhasil ditambahkan!', 'success');
    }).catch(err => showToast(parseErrorMessage(err, "Gagal tambah bidang"), 'error'));
  };

  const tambahKaryawan = (e) => {
    e.preventDefault();
    const payload = { ...formKaryawan };
    if (!payload.buat_akun) {
      delete payload.username;
      delete payload.password;
      delete payload.role;
    }

    axios.post('http://localhost:8000/api/karyawan', payload, {
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
      setShowPasswordAdd(false);
      muatSemuaData();
      showToast('Data karyawan berhasil ditambahkan!', 'success');
    }).catch(err => showToast(parseErrorMessage(err, "Gagal tambah data karyawan"), 'error'));
  };

  const hapusData = (id, tipe) => {
    setModalConfirm({
      isOpen: true,
      title: `Nonaktifkan Data ${tipe.toUpperCase()}?`,
      message: `Apakah Anda yakin ingin menonaktifkan data ${tipe} ini?`,
      actionType: 'danger',
      onConfirm: () => {
        axios.delete(`http://localhost:8000/api/${tipe}/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(() => {
          muatSemuaData();
          showToast(`Data ${tipe} berhasil dinonaktifkan.`, 'success');
        })
        .catch(err => {
          showToast(parseErrorMessage(err, `Gagal mengubah status data ${tipe}`), 'error');
        });
      }
    });
  };

  const hapusPermanenData = (id, tipe) => {
    setModalConfirm({
      isOpen: true,
      title: `HAPUS PERMANEN ${tipe.toUpperCase()}?`,
      message: `PERINGATAN: Data ${tipe} ini akan dihapus permanen dari sistem dan tidak bisa dikembalikan lagi! Yakin?`,
      actionType: 'danger',
      onConfirm: () => {
        axios.delete(`http://localhost:8000/api/${tipe}/${id}/permanent`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(() => {
          muatSemuaData();
          showToast(`Data ${tipe} berhasil dihapus permanen!`, 'success');
        })
        .catch(err => {
          showToast(parseErrorMessage(err, `Gagal menghapus permanen data ${tipe}`), 'error');
        });
      }
    });
  };

  const pulihkanKaryawan = (id) => {
    const karyawan = karyawanList.find(k => k.id === id);
    if (!karyawan) return;

    setModalConfirm({
      isOpen: true,
      title: 'Aktifkan Kembali Karyawan?',
      message: `Yakin ingin mengaktifkan kembali karyawan ${karyawan.nama_lengkap}?`,
      actionType: 'success',
      onConfirm: () => {
        const payload = {
          nama_lengkap: karyawan.nama_lengkap,
          jabatan_id: karyawan.jabatan_id || karyawan.jabatan?.id,
          bidang_id: karyawan.bidang_id || karyawan.bidang?.id,
          alamat: karyawan.alamat || '',
          no_hp: karyawan.no_hp || '',
          email: karyawan.email || '',
          status_aktif: 1
        };

        axios.put(`http://localhost:8000/api/karyawan/${id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(() => {
          muatSemuaData();
          showToast(`Karyawan berhasil diaktifkan kembali!`, 'success');
        })
        .catch(err => {
          showToast(parseErrorMessage(err, "Gagal mengaktifkan kembali karyawan"), 'error');
        });
      }
    });
  };

  const bukaModalEdit = (item, tipe) => {
    let payload = {};
    if (tipe === 'jabatan') payload = { nama_jabatan: item.nama_jabatan };
    if (tipe === 'bidang') payload = { nama_bidang: item.nama_bidang };
    if (tipe === 'karyawan') {
      payload = { 
        nama_lengkap: item.nama_lengkap || '', 
        jabatan_id: item.jabatan_id || item.jabatan?.id || '', 
        bidang_id: item.bidang_id || item.bidang?.id || '',
        alamat: item.alamat || '',
        no_hp: item.no_hp || '',
        email: item.email || '',
        user_id: item.user_id || item.user?.id || null, 
        buat_akun: !!item.user,
        username: item.user?.username || '',
        password: '',
        role: item.user?.role || 'user'
      };
    }

    setModalEdit({
      isOpen: true,
      tipe: tipe,
      id: item.id,
      data: payload
    });
    setShowPasswordEdit(false);
  };

  const bukaModalDetail = (item) => {
    setModalDetail({
      isOpen: true,
      data: item
    });
  };

  const simpanEdit = (e) => {
    e.preventDefault();
    let payload = { ...modalEdit.data };
    if (modalEdit.tipe === 'karyawan' && !payload.buat_akun) {
      delete payload.username;
      delete payload.password;
      delete payload.role;
    }

    axios.put(`http://localhost:8000/api/${modalEdit.tipe}/${modalEdit.id}`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setModalEdit({ isOpen: false, tipe: '', id: null, data: {} });
      muatSemuaData();
      showToast('Data berhasil diperbarui!', 'success');
    }).catch(err => showToast(parseErrorMessage(err, "Gagal mengubah data"), 'error'));
  };

  const filteredKaryawan = karyawanList.filter(k => 
    k.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.jabatan?.nama_jabatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.bidang?.nama_bidang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.alamat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.no_hp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayedKaryawan = [...filteredKaryawan].reverse().slice(0, 5);

  const filteredJabatan = jabatanList.filter(j => 
    j.nama_jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayedJabatan = [...filteredJabatan].reverse().slice(0, 5);

  const filteredBidang = bidangList.filter(b => 
    b.nama_bidang?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayedBidang = [...filteredBidang].reverse().slice(0, 5);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchTerm('');
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 text-slate-800 flex h-screen w-full overflow-hidden antialiased font-poppins" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          70% {
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
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
                {notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Informasi' : 'Peringatan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto h-full scroll-smooth">
        <div className="w-full max-w-7xl mx-auto space-y-5 animate-fade-in">
          
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
                Management <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Data</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder={`Cari ${activeTab === 'karyawan' ? 'karyawan...' : activeTab === 'jabatan' ? 'jabatan...' : 'bidang...'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs transition-all duration-200 text-slate-800 font-medium placeholder-slate-400 h-9"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
                )}
              </div>
            </div>
          </header>

          <div className="flex border-b border-sky-100 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
            <button 
              onClick={() => handleTabChange('karyawan')} 
              className={`px-4 py-2 font-bold text-xs md:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'karyawan' 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25' 
                  : 'bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200/60'
              }`}
            >
              👥 Data Karyawan
            </button>
            <button 
              onClick={() => handleTabChange('jabatan')} 
              className={`px-4 py-2 font-bold text-xs md:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'jabatan' 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25' 
                  : 'bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200/60'
              }`}
            >
              💼 Master Jabatan
            </button>
            <button 
              onClick={() => handleTabChange('bidang')} 
              className={`px-4 py-2 font-bold text-xs md:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bidang' 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25' 
                  : 'bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200/60'
              }`}
            >
              🏢 Master Bidang / Unit
            </button>
          </div>

          {/* TAB 1: KARYAWAN */}
          {activeTab === 'karyawan' && (
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xs space-y-5 transition-all duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg text-sm">👥</span> 
                  Master Data Karyawan
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Menampilkan maks. 5 data terbaru (Aktif & Nonaktif)
                </span>
              </div>
              
              <form onSubmit={tambahKaryawan} className="bg-gradient-to-br from-sky-50/50 via-slate-50 to-blue-50/30 p-4 md:p-5 rounded-xl border border-sky-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Lengkap Karyawan</label>
                    <input type="text" value={formKaryawan.nama_lengkap} onChange={e => setFormKaryawan({...formKaryawan, nama_lengkap: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium placeholder-slate-400" placeholder="Nama Karyawan..." required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Pilih Jabatan</label>
                    <select value={formKaryawan.jabatan_id} onChange={e => setFormKaryawan({...formKaryawan, jabatan_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium cursor-pointer" required>
                      <option value="">-- Pilih Jabatan --</option>
                      {jabatanList.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Pilih Bidang / Unit</label>
                    <select value={formKaryawan.bidang_id} onChange={e => setFormKaryawan({...formKaryawan, bidang_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium cursor-pointer" required>
                      <option value="">-- Pilih Bidang --</option>
                      {bidangList.map(b => <option key={b.id} value={b.id}>{b.nama_bidang}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nomor HP</label>
                    <input type="text" value={formKaryawan.no_hp} onChange={e => setFormKaryawan({...formKaryawan, no_hp: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium placeholder-slate-400" placeholder="Contoh: 081234..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email</label>
                    <input type="email" value={formKaryawan.email} onChange={e => setFormKaryawan({...formKaryawan, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium placeholder-slate-400" placeholder="karyawan@email.com..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Alamat Rumah</label>
                    <input type="text" value={formKaryawan.alamat} onChange={e => setFormKaryawan({...formKaryawan, alamat: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white shadow-2xs transition-all duration-200 h-9.5 text-slate-800 font-medium placeholder-slate-400" placeholder="Alamat lengkap rumah..." />
                  </div>
                </div>

                <div className="border-t border-dashed border-sky-200/80 pt-3 mt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="buat_akun" 
                      checked={formKaryawan.buat_akun} 
                      onChange={e => setFormKaryawan({...formKaryawan, buat_akun: e.target.checked})} 
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="buat_akun" className="text-xs font-bold text-sky-900 cursor-pointer select-none flex items-center gap-1">
                      🔑 Buatkan Akses Login Aplikasi (Akun User)
                    </label>
                  </div>

                  {formKaryawan.buat_akun && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-sky-200/70 shadow-2xs mt-3 transition-all duration-200">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-sky-700">Username Login</label>
                        <input type="text" value={formKaryawan.username} onChange={e => setFormKaryawan({...formKaryawan, username: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-sky-50/30 text-slate-800 h-9 font-medium" placeholder="Ketik username unik..." required={formKaryawan.buat_akun} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-sky-700">Password</label>
                        <div className="relative w-full">
                          <input type={showPasswordAdd ? "text" : "password"} value={formKaryawan.password} onChange={e => setFormKaryawan({...formKaryawan, password: e.target.value})} className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-sky-50/30 text-slate-800 h-9 font-medium" placeholder="Minimal 6 karakter..." required={formKaryawan.buat_akun} />
                          <button type="button" onClick={() => setShowPasswordAdd(!showPasswordAdd)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-600 cursor-pointer text-sm">
                            {showPasswordAdd ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-sky-700">Hak Akses / Role</label>
                        <select value={formKaryawan.role} onChange={e => setFormKaryawan({...formKaryawan, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-sky-50/30 text-slate-800 h-9 font-bold cursor-pointer" required={formKaryawan.buat_akun}>
                          <option value="user">User / Staf Biasa</option>
                          <option value="admin">Admin</option>
                          <option value="master_admin">Master Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button type="submit" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/20 cursor-pointer h-9 flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5">
                    ➕ Simpan Karyawan
                  </button>
                </div>
              </form>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white font-semibold tracking-wider text-[10px] uppercase">
                      <th className="py-3 px-4">Nama Lengkap & Akun</th>
                      <th className="py-3 px-3">Jabatan</th>
                      <th className="py-3 px-3">Bidang / Unit</th>
                      <th className="py-3 px-3">Kontak & Alamat</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedKaryawan.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400 italic font-medium bg-slate-50/50">
                          {searchTerm ? 'Data karyawan tidak ditemukan.' : 'Tidak ada data karyawan.'}
                        </td>
                      </tr>
                    ) : (
                      displayedKaryawan.map((k) => (
                        <tr key={k.id} className="hover:bg-sky-50/30 transition-colors duration-150 group">
                          <td className="py-3 px-4 text-slate-800">
                            <div className="font-bold text-xs text-slate-800 group-hover:text-sky-600 transition-colors">{k.nama_lengkap}</div>
                            {k.user ? (
                              <div className="text-[10px] text-sky-600 font-semibold flex items-center gap-1 mt-0.5">
                                <span>🔑 {k.user.username}</span> 
                                <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold">{k.user.role}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-normal italic mt-0.5">👤 Tanpa akun</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-sky-50 text-sky-700 border border-sky-200/60 px-2.5 py-1 rounded-lg font-semibold text-[11px] inline-block">
                              {k.jabatan?.nama_jabatan || 'Tidak ada'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-lg font-semibold text-[11px] inline-block">
                              {k.bidang?.nama_bidang || 'Tidak ada'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 space-y-0.5 text-[11px]">
                            <div className="font-semibold text-slate-700">📞 {k.no_hp || '-'}</div>
                            <div className="text-sky-600/90 font-medium">✉️ {k.email || '-'}</div>
                            <div className="text-[10px] italic text-slate-400 truncate max-w-[180px]" title={k.alamat}>📍 {k.alamat || '-'}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {k.status_aktif === 1 || k.status_aktif === '1' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px] inline-block">
                                Aktif
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[10px] inline-block">
                                Nonaktif
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-1.5 items-center">
                              <button type="button" onClick={() => bukaModalDetail(k)} className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition-all duration-150 cursor-pointer" title="Lihat Rincian">👁️</button>
                              <button type="button" onClick={() => bukaModalEdit(k, 'karyawan')} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-150 cursor-pointer" title="Edit Data">✏️</button>
                              
                              {(userRole === 'admin' || userRole === 'master_admin') && (
                                k.status_aktif === 1 || k.status_aktif === '1' ? (
                                  <button type="button" onClick={() => hapusData(k.id, 'karyawan')} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all duration-150 cursor-pointer" title="Nonaktifkan Karyawan">✕</button>
                                ) : (
                                  <button type="button" onClick={() => pulihkanKaryawan(k.id)} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all duration-150 cursor-pointer" title="Aktifkan Kembali">✅</button>
                                )
                              )}

                              {userRole === 'master_admin' && (
                                <button type="button" onClick={() => hapusPermanenData(k.id, 'karyawan')} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-150 cursor-pointer" title="Hapus Permanen">🗑️</button>
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
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg text-sm">💼</span> Master Jabatan
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Maksimal 5 Jabatan Terbaru
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form onSubmit={tambahJabatan} className="lg:col-span-5 bg-gradient-to-br from-sky-50/50 via-slate-50 to-blue-50/30 p-4 rounded-xl border border-sky-100 space-y-3.5 shadow-2xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Jabatan Baru</label>
                    <input 
                      type="text" 
                      value={inputJabatan} 
                      onChange={e => setInputJabatan(e.target.value)} 
                      className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 bg-white h-9.5 font-medium text-slate-800 placeholder-slate-400 shadow-2xs" 
                      placeholder="Masukkan nama jabatan..." 
                      required 
                    />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5">
                    ➕ Tambah Jabatan
                  </button>
                </form>

                <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white font-semibold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Nama Jabatan</th>
                        <th className="py-3 px-4 text-right w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedJabatan.length === 0 ? (
                        <tr><td colSpan="2" className="text-center py-6 text-slate-400 italic font-medium">{searchTerm ? 'Jabatan tidak ditemukan.' : 'Belum ada data jabatan.'}</td></tr>
                      ) : (
                        displayedJabatan.map((j) => (
                          <tr key={j.id} className="hover:bg-sky-50/30 transition-colors duration-150">
                            <td className="font-bold text-slate-800 py-3 px-4 text-xs">{j.nama_jabatan}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button type="button" onClick={() => bukaModalEdit(j, 'jabatan')} className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 cursor-pointer transition-all" title="Edit">✏️</button>
                                {(userRole === 'admin' || userRole === 'master_admin') && (
                                  <button type="button" onClick={() => hapusData(j.id, 'jabatan')} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-all" title="Nonaktifkan">✕</button>
                                )}
                                {userRole === 'master_admin' && (
                                  <button type="button" onClick={() => hapusPermanenData(j.id, 'jabatan')} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer transition-all" title="Hapus Permanen">🗑️</button>
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
            </div>
          )}

          {/* TAB 3: BIDANG */}
          {activeTab === 'bidang' && (
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg text-sm">🏢</span> Master Bidang / Unit
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Maksimal 5 Bidang Terbaru
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form onSubmit={tambahBidang} className="lg:col-span-5 bg-gradient-to-br from-sky-50/50 via-slate-50 to-blue-50/30 p-4 rounded-xl border border-sky-100 space-y-3.5 shadow-2xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Bidang / Unit Baru</label>
                    <input 
                      type="text" 
                      value={inputBidang} 
                      onChange={e => setInputBidang(e.target.value)} 
                      className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 bg-white h-9.5 font-medium text-slate-800 placeholder-slate-400 shadow-2xs" 
                      placeholder="Masukkan nama bidang..." 
                      required 
                    />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5">
                    ➕ Tambah Bidang
                  </button>
                </form>

                <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white font-semibold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Nama Bidang / Unit</th>
                        <th className="py-3 px-4 text-right w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedBidang.length === 0 ? (
                        <tr><td colSpan="2" className="text-center py-6 text-slate-400 italic font-medium">{searchTerm ? 'Bidang tidak ditemukan.' : 'Belum ada data bidang.'}</td></tr>
                      ) : (
                        displayedBidang.map((b) => (
                          <tr key={b.id} className="hover:bg-sky-50/30 transition-colors duration-150">
                            <td className="font-bold text-slate-800 py-3 px-4 text-xs">{b.nama_bidang}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button type="button" onClick={() => bukaModalEdit(b, 'bidang')} className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 cursor-pointer transition-all" title="Edit">✏️</button>
                                {(userRole === 'admin' || userRole === 'master_admin') && (
                                  <button type="button" onClick={() => hapusData(b.id, 'bidang')} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-all" title="Nonaktifkan">✕</button>
                                )}
                                {userRole === 'master_admin' && (
                                  <button type="button" onClick={() => hapusPermanenData(b.id, 'bidang')} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer transition-all" title="Hapus Permanen">🗑️</button>
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
            </div>
          )}

        </div>
      </main>

      {/* MODAL KONFIRMASI CUSTOM */}
      {modalConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-sky-100 shadow-2xl space-y-4 text-center font-poppins animate-fade-in">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl ${
              modalConfirm.actionType === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {modalConfirm.actionType === 'danger' ? '⚠️' : '💡'}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{modalConfirm.title}</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{modalConfirm.message}</p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirm({ ...modalConfirm, isOpen: false })}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalConfirm.onConfirm) modalConfirm.onConfirm();
                  setModalConfirm({ ...modalConfirm, isOpen: false });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  modalConfirm.actionType === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KARYAWAN */}
      {modalDetail.isOpen && modalDetail.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl p-5 md:p-6 w-full max-w-md border border-sky-100 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto font-poppins">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="bg-sky-100 text-sky-700 font-bold text-[9px] px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mb-0.5">
                  Rincian Karyawan
                </span>
                <h3 className="font-bold text-slate-800 text-base">
                  {modalDetail.data.nama_lengkap}
                </h3>
              </div>
              <button 
                onClick={() => setModalDetail({ isOpen: false, data: null })} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-br from-sky-50/30 to-slate-50 rounded-xl p-4 border border-sky-100 space-y-3 text-xs font-medium">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">ID Karyawan</span>
                <span className="text-slate-800 font-extrabold">#: {modalDetail.data.id}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Status Karyawan</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  modalDetail.data.status_aktif === 1 || modalDetail.data.status_aktif === '1' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {modalDetail.data.status_aktif === 1 || modalDetail.data.status_aktif === '1' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Jabatan</span>
                <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold text-[11px]">
                  {modalDetail.data.jabatan?.nama_jabatan || 'Tidak ada'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Bidang / Unit</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[11px]">
                  {modalDetail.data.bidang?.nama_bidang || 'Tidak ada'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Nomor HP</span>
                <span className="text-slate-800 font-bold">📞 {modalDetail.data.no_hp || '-'}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="text-slate-400">Email Utama</span>
                <span className="text-slate-800 font-bold">✉️ {modalDetail.data.email || '-'}</span>
              </div>

              <div className="flex flex-col gap-1 pt-0.5 border-b border-slate-200/50 pb-2.5">
                <span className="text-slate-400">Alamat Rumah</span>
                <span className="text-slate-700 font-medium bg-white p-2.5 rounded-lg border border-slate-200/50 leading-relaxed italic text-[11px]">
                  📍 {modalDetail.data.alamat || 'Alamat belum diisi.'}
                </span>
              </div>

              <div className="flex flex-col gap-1 pt-0.5">
                <span className="text-slate-400">Akun Sistem / Akses Login</span>
                {modalDetail.data.user ? (
                  <div className="bg-white p-3 rounded-lg border border-sky-200/70 flex flex-col gap-1.5 mt-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Username:</span>
                      <span className="font-extrabold text-sky-900">{modalDetail.data.user.username}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Hak Akses:</span>
                      <span className="font-extrabold text-sky-700 uppercase bg-sky-100 px-1.5 py-0.2 rounded text-[9px]">{modalDetail.data.user.role}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic bg-white p-2 rounded-lg text-center block mt-0.5 font-medium border border-slate-200/50 text-[11px]">
                    Belum dibuatkan akses login aplikasi
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                onClick={() => setModalDetail({ isOpen: false, data: null })} 
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-sky-500/20 cursor-pointer transition-all duration-150"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT UNIVERSAL */}
      {modalEdit.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl p-5 md:p-6 w-full max-w-lg border border-sky-100 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto font-poppins">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm md:text-base capitalize flex items-center gap-1.5">
                ✏️ Edit Data {modalEdit.tipe}
              </h3>
              <button onClick={() => setModalEdit({ isOpen: false, tipe: '', id: null, data: {} })} className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={simpanEdit} className="space-y-3.5">
              {modalEdit.tipe === 'jabatan' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Jabatan</label>
                  <input type="text" value={modalEdit.data.nama_jabatan || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_jabatan: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full h-9.5 font-medium text-slate-800" required />
                </div>
              )}

              {modalEdit.tipe === 'bidang' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Bidang / Unit</label>
                  <input type="text" value={modalEdit.data.nama_bidang || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_bidang: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full h-9.5 font-medium text-slate-800" required />
                </div>
              )}

              {modalEdit.tipe === 'karyawan' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                    <input type="text" value={modalEdit.data.nama_lengkap || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, nama_lengkap: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full h-9.5 font-medium text-slate-800" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Jabatan</label>
                      <select value={modalEdit.data.jabatan_id || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, jabatan_id: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full bg-white h-9.5 font-medium text-slate-800 cursor-pointer" required>
                        {jabatanList.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Bidang / Unit</label>
                      <select value={modalEdit.data.bidang_id || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, bidang_id: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full bg-white h-9.5 font-medium text-slate-800 cursor-pointer" required>
                        {bidangList.map(b => <option key={b.id} value={b.id}>{b.nama_bidang}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nomor HP</label>
                      <input type="text" value={modalEdit.data.no_hp || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, no_hp: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full bg-white h-9.5 font-medium text-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Email</label>
                      <input type="email" value={modalEdit.data.email || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, email: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full bg-white h-9.5 font-medium text-slate-800" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Alamat</label>
                    <input type="text" value={modalEdit.data.alamat || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, alamat: e.target.value }})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 w-full bg-white h-9.5 font-medium text-slate-800" />
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="edit_buat_akun" 
                        checked={modalEdit.data.buat_akun || false} 
                        onChange={e => setModalEdit({...modalEdit, data: {...modalEdit.data, buat_akun: e.target.checked}})} 
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                      />
                      <label htmlFor="edit_buat_akun" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                        🔑 {modalEdit.data.user_id ? 'Kelola / Update Akses Login' : 'Buatkan Akses Login Sekarang'}
                      </label>
                    </div>
                    
                    {modalEdit.data.buat_akun && (
                      <div className="space-y-3 bg-sky-50/40 p-3.5 rounded-xl border border-sky-100 mt-2 transition-all duration-200">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-sky-700">Username</label>
                          <input type="text" value={modalEdit.data.username || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, username: e.target.value }})} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white w-full text-slate-800 h-9 font-medium" required={modalEdit.data.buat_akun} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-sky-700">Password {modalEdit.data.user_id ? '(Kosongkan jika tidak diganti)' : ''}</label>
                          <div className="relative w-full">
                            <input type={showPasswordEdit ? "text" : "password"} value={modalEdit.data.password || ''} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, password: e.target.value }})} className="border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white w-full text-slate-800 h-9 font-medium" placeholder="Minimal 6 karakter..." required={!modalEdit.data.user_id && modalEdit.data.buat_akun} />
                            <button type="button" onClick={() => setShowPasswordEdit(!showPasswordEdit)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-600 cursor-pointer text-sm">
                              {showPasswordEdit ? (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-sky-700">Hak Akses / Role</label>
                          <select value={modalEdit.data.role || 'user'} onChange={e => setModalEdit({...modalEdit, data: { ...modalEdit.data, role: e.target.value }})} className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white w-full text-slate-800 font-bold h-9 cursor-pointer" required={modalEdit.data.buat_akun}>
                            <option value="user">User / Staf Biasa</option>
                            <option value="admin">Admin</option>
                            <option value="master_admin">Master Admin</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalEdit({ isOpen: false, tipe: '', id: null, data: {} })} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">Batal</button>
                <button type="submit" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagementData;