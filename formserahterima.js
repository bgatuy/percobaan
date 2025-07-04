pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    let dataTabel = [];

    function extractFromPDFText(text) {
      const lines = text.split('\n').map(line => line.trim());
      let namaUker = '';
      const startIndex = lines.findIndex(line => line.toLowerCase().startsWith('unit kerja'));

      if (startIndex !== -1) {
        const collected = [];
        const match = lines[startIndex].match(/unit kerja\s*:\s*(.*)/i);
        if (match && match[1]) collected.push(match[1]);
        for (let i = startIndex + 1; i < lines.length; i++) {
          const line = lines[i];
          if (/kantor cabang|tanggal|pelapor|jenis perangkat|asset id/i.test(line)) break;
          if (line !== '') collected.push(line);
        }
        namaUker = collected.join(' ').trim();
      }

      const tanggalTiketMatch = text.match(/Tanggal Tiket\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
      const tanggalTiket = tanggalTiketMatch ? tanggalTiketMatch[1] : '';

      return { namaUker, tanggalPekerjaan: tanggalTiket };
    }

    async function prosesFile() {
      const input = document.getElementById('multiPdf');
      const files = input.files;
      const tanggalSerahManual = document.getElementById('tanggalSerah').value;
      if (!files.length || !tanggalSerahManual) {
        alert('Isi tanggal dan upload file PDF.');
        return;
      }
      const [y, m, d] = tanggalSerahManual.split('-');
      const tglSerahFormatted = `${d}/${m}/${y}`;
      dataTabel = [];

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let j = 1; j <= pdf.numPages; j++) {
          const page = await pdf.getPage(j);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join('\n');
        }
        const { namaUker, tanggalPekerjaan } = extractFromPDFText(fullText);
        dataTabel.push({ no: i + 1, tanggalSerah: tglSerahFormatted, namaUker, tanggalPekerjaan });
      }

      tampilkanTabel();
      document.getElementById('downloadBtn').style.display = 'inline-block';
    }

    function tampilkanTabel() {
      const div = document.getElementById('tabelHasil');
      const html = `<div id="exportArea" style="font-family:Calibri; background:#fff; color:#000;">
        <h2 style="text-align:center; font-size:22px;">FORM TANDA TERIMA CM</h2>
        <table border="1" cellspacing="0" cellpadding="6" style="width:100%;">
          <thead>
            <tr style="font-weight:bold;">
              <th>No.</th>
              <th>Tanggal Serah Terima</th>
              <th>Nama Uker</th>
              <th>Tanggal Pekerjaan</th>
            </tr>
          </thead>
          <tbody>
            ${dataTabel.map(row => `<tr>
              <td>${row.no}</td>
              <td>${row.tanggalSerah}</td>
              <td>${row.namaUker}</td>
              <td>${row.tanggalPekerjaan}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <br>
        <table border="1" cellspacing="0" cellpadding="20" style="width:100%; text-align:center;">
          <tr>
            <th>TTD TEKNISI</th><th>TTD LEADER</th><th>TTD CALL CENTER</th>
          </tr>
          <tr style="height:100px;">
            <td></td><td></td><td></td>
          </tr>
        </table>
      </div>`;
      div.innerHTML = html;
    }

    function exportHTMLToPDF() {
      const content = document.getElementById("exportArea");
      if (!content) return alert("Klik Proses dulu.");

      const clone = content.cloneNode(true);
      clone.style.background = "#ffffff";
      clone.style.color = "#000000";

      clone.querySelectorAll('*').forEach(el => {
        el.style.background = '#ffffff';
        el.style.color = '#000000';
        el.style.borderColor = '#000000';
      });

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      html2pdf()
        .set({
          margin: 0.5,
          filename: "Tanda_Terima_CM.pdf",
          image: { type: "jpeg", quality: 1 },
          html2canvas: { scale: 2, backgroundColor: "#ffffff" },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .from(clone)
        .save()
        .then(() => document.body.removeChild(wrapper));
    }

    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('multiPdf').addEventListener('change', e => {
        const count = e.target.files.length;
        document.getElementById('fileCount').textContent = count ? `📁 ${count} file dipilih` : '';
      });
      document.getElementById('downloadBtn').addEventListener('click', exportHTMLToPDF);
    });
