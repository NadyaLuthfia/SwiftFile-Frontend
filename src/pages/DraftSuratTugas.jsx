import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import axios from 'axios'; 

function DraftSuratTugas() {
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

  // =========================================================================
  // STATE AUTOCOMPLETE (Nama Pekerja, Kepala Bidang, & Kepala Cabang)
  // =========================================================================
  const [karyawanList, setKaryawanList] = useState([]); 
  
  // 1. Nama Pekerja / Karyawan
  const [filteredKaryawan, setFilteredKaryawan] = useState([]); 
  const [showKaryawanDropdown, setShowKaryawanDropdown] = useState(false);

  // 2. Kepala Bidang
  const [filteredKepalaBidang, setFilteredKepalaBidang] = useState([]);
  const [showKepalaBidangDropdown, setShowKepalaBidangDropdown] = useState(false);

  // 3. Kepala Cabang
  const [filteredKepalaCabang, setFilteredKepalaCabang] = useState([]);
  const [showKepalaCabangDropdown, setShowKepalaCabangDropdown] = useState(false);
  // =========================================================================

  useEffect(() => {
    muatDataKaryawan(); 

    if (draftIdParam) {
      ambilDetailDraft(draftIdParam);
    } else if (templateIdParam) {
      setCurrentTemplateId(templateIdParam);
      ambilVariabelTemplate(templateIdParam);
    }
  }, [templateIdParam, draftIdParam]);

  // AUTOMATION LOGIC: Tetap aktif menghitung total hari di latar belakang
  useEffect(() => {
    const tglBerangkat = formData.tanggal_berangkat;
    const tglTiba = formData.tanggal_tiba;

    if (tglBerangkat && tglTiba) {
      const start = new Date(tglBerangkat);
      const end = new Date(tglTiba);

      if (!isNaN(start) && !isNaN(end)) {
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const totalHariHitung = diffDays > 0 ? String(diffDays) : '0';

        if (formData.total_hari !== totalHariHitung) {
          setFormData(prev => ({ ...prev, total_hari: totalHariHitung }));
        }
      }
    }
  }, [formData.tanggal_berangkat, formData.tanggal_tiba, formData.total_hari]);

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
            'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
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

    setNamaDraft(`${templateInfo?.nama || 'Surat Tugas'} - ${day}/${dateObj.getMonth() + 1}/${year}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (['nama_karyawan', 'nama_pegawai', 'nama_pekerja'].includes(name)) {
      if (value.trim() === '') {
        setFilteredKaryawan([]);
        setShowKaryawanDropdown(false);
      } else {
        const hasilFilter = karyawanList.filter(k =>
          k.nama_lengkap.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredKaryawan(hasilFilter);
        setShowKaryawanDropdown(true);
      }
    }

    if (name === 'kepala_bidang') {
      if (value.trim() === '') {
        setFilteredKepalaBidang([]);
        setShowKepalaBidangDropdown(false);
      } else {
        const hasilFilter = karyawanList.filter(k =>
          k.nama_lengkap.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredKepalaBidang(hasilFilter);
        setShowKepalaBidangDropdown(true);
      }
    }

    if (name === 'kepala_cabang') {
      if (value.trim() === '') {
        setFilteredKepalaCabang([]);
        setShowKepalaCabangDropdown(false);
      } else {
        const hasilFilter = karyawanList.filter(k =>
          k.nama_lengkap.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredKepalaCabang(hasilFilter);
        setShowKepalaCabangDropdown(true);
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

  const pilihKaryawan = (karyawan, targetFieldName) => {
    setFormData(prev => {
      const stateBaru = { ...prev, [targetFieldName]: karyawan.nama_lengkap };
      
      const nilaiJabatan = typeof karyawan.jabatan === 'object' && karyawan.jabatan !== null
        ? karyawan.jabatan?.nama_jabatan || ''
        : karyawan.jabatan || '';

      const nilaiBidang = typeof karyawan.bidang === 'object' && karyawan.bidang !== null
        ? karyawan.bidang?.nama_bidang || ''
        : karyawan.bidang || '';
      
      if (fields.includes('jabatan')) stateBaru['jabatan'] = nilaiJabatan;
      if (fields.includes('bidang')) stateBaru['bidang'] = nilaiBidang;
      
      return stateBaru;
    });
    setShowKaryawanDropdown(false);
  };

  const pilihKepalaBidang = (karyawan) => {
    setFormData(prev => ({ ...prev, kepala_bidang: karyawan.nama_lengkap }));
    setShowKepalaBidangDropdown(false);
  };

  const pilihKepalaCabang = (karyawan) => {
    setFormData(prev => ({ ...prev, kepala_cabang: karyawan.nama_lengkap }));
    setShowKepalaCabangDropdown(false);
  };

  const generateMultipartData = () => {
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

  // ⚡ SIMPAN DRAFT (Tanpa Pop-up Alert, Langsung Pindah & Menandai File)
  const handleSaveDraft = (e) => {
    e.preventDefault();
    setLoadingDraft(true);
    const token = localStorage.getItem('token');

    const endpoint = draftIdParam 
      ? `http://localhost:8000/api/drafts/${draftIdParam}`
      : 'http://localhost:8000/api/drafts';
      
    const payloadMultipart = generateMultipartData();

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
    .then((res) => {
      setLoadingDraft(false);
      
      // Ambil ID draft yang baru disimpan/diperbarui
      const savedId = res?.data?.data?.id || res?.data?.id || draftIdParam;
      
      // 🚀 Langsung pindah ke halaman /draft-dokumen tanpa alert
      if (savedId) {
        navigate(`/draft-dokumen?highlight=${savedId}`, {
          state: { highlightId: savedId, autoFocus: true }
        });
      } else {
        navigate('/draft-dokumen');
      }
    })
    .catch(err => {
      console.error(err);
      setLoadingDraft(false);
    });
  };

  // ⚡ KIRIM KE ANTREAN / SIAP CETAK (Tanpa Pop-up Alert, Langsung Pindah & Menandai File)
  const handleSelesai = (e) => {
    e.preventDefault();
    setLoadingSelesai(true);
    const token = localStorage.getItem('token');
    
    const payloadMultipart = generateMultipartData();
    payloadMultipart.append('items', JSON.stringify(dokumen_item));

    let createdDocId = null;

    axios.post('http://localhost:8000/api/siap-cetak', payloadMultipart, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then((res) => {
      createdDocId = res?.data?.data?.id || res?.data?.id;

      if (draftIdParam) {
        return axios.delete(`http://localhost:8000/api/drafts/${draftIdParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    })
    .then(() => {
      setLoadingSelesai(false);
      
      // 🚀 Langsung pindah ke halaman /siap-cetak tanpa alert
      if (createdDocId) {
        navigate(`/siap-cetak?highlight=${createdDocId}`, {
          state: { highlightId: createdDocId, autoFocus: true }
        });
      } else {
        navigate('/siap-cetak');
      }
    })
    .catch(err => {
      console.error(err);
      setLoadingSelesai(false);
    });
  };

  const formatLabel = (text) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // =========================================================================
  // RENDER LIVE PREVIEW (Tampilan Sky Blue Bersih & Natural)
  // =========================================================================
  const renderLivePreview = () => {
    if (!textContent) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-sky-400">
          <div className="text-3xl animate-bounce mb-2">📄</div>
          <p className="italic text-xs font-medium">Sedang menyiapkan preview kertas...</p>
        </div>
      );
    }

    let processedHTML = textContent;

    fields.forEach(variable => {
      if (['bulan', 'tahun', 'tanggal', 'no'].includes(variable)) return;
      
      if (variable.startsWith('foto_')) {
        const filePreview = filePreviews[variable];
        const replacementPhoto = filePreview 
          ? `<img src="${filePreview}" class="max-w-[130px] max-h-[70px] object-contain rounded border border-sky-200 p-0.5 bg-white inline-block shadow-xs" />`
          : `<span class="text-sky-600 font-mono text-[10px] italic">[Foto ${formatLabel(variable)}]</span>`;
        processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementPhoto);
        return;
      }

      let userValue = formData[variable];
      
      if (['tanggal_berangkat', 'tanggal_tiba'].includes(variable) && userValue) {
        const [yy, mm, dd] = userValue.split('-');
        if (yy && mm && dd) userValue = `${dd}/${mm}/${yy}`;
      }

      const replacementText = userValue 
        ? `<span class="text-sky-600 font-bold underline underline-offset-2 decoration-sky-300">${userValue}</span>` 
        : `<span class="text-slate-400 italic text-[10px] font-mono">[${variable}]</span>`;
      
      processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementText);
    });

    ['no', 'tahun', 'tanggal'].forEach(v => {
      if (fields.includes(v) || textContent.includes(`\${${v}}`)) {
        const fallback = v === 'no' ? '001' : v === 'tahun' ? new Date().getFullYear() : new Date().getDate();
        const userValue = formData[v] || fallback;
        const replacement = `<span class="text-sky-600 font-bold underline underline-offset-2 decoration-sky-300">${userValue}</span>`;
        processedHTML = processedHTML.replaceAll(`\${${v}}`, replacement);
      }
    });

    if (fields.includes('bulan') || textContent.includes('${bulan}')) {
      const userValueBulan = formData['bulan'] || 'Juli';
      const romawiMap = {
        'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
        'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
      };
      const nilaiRomawi = romawiMap[userValueBulan] || 'VII';
      processedHTML = processedHTML.replace(/\/BTG-\s*\${bulan}\s*\//g, `/BTG-<span class="text-sky-600 font-bold underline underline-offset-2 decoration-sky-300">${nilaiRomawi}</span>/`);
      
      const replacementAlfabet = `<span class="text-sky-600 font-bold underline underline-offset-2 decoration-sky-300">${userValueBulan}</span>`;
      processedHTML = processedHTML.replaceAll('${bulan}', replacementAlfabet);
    }

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: processedHTML }} 
        className="text-slate-800 leading-relaxed space-y-3 whitespace-pre-line break-words text-[11px] tracking-normal font-sans [&_table]:!w-auto [&_table]:!max-w-full [&_td]:!p-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_td]:border [&_td]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-sky-50/50" 
      />
    );
  };

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
          {/* HEADER TOP BAR */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {draftIdParam ? 'Edit Draft:' : 'Draft Baru:'}{' '}
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">
                  {templateInfo?.nama || 'Memuat...'}
                </span>
              </h1>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              className="text-xs font-bold text-sky-700 bg-sky-50/80 hover:bg-sky-100 px-4 py-2.5 rounded-2xl border border-sky-100/80 transition-all transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>⬅️</span> Kembali
            </button>
          </header>

          {loadingFetch ? (
            <div className="bg-white rounded-3xl border border-sky-100/80 p-20 text-center space-y-4 shadow-xs animate-pulse">
              <div className="text-4xl text-sky-500 animate-spin inline-block">⏳</div>
              <p className="text-sky-600 font-bold text-xs tracking-wide">Sinkronisasi data dokumen...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PANEL KIRI: FORM ISIAN DATA */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSelesai} className="bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-8 space-y-6">
                  
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
                      .filter(v => v !== 'no' && v !== 'bulan' && v !== 'tahun' && v !== 'tanggal' && v !== 'hari')
                      .map((variableName) => {
                        const isKaryawanField = ['nama_karyawan', 'nama_pegawai', 'nama_pekerja'].includes(variableName);
                        const isKepalaBidangField = variableName === 'kepala_bidang';
                        const isKepalaCabangField = variableName === 'kepala_cabang';
                        const isPhoto = variableName.startsWith('foto_');
                        
                        const isDateInput = ['tanggal_berangkat', 'tanggal_tiba'].includes(variableName);
                        const isTotalHariField = variableName === 'total_hari';
                        
                        return (
                          <div key={variableName} className={`flex flex-col gap-1.5 ${(isKaryawanField || isKepalaBidangField || isKepalaCabangField) ? 'relative' : ''} ${isPhoto ? 'md:col-span-2' : ''}`}>
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
                                {formatLabel(variableName)} <span className="text-slate-400 font-mono text-[10px] font-normal">({variableName})</span>
                              </label>
                            </div>
                            
                            {isPhoto ? (
                              <div className="flex items-center gap-4 border border-sky-100/80 rounded-2xl p-3 bg-[#F4F8FC]/50 hover:border-sky-300 transition-all">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, variableName)}
                                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer flex-1"
                                />
                                {filePreviews[variableName] && (
                                  <img 
                                    src={filePreviews[variableName]} 
                                    alt="Mini Preview" 
                                    className="w-16 h-12 object-cover rounded-xl border border-sky-100 shadow-xs"
                                  />
                                )}
                              </div>
                            ) : (
                              <input 
                                type={isDateInput ? 'date' : 'text'} 
                                name={variableName} 
                                value={formData[variableName] || ''} 
                                onChange={handleChange} 
                                readOnly={isTotalHariField} 
                                onFocus={() => {
                                  if (isKaryawanField && formData[variableName]) setShowKaryawanDropdown(true);
                                  if (isKepalaBidangField && formData[variableName]) setShowKepalaBidangDropdown(true);
                                  if (isKepalaCabangField && formData[variableName]) setShowKepalaCabangDropdown(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    if (isKaryawanField) setShowKaryawanDropdown(false);
                                    if (isKepalaBidangField) setShowKepalaBidangDropdown(false);
                                    if (isKepalaCabangField) setShowKepalaCabangDropdown(false);
                                  }, 250);
                                }}
                                className={`border border-sky-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all ${isTotalHariField ? 'bg-sky-50/60 font-bold text-sky-700 border-sky-200' : 'bg-[#F4F8FC]/50 text-slate-700'}`} 
                                required 
                              />
                            )}

                            {/* DROPDOWN AUTOCOMPLETE 1: NAMA PEKERJA */}
                            {isKaryawanField && showKaryawanDropdown && filteredKaryawan.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1 custom-scrollbar">
                                {filteredKaryawan.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, variableName)} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-colors">
                                    {k.nama_lengkap} <span className="text-[10px] text-sky-500 font-normal">({(typeof k.jabatan === 'object' && k.jabatan !== null) ? k.jabatan?.nama_jabatan : (k.jabatan || 'Karyawan')})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* DROPDOWN AUTOCOMPLETE 2: KEPALA BIDANG */}
                            {isKepalaBidangField && showKepalaBidangDropdown && filteredKepalaBidang.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1 custom-scrollbar">
                                {filteredKepalaBidang.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKepalaBidang(k)} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-colors">
                                    {k.nama_lengkap} <span className="text-[10px] text-sky-600 font-normal">({(typeof k.jabatan === 'object' && k.jabatan !== null) ? k.jabatan?.nama_jabatan : (k.jabatan || 'Kabid')})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* DROPDOWN AUTOCOMPLETE 3: KEPALA CABANG */}
                            {isKepalaCabangField && showKepalaCabangDropdown && filteredKepalaCabang.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1 custom-scrollbar">
                                {filteredKepalaCabang.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKepalaCabang(k)} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-colors">
                                    {k.nama_lengkap} <span className="text-[10px] text-blue-600 font-normal">({(typeof k.jabatan === 'object' && k.jabatan !== null) ? k.jabatan?.nama_jabatan : (k.jabatan || 'Pimpinan')})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                          </div>
                        );
                      })}
                  </div>

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
                      {loadingSelesai ? 'Memproses...' : '& Kirim Ke Antrean'}
                    </button>
                  </div>

                </form>
              </div>

              {/* PANEL KANAN: LIVE PREVIEW DOKUMEN */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-sky-100/80 shadow-md shadow-sky-100/50 p-6 sticky top-6 h-[calc(100vh-140px)] flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-sky-100/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Document Preview</h3>
                  </div>
                  <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2.5 py-1 rounded-full border border-sky-100">Auto Sync</span>
                </div>

                <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/80 border border-sky-100/80 rounded-2xl p-3.5 mb-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-sky-950 font-medium">
                  <span className="text-sm mt-0.5">💡</span>
                  <div>
                    <strong className="text-sky-900 font-bold">Sistem Nomor Dokumen:</strong> Nomor surat yang tertera di live preview saat ini hanyalah <strong className="text-sky-700">contoh/estimasi sementara</strong>. Nomor resmi akan disesuaikan otomatis saat dicetak.
                  </div>
                </div>

                {/* AREA LEMBAR KERTAS PREVIEW REALISTIS */}
                <div className="flex-1 overflow-y-auto border border-sky-100/80 rounded-2xl bg-slate-100/70 p-4 shadow-inner custom-scrollbar">
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-md p-6 min-h-full">
                    {renderLivePreview()}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DraftSuratTugas;