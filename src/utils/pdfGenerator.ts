/**
 * PDF Generator for Owner Quotes
 * Generates a clean PDF from quote data
 */

export interface QuoteItem {
  task: string;
  description: string;
  cost: number;
}

export interface QuoteData {
  projectName: string;
  propertyAddress: string;
  date: string;
  items: QuoteItem[];
  subtotal: number;
  managementFee: number;
  total: number;
  notes?: string;
}

export async function generateQuotePDF(data: QuoteData): Promise<Blob> {
  // Create HTML template for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quote - ${data.projectName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1e293b;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #0f172a;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      margin-bottom: 15px;
    }
    .item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .item-title {
      font-weight: 700;
      font-size: 15px;
    }
    .item-cost {
      font-weight: 700;
      font-size: 15px;
      color: #3b82f6;
    }
    .item-description {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }
    .totals {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    .total-row.grand {
      border-top: 2px solid #cbd5e1;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 700;
      font-size: 18px;
      color: #0f172a;
    }
    .notes {
      margin-top: 30px;
      padding: 15px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      font-size: 14px;
      color: #78350f;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.projectName}</h1>
    <div class="meta">
      <div>${data.propertyAddress}</div>
      <div>Quote Date: ${data.date}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Scope of Work</div>
    ${data.items.map(item => `
      <div class="item">
        <div class="item-header">
          <div class="item-title">${item.task}</div>
          <div class="item-cost">$${item.cost.toFixed(2)}</div>
        </div>
        <div class="item-description">${item.description}</div>
      </div>
    `).join('')}
  </div>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>$${data.subtotal.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Management Fee (15%)</span>
      <span>$${data.managementFee.toFixed(2)}</span>
    </div>
    <div class="total-row grand">
      <span>Total</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
  </div>

  ${data.notes ? `
  <div class="notes">
    <strong>Note:</strong> ${data.notes}
  </div>
  ` : ''}

  <div class="footer">
    Generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>
  `;

  // Convert HTML to PDF using browser's print functionality
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Trigger print dialog
  printWindow.print();

  // Note: This opens print dialog. For direct PDF download, would need a library like jsPDF or html2pdf
  // For now, user can "Save as PDF" from print dialog

  return new Blob([html], { type: 'text/html' });
}

// Alternative: Generate download link for HTML version
export function downloadQuoteHTML(data: QuoteData) {
  const html = generateQuoteHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quote-${data.projectName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateQuoteHTML(data: QuoteData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quote - ${data.projectName}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 40px; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { margin: 0; font-size: 28px; }
    .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 12px 0; }
    .totals { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .grand { font-weight: 700; font-size: 18px; border-top: 2px solid #cbd5e1; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.projectName}</h1>
    <p>${data.propertyAddress} | ${data.date}</p>
  </div>
  ${data.items.map(item => `
    <div class="item">
      <div style="display: flex; justify-content: space-between; font-weight: 700;">
        <span>${item.task}</span>
        <span>$${item.cost.toFixed(2)}</span>
      </div>
      <p style="color: #64748b; margin: 8px 0 0 0;">${item.description}</p>
    </div>
  `).join('')}
  <div class="totals">
    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
      <span>Subtotal</span><span>$${data.subtotal.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
      <span>Management Fee (15%)</span><span>$${data.managementFee.toFixed(2)}</span>
    </div>
    <div class="grand" style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px;">
      <span>Total</span><span>$${data.total.toFixed(2)}</span>
    </div>
  </div>
</body>
</html>`;
}
