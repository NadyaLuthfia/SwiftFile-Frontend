import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

function DraftTorJasa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  const draftId = searchParams.get('draft_id') || searchParams.get('id');
  const siapCetakIdParam = searchParams.get('siap_cetak_id');
  const arsipIdParam = searchParams.get('arsip_id');

  // State Template ID
  const [savedTemplateId, setSavedTemplateId] = useState(templateId || '');

  const [loading, setLoading] = useState(false);
  const [daftarPegawai, setDaftarPegawai] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // State Form Utama
  const [formData, setFormData] = useState({
    pengadaan: '',
    nama_peninjau: '',
    bidang1: '',
    nama_penyetuju: '',
    bidang2: ''
  });

  // State Spesifikasi Jasa / Pekerjaan
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

  // 2. Auto-Fill Data Saat Edit Draft / Siap Cetak / Arsip
  useEffect(() => {
    if (!draftId && !siapCetakIdParam && !arsipIdParam) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let endpoint = `http://localhost:8000/api/drafts/${draftId}`;
        if (siapCetakIdParam) {
          endpoint = `http://localhost:8000/api/siap-cetak/${siapCetakIdParam}`;
        } else if (arsipIdParam) {
          endpoint = `http://localhost:8000/api/arsip/${arsipIdParam}`;
        }

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data.data || res.data;
        
        if (data.template_id) {
          setSavedTemplateId(data.template_id);
        }

        let input = data.variables || data.data_input || {};
        if (typeof input === 'string') {
          try { input = JSON.parse(input); } catch (e) { input = {}; }
        }

        setFormData({
          pengadaan: data.pengadaan || input.pengadaan || input.tujuan_pengadaan || input.TUJUAN_PENGADAAN || '',
          nama_peninjau: data.nama_peninjau || input.nama_peninjau || data.nama_penyerah || input.nama_penyerah || '',
          bidang1: data.bidang1 || input.bidang1 || '',
          nama_penyetuju: data.nama_penyetuju || input.nama_penyetuju || data.nama_penerima || input.nama_penerima || '',
          bidang2: data.bidang2 || input.bidang2 || ''
        });

        setItemJasa({
          nama_jasa: data.nama_jasa || input.nama_jasa || input.nama_pekerjaan || input.NAMA_JASA || '',
          ruang_lingkup: data.ruang_lingkup || input.ruang_lingkup || input.RUANG_LINGKUP || '',
          spesifikasi: data.spesifikasi || input.spesifikasi || input.SPESIFIKASI || '',
          persyaratan_tambahan: data.persyaratan_tambahan || input.persyaratan_tambahan || input.PERSYARATAN_TAMBAHAN || '',
          jumlah: String(data.jumlah || input.jumlah || '1'),
          rincian_biaya: data.rincian_biaya || input.rincian_biaya || input.RINCIAN_BIAYA || '',
          harga_satuan: String(data.harga_satuan || input.harga_satuan || input.HARGA_SATUAN || ''),
          jumlah_harga: String(data.jumlah_harga || input.jumlah_harga || input.JUMLAH_HARGA || '')
        });

      } catch (err) {
        console.error("Gagal mengambil detail dokumen:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [draftId, siapCetakIdParam, arsipIdParam]);

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
      [target === 'peninjau' ? 'nama_peninjau' : 'nama_penyetuju']: nama,
      [target === 'peninjau' ? 'bidang1' : 'bidang2']: bidang,
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

  // PEMBUATAN PAYLOAD
  const createFormDataPayload = (status = 'draft') => {
    const data = new FormData();
    data.append('template_id', savedTemplateId || templateId || '');
    data.append('status', status);

    // Set Kategori & Jenis Dokumen secara eksplisit
    data.append('kategori', 'tor_jasa');
    data.append('jenis_dokumen', 'tor_jasa');
    data.append('tipe_dokumen', 'tor_jasa');

    if (draftId && status === 'draft') {
      data.append('draft_id', draftId);
      data.append('_method', 'PUT');
    }

    const namaDraftValue = itemJasa.nama_jasa.trim() 
      ? `TOR Jasa - ${itemJasa.nama_jasa}` 
      : 'Draft TOR Jasa';
    
    data.append('nama_draft', namaDraftValue);
    data.append('nama_dokumen', namaDraftValue);

    const variablesObject = {
      kategori: 'tor_jasa',
      jenis_dokumen: 'tor_jasa',
      nama_draft: namaDraftValue,

      pengadaan: formData.pengadaan,
      tujuan: formData.pengadaan,
      tujuan_pengadaan: formData.pengadaan,
      TUJUAN_PENGADAAN: formData.pengadaan,

      nama_peninjau: formData.nama_peninjau,
      NAMA_PENINJAU: formData.nama_peninjau,
      nama_penyerah: formData.nama_peninjau, // Fallback
      bidang1: formData.bidang1,
      BIDANG1: formData.bidang1,
      
      nama_penyetuju: formData.nama_penyetuju,
      NAMA_PENYETUJU: formData.nama_penyetuju,
      nama_penerima: formData.nama_penyetuju, // Fallback
      bidang2: formData.bidang2,
      BIDANG2: formData.bidang2,
      
      nama_jasa: itemJasa.nama_jasa,
      NAMA_JASA: itemJasa.nama_jasa,
      nama_pekerjaan: itemJasa.nama_jasa,
      NAMA_PEKERJAAN: itemJasa.nama_jasa,

      ruang_lingkup: itemJasa.ruang_lingkup,
      RUANG_LINGKUP: itemJasa.ruang_lingkup,

      spesifikasi: itemJasa.spesifikasi,
      SPESIFIKASI: itemJasa.spesifikasi,

      persyaratan_tambahan: itemJasa.persyaratan_tambahan,
      PERSYARATAN_TAMBAHAN: itemJasa.persyaratan_tambahan,

      jumlah: itemJasa.jumlah,
      JUMLAH: itemJasa.jumlah,

      rincian_biaya: itemJasa.rincian_biaya,
      RINCIAN_BIAYA: itemJasa.rincian_biaya,

      harga_satuan: itemJasa.harga_satuan,
      HARGA_SATUAN: itemJasa.harga_satuan,

      jumlah_harga: itemJasa.jumlah_harga,
      JUMLAH_HARGA: itemJasa.jumlah_harga
    };

    data.append('variables', JSON.stringify(variablesObject));

    Object.keys(formData).forEach(key => data.append(key, formData[key] ?? ''));
    Object.keys(itemJasa).forEach(key => data.append(key, itemJasa[key] ?? ''));

    data.append('tujuan_pengadaan', formData.pengadaan ?? '');
    data.append('TUJUAN_PENGADAAN', formData.pengadaan ?? '');
    data.append('NAMA_JASA', itemJasa.nama_jasa ?? '');

    return data;
  };

  // Simpan Draft
  const handleSaveDraft = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    
    const payload = createFormDataPayload('draft');
    const token = localStorage.getItem('token');
    const endpoint = draftId ? `http://localhost:8000/api/drafts/${draftId}` : 'http://localhost:8000/api/drafts';
    
    axios({
      method: 'post',
      url: endpoint,
      data: payload,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then((res) => {
      const savedId = res.data?.data?.id || res.data?.id || draftId;
      setLoading(false);

      navigate('/draft-dokumen', {
        state: { 
          targetTab: 'tor_jasa',
          highlightId: savedId 
        }
      });
    })
    .catch(err => {
      console.error("Gagal simpan draft:", err);
      alert(err.response?.data?.message || "Gagal menyimpan draft.");
      setLoading(false);
    });
  };

  // Submit Final (Siap Cetak Baru)
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = createFormDataPayload('siap_cetak');
    const token = localStorage.getItem('token');

    axios.post(`http://localhost:8000/api/siap-cetak`, payload, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then((res) => {
      const createdId = res.data?.data?.id || res.data?.id;

      if (draftId) {
        return axios.delete(`http://localhost:8000/api/drafts/${draftId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => createdId);
      }
      return createdId;
    })
    .then((createdId) => {
      setLoading(false);
      
      navigate('/siap-cetak', {
        state: { 
          tab: 'tor_jasa',
          activeTab: 'tor_jasa',
          targetTab: 'tor_jasa',
          highlightId: createdId 
        }
      });
    })
    .catch(err => {
      console.error("Gagal submit dokumen:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors?.variables?.[0] || err.response?.data?.errors?.nama_draft?.[0];
      alert(serverMsg || "Gagal menyelesaikan dokumen.");
      setLoading(false);
    });
  };

  // Update Siap Cetak (Saat Edit dari Halaman Siap Cetak)
  const handleUpdateSiapCetak = (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = createFormDataPayload('siap_cetak');
    payload.append('_method', 'PUT');
    const token = localStorage.getItem('token');

    axios.post(`http://localhost:8000/api/siap-cetak/${siapCetakIdParam}`, payload, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then(() => {
      setLoading(false);
      navigate(`/siap-cetak?highlight=${encodeURIComponent(siapCetakIdParam)}&tab=tor_jasa`, {
        state: { 
          tab: 'tor_jasa',
          activeTab: 'tor_jasa',
          targetTab: 'tor_jasa',
          highlightId: siapCetakIdParam,
          highlight_id: siapCetakIdParam
        }
      });
    })
    .catch(err => {
      console.error("Gagal update antrean cetak:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors?.variables?.[0];
      alert(serverMsg || "Gagal memperbarui dokumen siap cetak.");
      setLoading(false);
    });
  };

  // Update Arsip (Saat Edit dari Halaman Arsip)
  const handleUpdateArsip = (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = createFormDataPayload('arsip');
    payload.append('_method', 'PUT');
    const token = localStorage.getItem('token');

    axios.post(`http://localhost:8000/api/arsip/${arsipIdParam}`, payload, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then(() => {
      setLoading(false);
      // Simpan data highlight ke sessionStorage agar aman jika di-refresh
      sessionStorage.setItem('active_arsip_highlight', JSON.stringify({
        highlightId: arsipIdParam,
        targetTab: 'tor_jasa',
        timestamp: Date.now()
      }));

      // Navigasi ke Arsip Dokumen dengan state & query params
      navigate(`/arsip-dokumen?highlight=${encodeURIComponent(arsipIdParam)}&tab=tor_jasa`, {
        state: { 
          tab: 'tor_jasa',
          activeTab: 'tor_jasa',
          targetTab: 'tor_jasa',
          highlightId: arsipIdParam,
          highlight_id: arsipIdParam
        }
      });
    })
    .catch(err => {
      console.error("Gagal update arsip:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors?.variables?.[0];
      alert(serverMsg || "Gagal memperbarui arsip dokumen.");
      setLoading(false);
    });
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
              {arsipIdParam ? 'Edit Arsip:' : siapCetakIdParam ? 'Edit Siap Cetak:' : draftId ? 'Edit Draft:' : 'Draft Baru:'}{' '}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">
                TOR Jasa
              </span>
            </h1>
            <button 
              onClick={() => navigate(-1)} 
              className="text-xs font-bold text-sky-700 bg-sky-50/80 hover:bg-sky-100 px-4 py-2.5 rounded-2xl border border-sky-100/80 transition-all transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              ⬅️ Kembali
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* PANEL KIRI FORM */}
            <div className="lg:col-span-7">
              <form onSubmit={arsipIdParam ? handleUpdateArsip : siapCetakIdParam ? handleUpdateSiapCetak : handleSubmit} className="bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-8 space-y-6">
                
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
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Peninjau</label>
                        <input 
                          type="text" 
                          name="nama_peninjau" 
                          value={formData.nama_peninjau} 
                          onChange={handleFormChange} 
                          onFocus={() => setActiveDropdown('peninjau')} 
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                          placeholder="Ketik nama peninjau..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          autoComplete="off" 
                        />
                        {renderKaryawanDropdown('peninjau', formData.nama_peninjau)}
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Bidang Peninjau</label>
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
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Nama Penyetuju</label>
                        <input 
                          type="text" 
                          name="nama_penyetuju" 
                          value={formData.nama_penyetuju} 
                          onChange={handleFormChange} 
                          onFocus={() => setActiveDropdown('penyetuju')} 
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} 
                          placeholder="Ketik nama penyetuju..." 
                          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none font-medium transition-all" 
                          autoComplete="off" 
                        />
                        {renderKaryawanDropdown('penyetuju', formData.nama_penyetuju)}
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Bidang Penyetuju</label>
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
                  {arsipIdParam ? (
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-300/60 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Memperbarui..." : "🔄 Update Arsip"}
                    </button>
                  ) : siapCetakIdParam ? (
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-300/60 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Memperbarui..." : "🔄 Update Antrean Cetak"}
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
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
                    <p className="font-bold underline font-mono">{formData.nama_peninjau || '${nama_peninjau}'}</p>
                    <p className="font-mono text-slate-600">{formData.bidang1 || '${bidang1}'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-12">Disetujui/disahkan oleh,</p>
                    <p className="font-bold underline font-mono">{formData.nama_penyetuju || '${nama_penyetuju}'}</p>
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