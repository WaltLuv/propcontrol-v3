import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface PriceVerifierProps {
  description: string;
  vendorPrice: number;
}

// Market rate database (simplified - in production, this would be dynamic)
const MARKET_RATES: Record<string, { low: number; avg: number; high: number }> = {
  // Plumbing
  'water heater': { low: 600, avg: 900, high: 1200 },
  'faucet repair': { low: 100, avg: 200, high: 300 },
  'toilet replace': { low: 200, avg: 350, high: 500 },
  'drain clean': { low: 100, avg: 175, high: 250 },
  
  // HVAC
  'hvac service': { low: 150, avg: 250, high: 400 },
  'ac repair': { low: 200, avg: 400, high: 800 },
  'furnace repair': { low: 200, avg: 450, high: 900 },
  
  // Paint
  'interior paint': { low: 1.50, avg: 2.50, high: 4.00 }, // per sq ft
  'exterior paint': { low: 2.00, avg: 3.50, high: 5.00 }, // per sq ft
  
  // Flooring
  'carpet install': { low: 2.00, avg: 3.50, high: 5.00 }, // per sq ft
  'lvp install': { low: 3.00, avg: 5.00, high: 7.00 }, // per sq ft
  'tile install': { low: 5.00, avg: 8.00, high: 12.00 }, // per sq ft
  
  // General
  'appliance replace': { low: 300, avg: 500, high: 800 },
  'door replace': { low: 200, avg: 350, high: 600 },
  'window replace': { low: 300, avg: 500, high: 800 },
  'deep clean': { low: 150, avg: 250, high: 400 },
};

function findMarketRate(description: string) {
  const desc = description.toLowerCase();
  
  for (const [key, rates] of Object.entries(MARKET_RATES)) {
    if (desc.includes(key)) {
      return { key, ...rates };
    }
  }
  
  return null;
}

export function PriceVerifier({ description, vendorPrice }: PriceVerifierProps) {
  const marketRate = findMarketRate(description);
  
  if (!marketRate) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>No market data available</span>
      </div>
    );
  }
  
  const { low, avg, high } = marketRate;
  const variance = ((vendorPrice - avg) / avg) * 100;
  
  let status: 'good' | 'fair' | 'high';
  let icon;
  let color;
  let message;
  
  if (vendorPrice <= avg) {
    status = 'good';
    icon = <CheckCircle className="w-4 h-4" />;
    color = 'text-green-400';
    message = variance < -10 ? 'Great price!' : 'Fair price';
  } else if (vendorPrice <= high) {
    status = 'fair';
    icon = <AlertTriangle className="w-4 h-4" />;
    color = 'text-yellow-400';
    message = 'Above average';
  } else {
    status = 'high';
    icon = <AlertCircle className="w-4 h-4" />;
    color = 'text-red-400';
    message = 'High price - negotiate';
  }
  
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${color} text-sm font-semibold`}>
        {icon}
        <span>{message}</span>
      </div>
      
      <div className="bg-slate-900/50 rounded p-2 text-xs space-y-1">
        <div className="flex justify-between text-slate-400">
          <span>Market Range:</span>
          <span className="font-mono">${low} - ${high}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Market Avg:</span>
          <span className="font-mono font-bold">${avg}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Vendor Quote:</span>
          <span className={`font-mono font-bold ${color}`}>${vendorPrice}</span>
        </div>
        {variance !== 0 && (
          <div className="flex justify-between text-slate-500 text-xs">
            <span>Variance:</span>
            <span className={variance > 0 ? 'text-red-400' : 'text-green-400'}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
