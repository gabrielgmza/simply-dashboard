import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = 'Simply by PaySur';
const SUBTITLE = 'Panel Interno · Confidencial';

function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(8, 10, 15);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND, 14, 12);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(SUBTITLE, 14, 19);
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 45);
  doc.setDrawColor(31, 41, 55);
  doc.line(14, 48, 196, 48);
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(`${BRAND} · Documento confidencial · Pág. ${i}/${pages}`, 14, 290);
    doc.text('BCRA PSP · UIF Sujeto Obligado', 196, 290, { align: 'right' });
  }
}

export function exportCSV(filename: string, headers: string[], rows: any[][]) {
  const bom = '\uFEFF';
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const v = String(cell ?? '').replace(/"/g, '""');
      return v.includes(',') || v.includes('\n') ? `"${v}"` : v;
    }).join(','))
  ].join('\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title: string, filename: string, headers: string[], rows: any[][], summary?: { label: string; value: string }[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addHeader(doc, title);

  if (summary?.length) {
    let x = 14;
    const y = 56;
    summary.forEach(s => {
      doc.setFillColor(17, 24, 39);
      doc.roundedRect(x, y, 55, 14, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(s.label, x + 4, y + 5);
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(s.value, x + 4, y + 11);
      doc.setFont('helvetica', 'normal');
      x += 58;
    });
  }

  const startY = summary?.length ? 78 : 55;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [209, 213, 219],
      fillColor: [13, 17, 23],
    },
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [8, 10, 15],
    },
    tableLineColor: [31, 41, 55],
    tableLineWidth: 0.1,
  });

  addFooter(doc);
  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export const fmt = (n: any) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
