import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import axios from 'axios'; 

function DraftKerusakan() {
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

  // State & Ref Preview Foto di Frontend (Fix Stale Closure)
  const [filePreviews, setFilePreviews] = useState({});
  const filePreviewsRef = useRef({});

  // State Khusus Kalender Master & Counter Otomatis
  const [calendarDate, setCalendarDate] = useState('');
  const [nextCounter, setNextCounter] = useState(1); // Menyimpan angka urutan surat (cth: 1, 2, 3)

  // State Autocomplete Karyawan
  const [karyawanList, setKaryawanList] = useState([]); 
  const [filteredLaporan, setFilteredLaporan] = useState([]); 
  const [filteredPenanggung, setFilteredPenanggung] = useState([]); 
  const [filteredPengetahui, setFilteredPengetahui] = useState([]); 
  const [showLaporanDropdown, setShowLaporanDropdown] = useState(false);
  const [showPenanggungDropdown, setShowPenanggungDropdown] = useState(false);
  const [showPengetahuiDropdown, setShowPengetahuiDropdown] = useState(false);

  // Memuat data karyawan
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

  // Helper untuk menyusun format nomor surat otomatis (Semua BA digabung)
  const buatFormatNomor = useCallback((counter, tanggalObj) => {
    const angkaPad = String(counter).padStart(3, '0'); // Mengubah 1 menjadi 001
    const romawiMap = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const bulanRomawi = romawiMap[tanggalObj.getMonth()];
    const tahun = tanggalObj.getFullYear();
    
    return `${angkaPad}/BTG-${bulanRomawi}/BA/${tahun}`;
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

        if (dataLama) {
          // KONDISI EDIT DRAFT LAMA
          const cleanedData = { ...dataLama };
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === 'null' || cleanedData[key] === null || cleanedData[key] === undefined) {
              cleanedData[key] = '';
            }
          });

          setFormData(cleanedData);
          
          // Extrak counter angka dari nomor lama biar kalau kalender diedit counternya tetap sama
          const nomorEksis = cleanedData.no || '';
          const matchCounter = nomorEksis.match(/^(\d+)/);
          if (matchCounter) {
            setNextCounter(parseInt(matchCounter[1], 10));
          }
          
          const namaBulanIndo = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06',
            'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
            'i': '01', 'ii': '02', 'iii': '03', 'iv': '04', 'v': '05', 'vi': '06',
            'vii': '07', 'viii': '08', 'ix': '09', 'x': '10', 'xi': '11', 'xii': '12'
          };
          const yyyy = cleanedData.tahun || new Date().getFullYear();
          const mStr = String(cleanedData.bulan || '').toLowerCase().trim();
          const mm = namaBulanIndo[mStr] || String(new Date().getMonth() + 1).padStart(2, '0');
          const dd = String(cleanedData.tanggal || '').padStart(2, '0');
          
          setCalendarDate(`${yyyy}-${mm}-${dd}`);
          setLoadingFetch(false);
        } else {
          // KONDISI DRAFT BARU (GENERATE NOMOR OTOMATIS)
          const initialFormState = {};
          listVariabel.forEach(variable => {
            initialFormState[variable] = ''; 
          });

          const hariIni = new Date();
          const yyyy = hariIni.getFullYear();
          const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
          const dd = String(hariIni.getDate()).padStart(2, '0');
          const tglString = `${yyyy}-${mm}-${dd}`;
          
          const daftarBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          const daftarHariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          
          initialFormState['hari'] = daftarHariIndo[hariIni.getDay()];
          initialFormState['tanggal'] = String(hariIni.getDate());
          initialFormState['bulan'] = daftarBulanIndo[hariIni.getMonth()];
          initialFormState['tahun'] = String(yyyy);
          initialFormState['tanggal_input'] = tglString;

          // Request nomor urut gabungan terbaru dari backend
          axios.get('http://localhost:8000/api/dokumen/next-counter', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(counterRes => {
            const counterBaru = counterRes.data.next_counter || 1;
            setNextCounter(counterBaru);
            
            const nomorOtomatis = buatFormatNomor(counterBaru, hariIni);
            initialFormState['no'] = nomorOtomatis;
            
            setFormData(initialFormState);
            setCalendarDate(tglString);
            setNamaDraft(`${namaTemplate} - ${nomorOtomatis}`);
            setLoadingFetch(false);
          })
          .catch(err => {
            console.error("Gagal mengambil nomor urut otomatis backend:", err);
            const nomorFallback = buatFormatNomor(1, hariIni);
            initialFormState['no'] = nomorFallback;
            setFormData(initialFormState);
            setCalendarDate(tglString);
            setNamaDraft(`${namaTemplate} - ${nomorFallback}`);
            setLoadingFetch(false);
          });
        }
      })
      .catch(err => {
        console.error("Gagal men-scan template:", err);
        setLoadingFetch(false);
      });
  }, [buatFormatNomor]);

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

        ambilVariabelTemplate(draftData.template_id, dataInputSebelumnya);
      })
      .catch(err => {
        console.error("Gagal memuat detail draft:", err);
        alert("Draft tidak ditemukan atau telah dihapus.");
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
    const daftarHariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const monthName = daftarBulanIndo[dateObj.getMonth()];
    const dayName = daftarHariIndo[dateObj.getDay()];
    const year = dateObj.getFullYear();
    
    const nomorTerupdate = buatFormatNomor(nextCounter, dateObj);
    
    setFormData(prev => ({
      ...prev,
      hari: dayName,
      tanggal: String(day),
      bulan: monthName,
      tahun: String(year),
      tanggal_input: value,
      no: nomorTerupdate 
    }));

    setNamaDraft(`${templateInfo?.nama || 'BA Kerusakan'} - ${nomorTerupdate}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const saringKaryawan = (val) => {
      if (val.trim() === '') return [];
      return karyawanList.filter(k =>
        k.nama_lengkap.toLowerCase().includes(val.toLowerCase())
      );
    };

    if (name === 'nama_laporan') {
      const hasil = saringKaryawan(value);
      setFilteredLaporan(hasil);
      setShowLaporanDropdown(hasil.length > 0);

      // Jika teks di input nama laporan dihapus bersih, kolom bidang otomatis ikut bersih
      if (value.trim() === '') {
        setFormData(prev => ({ ...prev, bidang_laporan: '' }));
      }
    }
    if (name === 'nama_penanggung') {
      const hasil = saringKaryawan(value);
      setFilteredPenanggung(hasil);
      setShowPenanggungDropdown(hasil.length > 0);
    }
    if (name === 'nama_pengetahui') {
      const hasil = saringKaryawan(value);
      setFilteredPengetahui(hasil);
      setShowPengetahuiDropdown(hasil.length > 0);
    }
  };

  const handleFileChange = (e, variableName) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, [variableName]: file }));

    if (filePreviewsRef.current[variableName]) {
      URL.revokeObjectURL(filePreviewsRef.current[variableName]);
    }

    const previewUrl = URL.createObjectURL(file);
    filePreviewsRef.current[variableName] = previewUrl; 
    setFilePreviews(prev => ({ ...prev, [variableName]: previewUrl }));
  };

  const pilihKaryawan = (karyawan, tipeVariable) => {
    setFormData(prev => {
      const newFormData = { ...prev, [tipeVariable]: karyawan.nama_lengkap };
      
      if (tipeVariable === 'nama_laporan') {
        // Fallback berjenjang mengambil nama bidang/bagian dari objek relasi karyawan
        newFormData['bidang_laporan'] = 
          karyawan.bidang?.nama_bidang || 
          karyawan.bidang || 
          karyawan.bagian || 
          karyawan.jabatan?.nama_jabatan || 
          '';
      }
      
      return newFormData;
    });

    if (tipeVariable === 'nama_laporan') setShowLaporanDropdown(false);
    if (tipeVariable === 'nama_penanggung') setShowPenanggungDropdown(false);
    if (tipeVariable === 'nama_pengetahui') setShowPengetahuiDropdown(false);
  };

  const generateMultipartData = (statusDokumen, isCetakLangsung = false) => {
    const data = new FormData();
    data.append('template_id', currentTemplateId);
    data.append('nama_dokumen', namaDraft);
    data.append('nama_draft', namaDraft);

    let nomorSurat = formData['no'] || '';
    data.append('no_dokumen', nomorSurat);      
    data.append('nomor_dokumen', nomorSurat);   
    data.append('jenis_dokumen_id', 2); 
    data.append('jenis', 'kerusakan');
    data.append('status', statusDokumen); 
    data.append('status_cetak', 'belum_diprint');
    
    if (calendarDate) {
      data.append('tanggal_dokumen', calendarDate);
    }

    const merk = formData['merk'] || '-';
    const model = formData['model'] || '-';
    const noSeri = formData['no_seri'] || '-';
    const spesifikasiGabungan = `Merk: ${merk}, Model: ${model}, No Seri: ${noSeri}`;

    data.append('nama_item', formData['nama_alat'] || '');
    data.append('spesifikasi', spesifikasiGabungan);
    data.append('jumlah', 1); 
    data.append('keterangan_item', formData['keterangan_kerusakan'] || '')

    Object.keys(formData).forEach(key => {
      let item = formData[key];
      if (item === null || item === undefined || item === 'null') {
        item = '';
      }

      if (item instanceof File) {
        data.append(key, item);
      } else {
        if (key === 'bulan' && !isCetakLangsung) {
          const romawiMap = {
            'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
            'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
          };
          const bulanRomawi = romawiMap[item] || item;
          data.append(`variables[${key}]`, bulanRomawi);
          data.append(`isian[${key}]`, bulanRomawi);
        } else {
          data.append(`variables[${key}]`, item);
          data.append(`isian[${key}]`, item); 
        }
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
      
    const payloadMultipart = generateMultipartData('draft', false);

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
      alert("📁 Draft BA Kerusakan berhasil diamankan!");
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
    
    const payloadMultipart = generateMultipartData('belum_dicetak', true);

    axios.post('http://localhost:8000/api/siap-cetak', payloadMultipart, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    .then(() => {
      if (draftIdParam) {
        return axios.delete(`http://localhost:8000/api/drafts/${draftIdParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    })
    .then(() => {
      alert("📥 BA Kerusakan berhasil dikirim ke antrean Siap Cetak!");
      setLoadingSelesai(false);
      navigate('/siap-cetak'); 
    })
    .catch(err => {
      console.error(err);
      alert("❌ Gagal memproses data ke antrean siap cetak.");
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
      if (variable === 'bulan') return; 

      if (variable.startsWith('foto_')) {
        const urlFotoLokal = filePreviews[variable];
        const replacementPhoto = urlFotoLokal
          ? `<img src="${urlFotoLokal}" class="max-w-[140px] max-h-[100px] object-cover rounded-xl border border-amber-300 my-1.5 shadow-sm inline-block" />`
          : `<span class="bg-slate-100 text-slate-400 px-2 py-1 rounded font-mono text-[10px] border border-slate-200 block text-center my-1 border-dashed">📷 [Slot ${formatLabel(variable)}]</span>`;
        
        processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementPhoto);
        return;
      }
      
      let userValue = formData[variable];
      if (variable === 'no' && !userValue) {
        userValue = "001"; 
      }
      
      const replacementText = userValue 
        ? `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValue}</span>`
        : `<span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-200 mx-0.5">${variable}</span>`;
      
      processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementText);
    });

    if (fields.includes('bulan')) {
      const userValueBulan = formData['bulan'];
      const romawiMap = {
        'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
        'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
      };
      const nilaiRomawi = romawiMap[userValueBulan] || 'VI';

      const replacementRomawi = `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${nilaiRomawi}</span>`;
      const replacementTeks = userValueBulan 
        ? `<span class="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-semibold border border-amber-200 mx-0.5">${userValueBulan}</span>`
        : `<span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-200 mx-0.5">bulan</span>`;

      processedHTML = processedHTML.replaceAll('\\text{${bulan}}', replacementRomawi);
      processedHTML = processedHTML.replaceAll('${bulan}', replacementTeks);
    }

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: processedHTML }} 
        className="text-slate-700 leading-relaxed space-y-3 whitespace-pre-line break-words text-xs tracking-normal [&_table]:!w-auto [&_table]:!max-w-full [&_td]:!p-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_td]:border [&_td]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50"
      />
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

                  {/* KALENDER UTAMA */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-blue-600">
                        Tanggal Dokumen <span className="text-slate-400 font-normal">(Hari, Tgl, Bln, Thn Otomatis)</span>
                      </label>
                      <input 
                        type="date"
                        value={calendarDate}
                        onChange={handleCalendarChange}
                        className="border border-blue-200 bg-blue-50/5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* VARIABEL DINAMIS LAINNYA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields
                      .filter(v => v !== 'no' && v !== 'bulan' && v !== 'tahun' && v !== 'tanggal' && v !== 'hari')
                      .map((variableName) => {
                        const isLaporan = variableName === 'nama_laporan';
                        const isPenanggung = variableName === 'nama_penanggung';
                        const isPengetahui = variableName === 'nama_pengetahui';
                        const isBidang = variableName === 'bidang_laporan'; 
                        const isPhoto = variableName.startsWith('foto_');
                        
                        return (
                          <div key={variableName} className={`flex flex-col gap-1.5 ${isLaporan || isPenanggung || isPengetahui ? 'relative' : ''} ${isPhoto ? 'md:col-span-2' : ''}`}>
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
                              variableName === 'kronologis' || variableName === 'fungsi_alat' ? (
                                <textarea
                                  name={variableName}
                                  value={formData[variableName] || ''}
                                  onChange={handleChange}
                                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30 h-20 resize-none"
                                  required
                                />
                              ) : (
                                <input 
                                  type="text" 
                                  name={variableName} 
                                  value={formData[variableName] || ''} 
                                  onChange={handleChange}
                                  onFocus={() => {
                                    if (isLaporan && formData.nama_laporan) setShowLaporanDropdown(true);
                                    if (isPenanggung && formData.nama_penanggung) setShowPenanggungDropdown(true);
                                    if (isPengetahui && formData.nama_pengetahui) setShowPengetahuiDropdown(true);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (isLaporan) setShowLaporanDropdown(false);
                                      if (isPenanggung) setShowPenanggungDropdown(false);
                                      if (isPengetahui) setShowPengetahuiDropdown(false);
                                    }, 200);
                                  }}
                                  className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-slate-50/30 border-slate-200"
                                  required 
                                />
                              )
                            )}

                            {/* DROPDOWN AUTOCOMPLETE */}
                            {isLaporan && showLaporanDropdown && filteredLaporan.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredLaporan.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_laporan')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {isPenanggung && showPenanggungDropdown && filteredPenanggung.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenanggung.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penanggung')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {isPengetahui && showPengetahuiDropdown && filteredPengetahui.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPengetahui.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_pengetahui')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block">
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
                
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 mb-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-blue-800 font-medium">
                  <span className="text-sm mt-0.5">💡</span>
                  <div>
                    <strong className="text-blue-900">Sistem Nomor Dokumen:</strong> Nomor surat yang tertera di live preview saat ini hanyalah <strong>contoh/estimasi sementara</strong>. Nomor resmi yang asli akan otomatis disesuaikan secara akurat berdasarkan urutan terakhir di database saat dokumen dicetak.
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Document Preview</h3>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-full animate-pulse">Auto Sync</span>
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

export default DraftKerusakan;