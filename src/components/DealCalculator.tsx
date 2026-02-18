import React, { useState } from 'react';
import { Calculator, TrendingUp, Home, DollarSign, Percent } from 'lucide-react';

type CalculatorMode = 'wholesale' | 'rental' | 'quick' | 'scorecard' | 'assignment';

const DealCalculator: React.FC = () => {
  const [mode, setMode] = useState<CalculatorMode>('wholesale');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Mode Selector */}
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-indigo-500" />
        <h2 className="text-3xl font-black text-white">Deal Calculator</h2>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <button
          onClick={() => setMode('wholesale')}
          className={`p-6 rounded-2xl font-bold transition ${
            mode === 'wholesale'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          💰 Wholesale
        </button>
        <button
          onClick={() => setMode('rental')}
          className={`p-6 rounded-2xl font-bold transition ${
            mode === 'rental'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🏠 Rental (BRRRR)
        </button>
        <button
          onClick={() => setMode('quick')}
          className={`p-6 rounded-2xl font-bold transition ${
            mode === 'quick'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          ⚡ Quick Offer
        </button>
        <button
          onClick={() => setMode('scorecard')}
          className={`p-6 rounded-2xl font-bold transition ${
            mode === 'scorecard'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          ⭐ Scorecard
        </button>
        <button
          onClick={() => setMode('assignment')}
          className={`p-6 rounded-2xl font-bold transition ${
            mode === 'assignment'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          💵 Assignment Fee
        </button>
      </div>

      {/* Calculator Content */}
      {mode === 'wholesale' && <WholesaleCalculator />}
      {mode === 'rental' && <RentalCalculator />}
      {mode === 'quick' && <QuickOfferCalculator />}
      {mode === 'scorecard' && <ProfitPotentialScorecard />}
      {mode === 'assignment' && <AssignmentFeeCalculator />}
    </div>
  );
};

// Wholesale Calculator
const WholesaleCalculator: React.FC = () => {
  const [arv, setArv] = useState<number>(0);
  const [repairs, setRepairs] = useState<number>(0);
  const [assignmentFee, setAssignmentFee] = useState<number>(5000);
  const [buyerProfit, setBuyerProfit] = useState<number>(25000);

  const maxOffer = arv * 0.7 - repairs - buyerProfit;
  const yourProfit = assignmentFee;
  const buyerPurchase = maxOffer;
  const buyerAllIn = buyerPurchase + repairs;
  const buyerEquity = arv - buyerAllIn;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="bg-slate-800 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white mb-6">Deal Inputs</h3>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">After Repair Value (ARV)</label>
          <input
            type="number"
            value={arv || ''}
            onChange={(e) => setArv(Number(e.target.value))}
            placeholder="250000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estimated Repairs</label>
          <input
            type="number"
            value={repairs || ''}
            onChange={(e) => setRepairs(Number(e.target.value))}
            placeholder="30000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Your Assignment Fee</label>
          <input
            type="number"
            value={assignmentFee || ''}
            onChange={(e) => setAssignmentFee(Number(e.target.value))}
            placeholder="5000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Buyer's Target Profit</label>
          <input
            type="number"
            value={buyerProfit || ''}
            onChange={(e) => setBuyerProfit(Number(e.target.value))}
            placeholder="25000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="bg-emerald-500 rounded-3xl p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-wider mb-2">Maximum Offer</p>
          <p className="text-5xl font-black">${maxOffer.toLocaleString()}</p>
          <p className="text-sm mt-2 opacity-80">ARV × 70% - Repairs - Buyer Profit</p>
        </div>

        <div className="bg-indigo-500 rounded-3xl p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-wider mb-2">Your Profit (Assignment Fee)</p>
          <p className="text-5xl font-black">${yourProfit.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800 rounded-3xl p-6 space-y-3">
          <h4 className="text-lg font-bold text-white mb-4">Buyer's Numbers</h4>
          <div className="flex justify-between">
            <span className="text-slate-400">Purchase Price:</span>
            <span className="text-white font-bold">${buyerPurchase.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">+ Repairs:</span>
            <span className="text-white font-bold">${repairs.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="text-slate-400">All-In Cost:</span>
            <span className="text-white font-bold">${buyerAllIn.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">ARV:</span>
            <span className="text-emerald-400 font-bold">${arv.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="text-white font-bold">Buyer's Equity:</span>
            <span className="text-emerald-400 font-black text-xl">${buyerEquity.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rental Calculator
const RentalCalculator: React.FC = () => {
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [repairs, setRepairs] = useState<number>(0);
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(20);

  const totalInvestment = purchasePrice + repairs;
  const loanAmount = purchasePrice * (1 - downPayment / 100);
  const monthlyPayment = (loanAmount * 0.07) / 12; // 7% interest estimate
  const netCashFlow = monthlyRent - expenses - monthlyPayment;
  const annualCashFlow = netCashFlow * 12;
  const cashInvested = (purchasePrice * downPayment / 100) + repairs;
  const cashOnCashReturn = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="bg-slate-800 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white mb-6">Rental Inputs</h3>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Purchase Price</label>
          <input
            type="number"
            value={purchasePrice || ''}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            placeholder="150000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Repairs/Rehab</label>
          <input
            type="number"
            value={repairs || ''}
            onChange={(e) => setRepairs(Number(e.target.value))}
            placeholder="25000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monthly Rent</label>
          <input
            type="number"
            value={monthlyRent || ''}
            onChange={(e) => setMonthlyRent(Number(e.target.value))}
            placeholder="1500"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monthly Expenses</label>
          <input
            type="number"
            value={expenses || ''}
            onChange={(e) => setExpenses(Number(e.target.value))}
            placeholder="450"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">Taxes, insurance, maintenance, vacancy, PM fees</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Down Payment %</label>
          <input
            type="number"
            value={downPayment || ''}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            placeholder="20"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className={`rounded-3xl p-8 text-white ${netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <p className="text-sm font-bold uppercase tracking-wider mb-2">Monthly Cash Flow</p>
          <p className="text-5xl font-black">${netCashFlow.toLocaleString()}</p>
          <p className="text-sm mt-2 opacity-80">Rent - Expenses - Mortgage</p>
        </div>

        <div className="bg-indigo-500 rounded-3xl p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-wider mb-2">Cash on Cash Return</p>
          <p className="text-5xl font-black">{cashOnCashReturn.toFixed(1)}%</p>
          <p className="text-sm mt-2 opacity-80">Annual cash flow ÷ Cash invested</p>
        </div>

        <div className="bg-slate-800 rounded-3xl p-6 space-y-3">
          <h4 className="text-lg font-bold text-white mb-4">Investment Breakdown</h4>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Investment:</span>
            <span className="text-white font-bold">${totalInvestment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cash Invested:</span>
            <span className="text-white font-bold">${cashInvested.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Annual Cash Flow:</span>
            <span className="text-emerald-400 font-bold">${annualCashFlow.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="text-slate-400">Monthly Payment:</span>
            <span className="text-white font-bold">${monthlyPayment.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Offer Calculator
const QuickOfferCalculator: React.FC = () => {
  const [arv, setArv] = useState<number>(0);
  const [repairs, setRepairs] = useState<number>(0);

  const maxOffer = arv * 0.7 - repairs;
  const offerAt65 = arv * 0.65 - repairs;
  const offerAt75 = arv * 0.75 - repairs;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-800 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white mb-6">Quick Offer (70% Rule)</h3>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">After Repair Value (ARV)</label>
          <input
            type="number"
            value={arv || ''}
            onChange={(e) => setArv(Number(e.target.value))}
            placeholder="200000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estimated Repairs</label>
          <input
            type="number"
            value={repairs || ''}
            onChange={(e) => setRepairs(Number(e.target.value))}
            placeholder="25000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="bg-emerald-500 rounded-3xl p-10 text-white text-center">
          <p className="text-sm font-bold uppercase tracking-wider mb-2">Maximum Offer (70% Rule)</p>
          <p className="text-6xl font-black mb-2">${maxOffer.toLocaleString()}</p>
          <p className="text-lg opacity-90">${arv.toLocaleString()} × 70% - ${repairs.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Conservative (65%)</p>
            <p className="text-3xl font-black text-white">${offerAt65.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Aggressive (75%)</p>
            <p className="text-3xl font-black text-white">${offerAt75.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profit Potential Scorecard
const ProfitPotentialScorecard: React.FC = () => {
  const [margin, setMargin] = useState<number>(5);
  const [condition, setCondition] = useState<number>(5);
  const [location, setLocation] = useState<number>(5);
  const [motivation, setMotivation] = useState<number>(5);
  const [demand, setDemand] = useState<number>(5);

  const totalScore = margin + condition + location + motivation + demand;
  
  let rating = '';
  let color = '';
  let recommendation = '';
  
  if (totalScore >= 40) {
    rating = 'GREAT DEAL';
    color = 'bg-green-600';
    recommendation = 'Pursue aggressively! This is a home run.';
  } else if (totalScore >= 30) {
    rating = 'GOOD DEAL';
    color = 'bg-blue-600';
    recommendation = 'Move forward with confidence.';
  } else if (totalScore >= 20) {
    rating = 'MARGINAL';
    color = 'bg-yellow-600';
    recommendation = 'Only if it\'s easy and you need volume.';
  } else {
    rating = 'PASS';
    color = 'bg-red-600';
    recommendation = 'Walk away. Not worth your time.';
  }

  const RatingSlider = ({ label, value, setValue, description }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-white font-bold">{label}</label>
        <span className="text-indigo-400 font-black text-2xl">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-800 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white mb-6">Profit Potential Scorecard</h3>
        <p className="text-slate-400 text-sm">Rate each factor from 1 (worst) to 10 (best)</p>

        <RatingSlider
          label="1. Profit Margin"
          value={margin}
          setValue={setMargin}
          description="1 = Thin (<10%) | 10 = Excellent (>40%)"
        />

        <RatingSlider
          label="2. Property Condition"
          value={condition}
          setValue={setCondition}
          description="1 = Complete gut job | 10 = Move-in ready"
        />

        <RatingSlider
          label="3. Location Quality"
          value={location}
          setValue={setLocation}
          description="1 = Terrible area | 10 = Prime A+ neighborhood"
        />

        <RatingSlider
          label="4. Seller Motivation"
          value={motivation}
          setValue={setMotivation}
          description="1 = Just browsing | 10 = Must sell TODAY"
        />

        <RatingSlider
          label="5. Buyer Demand"
          value={demand}
          setValue={setDemand}
          description="1 = Will sit for months | 10 = Bidding war guaranteed"
        />
      </div>

      {/* Results */}
      <div className={`${color} rounded-3xl p-10 text-white text-center`}>
        <p className="text-sm font-bold uppercase tracking-wider mb-2">Deal Rating</p>
        <p className="text-6xl font-black mb-4">{totalScore}/50</p>
        <p className="text-3xl font-bold mb-2">{rating}</p>
        <p className="text-lg opacity-90">{recommendation}</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6">
        <h4 className="font-bold text-white mb-3">Score Breakdown:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Profit Margin:</span>
            <span className="font-bold">{margin}/10</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Condition:</span>
            <span className="font-bold">{condition}/10</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Location:</span>
            <span className="font-bold">{location}/10</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Motivation:</span>
            <span className="font-bold">{motivation}/10</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Buyer Demand:</span>
            <span className="font-bold">{demand}/10</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            <strong className="text-white">40-50:</strong> Great Deal | 
            <strong className="text-white"> 30-39:</strong> Good Deal | 
            <strong className="text-white"> 20-29:</strong> Marginal | 
            <strong className="text-white"> &lt;20:</strong> Pass
          </p>
        </div>
      </div>
    </div>
  );
};

// Assignment Fee Calculator
const AssignmentFeeCalculator: React.FC = () => {
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [repairCost, setRepairCost] = useState<number>(0);
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');

  let suggestedFee = 0;
  let minFee = 0;
  let maxFee = 0;

  if (propertyValue < 100000) {
    minFee = 5000;
    maxFee = 7000;
    suggestedFee = complexity === 'low' ? 5000 : complexity === 'medium' ? 6000 : 7000;
  } else if (propertyValue < 200000) {
    minFee = 8000;
    maxFee = 12000;
    suggestedFee = complexity === 'low' ? 8000 : complexity === 'medium' ? 10000 : 12000;
  } else {
    minFee = 12000;
    maxFee = 20000;
    suggestedFee = complexity === 'low' ? 12000 : complexity === 'medium' ? 15000 : 20000;
  }

  const buyerProfit = (propertyValue * 0.7) - repairCost - suggestedFee;
  const buyerProfitOk = buyerProfit >= 20000;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-800 rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white mb-6">Assignment Fee Calculator</h3>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Property Value (ARV)</label>
          <input
            type="number"
            value={propertyValue || ''}
            onChange={(e) => setPropertyValue(Number(e.target.value))}
            placeholder="150000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Repair Cost</label>
          <input
            type="number"
            value={repairCost || ''}
            onChange={(e) => setRepairCost(Number(e.target.value))}
            placeholder="30000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Deal Complexity</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setComplexity('low')}
              className={`p-4 rounded-xl font-bold transition ${
                complexity === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setComplexity('medium')}
              className={`p-4 rounded-xl font-bold transition ${
                complexity === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setComplexity('high')}
              className={`p-4 rounded-xl font-bold transition ${
                complexity === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
              }`}
            >
              High
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-indigo-600 rounded-3xl p-10 text-white text-center">
        <p className="text-sm font-bold uppercase tracking-wider mb-2">Suggested Assignment Fee</p>
        <p className="text-6xl font-black mb-2">${suggestedFee.toLocaleString()}</p>
        <p className="text-lg opacity-90">Range: ${minFee.toLocaleString()} - ${maxFee.toLocaleString()}</p>
      </div>

      <div className={`rounded-2xl p-6 ${buyerProfitOk ? 'bg-green-900/30 border-2 border-green-600' : 'bg-red-900/30 border-2 border-red-600'}`}>
        <h4 className="font-bold text-white mb-2">Buyer's Profit Check:</h4>
        <p className="text-2xl font-bold mb-1" style={{ color: buyerProfitOk ? '#10b981' : '#ef4444' }}>
          ${buyerProfit.toLocaleString()}
        </p>
        <p className="text-sm text-slate-300">
          {buyerProfitOk 
            ? '✅ Buyer makes good money. Deal works!' 
            : '❌ Buyer profit too low. Reduce your fee or negotiate better price.'}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Target: Buyer should make at least $20K-$30K
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6">
        <h4 className="font-bold text-white mb-3">Fee Guidelines:</h4>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between">
            <span>Property &lt;$100K:</span>
            <span className="font-bold">$5K-$7K</span>
          </div>
          <div className="flex justify-between">
            <span>Property $100K-$200K:</span>
            <span className="font-bold">$8K-$12K</span>
          </div>
          <div className="flex justify-between">
            <span>Property $200K+:</span>
            <span className="font-bold">$12K-$20K</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          💡 Golden Rule: Leave your buyer $20K-$30K profit minimum
        </p>
      </div>
    </div>
  );
};

export default DealCalculator;
