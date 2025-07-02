// === formserahterima.js FINAL PDF DARI HTML TABLE + RESPONSIVE SUPPORT ===

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
  const html = [`<style>
    @media (max-width: 600px) {
      h1 { font-size: 24px !important; }
      .upload-label { width: 100%; text-align: center; font-size: 16px; }
      #fileCount { display: block; text-align: center; margin-top: 6px; }
      #printTable { display: block; overflow-x: auto; white-space: nowrap; }
      table { font-size: 12px !important; }
    }
  </style>
  <div style="text-align:center; font-family:Calibri; font-size:35px; margin-bottom:10px;"><strong>FORM TANDA TERIMA CM</strong></div>
    <table id="printTable" border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-family:Calibri;">
    <thead>
      <tr style="background:none; text-transform:uppercase; font-size:14px;">
        <th>No.</th>
        <th>Tanggal Serah Terima</th>
        <th>Nama Uker</th>
        <th>Tanggal Pekerjaan</th>
      </tr>
    </thead>
    <tbody style="font-size:12px;">` +
    dataTabel.map(row => `<tr>
        <td>${row.no}</td>
        <td>${row.tanggalSerah}</td>
        <td>${row.namaUker}</td>
        <td>${row.tanggalPekerjaan}</td>
      </tr>`).join('') +
    `</tbody>
    </table>

    <br><br>
    <table border="1" cellspacing="0" cellpadding="16" style="width:100%; text-align:center; font-family:Calibri; font-size:14px; border-collapse:collapse">
      <tr>
        <th style="font-size:14px; width:33.33%">TTD TEKNISI</th>
        <th style="font-size:14px; width:33.33%">TTD LEADER</th>
        <th style="font-size:14px; width:33.33%">TTD CALL CENTER</th>
      </tr>
      <tr style="height:100px">
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </table>`];
  div.innerHTML = html;
}

function exportHTMLToPDF() {
  const element = document.getElementById('tabelHasil');
  const opt = {
    margin: 0.5,
    filename: 'Tanda_Terima_CM.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }
  };
  html2pdf().set(opt).from(element).save();
}


document.addEventListener('DOMContentLoaded', () => {
  const inputFile = document.getElementById('multiPdf');
  const fileCount = document.getElementById('fileCount');

  inputFile.addEventListener('change', () => {
    const count = inputFile.files.length;
    fileCount.textContent = count > 0 ? `📂 ${count} file dipilih` : '';
  });

  document.getElementById('downloadBtn').addEventListener('click', exportHTMLToPDF);
});
