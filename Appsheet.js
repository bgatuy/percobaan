const pdfInput = document.getElementById("pdfFile");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");

// Format tanggal
function formatTanggalIndo(tanggalStr) {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const [dd, mm, yyyy] = tanggalStr.split("/");
  return `${dd} ${bulan[parseInt(mm, 10) - 1]} ${yyyy}`;
}

// Ambil dengan regex
function ambil(text, regex, fallback = "-") {
  const match = text.match(regex);
  return match?.[1]?.trim() || fallback;
}

// Format jam 10.25.00 jadi 10:25
function cleanJam(jamStr) {
  if (!jamStr || jamStr === "-") return "-";
  const match = jamStr.match(/\d{2}[.:]\d{2}/);
  return match ? match[0].replace(/\./g, ":") : "-";
}

pdfInput.addEventListener("change", async () => {
  const file = pdfInput.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(" ") + "\n";
  }

  // === Ekstraksi data ===
  const unitKerja = ambil(fullText, /Unit Kerja\s*:\s*(.+?)\s+(Perangkat|Kantor Cabang)/);
  const kantorCabang = ambil(fullText, /Kantor Cabang\s*:\s*(.+?)\s+(Asset ID|Tanggal|Tanggal\/Jam)/);
  const tanggalRaw = ambil(fullText, /Tanggal\/Jam\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
  const tanggal = tanggalRaw.includes("/") ? formatTanggalIndo(tanggalRaw) : "-";

  // Coba beberapa opsi untuk Problem
  let problem = ambil(fullText, /Trouble Dilaporkan\s*:\s*(.+?)\s+(Solusi|Progress|KETERANGAN)/i);
  if (problem === "-") problem = ambil(fullText, /Problem\s*[:\-]?\s*(.+?)\s+(Solusi|Progress|KETERANGAN)/i);
  if (problem === "-") problem = ambil(fullText, /Jenis Pekerjaan\s*\(Problem\)\s*[:\-]?\s*(.+?)\s+(Solusi|Progress|KETERANGAN)/i);

  const progress = ambil(fullText, /Solusi\s*\/?\s*Perbaikan\s*:\s*(.+?)\s+(KETERANGAN|Backup|Status|$)/i);
  const berangkat = cleanJam(ambil(fullText, /BERANGKAT\s+(\d{2}[.:]\d{2})/));
  const tiba = cleanJam(ambil(fullText, /TIBA\s+(\d{2}[.:]\d{2})/));
  const mulai = cleanJam(ambil(fullText, /MULAI\s+(\d{2}[.:]\d{2})/));
  const selesai = cleanJam(ambil(fullText, /SELESAI\s+(\d{2}[.:]\d{2})/));

  const jenis = ambil(fullText, /Perangkat\s+(Notebook Highend|PC|Printer|.+?)\s+(Kantor Cabang|Asset ID|SN)/);
  const sn = ambil(fullText, /SN\s+([A-Z0-9\-]+)/);
  const merk = ambil(fullText, /Merk\s+([A-Z0-9]+)/);
  const tipe = ambil(fullText, /Type\s+([A-Za-z0-9\s\-]+?)(?:\s+SN|\s+PW|$)/); // <= stop sebelum SN/PW

  let pic = ambil(fullText, /Pelapor\s*:\s*(.+?)\s+(Type|Status|$)/);
  if (pic.includes("(")) pic = pic.split("(")[0].trim();

  const status = ambil(fullText, /Status Pekerjaan\s*:?\s*(Done|Pending|On\s?Progress)/i);

  // === Hasil akhir ===
  const laporan = `Selamat Pagi/Siang/Sore Petugas Call Center, Update Pekerjaan

Unit Kerja : ${unitKerja}
Kantor Cabang : ${kantorCabang}

Tanggal : ${tanggal}

Jenis Pekerjaan (Problem) : ${problem}

Berangkat : ${berangkat}
Tiba : ${tiba}
Mulai : ${mulai}
Selesai : ${selesai}

Progress : ${progress}

Jenis Perangkat : ${jenis}
Serial Number : ${sn}
Merk Perangkat : ${merk}
Type Perangkat : ${tipe}

PIC : ${pic}
Status : ${status}`;

  output.textContent = laporan;
});

// Tombol copy
copyBtn.addEventListener("click", () => {
  const textarea = document.createElement("textarea");
  textarea.value = output.textContent;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  copyBtn.textContent = "✔ Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
