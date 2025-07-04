// === formserahterima.js FINAL EXPORT PDF DENGAN jsPDF NATIVE ===

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

let dataTabel = [];

function extractFromPDFText(text) {
  const lines = text.split('\n').map(line => line.trim());
  let namaUker = '';
  const startIndex = lines.findIndex(line => line.toLowerCase().startsWith('unit kerja'));

  if (startIndex !== -1) {
    const firstLine = lines[startIndex];
    const inlineMatch = firstLine.match(/unit kerja\s*:\s*(.*)/i);
    const collected = [];

    if (inlineMatch && inlineMatch[1]) {
      collected.push(inlineMatch[1]);
    }

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/kantor cabang|tanggal|pelapor|jenis perangkat|asset id/i.test(line)) break;
      if (line !== '') collected.push(line);
    }

    namaUker = collected.join(' ').replace(/^[\s:]+/, '').replace(/\s+/g, ' ').trim();
  }

  const tanggalTiketMatch = text.match(/Tanggal Tiket\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
  const tanggalTiket = tanggalTiketMatch ? tanggalTiketMatch[1] : '';

  return { namaUker, tanggalPekerjaan: tanggalTiket };
}

async function prosesFile() {
  const input = document.getElementById('multiPdf');
  const files = input.files;
  const inputTanggalSerah = document.getElementById('tanggalSerah');
  const tanggalSerahManual = inputTanggalSerah.value;

  if (!files.length || !tanggalSerahManual) {
    alert('Isi tanggal serah terima dan upload minimal 1 file PDF.');
    return;
  }

  const [y, m, d] = tanggalSerahManual.split('-');
  const tglSerahFormatted = `${d}/${m}/${y}`;
  dataTabel = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let j = 1; j <= pdf.numPages; j++) {
      const page = await pdf.getPage(j);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join('\n');
    }

    const { namaUker, tanggalPekerjaan } = extractFromPDFText(fullText);
    dataTabel.push({
      no: `${i + 1}`,
      tanggalSerah: tglSerahFormatted,
      namaUker,
      tanggalPekerjaan
    });
  }

  tampilkanTabel();
  document.getElementById('downloadBtn').style.display = 'inline-block';
}

function tampilkanTabel() {
  const div = document.getElementById('tabelHasil');
  const html = [`<div id="exportArea" style="font-family:Calibri; max-width:800px; margin:0 auto; padding:20px; background:#ffffff; color:#000000;">
    <h2 style="text-align:center; font-size:28px; color:#000;">FORM TANDA TERIMA CM</h2>
    <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-size:12px; color:#000; background:#fff;">
      <thead>
        <tr style="text-transform:uppercase; font-size:14px;">
          <th>No.</th>
          <th>Tanggal Serah Terima</th>
          <th>Nama Uker</th>
          <th>Tanggal Pekerjaan</th>
        </tr>
      </thead>
      <tbody>` +
    dataTabel.map(row => `<tr>
          <td>${row.no}</td>
          <td>${row.tanggalSerah}</td>
          <td>${row.namaUker}</td>
          <td>${row.tanggalPekerjaan}</td>
        </tr>`).join('') +
    `</tbody>
    </table>
    <br />
    <table border="1" cellspacing="0" cellpadding="20" style="width:100%; text-align:center; font-size:14px; color:#000000; background:#ffffff;">
      <tr>
        <th style="width:33.33%; color:#000; background:#fff;">TTD TEKNISI</th>
        <th style="width:33.33%; color:#000; background:#fff;">TTD LEADER</th>
        <th style="width:33.33%; color:#000; background:#fff;">TTD CALL CENTER</th>
      </tr>
      <tr style="height:120px">
        <td style="background:#fff;"></td>
        <td style="background:#fff;"></td>
        <td style="background:#fff;"></td>
      </tr>
    </table>
  </div>`];
  div.innerHTML = html;
}

function exportHTMLToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FORM TANDA TERIMA CM', pageWidth / 2, y, { align: 'center' });

  y += 10;
  const headers = ['No.', 'Tanggal Serah', 'Nama Uker', 'Tanggal Pekerjaan'];
  const colWidths = [15, 40, 95, 40];
  const startX = 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  headers.forEach((text, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(text, x, y);
  });

  y += 7;
  doc.setFont('helvetica', 'normal');
  dataTabel.forEach(row => {
    const rowData = [row.no, row.tanggalSerah, row.namaUker, row.tanggalPekerjaan];
    rowData.forEach((text, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(text), x, y);
    });
    y += 7;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('TTD TEKNISI', 25, y);
  doc.text('TTD LEADER', 90, y);
  doc.text('TTD CALL CENTER', 150, y);

  y += 5;
  doc.setDrawColor(0);
  doc.rect(20, y, 50, 30);
  doc.rect(85, y, 50, 30);
  doc.rect(145, y, 50, 30);

  doc.save('Tanda_Terima_CM.pdf');
}

document.addEventListener('DOMContentLoaded', () => {
  const inputFile = document.getElementById('multiPdf');
  const fileCount = document.getElementById('fileCount');

  inputFile.addEventListener('change', () => {
    const count = inputFile.files.length;
    fileCount.textContent = count > 0 ? `📁 ${count} file dipilih` : '';
  });

  document.getElementById('downloadBtn').addEventListener('click', exportHTMLToPDF);
});
