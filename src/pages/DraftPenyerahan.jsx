import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import axios from 'axios'; 

function DraftPenyerahan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const templateIdParam = searchParams.get('template_id');
  const draftIdParam = searchParams.get('draft_id'); 

  // State Utama
  const [currentTemplateId, setCurrentTemplateId] = useState(null); 
  const [namaDraft, setNamaDraft] = useState(''); 
  const [templateInfo, setTemplateInfo] = useState(null); 
  const [fields, setFields] = useState([]); 
  const [formData, setFormData] = useState({}); 
  const [textContent, setTextContent] = useState(''); 
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingDraft, setLoadingDraft] = useState(false); 
  const [loadingSelesai, setLoadingSelesai] = useState(false); 

  // State Preview Foto di Frontend
  const [filePreviews, setFilePreviews] = useState({});

  // State untuk Tabel Barang / Item Dokumen
  const [dokumen_item, setDokumenItem] = useState([]);

  // State Khusus Kalender Master
  const [calendarDate, setCalendarDate] = useState('');

  // State Autocomplete Karyawan
  const [karyawanList, setKaryawanList] = useState([]); 
  const [filteredPenyerah, setFilteredPenyerah] = useState([]); 
  const [filteredPenerima, setFilteredPenerima] = useState([]); 
  const [showPenyerahDropdown, setShowPenyerahDropdown] = useState(false);
  const [showPenerimaDropdown, setShowPenerimaDropdown] = useState(false);

  useEffect(() => {
    muatDataKaryawan(); 

    if (draftIdParam) {
      ambilDetailDraft(draftIdParam);
    } else if (templateIdParam) {
      setCurrentTemplateId(templateIdParam);
      ambilVariabelTemplate(templateIdParam);
    }
  }, [templateIdParam, draftIdParam]);

  const ambilDetailDraft = (draftId) => {
    setLoadingFetch(true);
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/drafts/${draftId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => {
        const draftData = res.data.data;
        setNamaDraft(draftData.nama_draft);
        setCurrentTemplateId(draftData.template_id);

        let dataInputSebelumnya = draftData.data_input;
        if (typeof dataInputSebelumnya === 'string') {
          dataInputSebelumnya = JSON.parse(dataInputSebelumnya);
        }

        if (draftData.items) {
          setDokumenItem(draftData.items);
        }

        ambilVariabelTemplate(draftData.template_id, dataInputSebelumnya);
      })
      .catch(err => {
        console.error("Gagal memuat detail draft:", err);
        alert("Draft tidak ditemukan atau telah dihapus.");
        setLoadingFetch(false);
      });
  };

  const ambilVariabelTemplate = (idTemplate, dataLama = null) => {
    setLoadingFetch(true);
    const token = localStorage.getItem('token');

    axios.get(`http://localhost:8000/api/templates/${idTemplate}/variables`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => {
        const listVariabel = res.data.variables || []; 
        const namaTemplate = res.data.nama || `Dokumen Template #${idTemplate}`;
        
        setFields(listVariabel);
        setTemplateInfo({ nama: namaTemplate });
        setTextContent(res.data.text_content || ''); 

        const daftarHariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const initialFormState = {};

        if (dataLama) {
          Object.assign(initialFormState, dataLama);
          
          const namaBulanIndo = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
            'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
            'i': '01', 'ii': '02', 'iii': '03', 'iv': '04', 'v': '05', 'vi': '06',
            'vii': '07', 'viii': '08', 'ix': '09', 'x': '10', 'xi': '11', 'xii': '12'
          };
          const yyyy = dataLama.tahun || new Date().getFullYear();
          const mStr = String(dataLama.bulan || '').toLowerCase().trim();
          const mm = namaBulanIndo[mStr] || String(new Date().getMonth() + 1).padStart(2, '0');
          const dd = String(dataLama.tanggal || '').padStart(2, '0');
          
          setCalendarDate(`${yyyy}-${mm}-${dd}`);
        } else {
          listVariabel.forEach(variable => {
            initialFormState[variable] = ''; 
          });

          const hariIni = new Date();
          const yyyy = hariIni.getFullYear();
          const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
          const dd = String(hariIni.getDate()).padStart(2, '0');
          const tglString = `${yyyy}-${mm}-${dd}`;
          
          const daftarBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          
          initialFormState['tanggal'] = String(hariIni.getDate());
          initialFormState['bulan'] = daftarBulanIndo[hariIni.getMonth()];
          initialFormState['tahun'] = String(yyyy);
          initialFormState['hari'] = daftarHariIndo[hariIni.getDay()];
          initialFormState['tanggal_input'] = tglString;

          setCalendarDate(tglString);
          setNamaDraft(`${namaTemplate} - ${hariIni.getDate()}/${hariIni.getMonth() + 1}/${yyyy}`);
        }

        axios.get('http://localhost:8000/api/next-counter', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        .then(counterRes => {
          const nextNo = String(counterRes.data.next_counter || 1).padStart(3, '0');
          initialFormState['no'] = nextNo; 
          setFormData(initialFormState);
          setLoadingFetch(false);
        })
        .catch(err => {
          console.error("Gagal mengambil counter live, memakai data lokal:", err);
          if (!initialFormState['no']) {
            initialFormState['no'] = '001';
          }
          setFormData(initialFormState);
          setLoadingFetch(false);
        });

      })
      .catch(err => {
        console.error("Gagal men-scan template:", err);
        setLoadingFetch(false);
      });
  };

  const muatDataKaryawan = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:8000/api/karyawan', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      setKaryawanList(res.data.data || []);
    })
    .catch(err => console.error("Gagal memuat data karyawan:", err));
  };

  const handleCalendarChange = (e) => {
    const value = e.target.value; 
    setCalendarDate(value);
    
    if (!value) return;
    
    const dateObj = new Date(value);
    const day = dateObj.getDate();
    const daftarBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = daftarBulanIndo[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const daftarHariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daftarHariIndo[dateObj.getDay()];
    
    setFormData(prev => ({
      ...prev,
      tanggal: String(day),
      bulan: monthName,
      tahun: String(year),
      hari: dayName,
      tanggal_input: value
    }));

    setNamaDraft(`${templateInfo?.nama || 'BA Penyerahan'} - ${day}/${dateObj.getMonth() + 1}/${year}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'nama_penyerah') {
      if (value.trim() === '') {
        setFilteredPenyerah([]);
        setShowPenyerahDropdown(false);
      } else {
        const hasilFilter = karyawanList.filter(k =>
          k.nama_lengkap.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredPenyerah(hasilFilter);
        setShowPenyerahDropdown(true);
      }
    }

    if (name === 'nama_penerima') {
      if (value.trim() === '') {
        setFilteredPenerima([]);
        setShowPenerimaDropdown(false);
      } else {
        const hasilFilter = karyawanList.filter(k =>
          k.nama_lengkap.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredPenerima(hasilFilter);
        setShowPenerimaDropdown(true);
      }
    }
  };

  const handleFileChange = (e, variableName) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, [variableName]: file }));

    const previewUrl = URL.createObjectURL(file);
    setFilePreviews(prev => ({ ...prev, [variableName]: previewUrl }));
  };

  const pilihKaryawan = (karyawan, tipeVariable) => {
    if (tipeVariable === 'nama_penyerah') {
      setFormData(prev => ({
        ...prev,
        nama_penyerah: karyawan.nama_lengkap,
        jabatan1: karyawan.jabatan?.nama_jabatan || '', 
        bidang1: karyawan.bidang?.nama_bidang || ''     
      }));
      setShowPenyerahDropdown(false);
    } 
    
    if (tipeVariable === 'nama_penerima') {
      setFormData(prev => ({
        ...prev,
        nama_penerima: karyawan.nama_lengkap,
        jabatan2: karyawan.jabatan?.nama_jabatan || '', 
        bidang2: karyawan.bidang?.nama_bidang || ''     
      }));
      setShowPenerimaDropdown(false);
    }
  };

  const generateMultipartData = (isCetakLangsung = false) => {
    const data = new FormData();
    data.append('template_id', currentTemplateId);
    data.append('nama_dokumen', namaDraft);
    data.append('nama_draft', namaDraft);

    Object.keys(formData).forEach(key => {
      const item = formData[key];
      if (item instanceof File) {
        data.append(key, item);
      } else {
        data.append(`variables[${key}]`, item);
        data.append(`isian[${key}]`, item); 
      }
    });

    return data;
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    setLoadingDraft(true);
    const token = localStorage.getItem('token');

    const endpoint = draftIdParam 
      ? `http://localhost:8000/api/drafts/${draftIdParam}`
      : 'http://localhost:8000/api/drafts';
      
    const payloadMultipart = generateMultipartData(false);

    if (draftIdParam) {
      payloadMultipart.append('_method', 'PUT');
    }

    axios({
      method: 'post', 
      url: endpoint,
      data: payloadMultipart,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then(() => {
      alert("📁 Draft dokumen berhasil diamankan!");
      setLoadingDraft(false);
      navigate('/draft-dokumen'); 
    })
    .catch(err => {
      console.error(err);
      alert("❌ Gagal memproses simpan draf.");
      setLoadingDraft(false);
    });
  };

  const handleSelesai = (e) => {
    e.preventDefault();
    setLoadingSelesai(true);
    const token = localStorage.getItem('token');
    
    const payloadMultipart = generateMultipartData(false);
    payloadMultipart.append('items', JSON.stringify(dokumen_item));

    axios.post('http://localhost:8000/api/siap-cetak', payloadMultipart, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then(res => {
      if (draftIdParam) {
        return axios.delete(`http://localhost:8000/api/drafts/${draftIdParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    })
    .then(() => {
      alert("📥 Sukses masuk antrean cetak & dokumen berhasil disimpan!");
      setLoadingSelesai(false);
      navigate('/siap-cetak'); 
    })
    .catch(err => {
      console.error(err);
      alert("❌ Gagal memproses pengiriman dokumen.");
      setLoadingSelesai(false);
    });
  };

  const formatLabel = (text) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderLivePreview = () => {
    if (!textContent) {
      return <p className="text-slate-400 italic text-center py-10">Memuat teks preview...</p>;
    }

    let processedHTML = textContent;

    fields.forEach(variable => {
      if (['bulan', 'tahun', 'tanggal', 'no' ].includes(variable)) return;
      
      // Deteksi semua jenis string bernuansa foto agar preview di kanan seragam penampilannya
      if (variable.startsWith('foto') || variable === 'foto_tunggal') {
        const filePreview = filePreviews[variable];
        const replacementPhoto = filePreview 
          ? `<img src="${filePreview}" class="max-w-[120px] max-h-[60px] object-contain rounded-lg border border-slate-200 p-1 bg-white my-1 inline-block" />`
          : `<span class="bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-mono">[Foto ${formatLabel(variable)}]</span>`;
        processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementPhoto);
        return;
      }

      let userValue = formData[variable];
      const replacementText = userValue 
        ? `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValue}</span>` 
        : `<span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-200 mx-0.5">${variable}</span>`;
      
      processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementText);
    });

    if (fields.includes('no') || textContent.includes('${no}')) {
      const userValueNo = formData['no'] || "001";
      const replacementNo = `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValueNo}</span>`;
      processedHTML = processedHTML.replaceAll('${no}', replacementNo);
    }

    if (fields.includes('tahun') || textContent.includes('${tahun}')) {
      const userValueTahun = formData['tahun'] || new Date().getFullYear();
      const replacementTahun = `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValueTahun}</span>`;
      processedHTML = processedHTML.replaceAll('${tahun}', replacementTahun);
    }

    if (fields.includes('tanggal') || textContent.includes('${tanggal}')) {
      const userValueTanggal = formData['tanggal'] || new Date().getDate();
      const replacementTanggal = `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValueTanggal}</span>`;
      processedHTML = processedHTML.replaceAll('${tanggal}', replacementTanggal);
    }

    if (fields.includes('bulan') || textContent.includes('${bulan}')) {
      const userValueBulan = formData['bulan'] || 'Juli';
      
      const romawiMap = {
        'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
        'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
      };
      const nilaiRomawi = romawiMap[userValueBulan] || 'VII';
      
      processedHTML = processedHTML.replace(/\/BTG-\s*\${bulan}\s*\//g, `/BTG-<span class="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded font-bold border border-emerald-200 mx-0.5">${nilaiRomawi}</span>/`);
      
      const replacementAlfabet = `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValueBulan}</span>`;
      processedHTML = processedHTML.replaceAll('${bulan}', replacementAlfabet);
    }

    return (
      <div dangerouslySetInnerHTML={{ __html: processedHTML }} className="text-slate-700 leading-relaxed space-y-3 whitespace-pre-line break-words text-xs tracking-normal [&_table]:!w-auto [&_table]:!max-w-full [&_td]:!p-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_td]:border [&_td]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50" />
    );
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-700 flex h-screen w-full overflow-hidden antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-6 overflow-y-auto h-full">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          
          <header className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Smart Auto-Scan Form</span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {draftIdParam ? 'Edit Draft:' : 'Draft Baru:'} <span className="text-blue-600">{templateInfo?.nama || 'Memuat...'}</span>
              </h1>
            </div>
            <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm cursor-pointer">
              ⬅️ Kembali
            </button>
          </header>

          {loadingFetch ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-4 shadow-sm animate-pulse">
              <div className="text-4xl text-blue-500 animate-spin inline-block">⏳</div>
              <p className="text-slate-500 font-bold text-sm">Sinkronisasi data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PANEL KIRI FORM */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSelesai} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 font-medium">
                    <span>🤖</span>
                    <p><b>Sinkronisasi Kalender & Form Aktif!</b> Input data di bawah langsung ter-sinkronisasi ke berkas preview secara langsung.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* KALENDER UTAMA */}
                    <div className="flex flex-col gap-1.5 md:col-span-2 border-b border-slate-100 pb-3">
                      <label className="text-xs font-bold text-blue-600">
                        Tanggal Dokumen <span className="text-slate-400 font-normal">(Hari, Tgl, Bln, Thn Otomatis)</span>
                      </label>
                      <input 
                        type="date"
                        value={calendarDate}
                        onChange={handleCalendarChange}
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    {fields
                      .filter(v => 
                        v !== 'no' && 
                        v !== 'bulan' && 
                        v !== 'tahun' && 
                        v !== 'tanggal' && 
                        v !== 'hari' &&
                        // ✨ KUNCI UTAMA: Pengecualian variabel layout agar disembunyikan dari UI Form input
                        v !== 'foto_tunggal' &&
                        !v.startsWith('foto3_') &&
                        !v.startsWith('foto_grid')
                      )
                      .map((variableName) => {
                        const isPenyerah = variableName === 'nama_penyerah';
                        const isPenerima = variableName === 'nama_penerima';
                        const isPhoto = variableName.startsWith('foto_');
                        
                        return (
                          <div key={variableName} className={`flex flex-col gap-1.5 ${isPenyerah || isPenerima ? 'relative' : ''} ${isPhoto ? 'md:col-span-2' : ''}`}>
                            <label className="text-xs font-bold text-slate-600">
                              {formatLabel(variableName)} <span className="text-slate-300">({variableName})</span>
                            </label>
                            
                            {isPhoto ? (
                              <div className="flex items-center gap-4 border border-slate-200 rounded-xl p-3 bg-slate-50/30 hover:border-blue-300 transition-all">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, variableName)}
                                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer flex-1"
                                />
                                {filePreviews[variableName] && (
                                  <img 
                                    src={filePreviews[variableName]} 
                                    alt="Mini Preview" 
                                    className="w-16 h-12 object-cover rounded-lg border border-slate-200 shadow-sm"
                                  />
                                )}
                              </div>
                            ) : (
                              <input 
                                type="text" 
                                name={variableName} 
                                value={formData[variableName] || ''} 
                                onChange={handleChange} 
                                onFocus={() => {
                                  if (isPenyerah && formData.nama_penyerah) setShowPenyerahDropdown(true);
                                  if (isPenerima && formData.nama_penerima) setShowPenerimaDropdown(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    if (isPenyerah) setShowPenyerahDropdown(false);
                                    if (isPenerima) setShowPenerimaDropdown(false);
                                  }, 200);
                                }}
                                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30" 
                                required 
                              />
                            )}

                            {isPenyerah && showPenyerahDropdown && filteredPenyerah.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenyerah.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penyerah')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {isPenerima && showPenerimaDropdown && filteredPenerima.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenerima.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penerima')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                    <button type="button" onClick={handleSaveDraft} disabled={loadingDraft || loadingSelesai} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer">
                      {loadingDraft ? 'Menyimpan...' : draftIdParam ? '🔄 Perbarui Draft' : '📁 Simpan Draft'}
                    </button>
                    
                    <button type="submit" disabled={loadingDraft || loadingSelesai} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer">
                      {loadingSelesai ? 'Memproses...' : '✨ Selesai & Kirim Ke Antrean'}
                    </button>
                  </div>

                </form>
              </div>

              {/* PANEL KANAN PREVIEW */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-6 h-[calc(100vh-140px)] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Document Preview</h3>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-full animate-pulse">Auto Sync</span>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 mb-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-blue-800 font-medium">
                  <span className="text-sm mt-0.5">💡</span>
                  <div>
                    <strong className="text-blue-900">Sistem Nomor Dokumen:</strong> Nomor surat yang tertera di live preview saat ini hanyalah <strong>contoh/estimasi sementara</strong>. Nomor resmi yang asli akan otomatis disesuaikan secara akurat berdasarkan urutan terakhir di database saat dokumen dicetak.
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl bg-white p-6 shadow-inner">
                  {renderLivePreview()}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DraftPenyerahan;