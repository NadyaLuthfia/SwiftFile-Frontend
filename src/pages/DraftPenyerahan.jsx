import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // State khusus penampung array file foto & preview
  const [photoFiles, setPhotoFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const filePreviewsRef = useRef({});

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

  const muatDataKaryawan = useCallback(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:8000/api/karyawan', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      setKaryawanList(res.data.data || []);
    })
    .catch(err => console.error("Gagal memuat data karyawan:", err));
  }, []);

  const ambilVariabelTemplate = useCallback((idTemplate, dataLama = null) => {
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
          setFormData(initialFormState);
          setLoadingFetch(false);
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
        }
      })
      .catch(err => {
        console.error("Gagal men-scan template:", err);
        setLoadingFetch(false);
      });
  }, []);

  const ambilDetailDraft = useCallback((draftId) => {
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
        setLoadingFetch(false);
      });
  }, [ambilVariabelTemplate]);

  useEffect(() => {
    muatDataKaryawan(); 

    if (draftIdParam) {
      ambilDetailDraft(draftIdParam);
    } else if (templateIdParam) {
      setCurrentTemplateId(templateIdParam);
      ambilVariabelTemplate(templateIdParam);
    }

    return () => {
      Object.values(filePreviewsRef.current).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [templateIdParam, draftIdParam, muatDataKaryawan, ambilDetailDraft]);

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

  // MANAJEMEN FOTO DINAMIS
  const updatePhotosState = (updatedList) => {
    Object.values(filePreviewsRef.current).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });

    const newPreviews = {};
    const newFormData = { ...formData };

    Object.keys(newFormData).forEach(key => {
      if (key.startsWith('foto_')) {
        delete newFormData[key];
      }
    });

    updatedList.forEach((file, index) => {
      const varName = `foto_${index + 1}`;
      newFormData[varName] = file;
      newPreviews[varName] = URL.createObjectURL(file);
    });

    filePreviewsRef.current = newPreviews;
    setPhotoFiles(updatedList);
    setFilePreviews(newPreviews);
    setFormData(newFormData);
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const updatedList = [...photoFiles, ...files];
    updatePhotosState(updatedList);

    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    const updatedList = photoFiles.filter((_, index) => index !== indexToRemove);
    updatePhotosState(updatedList);
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

  // =========================================================================
  // 🔥 PERBAIKAN UTAMA DI SINI (PENYEBABB FOTO GAK KEBACA BERHASIL DIPERBAIKI):
  // =========================================================================
  const generateMultipartData = (isCetakLangsung = false) => {
    const data = new FormData();
    data.append('template_id', currentTemplateId);
    data.append('nama_dokumen', namaDraft);
    data.append('nama_draft', namaDraft);

    // 1. Masukkan semua variabel teks biasa
    Object.keys(formData).forEach(key => {
      const item = formData[key];
      if (!(item instanceof File)) {
        data.append(`variables[${key}]`, item);
        data.append(`isian[${key}]`, item); 
      }
    });

    // 2. KUNCI UTAMA: Masukkan semua file gambar ke key 'foto[]'
    if (photoFiles && photoFiles.length > 0) {
      photoFiles.forEach(file => {
        data.append('foto[]', file);
      });
    }

    return data;
  };

  // 1. SIMPAN DRAFT
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
      setLoadingDraft(false);
      navigate('/draft-dokumen'); 
    })
    .catch(err => {
      console.error("Gagal menyimpan draft:", err);
      setLoadingDraft(false);
    });
  };

  // 2. SELESAI & KIRIM
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
      setLoadingSelesai(false);
      navigate('/siap-cetak'); 
    })
    .catch(err => {
      console.error("Gagal mengirim dokumen:", err);
      setLoadingSelesai(false);
    });
  };

  const formatLabel = (text) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // LIVE PREVIEW DENGAN SKEMA WARNA SKY BLUE
  const renderLivePreview = () => {
    if (!textContent) {
      return <p className="text-slate-400 italic text-center py-10">Memuat teks preview...</p>;
    }

    let processedHTML = textContent;

    fields.forEach(variable => {
      if (['bulan', 'tahun', 'tanggal', 'no' ].includes(variable)) return;
      
      if (variable.startsWith('foto') || variable === 'foto_tunggal') {
        const filePreview = filePreviews[variable];
        const replacementPhoto = filePreview 
          ? `<img src="${filePreview}" class="max-w-[140px] max-h-[100px] object-cover rounded-2xl border border-sky-200 my-1.5 shadow-xs inline-block" />`
          : `<span class="text-sky-600 font-bold text-[11px]">[Foto ${formatLabel(variable)}]</span>`;
        processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementPhoto);
        return;
      }

      let userValue = formData[variable];
      const replacementText = userValue 
        ? `<span class="text-sky-600 font-bold">${userValue}</span>` 
        : `<span class="text-slate-400 font-mono text-[10px]">[${variable}]</span>`;
      
      processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementText);
    });

    if (fields.includes('no') || textContent.includes('${no}')) {
      const userValueNo = formData['no'] || "001";
      const replacementNo = `<span class="text-sky-600 font-bold">${userValueNo}</span>`;
      processedHTML = processedHTML.replaceAll('${no}', replacementNo);
    }

    if (fields.includes('tahun') || textContent.includes('${tahun}')) {
      const userValueTahun = formData['tahun'] || new Date().getFullYear();
      const replacementTahun = `<span class="text-sky-600 font-bold">${userValueTahun}</span>`;
      processedHTML = processedHTML.replaceAll('${tahun}', replacementTahun);
    }

    if (fields.includes('tanggal') || textContent.includes('${tanggal}')) {
      const userValueTanggal = formData['tanggal'] || new Date().getDate();
      const replacementTanggal = `<span class="text-sky-600 font-bold">${userValueTanggal}</span>`;
      processedHTML = processedHTML.replaceAll('${tanggal}', replacementTanggal);
    }

    if (fields.includes('bulan') || textContent.includes('${bulan}')) {
      const userValueBulan = formData['bulan'] || 'Juli';
      
      const romawiMap = {
        'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
        'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
      };
      const nilaiRomawi = romawiMap[userValueBulan] || 'VII';
      
      processedHTML = processedHTML.replace(/\/BTG-\s*\${bulan}\s*\//g, `/BTG-<span class="text-sky-600 font-bold">${nilaiRomawi}</span>/`);
      
      const replacementAlfabet = `<span class="text-sky-600 font-bold">${userValueBulan}</span>`;
      processedHTML = processedHTML.replaceAll('${bulan}', replacementAlfabet);
    }

    return (
      <div dangerouslySetInnerHTML={{ __html: processedHTML }} className="text-slate-700 leading-relaxed space-y-3 whitespace-pre-line break-words text-xs tracking-normal [&_table]:!w-auto [&_table]:!max-w-full [&_td]:!p-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-200 [&_td]:border [&_td]:border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50" />
    );
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          <header className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {draftIdParam ? 'Edit Draft:' : 'Draft Baru:'}{' '}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">
                {templateInfo?.nama || 'Memuat...'}
              </span>
            </h1>
            <button 
              onClick={() => navigate(-1)} 
              className="text-xs font-bold text-sky-700 bg-sky-50/80 hover:bg-sky-100 px-4 py-2.5 rounded-2xl border border-sky-100/80 transition-all transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              ⬅️ Kembali
            </button>
          </header>

          {loadingFetch ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-4 shadow-xs">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-600 font-bold text-xs">Sinkronisasi data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PANEL KIRI FORM */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSelesai} className="bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-8 space-y-6">
                  
                  <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/80 border border-sky-100/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-sky-950 font-medium">
                    <span>🤖</span>
                    <p><b>Sinkronisasi Kalender & Form Aktif!</b> Input data di bawah langsung tersinkronisasi ke berkas preview secara real-time.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* KALENDER UTAMA */}
                    <div className="flex flex-col gap-1.5 md:col-span-2 border-b border-sky-100/80 pb-4">
                      <label className="text-xs font-extrabold text-sky-800 uppercase tracking-wider">
                        Tanggal Dokumen <span className="text-slate-400 font-normal lowercase">(Hari, Tgl, Bln, Thn Otomatis)</span>
                      </label>
                      <input 
                        type="date"
                        value={calendarDate}
                        onChange={handleCalendarChange}
                        className="border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-[#F4F8FC]/50 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
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
                        !v.startsWith('foto_') &&
                        v !== 'foto_tunggal' &&
                        !v.startsWith('foto3_') &&
                        !v.startsWith('foto_grid')
                      )
                      .map((variableName) => {
                        const isPenyerah = variableName === 'nama_penyerah';
                        const isPenerima = variableName === 'nama_penerima';
                        
                        return (
                          <div key={variableName} className={`flex flex-col gap-1.5 ${isPenyerah || isPenerima ? 'relative' : ''}`}>
                            <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
                              {formatLabel(variableName)} <span className="text-slate-400 font-mono text-[10px] font-normal">({variableName})</span>
                            </label>
                            
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
                              className="border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs font-medium bg-[#F4F8FC]/50 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all" 
                              required 
                            />

                            {isPenyerah && showPenyerahDropdown && filteredPenyerah.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenyerah.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penyerah')} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {isPenerima && showPenerimaDropdown && filteredPenerima.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenerima.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penerima')} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* SECTION UPLOAD FOTO MULTIPLE BISA HAPUS & TAMBAH 1 PER 1 */}
                  {fields.some(v => v.startsWith('foto_')) && (
                    <div className="md:col-span-2 flex flex-col gap-1.5 border-t border-sky-100 pt-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
                          Upload Foto Dokumentasi <span className="text-slate-400 font-normal lowercase">(Bisa pilih banyak & nambah 1 per 1)</span>
                        </label>
                        <span className="text-xs font-bold text-sky-600">
                          {photoFiles.length} foto terpilih
                        </span>
                      </div>

                      <div className="flex flex-col gap-4 border border-sky-100/80 rounded-2xl p-4 bg-[#F4F8FC]/50 hover:border-sky-300 transition-all">
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleMultipleFileChange}
                          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer flex-1"
                        />

                        {/* PREVIEW FOTO + TOMBOL HAPUS (X) */}
                        {photoFiles.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-2">
                            {photoFiles.map((file, index) => {
                              const key = `foto_${index + 1}`;
                              const previewUrl = filePreviews[key];

                              return (
                                <div key={index} className="relative group w-20 h-20">
                                  <img 
                                    src={previewUrl} 
                                    alt={`Preview ${key}`} 
                                    className="w-full h-full object-cover rounded-xl border border-sky-200 shadow-xs"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    title="Hapus foto ini"
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md transition-all cursor-pointer transform hover:scale-110"
                                  >
                                    ✕
                                  </button>

                                  <span className="absolute bottom-1 right-1 bg-sky-500/90 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                    F{index + 1}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-sky-100 flex flex-wrap justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={handleSaveDraft} 
                      disabled={loadingDraft || loadingSelesai} 
                      className="bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent font-bold px-5 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loadingDraft ? 'Menyimpan...' : draftIdParam ? '🔄 Perbarui Draft' : '📁 Simpan Draft'}
                    </button>
                    
                    <button 
                      type="submit" 
                      disabled={loadingDraft || loadingSelesai} 
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/60 disabled:opacity-50 cursor-pointer"
                    >
                      {loadingSelesai ? 'Memproses...' : 'Selesai & Kirim Ke Antrean'}
                    </button>
                  </div>

                </form>
              </div>

              {/* PANEL KANAN PREVIEW */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-6 sticky top-6 h-[calc(100vh-140px)] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-sky-100/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Document Preview</h3>
                  </div>
                  <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2.5 py-1 rounded-full border border-sky-100">Auto Sync</span>
                </div>

                <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/80 border border-sky-100/80 rounded-2xl p-3.5 mb-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-sky-950 font-medium">
                  <span className="text-sm mt-0.5">💡</span>
                  <div>
                    <strong className="text-sky-900">Sistem Nomor Dokumen:</strong> Nomor surat yang tertera di live preview saat ini hanyalah <strong>contoh/estimasi sementara</strong>. Nomor resmi yang asli akan otomatis disesuaikan secara akurat berdasarkan urutan terakhir di database saat dokumen dicetak.
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-sky-100/80 rounded-2xl bg-white p-6 shadow-inner custom-scrollbar">
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