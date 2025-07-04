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
  const html = [`<div id="exportArea" style="font-family:Calibri,sans-serif; max-width:800px; margin:0 auto; padding:20px; background:#ffffff; color:#000;">
    <h2 style="text-align:center; font-size:28px;">FORM TANDA TERIMA CM</h2>
    <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; font-size:12px;">
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
        <td style="text-align:center">${row.no}</td>
        <td style="text-align:center">${row.tanggalSerah}</td>
        <td>${row.namaUker}</td>
        <td style="text-align:center">${row.tanggalPekerjaan}</td>
      </tr>`).join('') +
    `</tbody>
    </table>
    <br />
    <table border="1" cellspacing="0" cellpadding="20" style="width:100%; text-align:center; font-size:14px;">
      <tr>
        <th style="width:33.33%;">TTD TEKNISI</th>
        <th style="width:33.33%;">TTD LEADER</th>
        <th style="width:33.33%;">TTD CALL CENTER</th>
      </tr>
      <tr style="height:100px;">
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </table>
  </div>`];
  div.innerHTML = html;
}

function exportHTMLToPDF() {
  const original = document.getElementById("exportArea");
  if (!original) {
    alert("Tabel belum dibuat. Klik tombol Proses dulu.");
    return;
  }

  // Clone node
  const clone = original.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.appendChild(clone);

  // Paksa light style
  wrapper.style.backgroundColor = "#ffffff";
  wrapper.style.color = "#000000";
  wrapper.style.fontFamily = "Calibri, sans-serif";
  wrapper.style.padding = "20px";

  // Terapkan ke semua anak
  wrapper.querySelectorAll("*").forEach(el => {
    el.style.backgroundColor = "#ffffff";
    el.style.color = "#000000";
    el.style.borderColor = "#000000";
    el.style.fontFamily = "Calibri, sans-serif";
  });

  // Tampilkan elemen sebelum convert (tapi di luar layar)
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "210mm";
  wrapper.style.maxWidth = "210mm";
  document.body.appendChild(wrapper);

  // Delay agar DOM siap render
  setTimeout(() => {
    html2pdf()
      .set({
        margin: 0.5,
        filename: "Tanda_Terima_CM.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      })
      .from(wrapper)
      .save()
      .then(() => {
        document.body.removeChild(wrapper);
      });
  }, 100);
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
