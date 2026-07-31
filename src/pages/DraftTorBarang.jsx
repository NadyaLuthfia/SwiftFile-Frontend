import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';

function DraftTorBarang() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  const draftId = searchParams.get('draft_id') || searchParams.get('id'); // ID untuk mode edit

  const [loading, setLoading] = useState(false);
  const [daftarPegawai, setDaftarPegawai] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'penyerah' | 'penerima' | null

  // State Form Utama
  const [formData, setFormData] = useState({
    nama_draft: '',
    pengadaan: '',
    nama_penyerah: '',
    bidang1: '',
    nama_penerima: '',
    bidang2: ''
  });

  // State Spesifikasi Barang
  const [itemBarang, setItemBarang] = useState({
    nama_barang: '',
    merk: '',
    type: '',
    persyaratan_tambahan: '',
    jumlah: '1',
    harga_satuan: '',
    jumlah_harga: ''
  });

  // State Tabel Rincian Barang & Foto
  const [itemsRincian, setItemsRincian] = useState([
    { barang: '', foto_file: null, foto_preview: null, qty: '1', satuan: 'Pcs', harga_satuan: '', total: '' }
  ]);

  // 1. Fetch Data Karyawan / Pegawai
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

  // 2. Auto-Fill Data Saat Mode Edit Draft
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
        
        // Pembacaan fleksibel baik dari 'data_input' (drafts) maupun 'variables' (dokumen_cetak)
        let input = data.data_input || data.variables || {};
        if (typeof input === 'string') {
          try { input = JSON.parse(input); } catch (e) { input = {}; }
        }

        // Fill Form Utama
        setFormData({
          nama_draft: data.nama_draft || input.nama_draft || '',
          pengadaan: data.pengadaan || input.pengadaan || '',
          nama_penyerah: data.nama_penyerah || input.nama_penyerah || '',
          bidang1: data.bidang1 || input.bidang1 || '',
          nama_penerima: data.nama_penerima || input.nama_penerima || '',
          bidang2: data.bidang2 || input.bidang2 || ''
        });

        // Fill Spesifikasi Barang
        setItemBarang({
          nama_barang: data.nama_barang || input.nama_barang || data.item_barang?.nama_barang || '',
          merk: data.merk || input.merk || data.item_barang?.merk || '',
          type: data.type || input.type || data.item_barang?.type || '',
          persyaratan_tambahan: data.persyaratan_tambahan || input.persyaratan_tambahan || data.item_barang?.persyaratan_tambahan || '',
          jumlah: String(data.jumlah || input.jumlah || data.item_barang?.jumlah || '1'),
          harga_satuan: String(data.harga_satuan || input.harga_satuan || data.item_barang?.harga_satuan || ''),
          jumlah_harga: String(data.jumlah_harga || input.jumlah_harga || data.item_barang?.jumlah_harga || '')
        });

        // Fill Tabel Rincian & Foto
        const rincian = data.rincian_barang || input.rincian_barang || data.rincian || [];
        if (Array.isArray(rincian) && rincian.length > 0) {
          setItemsRincian(rincian.map(r => ({
            barang: r.barang || r.nama_barang || '',
            foto_file: null,
            foto_preview: r.foto ? (r.foto.startsWith('http') ? r.foto : `http://localhost:8000/storage/${r.foto}`) : null,
            qty: String(r.qty || '1'),
            satuan: r.satuan || 'Pcs',
            harga_satuan: String(r.harga_satuan || ''),
            total: String(r.total || '')
          })));
        }
      } catch (err) {
        console.error("Gagal mengambil detail draft lama:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailDraft();
  }, [draftId]);

  // Helper Auto-complete Karyawan
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

  // Form Input Handlers
  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSpecChange = (field, val) => {
    const updated = { ...itemBarang, [field]: val };
    const jml = Number(updated.jumlah) || 0;
    const hrg = Number(updated.harga_satuan) || 0;
    updated.jumlah_harga = jml && hrg ? (jml * hrg).toString() : '';
    setItemBarang(updated);
  };

  const handleRincianChange = (index, field, val) => {
    const updated = [...itemsRincian];
    updated[index][field] = val;
    const q = Number(updated[index].qty) || 0;
    const h = Number(updated[index].harga_satuan) || 0;
    updated[index].total = q && h ? (q * h).toString() : '';
    setItemsRincian(updated);
  };

  // Handle Foto / Gambar
  const handleFoto = (index, file) => {
    const updated = [...itemsRincian];
    if (updated[index].foto_preview && updated[index].foto_preview.startsWith('blob:')) {
      URL.revokeObjectURL(updated[index].foto_preview);
    }
    updated[index].foto_file = file;
    updated[index].foto_preview = file ? URL.createObjectURL(file) : null;
    setItemsRincian(updated);
  };

  const addRincian = () => setItemsRincian([
    ...itemsRincian, 
    { barang: '', foto_file: null, foto_preview: null, qty: '1', satuan: 'Pcs', harga_satuan: '', total: '' }
  ]);
  
  const removeRincian = (index) => {
    if (itemsRincian.length === 1) return;
    if (itemsRincian[index].foto_preview && itemsRincian[index].foto_preview.startsWith('blob:')) {
      URL.revokeObjectURL(itemsRincian[index].foto_preview);
    }
    setItemsRincian(itemsRincian.filter((_, i) => i !== index));
  };

  // Pairing 2 Gambar Per Baris Untuk Layout Lampiran
  const lampiranPairs = itemsRincian.reduce((acc, item, i) => {
    if (i % 2 === 0) acc.push({ kiri: item, kanan: itemsRincian[i + 1] || null });
    return acc;
  }, []);

  // 🎯 HELPER FORM DATA PAYLOAD (MEMBUNGKUS 'variables' SEBAGAI JSON STRING)
  const createFormDataPayload = (status = 'draft') => {
    const data = new FormData();
    data.append('template_id', templateId || '');
    data.append('status', status);

    if (draftId) {
      data.append('draft_id', draftId);
      data.append('_method', 'PUT');
    }

    const namaDraftValue = formData.nama_draft.trim() 
      || (itemBarang.nama_barang ? `TOR - ${itemBarang.nama_barang}` : 'Draft TOR Barang');
    data.append('nama_draft', namaDraftValue);

    // 📦 1. BUNGKUS SELURUH FIELD INPUTAN KE DALAM OBJECT 'variables'
    const variablesObject = {
      nama_draft: namaDraftValue,
      pengadaan: formData.pengadaan,
      nama_penyerah: formData.nama_penyerah,
      bidang1: formData.bidang1,
      nama_penerima: formData.nama_penerima,
      bidang2: formData.bidang2,
      nama_barang: itemBarang.nama_barang,
      merk: itemBarang.merk,
      type: itemBarang.type,
      persyaratan_tambahan: itemBarang.persyaratan_tambahan,
      jumlah: itemBarang.jumlah,
      qty: itemBarang.jumlah,
      harga_satuan: itemBarang.harga_satuan,
      jumlah_harga: itemBarang.jumlah_harga,
      rincian_barang: itemsRincian.map(item => ({
        barang: item.barang,
        qty: item.qty,
        satuan: item.satuan,
        harga_satuan: item.harga_satuan,
        total: item.total
      }))
    };

    // ✅ 2. APPEND 'variables' SEBAGAI JSON STRING (LULUS VALIDASI LARAVEL)
    data.append('variables', JSON.stringify(variablesObject));

    // 3. Append juga field individual agar kompatibel dengan upload file / $request
    Object.keys(formData).forEach(key => {
      if (key !== 'nama_draft') data.append(key, formData[key]);
    });

    Object.keys(itemBarang).forEach(key => data.append(key, itemBarang[key]));

    itemsRincian.forEach((item, index) => {
      data.append(`rincian_barang[${index}][barang]`, item.barang);
      data.append(`rincian_barang[${index}][qty]`, item.qty);
      data.append(`rincian_barang[${index}][satuan]`, item.satuan);
      data.append(`rincian_barang[${index}][harga_satuan]`, item.harga_satuan);
      data.append(`rincian_barang[${index}][total]`, item.total);
      
      if (item.foto_file) {
        data.append(`rincian_barang[${index}][foto]`, item.foto_file);
      }
    });

    return data;
  };

  // Submit Simpan Ke Draft
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = createFormDataPayload('draft');
      const token = localStorage.getItem('token');
      
      const endpoint = draftId ? `http://localhost:8000/api/drafts/${draftId}` : 'http://localhost:8000/api/drafts';
      
      await axios.post(endpoint, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("Dokumen berhasil disimpan ke draft!");
      navigate('/draft-dokumen');
    } catch (err) {
      console.error("Gagal simpan draft:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors?.nama_draft?.[0];
      alert(serverMsg || "Gagal menyimpan ke draft.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Final (Selesai -> SiapCetakController)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = createFormDataPayload('siap_cetak');
      const token = localStorage.getItem('token');

      const endpoint = draftId 
        ? `http://localhost:8000/api/siap-cetak/${draftId}` 
        : 'http://localhost:8000/api/siap-cetak';

      await axios.post(endpoint, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("Dokumen berhasil diselesaikan dan masuk ke antrean siap cetak!");
      navigate('/siap-cetak');
    } catch (err) {
      console.error("Gagal submit dokumen:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors?.variables?.[0] || err.response?.data?.errors?.nama_draft?.[0];
      alert(serverMsg || "Gagal menyelesaikan dokumen.");
    } finally {
      setLoading(false);
    }
  };

  // Dropdown Auto-complete Karyawan
  const renderKaryawanDropdown = (type, query) => {
    if (activeDropdown !== type) return null;
    const list = getFilteredPegawai(query);
    if (!list.length) return null;

    return (
      <div className="absolute left-0 right-0 top-full bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1 mt-1">
        {list.map((k, idx) => (
          <button
            key={k.id || idx}
            type="button"
            onMouseDown={() => handleSelectKaryawan(k, type)}
            className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-colors"
          >
            {k.nama_lengkap || k.nama || k.nama_pegawai} <span className="text-[10px] text-slate-400 font-normal">({k.bidang?.nama_bidang || k.bidang || ''})</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                {draftId ? 'Edit' : 'Draft'} <span className="text-sky-600">TOR Barang</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Form Input Spesifikasi Teknis & Rincian</p>
            </div>
            <button onClick={() => navigate('/draft-dokumen')} className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2.5 rounded-2xl border border-sky-100 cursor-pointer transition-all">
              ← Kembali
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FORM INPUT */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-sky-100 shadow-md p-8 space-y-6">
                
                {/* 0. Nama Draft */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-700">📌 Nama Draft / Dokumen</label>
                  <input 
                    type="text" 
                    name="nama_draft" 
                    value={formData.nama_draft} 
                    onChange={handleFormChange} 
                    placeholder="Contoh: TOR Pengadaan PC Lab Komputer..." 
                    className="w-full border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-400 bg-[#F4F8FC]/50 font-medium" 
                  />
                  <p className="text-[10px] text-slate-400 italic">*Jika dikosongkan, nama draft otomatis dibuat dari nama barang.</p>
                </div>

                {/* 1. Pengadaan */}
                <div className="space-y-2 border-t border-sky-100 pt-5">
                  <label className="text-xs font-bold uppercase tracking-wider">📝 1. Tujuan Pengadaan</label>
                  <textarea name="pengadaan" rows={2} value={formData.pengadaan} onChange={handleFormChange} placeholder="Masukkan tujuan pengadaan..." className="w-full border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-400 bg-[#F4F8FC]/50 font-medium resize-none" required />
                </div>

                {/* 2. Spesifikasi Teknis */}
                <div className="space-y-4 border-t border-sky-100 pt-5">
                  <label className="text-xs font-bold uppercase tracking-wider block">📦 2. Spesifikasi Teknis & Price</label>
                  <div className="p-5 rounded-2xl bg-[#F4F8FC]/60 border border-sky-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500">Nama Barang</label>
                        <input type="text" value={itemBarang.nama_barang} onChange={e => handleSpecChange('nama_barang', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Merk</label>
                        <input type="text" value={itemBarang.merk} onChange={e => handleSpecChange('merk', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Type</label>
                        <input type="text" value={itemBarang.type} onChange={e => handleSpecChange('type', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500">Persyaratan Tambahan</label>
                        <input type="text" value={itemBarang.persyaratan_tambahan} onChange={e => handleSpecChange('persyaratan_tambahan', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Jumlah</label>
                        <input type="number" min="1" value={itemBarang.jumlah} onChange={e => handleSpecChange('jumlah', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Harga Satuan (-PPN 11%)</label>
                        <input type="number" value={itemBarang.harga_satuan} onChange={e => handleSpecChange('harga_satuan', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" required />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500">Jumlah Harga (-PPN 11%)</label>
                        <input type="number" value={itemBarang.jumlah_harga} readOnly placeholder="Terhitung otomatis" className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Tabel Rincian Barang */}
                <div className="space-y-4 border-t border-sky-100 pt-5">
                  <label className="text-xs font-bold uppercase tracking-wider block">📋 3. Tabel Rincian Barang & Foto</label>
                  {itemsRincian.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#F4F8FC]/60 border border-sky-100 space-y-3">
                      <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                        <span className="text-xs font-bold text-sky-800">Rincian #{idx + 1}</span>
                        {itemsRincian.length > 1 && (
                          <button type="button" onClick={() => removeRincian(idx)} className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer">Hapus</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500">Nama Barang</label>
                          <input type="text" placeholder="Spesifikasi barang..." value={item.barang} onChange={e => handleRincianChange(idx, 'barang', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500">Qty</label>
                          <input type="number" value={item.qty} onChange={e => handleRincianChange(idx, 'qty', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500">Satuan</label>
                          <input type="text" value={item.satuan} onChange={e => handleRincianChange(idx, 'satuan', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500">Harga Satuan</label>
                          <input type="number" value={item.harga_satuan} onChange={e => handleRincianChange(idx, 'harga_satuan', e.target.value)} className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500">Total</label>
                          <input type="number" value={item.total} readOnly placeholder="Otomatis" className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2 pt-1">
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Foto Barang</label>
                          <div className="flex flex-col gap-2 border border-sky-100 rounded-xl p-3 bg-white">
                            <input type="file" accept="image/*" disabled={!!item.foto_preview} onChange={e => e.target.files[0] && handleFoto(idx, e.target.files[0])} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer disabled:opacity-50" />
                            {item.foto_preview && (
                              <div className="relative w-24 h-24 mt-1">
                                <img src={item.foto_preview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-sky-200" />
                                <button type="button" onClick={() => handleFoto(idx, null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-red-600 transition-colors">✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button type="button" onClick={addRincian} className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-4 py-2 rounded-xl text-xs border border-sky-200 cursor-pointer transition-all">+ Tambah Baris</button>
                  </div>
                </div>

                {/* 4. Penandatangan */}
                <div className="space-y-4 border-t border-sky-100 pt-5">
                  <label className="text-xs font-bold uppercase tracking-wider block">✍️ 4. Penandatangan / Pengesahan</label>
                  <div className="p-4 rounded-2xl bg-[#F4F8FC]/60 border border-sky-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-[11px] font-bold text-slate-500">Nama Penyerah</label>
                        <input type="text" name="nama_penyerah" value={formData.nama_penyerah} onChange={handleFormChange} onFocus={() => setActiveDropdown('penyerah')} onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} placeholder="Ketik nama penyerah..." className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" autoComplete="off" />
                        {renderKaryawanDropdown('penyerah', formData.nama_penyerah)}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Bidang Penyerah</label>
                        <input type="text" name="bidang1" value={formData.bidang1} onChange={handleFormChange} placeholder="Terisi otomatis / masukkan bidang..." className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                      </div>
                      <div className="relative">
                        <label className="text-[11px] font-bold text-slate-500">Nama Penerima</label>
                        <input type="text" name="nama_penerima" value={formData.nama_penerima} onChange={handleFormChange} onFocus={() => setActiveDropdown('penerima')} onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} placeholder="Ketik nama penerima..." className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" autoComplete="off" />
                        {renderKaryawanDropdown('penerima', formData.nama_penerima)}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500">Bidang Penerima</label>
                        <input type="text" name="bidang2" value={formData.bidang2} onChange={handleFormChange} placeholder="Terisi otomatis / masukkan bidang..." className="w-full border border-sky-100 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-400 font-medium" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={handleSaveDraft} 
                    disabled={loading} 
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs transition-all border border-slate-200 cursor-pointer disabled:bg-slate-100 disabled:opacity-50"
                  >
                    💾 Simpan ke Draft
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                  >
                    {loading ? "Memproses..." : "Selesai"}
                  </button>
                </div>
              </form>
            </div>

            {/* LIVE PREVIEW DOKUMEN */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-sky-100 shadow-md p-6 sticky top-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2">Live Preview Dokumen</h3>
              <div className="space-y-6">
                <div>
                  <p className="font-bold text-xs">1. TUJUAN PENGADAAN</p>
                  <div className="p-3 border border-slate-900 rounded-lg bg-slate-50 text-[11px] font-mono break-words min-h-[42px] mt-1">{formData.pengadaan || '${pengadaan}'}</div>
                </div>

                <div>
                  <p className="font-bold text-xs mb-2">2. SPESIFIKASI TEKNIS, JUMLAH DAN PERKIRAAN HARGA</p>
                  <table className="w-full border-collapse border border-slate-900 text-[11px]">
                    <tbody>
                      <tr><td className="border border-slate-900 p-2 w-1/2 font-medium">Nama barang</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.nama_barang || '${nama_barang}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Merk</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.merk || '${merk}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Type</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.type || '${type}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Persyaratan tambahan</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.persyaratan_tambahan || '${persyaratan_tambahan}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Jumlah</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.jumlah || '${jumlah}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Harga satuan (-PPN 11%)</td><td className="border border-slate-900 p-2 font-mono">{itemBarang.harga_satuan ? `Rp ${Number(itemBarang.harga_satuan).toLocaleString('id-ID')}` : '${harga_satuan}'}</td></tr>
                      <tr><td className="border border-slate-900 p-2 font-medium">Jumlah Harga (-PPN 11%)</td><td className="border border-slate-900 p-2 font-mono font-bold text-sky-700">{itemBarang.jumlah_harga ? `Rp ${Number(itemBarang.jumlah_harga).toLocaleString('id-ID')}` : '${jumlah_harga}'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4">
                  <p className="font-bold text-xs text-center uppercase mb-2">TERM OF REFERENCE (TOR) BARANG</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-900 text-[10px] text-center">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-900 p-1">No</th>
                          <th className="border border-slate-900 p-1">Nama Barang</th>
                          <th className="border border-slate-900 p-1">Qty</th>
                          <th className="border border-slate-900 p-1">Satuan</th>
                          <th className="border border-slate-900 p-1">Harga Satuan</th>
                          <th className="border border-slate-900 p-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsRincian.map((r, idx) => (
                          <tr key={idx} className="font-mono">
                            <td className="border border-slate-900 p-1">{idx + 1}</td>
                            <td className="border border-slate-900 p-1 text-left">{r.barang || '${barang}'}</td>
                            <td className="border border-slate-900 p-1">{r.qty || '${qty}'}</td>
                            <td className="border border-slate-900 p-1">{r.satuan || '${satuan}'}</td>
                            <td className="border border-slate-900 p-1">{r.harga_satuan ? `Rp ${Number(r.harga_satuan).toLocaleString('id-ID')}` : '${harga_satuan}'}</td>
                            <td className="border border-slate-900 p-1 font-bold text-sky-700">{r.total ? `Rp ${Number(r.total).toLocaleString('id-ID')}` : '${total}'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-bold text-xs mb-2">Lampiran ATK</p>
                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr><th colSpan={2} className="border border-slate-900 p-1.5 text-center font-bold bg-slate-50">Lampiran Contoh Foto Barang</th></tr>
                    </thead>
                    <tbody>
                      {lampiranPairs.map((p, idx) => (
                        <tr key={idx} className="font-mono text-center">
                          <td className="border border-slate-900 p-2 w-1/2 align-top">
                            {p.kiri?.foto_preview ? (
                              <img src={p.kiri.foto_preview} alt="" className="h-16 mx-auto object-contain mb-1 rounded" />
                            ) : (
                              <div className="text-slate-400 italic mb-1">{p.kiri?.foto_file?.name || '${foto_kiri}'}</div>
                            )}
                            <div className="font-bold border-t pt-1">{p.kiri?.barang || '${barang_kiri}'}</div>
                          </td>
                          <td className="border border-slate-900 p-2 w-1/2 align-top">
                            {p.kanan?.foto_preview ? (
                              <img src={p.kanan.foto_preview} alt="" className="h-16 mx-auto object-contain mb-1 rounded" />
                            ) : (
                              <div className="text-slate-400 italic mb-1">{p.kanan?.foto_file?.name || '${foto_kanan}'}</div>
                            )}
                            <div className="font-bold border-t pt-1">{p.kanan?.barang || '${barang_kanan}'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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

export default DraftTorBarang;