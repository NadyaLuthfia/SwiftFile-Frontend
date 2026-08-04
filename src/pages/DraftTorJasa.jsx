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
    rincian_biaya: '',
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

    // Nama draft otomatis dikirim berdasarkan nama jasa
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
      
      // Variable Jasa
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
      <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
        {list.map((k, idx) => (
          <button
            key={k.id || idx}
            type="button"
            onMouseDown={() => handleSelectKaryawan(k, type)}
            className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all"
          >
            {k.nama_lengkap || k.nama || k.nama_pegawai} <span className="text-[10px] text-slate-400 font-normal">({k.bidang?.nama_bidang || k.bidang || ''})</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {draftId ? 'Edit Draft:' : 'Draft Baru:'}{' '}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">
                TOR Jasa
              </span>
            </h1>
            <button 
              onClick={() => navigate('/draft-dokumen')} 
              className="text-xs font-bold text-sky-700 bg-sky-50/80 hover:bg-sky-100 px-4 py-2.5 rounded-2xl border border-sky-100/80 transition-all transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              ⬅️ Kembali
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* PANEL KIRI FORM */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-8 space-y-6">
                
                {/* BANNER INFORMASI SINKRONISASI */}
                <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/80 border border-sky-100/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-sky-950 font-medium">
                  <span>🤖</span>
                  <p><b>Form Spesifikasi Jasa Aktif!</b> Seluruh pengisian di bawah ini langsung terhubung dan tersinkronisasi ke berkas live preview secara real-time.</p>
                </div>

                {/* 1. Pengadaan */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-sky-800 uppercase tracking-wider">📝 1. Tujuan Pengadaan Jasa</label>
                  <textarea 
                    name="pengadaan" 
                    rows={2} 
                    value={formData.pengadaan} 
                    onChange={handleFormChange} 
                    placeholder="Contoh: Pengadaan Jasa Pemeliharaan Server Aplikasi Kantor..." 
                    className="border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs font-medium bg-[#F4F8FC]/50 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all resize-none" 
                    required 
                  />
                </div>

                {/* 2. Spesifikasi Teknis Jasa */}
                <div className="space-y-3 border-t border-sky-100/80 pt-5">
                  <label className="text-xs font-extrabold text-sky-800 uppercase tracking-wider block">🛠️ 2. Spesifikasi Teknis & Harga</label>
                  
                  <div className="p-5 rounded-2xl bg-[#F4F8FC]/50 border border-sky-100/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Jasa / Pekerjaan</label>
                        <input 
                          type="text" 
                          value={itemJasa.nama_jasa} 
                          onChange={e => handleSpecChange('nama_jasa', e.target.value)} 
                          placeholder="Contoh: Jasa Service & Maintenance Server" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          required 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Ruang Lingkup Pekerjaan</label>
                        <input 
                          type="text" 
                          value={itemJasa.ruang_lingkup} 
                          onChange={e => handleSpecChange('ruang_lingkup', e.target.value)} 
                          placeholder="Contoh: Perbaikan hardware, pembersihan rutin, tuning OS" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Spesifikasi Jasa</label>
                        <input 
                          type="text" 
                          value={itemJasa.spesifikasi} 
                          onChange={e => handleSpecChange('spesifikasi', e.target.value)} 
                          placeholder="Contoh: Pemeliharaan berkala 2x sebulan" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Persyaratan Tambahan</label>
                        <input 
                          type="text" 
                          value={itemJasa.persyaratan_tambahan} 
                          onChange={e => handleSpecChange('persyaratan_tambahan', e.target.value)} 
                          placeholder="Contoh: Sertifikat Teknisi Resmi" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Jumlah / Volume</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={itemJasa.jumlah} 
                          onChange={e => handleSpecChange('jumlah', e.target.value)} 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          required 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Rincian / Komponen Biaya</label>
                        <input 
                          type="text" 
                          value={itemJasa.rincian_biaya} 
                          onChange={e => handleSpecChange('rincian_biaya', e.target.value)} 
                          placeholder="Contoh: Transportasi + Suku Cadang + Jasa Teknisi" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Harga Satuan (-PPN 11%)</label>
                        <input 
                          type="number" 
                          value={itemJasa.harga_satuan} 
                          onChange={e => handleSpecChange('harga_satuan', e.target.value)} 
                          placeholder="Masukkan harga satuan..."
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          required 
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Jumlah Harga (-PPN 11%)</label>
                        <input 
                          type="text" 
                          value={itemJasa.jumlah_harga ? `Rp ${Number(itemJasa.jumlah_harga).toLocaleString('id-ID')}` : ''} 
                          readOnly 
                          placeholder="Terhitung otomatis" 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 outline-none cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Penandatangan */}
                <div className="space-y-3 border-t border-sky-100/80 pt-5">
                  <label className="text-xs font-extrabold text-sky-800 uppercase tracking-wider block">✍️ 4. Penandatangan / Pengesahan</label>
                  <div className="p-4 rounded-2xl bg-[#F4F8FC]/50 border border-sky-100/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Penyerah</label>
                        <input 
                          type="text" 
                          name="nama_penyerah" 
                          value={formData.nama_penyerah} 
                          onChange={handleFormChange} 
                          onFocus={() => setActiveDropdown('penyerah')} 
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                          placeholder="Ketik nama penyerah..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          autoComplete="off" 
                        />
                        {renderKaryawanDropdown('penyerah', formData.nama_penyerah)}
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Bidang Penyerah</label>
                        <input 
                          type="text" 
                          name="bidang1" 
                          value={formData.bidang1} 
                          onChange={handleFormChange} 
                          placeholder="Terisi otomatis / masukkan bidang..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div className="relative">
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Penerima</label>
                        <input 
                          type="text" 
                          name="nama_penerima" 
                          value={formData.nama_penerima} 
                          onChange={handleFormChange} 
                          onFocus={() => setActiveDropdown('penerima')} 
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                          placeholder="Ketik nama penerima..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          autoComplete="off" 
                        />
                        {renderKaryawanDropdown('penerima', formData.nama_penerima)}
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Bidang Penerima</label>
                        <input 
                          type="text" 
                          name="bidang2" 
                          value={formData.bidang2} 
                          onChange={handleFormChange} 
                          placeholder="Terisi otomatis / masukkan bidang..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-6 border-t border-sky-100/80 flex flex-wrap justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={handleSaveDraft} 
                    disabled={loading} 
                    className="bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent font-bold px-5 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Menyimpan..." : "📁 Simpan Draft"}
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/60 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Memproses..." : "Selesai & Kirim Ke Antrean"}
                  </button>
                </div>

              </form>
            </div>

            {/* LIVE PREVIEW DOKUMEN PANEL KANAN */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-6 sticky top-6 h-[calc(100vh-140px)] flex flex-col">
              
              <div className="flex items-center justify-between pb-4 border-b border-sky-100/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Document Preview</h3>
                </div>
                <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2.5 py-1 rounded-full border border-sky-100">Auto Sync</span>
              </div>

              <div className="flex-1 overflow-y-auto border border-sky-100/80 rounded-2xl bg-white p-6 shadow-inner custom-scrollbar space-y-6">
                
                {/* Bagian 1: Tujuan Pengadaan */}
                <div>
                  <p className="font-bold text-xs">1. TUJUAN PENGADAAN</p>
                  <div className="p-3 border border-slate-900 rounded-lg bg-slate-50 text-[11px] font-mono break-words min-h-[42px] mt-1">
                    {formData.pengadaan || '${pengadaan}'}
                  </div>
                </div>

                {/* Bagian 2: Spesifikasi Teknis Jasa */}
                <div>
                  <p className="font-bold text-xs mb-2 uppercase tracking-tight">
                    2. SPESIFIKASI TEKNIS, JUMLAH DAN PERKIRAAN HARGA **)
                  </p>
                  
                  <table className="w-full border-collapse border border-slate-900 text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-2 w-1/2 font-medium">Nama jasa <sup>a)</sup></td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.nama_jasa || '${nama_jasa}'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Ruang lingkup jasa:</td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.ruang_lingkup || '${ruang_lingkup}'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Spesifikasi jasa:</td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.spesifikasi || '${spesifikasi}'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Persyaratan tambahan</td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.persyaratan_tambahan || '${persyaratan_tambahan}'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Jumlah</td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.jumlah || '1'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Rincian/komponen biaya</td>
                        <td className="border border-slate-900 p-2 font-mono">{itemJasa.rincian_biaya || '${rincian_biaya}'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Harga satuan (-PPN 11%) (Rp) <sup>b)</sup></td>
                        <td className="border border-slate-900 p-2 font-mono">
                          {itemJasa.harga_satuan ? `Rp ${Number(itemJasa.harga_satuan).toLocaleString('id-ID')}` : '${harga_satuan}'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-medium">Jumlah Harga (-PPN 11%) (Rp) <sup>c)</sup></td>
                        <td className="border border-slate-900 p-2 font-mono font-bold text-sky-700">
                          {itemJasa.jumlah_harga ? `Rp ${Number(itemJasa.jumlah_harga).toLocaleString('id-ID')}` : '${jumlah_harga}'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bagian 4: Penandatangan / Pengesahan */}
                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-center text-[11px]">
                  <div>
                    <p className="font-medium mb-12">Disiapkan/ditinjau oleh,</p>
                    <p className="font-bold underline font-mono">{formData.nama_penyerah || '${nama_penyerah}'}</p>
                    <p className="font-mono text-slate-600">{formData.bidang1 || '${bidang1}'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-12">Disetujui/disahkan oleh,</p>
                    <p className="font-bold underline font-mono">{formData.nama_penerima || '${nama_penerima}'}</p>
                    <p className="font-mono text-slate-600">{formData.bidang2 || '${bidang2}'}</p>
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