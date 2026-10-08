import React, { useState } from 'react';
import Sidebar from './Sidebar';

function PanduanUser() {
  const userRole = localStorage.getItem('role') || 'user';

  // Jika user biasa, default tab langsung ke tutorial penggunaan aplikasi
  const [activeTab, setActiveTab] = useState(
    userRole === 'user' ? 'penggunaan' : 'sintaks'
  );

  return (
    <div className="bg-[#F4F8FC] text-slate-700 flex h-screen w-full overflow-hidden antialiased selection:bg-sky-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <Sidebar />

      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto h-full custom-scrollbar">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          
          {/* HEADER PANDUAN */}
          <section className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Buku Panduan User <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-extrabold">SuCoFile</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Panduan tata cara penggunaan aplikasi dan alur pemrosesan dokumen.
              </p>
            </div>
          </section>

          {/* TAB NAVIGASI PANDUAN */}
          <section className="bg-white p-2 rounded-2xl border border-sky-100/80 shadow-xs flex gap-2">
            {/* Hanya Admin / Master Admin yang bisa lihat Aturan Kunci & Upload Template */}
            {(userRole === 'admin' || userRole === 'master_admin') && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('sintaks')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'sintaks'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200'
                      : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <span>🔑</span> Aturan Kunci Variable `${'{...}'}`
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'upload'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200'
                      : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <span>📤</span> Tutorial Upload Template Baru
                </button>
              </>
            )}

            {/* Semua Role (Termasuk User Biasa) Bisa Lihat Tutorial Cara Penggunaan */}
            <button
              type="button"
              onClick={() => setActiveTab('penggunaan')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'penggunaan'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200'
                  : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
              }`}
            >
              <span>🚀</span> Cara Penggunaan Aplikasi (User)
            </button>
          </section>

          {/* KONTEN TAB 1: ATURAN KUNCI VARIABLE (KHUSUS ADMIN) */}
          {activeTab === 'sintaks' && (userRole === 'admin' || userRole === 'master_admin') && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl font-black">
                    💡
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800">Cara Kerja Kunci Variable `${'{...}'}`</h2>
                    <p className="text-xs text-slate-400">Gunakan tag ini di dalam dokumen Microsoft Word (.docx) kamu.</p>
                  </div>
                </div>

                <div className="bg-sky-50/60 border border-sky-100 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Sistem SuCoFile menggunakan parser otomatis untuk membaca kata kunci di dalam dokumen Word. Agar sistem tahu bagian mana yang harus diisi oleh form React, kamu wajib membungkus nama variabel menggunakan format <code className="bg-white border border-sky-200 px-2 py-0.5 rounded font-mono text-sky-600 font-extrabold">${'{nama_variabel}'}</code>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-semibold text-slate-700">
                    <li>Gunakan huruf kecil dan tanpa spasi (gunakan underscore <code className="text-sky-600">_</code> jika lebih dari 1 kata).</li>
                    <li>Contoh penulisan yang benar: <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">${'{nama_barang}'}</code>, <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">${'{no_surat}'}</code>, <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">${'{tgl_pelaksanaan}'}</code>.</li>
                    <li>Hindari penggunaan karakter khusus seperti <code className="text-rose-500">! @ # % ^ & * ( )</code> di dalam kunci.</li>
                  </ul>
                </div>
              </div>

              {/* PERBANDINGAN VISUAL TEMPLATE VS HASIL JADI */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span>📸</span> Perbandingan Visual Template vs Hasil Cetak
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl p-5 border-2 border-dashed border-sky-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                        1. Tampilan Master Template (.docx)
                      </span>
                      <span className="text-xs">📝</span>
                    </div>

                    <div className="bg-[#FAFBFD] p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 space-y-2 leading-relaxed">
                      <p className="font-bold text-center border-b pb-2 text-slate-800">BERITA ACARA SERAH TERIMA</p>
                      <p>Nomor: <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{no_dokumen}'}</span></p>
                      <p>Pada hari ini, <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{hari}'}</span> tanggal <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{tanggal}'}</span>, kami yang bertanda tangan di bawah ini:</p>
                      <p className="pl-3">Nama : <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{nama_penyerah}'}</span></p>
                      <p className="pl-3">Jabatan : <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{jabatan_penyerah}'}</span></p>
                      <p>Telah menyerahkan barang berupa <span className="bg-amber-200/80 text-amber-900 px-1 rounded font-bold">${'{nama_barang}'}</span> dalam kondisi baik.</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                        2. Tampilan Hasil Dokumen (.pdf / .docx)
                      </span>
                      <span className="text-xs">✅</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed shadow-inner">
                      <p className="font-bold text-center border-b pb-2 text-slate-900">BERITA ACARA SERAH TERIMA</p>
                      <p>Nomor: <span className="font-bold text-slate-900">005/BTG-X/BA/2026</span></p>
                      <p>Pada hari ini, <span className="font-bold text-slate-900">Rabu</span> tanggal <span className="font-bold text-slate-900">7 Oktober 2026</span>, kami yang bertanda tangan di bawah ini:</p>
                      <p className="pl-3">Nama : <span className="font-bold text-slate-900">Sita</span></p>
                      <p className="pl-3">Jabatan : <span className="font-bold text-slate-900">Admin Staff PT Sucofindo</span></p>
                      <p>Telah menyerahkan barang berupa <span className="font-bold text-slate-900">Laptop Dell Latitude 5420</span> dalam kondisi baik.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN TAB 2: TUTORIAL UPLOAD TEMPLATE BARU (KHUSUS ADMIN) */}
          {activeTab === 'upload' && (userRole === 'admin' || userRole === 'master_admin') && (
            <div className="bg-white rounded-3xl p-8 border border-sky-100 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-800">Langkah-Langkah Upload Template Baru</h2>
                <p className="text-xs text-slate-400">Ikuti panduan berikut agar master template baru bisa didaftarkan ke sistem SuCoFile.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-200">1</div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">Siapkan Master File Word (.docx)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Pastikan bagian dinamis sudah diubah menggunakan kunci tag <code className="bg-sky-50 text-sky-600 px-1 py-0.5 rounded font-mono font-bold">${'{nama_kunci}'}</code>.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-200">2</div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">Buka Menu "File Template"</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Pilih menu <span className="font-bold text-slate-700">File Template</span> di Sidebar kiri, lalu klik <span className="font-bold text-sky-600">+ Tambah Template Baru</span>.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-sky-200">3</div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">Isi Form & Unggah File</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Isi nama template, tentukan kategori jenis dokumen, lalu unggah file <code className="text-slate-700 font-semibold">.docx</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN TAB 3: TUTORIAL CARA PENGGUNAAN APLIKASI */}
          {activeTab === 'penggunaan' && (
            <div className="bg-white rounded-3xl p-8 border border-sky-100 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-sky-100 pb-4">
                <span className="text-2xl p-2 bg-sky-50 rounded-2xl">🚀</span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Cara Penggunaan Aplikasi SuCoFile</h2>
                  <p className="text-xs text-slate-400">Panduan lengkap alur pembuatan dokumen dari awal hingga tersimpan di Arsip.</p>
                </div>
              </div>

              <div className="space-y-5">
                
                {/* LANGKAH 1 */}
                <div className="border border-sky-100 rounded-2xl p-5 space-y-2 bg-[#F4F8FC]/50 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-xl">
                      Langkah 1
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">Buka Menu Sidebar & Pilih "File Template"</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Klik tombol menu <b>File Template</b> di Sidebar kiri layar kamu. Di sana akan muncul daftar pilihan jenis file template surat/dokumen yang tersedia. Pilih jenis file template yang ingin kamu buat.
                  </p>
                </div>

                {/* LANGKAH 2 */}
                <div className="border border-sky-100 rounded-2xl p-5 space-y-2 bg-[#F4F8FC]/50 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-xl">
                      Langkah 2
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">Mengisi Form Inputan Data</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Isi seluruh kolom-kolom form inputan yang muncul sesuai dengan data dokumen kamu (seperti Nama Penyerah, Jabatan, Nomor Surat, Keterangan, dll.).
                  </p>
                </div>

                {/* LANGKAH 3 */}
                <div className="border border-sky-100 rounded-2xl p-5 space-y-3 bg-[#F4F8FC]/50 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-xl">
                      Langkah 3
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">Menyimpan atau Melanjutkan Dokumen</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Di bagian bawah form inputan terdapat 2 tombol pilihan utama:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-1">
                      <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md inline-block">
                        1. Tombol "Simpan Draft"
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Data akan masuk ke dalam menu <b>Draft</b>. Dokumen di menu ini bisa kamu buka dan edit kembali kapan saja jika belum selesai.
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-1">
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md inline-block">
                        2. Tombol "Selesai"
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Pengisian tahap awal selesai dan dokumen akan langsung diteruskan masuk ke menu <b>Siap Cetak</b>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* LANGKAH 4 (Kartu Ke-2 Diubah Jadi Tombol Selesai) */}
                <div className="border border-sky-100 rounded-2xl p-5 space-y-3 bg-[#F4F8FC]/50 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-xl">
                      Langkah 4
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">Proses di Menu "Siap Cetak" (Belum Final)</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <b>Siap Cetak</b> di Sidebar kiri. Pada tahap ini status dokumen <b>belum final</b> dan masih bisa kamu ubah. Berikut fungsi tombol-tombol yang ada di menu ini:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded inline-block">
                        ✏️ Tombol Edit
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Untuk memperbaiki atau mengubah isi data dokumen jika masih terdapat kesalahan ketik.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded inline-block">
                        🖨️ Tombol Print / Cetak
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Mencetak dokumen fisik secara langsung ke mesin printer kamu.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded inline-block">
                        ✅ Tombol Selesai
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Aktif setelah di-print. Ditekan untuk menyelesaikan dokumen dan memindahkannya ke Arsip.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 mt-2 text-xs text-amber-900 font-medium leading-relaxed">
                    💡 <b>Penting:</b> Setelah kamu menekan tombol <b>Print / Cetak</b>, sistem akan otomatis <b>mengaktifkan tombol "Selesai"</b> di baris dokumen tersebut.
                  </div>
                </div>

                {/* LANGKAH 5 */}
                <div className="border border-emerald-100 rounded-2xl p-5 space-y-2 bg-emerald-50/30 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-xl">
                      Langkah 5 (Final)
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">Konfirmasi Selesai & Pemindahan ke Menu "Arsip"</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Setelah tombol <b>Selesai</b> di menu Siap Cetak kamu tekan, file dokumen akan resmi dianggap <b>Final/Selesai sepenuhnya</b>. Sistem akan otomatis memindahkan dokumen tersebut dari Siap Cetak ke menu <b>Arsip</b> untuk disimpan permanen.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default PanduanUser;