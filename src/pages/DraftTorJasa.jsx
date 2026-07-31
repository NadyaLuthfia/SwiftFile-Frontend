import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

function DraftTorJasa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  const draftId = searchParams.get('draft_id') || searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [daftarPegawai, setDaftarPegawai] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // State Form Utama
  const [formData, setFormData] = useState({
    pengadaan: '',
    nama_penyerah: '',
    bidang1: '',
    nama_penerima: '',
    bidang2: ''
  });

  // State Spesifikasi Jasa / Pekerjaan (Point 2)
  const [itemJasa, setItemJasa] = useState({
    nama_jasa: '',
    ruang_lingkup: '',
    spesifikasi: '',
    persyaratan_tambahan: '',
    jumlah: '1',
    rincian_biaya: '', // <-- Ditambahkan sesuai template
    harga_satuan: '',
    jumlah_harga: ''
  });

  // 1. Fetch Data Pegawai
  useEffect(() => {
    const fetchPegawai = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/karyawan', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setDaftarPegawai(data);
      } catch (err) {
        console.error("Gagal mengambil data pegawai:", err);
      }
    };
    fetchPegawai();
  }, []);

  // 2. Auto-Fill Data Saat Edit
  useEffect(() => {
    if (!draftId) return;

    const fetchDetailDraft = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/drafts/${draftId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data.data || res.data;
        let input = data.data_input || data.variables || {};
        if (typeof input === 'string') {
          try { input = JSON.parse(input); } catch (e) { input = {}; }
        }

        setFormData({
          pengadaan: data.pengadaan || input.pengadaan || '',
          nama_penyerah: data.nama_penyerah || input.nama_penyerah || '',
          bidang1: data.bidang1 || input.bidang1 || '',
          nama_penerima: data.nama_penerima || input.nama_penerima || '',
          bidang2: data.bidang2 || input.bidang2 || ''
        });

        setItemJasa({
          nama_jasa: data.nama_jasa || input.nama_jasa || '',
          ruang_lingkup: data.ruang_lingkup || input.ruang_lingkup || '',
          spesifikasi: data.spesifikasi || input.spesifikasi || '',
          persyaratan_tambahan: data.persyaratan_tambahan || input.persyaratan_tambahan || '',
          jumlah: String(data.jumlah || input.jumlah || '1'),
          rincian_biaya: data.rincian_biaya || input.rincian_biaya || '',
          harga_satuan: String(data.harga_satuan || input.harga_satuan || ''),
          jumlah_harga: String(data.jumlah_harga || input.jumlah_harga || '')
        });

      } catch (err) {
        console.error("Gagal mengambil detail draft:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailDraft();
  }, [draftId]);

  const getFilteredPegawai = (query) => {
    if (!query?.trim()) return [];
    const q = query.toLowerCase();
    return daftarPegawai.filter(k => 
      (k.nama_lengkap || k.nama || k.nama_pegawai || '').toLowerCase().includes(q)
    );
  };

  const handleSelectKaryawan = (karyawan, target) => {
    const nama = karyawan.nama_lengkap || karyawan.nama || karyawan.nama_pegawai || '';
    const bidang = karyawan.bidang?.nama_bidang || karyawan.bidang || karyawan.nama_bidang || '';
    setFormData(prev => ({
      ...prev,
      [target === 'penyerah' ? 'nama_penyerah' : 'nama_penerima']: nama,
      [target === 'penyerah' ? 'bidang1' : 'bidang2']: bidang,
    }));
    setActiveDropdown(null);
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSpecChange = (field, val) => {
    const updated = { ...itemJasa, [field]: val };
    const jml = Number(updated.jumlah) || 0;
    const hrg = Number(updated.harga_satuan) || 0;
    updated.jumlah_harga = jml && hrg ? (jml * hrg).toString() : '';
    setItemJasa(updated);
  };

  const createFormDataPayload = (status = 'draft') => {
    const data = new FormData();
    data.append('template_id', templateId || '');
    data.append('status', status);

    if (draftId) {
      data.append('draft_id', draftId);
      data.append('_method', 'PUT');
    }

    const namaDraftValue = itemJasa.nama_jasa.trim() 
      ? `TOR Jasa - ${itemJasa.nama_jasa}` 
      : 'Draft TOR Jasa';
    
    data.append('nama_draft', namaDraftValue);

    const variablesObject = {
      nama_draft: namaDraftValue,
      pengadaan: formData.pengadaan,
      nama_penyerah: formData.nama_penyerah,
      bidang1: formData.bidang1,
      nama_penerima: formData.nama_penerima,
      bidang2: formData.bidang2,
      
      // Variable Jasa sesuai template Word
      nama_jasa: itemJasa.nama_jasa,
      ruang_lingkup: itemJasa.ruang_lingkup,
      spesifikasi: itemJasa.spesifikasi,
      persyaratan_tambahan: itemJasa.persyaratan_tambahan,
      jumlah: itemJasa.jumlah,
      rincian_biaya: itemJasa.rincian_biaya,
      harga_satuan: itemJasa.harga_satuan,
      jumlah_harga: itemJasa.jumlah_harga
    };

    data.append('variables', JSON.stringify(variablesObject));

    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    Object.keys(itemJasa).forEach(key => data.append(key, itemJasa[key]));

    return data;
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = createFormDataPayload('draft');
      const token = localStorage.getItem('token');
      const endpoint = draftId ? `http://localhost:8000/api/drafts/${draftId}` : 'http://localhost:8000/api/drafts';
      
      await axios.post(endpoint, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      alert("Draft TOR Jasa berhasil disimpan!");
      navigate('/draft-dokumen');
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = createFormDataPayload('siap_cetak');
      const token = localStorage.getItem('token');
      const endpoint = draftId ? `http://localhost:8000/api/siap-cetak/${draftId}` : 'http://localhost:8000/api/siap-cetak';

      await axios.post(endpoint, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      alert("Dokumen TOR Jasa berhasil dikirim ke antrean siap cetak!");
      navigate('/siap-cetak');
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyelesaikan dokumen.");
    } finally {
      setLoading(false);
    }
  };

  const renderKaryawanDropdown = (type, query) => {
    if (activeDropdown !== type) return null;
    const list = getFilteredPegawai(query);
    if (!list.length) return null;

    return (
      <div className="absolute left-0 right-0 top-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto py-1 mt-1">
        {list.map((k, idx) => (
          <button
            key={k.id || idx}
            type="button"
            onMouseDown={() => handleSelectKaryawan(k, type)}
            className="w-full text-left px-3.5 py-2 text-xs hover:bg-sky-50 font-medium text-slate-700 block transition-colors"
          >
            {k.nama_lengkap || k.nama || k.nama_pegawai} <span className="text-[10px] text-slate-400 font-normal">({k.bidang?.nama_bidang || k.bidang || ''})</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col px-8 py-6 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <header className="flex justify-between items-center bg-white p-5 rounded-2xl border border-sky-100/80 shadow-sm">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {draftId ? 'Edit' : 'Draft'} <span className="text-sky-600">TOR Jasa</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Form Input Spesifikasi Teknis Pekerjaan & Pengesahan</p>
            </div>
            <button 
              onClick={() => navigate('/draft-dokumen')} 
              className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2.5 rounded-xl border border-sky-100 cursor-pointer transition-all"
            >
              ← Kembali
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* FORM INPUT */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-sky-100/80 shadow-sm p-7 space-y-6">
                
                {/* 1. Pengadaan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📝</span> 1. Tujuan Pengadaan Jasa
                  </label>
                  <textarea 
                    name="pengadaan" 
                    rows={2} 
                    value={formData.pengadaan} 
                    onChange={handleFormChange} 
                    placeholder="Contoh: Pengadaan Jasa Pemeliharaan Server Aplikasi Kantor..." 
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 bg-white font-medium resize-none shadow-sm placeholder:text-slate-300" 
                    required 
                  />
                </div>

                {/* 2. Spesifikasi Teknis Jasa */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛠️</span> 2. SPESIFIKASI TEKNIS & HARGA
                  </label>
                  
                  <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nama Jasa / Pekerjaan</label>
                      <input 
                        type="text" 
                        value={itemJasa.nama_jasa} 
                        onChange={e => handleSpecChange('nama_jasa', e.target.value)} 
                        placeholder="Contoh: Jasa Service & Maintenance Server" 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Ruang Lingkup Pekerjaan</label>
                      <input 
                        type="text" 
                        value={itemJasa.ruang_lingkup} 
                        onChange={e => handleSpecChange('ruang_lingkup', e.target.value)} 
                        placeholder="Contoh: Perbaikan hardware, pembersihan rutin, tuning OS" 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Spesifikasi Jasa</label>
                        <input 
                          type="text" 
                          value={itemJasa.spesifikasi} 
                          onChange={e => handleSpecChange('spesifikasi', e.target.value)} 
                          placeholder="Contoh: Pemeliharaan berkala 2x sebulan" 
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Persyaratan Tambahan</label>
                        <input 
                          type="text" 
                          value={itemJasa.persyaratan_tambahan} 
                          onChange={e => handleSpecChange('persyaratan_tambahan', e.target.value)} 
                          placeholder="Contoh: Sertifikat Teknisi Resmi" 
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Jumlah / Volume</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={itemJasa.jumlah} 
                          onChange={e => handleSpecChange('jumlah', e.target.value)} 
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Rincian / Komponen Biaya</label>
                        <input 
                          type="text" 
                          value={itemJasa.rincian_biaya} 
                          onChange={e => handleSpecChange('rincian_biaya', e.target.value)} 
                          placeholder="Contoh: Transportasi + Suku Cadang + Jasa Teknisi" 
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Harga Satuan (-PPN 11%)</label>
                        <input 
                          type="number" 
                          value={itemJasa.harga_satuan} 
                          onChange={e => handleSpecChange('harga_satuan', e.target.value)} 
                          placeholder="Masukkan harga satuan..."
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">Jumlah Harga (-PPN 11%)</label>
                        <input 
                          type="text" 
                          value={itemJasa.jumlah_harga ? `Rp ${Number(itemJasa.jumlah_harga).toLocaleString('id-ID')}` : ''} 
                          readOnly 
                          placeholder="Terhitung otomatis" 
                          className="w-full border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-sky-700 bg-sky-50/70 focus:outline-none cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Penandatangan */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✍️</span> 4. Penandatangan / Pengesahan
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="relative">
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nama Penyerah</label>
                      <input 
                        type="text" 
                        name="nama_penyerah" 
                        value={formData.nama_penyerah} 
                        onChange={handleFormChange} 
                        onFocus={() => setActiveDropdown('penyerah')} 
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                        placeholder="Ketik nama penyerah..." 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        autoComplete="off" 
                      />
                      {renderKaryawanDropdown('penyerah', formData.nama_penyerah)}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Bidang Penyerah</label>
                      <input 
                        type="text" 
                        name="bidang1" 
                        value={formData.bidang1} 
                        onChange={handleFormChange} 
                        placeholder="Terisi otomatis / masukkan bidang..." 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nama Penerima</label>
                      <input 
                        type="text" 
                        name="nama_penerima" 
                        value={formData.nama_penerima} 
                        onChange={handleFormChange} 
                        onFocus={() => setActiveDropdown('penerima')} 
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                        placeholder="Ketik nama penerima..." 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                        autoComplete="off" 
                      />
                      {renderKaryawanDropdown('penerima', formData.nama_penerima)}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Bidang Penerima</label>
                      <input 
                        type="text" 
                        name="bidang2" 
                        value={formData.bidang2} 
                        onChange={handleFormChange} 
                        placeholder="Terisi otomatis / masukkan bidang..." 
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 font-medium shadow-sm placeholder:text-slate-300" 
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={handleSaveDraft} 
                    disabled={loading} 
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
                  >
                    💾 Simpan ke Draft
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:bg-slate-300"
                  >
                    {loading ? "Memproses..." : "Selesai"}
                  </button>
                </div>

              </form>
            </div>

            {/* LIVE PREVIEW DOKUMEN */}
            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-white rounded-3xl border border-sky-100/80 shadow-sm p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                
                <h3 className="text-xs font-extrabold uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 text-slate-800">
                  LIVE PREVIEW DOKUMEN
                </h3>
                
                <div className="space-y-6 text-slate-800 text-xs">
                  
                  {/* Poin 2: Spesifikasi Teknis (Urutan persis gambar) */}
                  <div>
                    <p className="font-bold text-[11px] text-slate-900 mb-2 uppercase tracking-tight">
                      2. SPESIFIKASI TEKNIS, JUMLAH DAN PERKIRAAN HARGA **)
                    </p>
                    
                    <div className="border border-slate-400 rounded-sm overflow-hidden">
                      <table className="w-full border-collapse text-[11px]">
                        <tbody>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal w-5/12 border-r border-slate-400 bg-slate-50/50">Nama jasa <sup>a)</sup></td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.nama_jasa || '${nama_jasa}'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Ruang lingkup jasa:</td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.ruang_lingkup || '${ruang_lingkup}'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Spesifikasi jasa:</td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.spesifikasi || '${spesifikasi}'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Persyaratan tambahan</td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.persyaratan_tambahan || '${persyaratan_tambahan}'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Jumlah</td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.jumlah || 1}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Rincian/komponen biaya</td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.rincian_biaya || '${rincian_biaya}'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-400">
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Harga satuan (-PPN 11%) (Rp) <sup>b)</sup></td>
                            <td className="p-2.5 font-mono text-slate-800">
                              {itemJasa.harga_satuan ? `Rp ${Number(itemJasa.harga_satuan).toLocaleString('id-ID')}` : '${harga_satuan}'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-normal border-r border-slate-400 bg-slate-50/50">Jumlah Harga (-PPN 11%) (Rp) <sup>c)</sup></td>
                            <td className="p-2.5 font-mono font-bold text-sky-700">
                              {itemJasa.jumlah_harga ? `Rp ${Number(itemJasa.jumlah_harga).toLocaleString('id-ID')}` : '${jumlah_harga}'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pengesahan */}
                  <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[11px] border-t border-slate-100">
                    <div>
                      <p className="font-medium text-slate-600 mb-12">Disiapkan/ditinjau oleh,</p>
                      <p className="font-bold underline font-mono text-slate-900">{formData.nama_penyerah || '${nama_penyerah}'}</p>
                      <p className="font-mono text-slate-500 text-[10px] mt-0.5">{formData.bidang1 || '${bidang1}'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-600 mb-12">Disetujui/disahkan oleh,</p>
                      <p className="font-bold underline font-mono text-slate-900">{formData.nama_penerima || '${nama_penerima}'}</p>
                      <p className="font-mono text-slate-500 text-[10px] mt-0.5">{formData.bidang2 || '${bidang2}'}</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default DraftTorJasa;