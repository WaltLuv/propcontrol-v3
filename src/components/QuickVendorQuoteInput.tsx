import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Zap, FileText } from 'lucide-react';

interface QuickVendorQuoteInputProps {
  onQuoteSubmit: (quote: {
    vendorName: string;
    vendorContact: string;
    items: Array<{ description: string; cost: number }>;
    total: number;
  }) => void;
}

export function QuickVendorQuoteInput({ onQuoteSubmit }: QuickVendorQuoteInputProps) {
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [rawQuote, setRawQuote] = useState('');
  const [parsed, setParsed] = useState<any>(null);

  const parseQuote = () => {
    // Simple parser - extracts dollar amounts and descriptions
    const lines = rawQuote.split('\n').filter(line => line.trim());
    const items: Array<{ description: string; cost: number }> = [];
    
    lines.forEach(line => {
      // Look for dollar amounts
      const match = line.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        const cost = parseFloat(match[1].replace(/,/g, ''));
        const description = line.replace(/\$?\s*\d+(?:,\d{3})*(?:\.\d{2})?/g, '').trim();
        if (description && cost > 0) {
          items.push({ description, cost });
        }
      }
    });

    const total = items.reduce((sum, item) => sum + item.cost, 0);
    
    setParsed({ items, total });
  };

  const handleSubmit = () => {
    if (!vendorName || !parsed) return;
    
    onQuoteSubmit({
      vendorName,
      vendorContact,
      items: parsed.items,
      total: parsed.total
    });
    
    // Reset
    setVendorName('');
    setVendorContact('');
    setRawQuote('');
    setParsed(null);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Quick Vendor Quote Input</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Vendor Name</label>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            placeholder="ABC Plumbing"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Vendor Contact</label>
          <input
            type="text"
            value={vendorContact}
            onChange={(e) => setVendorContact(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            placeholder="555-1234 or email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Paste Vendor Quote (email/text)
          </label>
          <textarea
            value={rawQuote}
            onChange={(e) => setRawQuote(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
            rows={8}
            placeholder={`Paste vendor quote here. Example:

Water heater replacement - $850
Labor - $200
Parts - $150
Total: $1,200`}
          />
        </div>

        <button
          onClick={parseQuote}
          disabled={!rawQuote.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Parse Quote
        </button>

        {parsed && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold">Quote Parsed</span>
            </div>

            <div className="space-y-2">
              {parsed.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.description}</span>
                  <span className="text-white font-mono">${item.cost.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-green-400">${parsed.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!vendorName}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Use This Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
