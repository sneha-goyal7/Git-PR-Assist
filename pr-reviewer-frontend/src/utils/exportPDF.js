import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportReviewAsPDF = async (result) => {
  // We'll dynamically render a hidden div holding all data strictly formatted for 8.5x11 PDF.
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'absolute';
  pdfContainer.style.left = '-9999px';
  pdfContainer.style.top = '0';
  pdfContainer.style.width = '800px'; 
  pdfContainer.style.background = '#ffffff';
  pdfContainer.style.color = '#121212';
  pdfContainer.style.fontFamily = 'system-ui, sans-serif';
  pdfContainer.style.padding = '40px';
  pdfContainer.style.boxSizing = 'border-box';

  const dateStr = new Date().toLocaleDateString();
  
  // Format the inner HTML directly
  pdfContainer.innerHTML = `
    <h1 style="font-size: 24px; border-bottom: 2px solid #eaeaea; padding-bottom: 12px(>PR Reviewer ⚡ — Report</h1>
    <div style="font-size: 14px; color: #666; margin-bottom: 32px">Generated: ${dateStr}</div>
    
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="font-size: 18px; margin: 0 0 8px 0">${result.pr.title}</h2>
      <div style="font-size: 14px; color: #555;">Author: <b>@${result.pr.author}</b> | Score: <b>${result.score}/100</b></div>
    </div>
    
    <h3 style="font-size: 16px; margin-top: 32px; color: #333">📋 Summary</h3>
    <div style="font-size: 14px; line-height: 1.6;">${result.summary.replace(/\n/g, '<br/>')}</div>
    
    <h3 style="font-size: 16px; margin-top: 32px; color: #333">🐛 Issues Found</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #f5f5f5; text-align: left;">
        <th style="padding: 8px; border-bottom: 1px solid #ddd">Sev</th>
        <th style="padding: 8px; border-bottom: 1px solid #ddd">File</th>
        <th style="padding: 8px; border-bottom: 1px solid #ddd">Issue</th>
      </tr>
      ${result.bugs.length === 0 ? '<tr><td colspan="3" style="padding: 8px">No issues detected.</td></tr>' : 
        result.bugs.map(b => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee">${b.severity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace">${b.file}:${b.line}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee">${b.issue}</td>
          </tr>
        `).join('')}
    </table>
  `;

  document.body.appendChild(pdfContainer);

  try {
    const canvas = await html2canvas(pdfContainer, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`PR-Review-${result.pr.author}-${dateStr.replace(/\//g, '-')}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
  } finally {
    document.body.removeChild(pdfContainer);
  }
};
