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
  
  // State penyimpan ID pembuat asli, ID Penanggung, dan ID User Login
  const [creatorId, setCreatorId] = useState(null);
  const [penanggungId, setPenanggungId] = useState(null); 
  const [currentLoginId, setCurrentLoginId] = useState(null);

  // State khusus penampung array file foto & preview
  const [photoFiles, setPhotoFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const filePreviewsRef = useRef({});

  // State Khusus Kalender Master & Counter Otomatis
  const [calendarDate, setCalendarDate] = useState('');
  const [nextCounter, setNextCounter] = useState(1); 

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

  // Helper untuk menyusun format nomor surat otomatis
  const buatFormatNomor = useCallback((counter, tanggalObj) => {
    const angkaPad = String(counter).padStart(3, '0');
    const romawiMap = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const bulanRomawi = romawiMap[tanggalObj.getMonth()];
    const tahun = tanggalObj.getFullYear();
    
    return `${angkaPad}/BTG-${bulanRomawi}/BA/${tahun}`;
  }, []);

  // MANAJEMEN FOTO DINAMIS
  const updatePhotosState = useCallback((updatedList) => {
    Object.values(filePreviewsRef.current).forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });

    const newPreviews = {};
    
    setFormData(prevForm => {
      const newFormData = { ...prevForm };

      Object.keys(newFormData).forEach(key => {
        if (key.startsWith('foto_')) {
          delete newFormData[key];
        }
      });

      const photoListForVariables = [];

      updatedList.forEach((file, index) => {
        const varName = `foto_${index + 1}`;
        let previewUrl = '';

        if (file instanceof File) {
          previewUrl = URL.createObjectURL(file);
          newFormData[varName] = file;
        } else {
          const pathStr = typeof file === 'string' ? file : (file.path || file.url || '');
          if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
            previewUrl = pathStr;
          } else {
            const cleanPath = pathStr.replace(/^\//, '');
            previewUrl = `http://localhost:8000/${cleanPath}`;
          }
          newFormData[varName] = previewUrl;
          photoListForVariables.push(pathStr);
        }

        newPreviews[varName] = previewUrl;
      });

      newFormData['foto'] = photoListForVariables;

      return newFormData;
    });

    filePreviewsRef.current = newPreviews;
    setPhotoFiles(updatedList);
    setFilePreviews(newPreviews);
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
          const cleanedData = { ...dataLama };
          Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === 'null' || cleanedData[key] === null || cleanedData[key] === undefined) {
              cleanedData[key] = '';
            }
          });

          setFormData(cleanedData);

          let existingPhotos = [];
          if (cleanedData.foto) {
            if (typeof cleanedData.foto === 'string') {
              try {
                existingPhotos = JSON.parse(cleanedData.foto);
              } catch (e) {
                existingPhotos = [cleanedData.foto];
              }
            } else if (Array.isArray(cleanedData.foto)) {
              existingPhotos = cleanedData.foto;
            }
          }

          if (existingPhotos.length === 0) {
            Object.keys(cleanedData).forEach(key => {
              if (key.startsWith('foto_') && cleanedData[key] && typeof cleanedData[key] === 'string') {
                existingPhotos.push(cleanedData[key]);
              }
            });
          }

          if (existingPhotos.length > 0) {
            updatePhotosState(existingPhotos);
          }
          
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
  }, [buatFormatNomor, updatePhotosState]);

  const ambilDetailDraft = useCallback((draftId) => {
    setLoadingFetch(true);
    const token = localStorage.getItem('token');

    let loggedInUserId = null;
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      loggedInUserId = savedUser.id || savedUser.user_id || savedUser.id_user || localStorage.getItem('user_id');
    } catch (e) {
      loggedInUserId = localStorage.getItem('user_id');
    }

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
        
        setCreatorId(draftData.user_id); 
        setPenanggungId(draftData.assigned_to_id || null);
        
        const userIdAktif = res.data.current_user_id || draftData.current_user_id || loggedInUserId;
        setCurrentLoginId(userIdAktif);

        let dataInputSebelumnya = draftData.data_input;
        if (typeof dataInputSebelumnya === 'string') {
          dataInputSebelumnya = JSON.parse(dataInputSebelumnya);
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
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
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
    setFormData(prev => {
      const newFormData = { ...prev, [tipeVariable]: karyawan.nama_lengkap };
      
      if (tipeVariable === 'nama_laporan') {
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
    
    if (tipeVariable === 'nama_penanggung') {
      setShowPenanggungDropdown(false);
      setPenanggungId(karyawan.user_id || karyawan.id); 
    }

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
    
    if (penanggungId) {
      data.append('assigned_to_id', penanggungId);
    }

    if (calendarDate) {
      data.append('tanggal_dokumen', calendarDate);
    }

    const namaAlat = formData['nama_alat'] || formData['nama_item'] || '';
    const noInv = formData['no_inventaris'] || '';
    const merk = formData['merk'] || '';
    const model = formData['model'] || '';
    const noSeri = formData['no_seri'] || '';

    const spesifikasiArr = [];
    if (noInv) spesifikasiArr.push(`No Inv: ${noInv}`);
    if (merk) spesifikasiArr.push(`Merk: ${merk}`);
    if (model) spesifikasiArr.push(`Model: ${model}`);
    if (noSeri) spesifikasiArr.push(`No Seri: ${noSeri}`);

    data.append('nama_item', namaAlat);
    data.append('spesifikasi', spesifikasiArr.join(', ') || '-');
    data.append('jumlah', 1); 
    data.append('keterangan_item', formData['keterangan_kerusakan'] || '');

    photoFiles.forEach((file) => {
      if (file instanceof File) {
        data.append('foto[]', file);
      } else {
        const pathVal = typeof file === 'string' ? file : (file.path || file.url || '');
        data.append('existing_foto[]', typeof file === 'object' ? JSON.stringify(file) : pathVal);
        data.append('variables[foto][]', pathVal);
        data.append('isian[foto][]', pathVal);
      }
    });

    Object.keys(formData).forEach(key => {
      let item = formData[key];
      if (item === null || item === undefined || item === 'null') {
        item = '';
      }

      if (!(item instanceof File) && key !== 'foto') {
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
    .then((res) => {
      setLoadingDraft(false);
      const savedId = res.data?.data?.id || res.data?.id || draftIdParam;

      if (savedId) {
        navigate(`/draft-dokumen?highlight_id=${savedId}`);
      } else {
        navigate('/draft-dokumen');
      }
    })
    .catch(err => {
      console.error("Gagal memproses simpan draf:", err);
      setLoadingDraft(false);
    });
  };

  const handleSelesai = async (e) => {
    e.preventDefault();
    setLoadingSelesai(true);
    const token = localStorage.getItem('token');

    try {
      const payloadMultipart = generateMultipartData('belum_dicetak', true);
      const resCetak = await axios.post('http://localhost:8000/api/siap-cetak', payloadMultipart, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      const newCreatedId = resCetak.data?.data?.id || resCetak.data?.id;

      if (draftIdParam) {
        await axios.delete(`http://localhost:8000/api/drafts/${draftIdParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
      }

      setLoadingSelesai(false);

      navigate('/siap-cetak', {
        state: {
          targetTab: 'ba_kerusakan', 
          highlightId: newCreatedId
        }
      });
    } catch (err) {
      console.error("Gagal memproses data ke antrean siap cetak:", err);
      setLoadingSelesai(false);
    }
  };

  const formatLabel = (text) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActiveUserId = () => {
    try {
      const userStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const id = userStorage.id || userStorage.user_id || userStorage.id_user;
      if (id) return String(id);
    } catch (e) {}
    if (currentLoginId) return String(currentLoginId);
    if (localStorage.getItem('user_id')) return String(localStorage.getItem('user_id'));
    return null;
  };

  const activeUserId = getActiveUserId();

  const isRestrictedPenanggung = Boolean(
    draftIdParam && (
      (penanggungId && activeUserId && String(activeUserId) === String(penanggungId)) ||
      (creatorId && activeUserId && String(activeUserId) !== String(creatorId))
    )
  );

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
          ? `<img src="${urlFotoLokal}" class="max-w-[140px] max-h-[100px] object-cover rounded-2xl border border-sky-200 my-1.5 shadow-xs inline-block" />`
          : `<span class="text-sky-600 font-bold text-[11px]">[Foto ${formatLabel(variable)}]</span>`;
        
        processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementPhoto);
        return;
      }
      
      let userValue = formData[variable];
      if (variable === 'no' && !userValue) {
        userValue = "001"; 
      }
      
      const replacementText = userValue 
        ? `<span class="text-sky-600 font-bold">${userValue}</span>`
        : `<span class="text-slate-400 font-mono text-[10px]">[${variable}]</span>`;
      
      processedHTML = processedHTML.replaceAll(`\${${variable}}`, replacementText);
    });

    if (fields.includes('bulan')) {
      const userValueBulan = formData['bulan'];
      const romawiMap = {
        'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV', 'Mei': 'V', 'Juni': 'VI',
        'Juli': 'VII', 'Agustus': 'VIII', 'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
      };
      const nilaiRomawi = romawiMap[userValueBulan] || 'VI';

      const replacementRomawi = `<span class="text-sky-600 font-bold">${nilaiRomawi}</span>`;
      const replacementTeks = userValueBulan 
        ? `<span class="text-sky-600 font-bold">${userValueBulan}</span>`
        : `<span class="text-slate-400 font-mono text-[10px]">[bulan]</span>`;

      processedHTML = processedHTML.replaceAll('\\text{${bulan}}', replacementRomawi);
      processedHTML = processedHTML.replaceAll('${bulan}', replacementTeks);
    }

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: processedHTML }} 
        className="text-slate-700 leading-relaxed space-y-3 whitespace-pre-line break-words text-xs tracking-normal [&_table]:!w-auto [&_table]:!max-w-full [&_td]:!p-2 [&_table]:border-collapse [&_table]:border [&_table]:border-slate-200 [&_td]:border [&_td]:border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50"
      />
    );
  };

  return (
    <div 
      className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          
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
                    <p><b>Sinkronisasi Kalender & Form Aktif!</b> Input data di bawah langsung ter-sinkronisasi ke berkas preview secara langsung.</p>
                  </div>

                  {/* KALENDER UTAMA */}
                  <div className="border-b border-sky-100/80 pb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-extrabold text-sky-800 uppercase tracking-wider">
                        Tanggal Dokumen <span className="text-slate-400 font-normal lowercase">(Hari, Tgl, Bln, Thn Otomatis)</span>
                      </label>
                      <input 
                        type="date"
                        value={calendarDate}
                        onChange={handleCalendarChange}
                        disabled={isRestrictedPenanggung}
                        className={`border rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-all ${
                          isRestrictedPenanggung 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none' 
                            : 'bg-[#F4F8FC]/50 text-slate-800 border-sky-100 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
                        }`}
                        required={!isRestrictedPenanggung}
                      />
                    </div>
                  </div>

                  {/* VARIABEL DINAMIS TANPA MENGUBAH URUTAN BAWAAN BACKEND */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      // Filter variabel bawaan
                      const rawFields = fields.filter(
                        v => v !== 'no' && v !== 'bulan' && v !== 'tahun' && v !== 'tanggal' && v !== 'hari' && !v.startsWith('foto_')
                      );

                      // Pertahankan urutan asli backend, HANYA memindahkan 'catatan' ke posisi setelah 'bidang_laporan'
                      let orderedFields = [...rawFields];
                      if (orderedFields.includes('catatan')) {
                        orderedFields = orderedFields.filter(f => f !== 'catatan');
                        const idxBidang = orderedFields.indexOf('bidang_laporan');
                        if (idxBidang !== -1) {
                          orderedFields.splice(idxBidang + 1, 0, 'catatan');
                        } else {
                          orderedFields.push('catatan');
                        }
                      }

                      return orderedFields.map((variableName) => {
                        const isLaporan = variableName === 'nama_laporan';
                        const isPenanggung = variableName === 'nama_penanggung';
                        const isPengetahui = variableName === 'nama_pengetahui';
                        
                        const isCatatan = variableName.toLowerCase() === 'catatan';
                        const isFieldDisabled = isRestrictedPenanggung && !isCatatan;

                        return (
                          <div 
                            key={variableName} 
                            className={`flex flex-col gap-1.5 ${isCatatan ? 'md:col-span-2' : ''} ${isLaporan || isPenanggung || isPengetahui ? 'relative' : ''}`}
                          >
                            <label className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
                              {formatLabel(variableName)} <span className="text-slate-400 font-mono text-[10px] font-normal">({variableName})</span>
                            </label>
                            
                            {variableName === 'kronologis' || variableName === 'fungsi_alat' || isCatatan ? (
                              <textarea
                                name={variableName}
                                value={formData[variableName] || ''}
                                onChange={handleChange}
                                disabled={isFieldDisabled}
                                className={`border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all h-20 resize-none ${
                                  isFieldDisabled 
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none' 
                                    : 'bg-[#F4F8FC]/50 text-slate-800 border-sky-100 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
                                }`}
                                required={!isCatatan && !isFieldDisabled}
                              />
                            ) : (
                              <input 
                                type="text" 
                                name={variableName} 
                                value={formData[variableName] || ''} 
                                onChange={handleChange}
                                disabled={isFieldDisabled}
                                onFocus={() => {
                                  if (!isFieldDisabled) {
                                    if (isLaporan && formData.nama_laporan) setShowLaporanDropdown(true);
                                    if (isPenanggung && formData.nama_penanggung) setShowPenanggungDropdown(true);
                                    if (isPengetahui && formData.nama_pengetahui) setShowPengetahuiDropdown(true);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    if (isLaporan) setShowLaporanDropdown(false);
                                    if (isPenanggung) setShowPenanggungDropdown(false);
                                    if (isPengetahui) setShowPengetahuiDropdown(false);
                                  }, 200);
                                }}
                                className={`border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all ${
                                  isFieldDisabled 
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none' 
                                    : 'bg-[#F4F8FC]/50 text-slate-800 border-sky-100 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
                                }`}
                                required={!isFieldDisabled} 
                              />
                            )}

                            {/* DROPDOWN AUTOCOMPLETE */}
                            {!isFieldDisabled && isLaporan && showLaporanDropdown && filteredLaporan.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredLaporan.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_laporan')} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {!isFieldDisabled && isPenanggung && showPenanggungDropdown && filteredPenanggung.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPenanggung.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_penanggung')} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {!isFieldDisabled && isPengetahui && showPengetahuiDropdown && filteredPengetahui.length > 0 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-sky-100 rounded-2xl shadow-xl z-50 max-h-40 overflow-y-auto py-1">
                                {filteredPengetahui.map(k => (
                                  <button key={k.id} type="button" onMouseDown={() => pilihKaryawan(k, 'nama_pengetahui')} className="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 font-bold text-slate-700 block transition-all">
                                    {k.nama_lengkap} <span className="text-[10px] text-slate-400 font-normal">({k.jabatan?.nama_jabatan})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* SECTION UPLOAD FOTO MULTIPLE */}
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
                          disabled={isRestrictedPenanggung}
                          onChange={handleMultipleFileChange}
                          className={`text-xs flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold ${
                            isRestrictedPenanggung 
                              ? 'text-slate-400 opacity-50 cursor-not-allowed file:bg-slate-200 file:text-slate-400' 
                              : 'text-slate-500 file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer'
                          }`}
                        />

                        {/* PREVIEW FOTO */}
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

                                  {!isRestrictedPenanggung && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePhoto(index)}
                                      title="Hapus foto ini"
                                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md transition-all cursor-pointer transform hover:scale-110"
                                    >
                                      ✕
                                    </button>
                                  )}

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

                  {/* TOMBOL AKSI BERDASARKAN HAK AKSES */}
                  <div className="pt-6 border-t border-sky-100 flex flex-col items-end gap-3">
                    
                    {isRestrictedPenanggung && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-bold shadow-sm">
                        ⚠️ Akses Penanggung Jawab: Anda hanya memiliki hak untuk mengisi & menyimpan Catatan.
                      </span>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                      <button 
                        type="button" 
                        onClick={handleSaveDraft} 
                        disabled={loadingDraft || loadingSelesai} 
                        className={
                          isRestrictedPenanggung
                            ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-sky-200/50 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                            : "bg-sky-50/80 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 text-sky-700 hover:text-white border border-sky-100/80 hover:border-transparent font-bold px-5 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-xs disabled:opacity-50 cursor-pointer"
                        }
                      >
                        {loadingDraft 
                          ? 'Menyimpan...' 
                          : isRestrictedPenanggung 
                            ? '💾 Simpan Catatan' 
                            : draftIdParam ? '🔄 Perbarui Draft' : '📁 Simpan Draft'
                        }
                      </button>
                      
                      {!isRestrictedPenanggung && (
                        <button 
                          type="submit" 
                          disabled={loadingDraft || loadingSelesai} 
                          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/60 disabled:opacity-50 cursor-pointer"
                        >
                          {loadingSelesai ? 'Memproses...' : 'Selesai & Kirim Ke Antrean'}
                        </button>
                      )}
                    </div>
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

export default DraftKerusakan;