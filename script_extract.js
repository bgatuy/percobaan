
const fileInput = document.getElementById('pdfFile');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const waLink = document.getElementById('waLink');

let finalOutput = "";

function formatTanggalIndonesia(tanggal) {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const [dd, mm, yyyy] = tanggal.split('/');
  return `${dd} ${bulan[parseInt(mm) - 1]} ${yyyy}`;
}

function potongJamMenit(waktu) {
  return waktu?.substring(0, 5) || '';
}

function extractFlexibleBlock(lines, startLabel, stopLabels = []) {
  const startIndex = lines.findIndex(line => line.toLowerCase().includes(startLabel.toLowerCase()));
  if (startIndex === -1) return '';
  let result = '';
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const isStop = stopLabels.some(label => line.toLowerCase().includes(label.toLowerCase()));
    if (isStop) break;
    result += ' ' + line;
  }
  return result.replace(/^:+/, '').replace(/:+$/, '').replace(/^:+\s*/, '').replace(/\s*:+\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

fileInput.addEventListener('change', async function () {
  const file = fileInput.files[0];
  if (!file || file.type !== 'application/pdf') return;

  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    let rawText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      rawText += strings.join('\n') + '\n';
    }

    const clean = (text) => text?.replace(/\s+/g, ' ').trim() || '';
    const lines = rawText.split('\n');

    const unitKerja = extractFlexibleBlock(lines, 'Unit Kerja', ['Kantor Cabang', 'Tanggal']);
    const kantorCabang = extractFlexibleBlock(lines, 'Kantor Cabang', ['Tanggal', 'Pelapor']);
    const tanggal = rawText.match(/Tanggal(?:\sTiket)?\s*:\s*(\d{2}\/\d{2}\/\d{4})/)?.[1];
    const tanggalFormatted = tanggal ? formatTanggalIndonesia(tanggal) : '';

    const problem = clean(rawText.match(/Trouble Dilaporkan\s*:\s*(.+)/)?.[1]);
    const berangkat = potongJamMenit(rawText.match(/Berangkat\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    const tiba = potongJamMenit(rawText.match(/Tiba\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    const mulai = potongJamMenit(rawText.match(/Mulai\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    const selesai = potongJamMenit(rawText.match(/Selesai\s+(\d{2}:\d{2}:\d{2})/)?.[1]);

    const solusi = clean(rawText.match(/Solusi\/Perbaikan\s*:\s*(.+)/)?.[1]);
    const jenisPerangkat = clean(rawText.match(/Jenis Perangkat\s*:\s*(.+)/)?.[1]);
    const serial = clean(rawText.match(/SN\s*:\s*(.+)/)?.[1]);
    const merk = clean(rawText.match(/Merk\s*:\s*(.+)/)?.[1]);
    const type = clean(rawText.match(/Type\s*:\s*(.+)/)?.[1]);
    const pic = clean(rawText.match(/Pelapor\s*:\s*([^\(]+)/)?.[1]);
    const status = clean(rawText.match(/STATUS PEKERJAAN\s*:\s*(.+)/)?.[1]);

   finalOutput = `Selamat Pagi/Siang/Sore Petugas Call Center, Update Pekerjaan

Unit Kerja : ${unitKerja}
Kantor Cabang : ${kantorCabang}

Tanggal : ${tanggalFormatted}

Jenis Pekerjaan (Problem) : ${problem}

Berangkat : ${berangkat}
Tiba : ${tiba}
Mulai : ${mulai}
Selesai : ${selesai}

Progress : ${solusi}

Jenis Perangkat : ${jenisPerangkat}
Serial Number : ${serial}
Merk Perangkat : ${merk}
Type Perangkat : ${type}

PIC : ${pic}
Status : ${status}`;


    output.textContent = finalOutput;

// WhatsApp Integration
const waLink = document.getElementById("waLink");
const pesan = encodeURIComponent(finalOutput);
waLink.href = `https://wa.me/?text=${pesan}`;
waLink.style.display = "inline-block";


  reader.readAsArrayBuffer(file);
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(output.textContent || '').catch(console.error);
});
