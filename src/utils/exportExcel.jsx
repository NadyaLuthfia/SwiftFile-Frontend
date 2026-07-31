import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Fungsi untuk export data ke Excel dengan Sheet per Bulan
 * @param {Array} dataList - List data berkas (contoh: seluruh data Surat Tugas)
 * @param {String} namaFile - Nama file excel hasil download
 */
export const exportRekapPerBulan = async (dataList, namaFile = 'Rekap_Surat_Tugas') => {
  if (!dataList || dataList.length === 0) {
    alert('Belum ada data untuk di-download!');
    return;
  }

  const workbook = new ExcelJS.Workbook();

  // 1. Grouping Data berdasarkan Bulan & Tahun (Contoh: "Juli 2026")
  const groupedData = dataList.reduce((acc, item) => {
    // Ambil tanggal dari item (gunakan fallback jika tanggal tidak valid)
    const tgl = item.tanggal_terakhir || item.created_at || new Date();
    const dateObj = new Date(tgl);

    // Format nama sheet: "Juli 2026" (bahasa Indonesia)
    let bulanTahun = 'Lainnya';
    if (!isNaN(dateObj)) {
      bulanTahun = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    if (!acc[bulanTahun]) {
      acc[bulanTahun] = [];
    }
    acc[bulanTahun].push(item);
    return acc;
  }, {});

  // 2. Loop setiap kelompok Bulan dan buatkan Sheet-nya masing-masing
  Object.keys(groupedData).forEach((bulanTahun) => {
    // Buat Sheet dengan nama Bulan
    const sheet = workbook.addWorksheet(bulanTahun);

    // Set Header Kolom
    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nomor Dokumen', key: 'nomor_terakhir', width: 30 },
      { header: 'Jenis File', key: 'jenis_file', width: 20 },
      { header: 'Pembuat', key: 'pembuat', width: 22 },
      { header: 'Tanggal Dibuat', key: 'tanggal_terakhir', width: 20 },
      { header: 'Total Dicetak', key: 'total_dicetak', width: 15 },
    ];

    // Styling Header biar cantik & rapi (Background biru, font bold putih)
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' } // Warna Blue-600
    };

    // Tambahkan Baris Data
    groupedData[bulanTahun].forEach((item, index) => {
      const row = sheet.addRow({
        no: index + 1,
        nomor_terakhir: item.nomor_terakhir || '-',
        jenis_file: item.jenis_file || '-',
        pembuat: item.pembuat || '-',
        tanggal_terakhir: item.tanggal_terakhir || '-',
        total_dicetak: `${item.total_dicetak ?? 0} Berkas`,
      });

      // Align rata tengah untuk kolom No & Total
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'center' };
    });

    // Atur Border tipis di setiap cell
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      });
    });
  });

  // 3. Generate file dan Trigger Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${namaFile}_${new Date().getFullYear()}.xlsx`);
};