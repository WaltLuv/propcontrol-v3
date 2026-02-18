import { useState } from 'react'

export default function BRRRRCalculator() {
  const [values, setValues] = useState({
    purchasePrice: '',
    rehabCosts: '',
    closingCosts: '',
    arv: '',
    downPayment: '',
    loanAmount: '',
    interestRate: '',
    loanTerm: '',
    refinancePercentage: '75',
    monthlyRent: '',
    monthlyExpenses: ''
  })

  const totalInvestment = 
    (parseFloat(values.purchasePrice) || 0) + 
    (parseFloat(values.rehabCosts) || 0) + 
    (parseFloat(values.closingCosts) || 0)

  const arv = parseFloat(values.arv) || 0
  const refinanceAmount = arv * (parseFloat(values.refinancePercentage) / 100)
  const cashRecovered = refinanceAmount - totalInvestment
  const leftInDeal = totalInvestment - refinanceAmount

  const monthlyRent = parseFloat(values.monthlyRent) || 0
  const monthlyExpenses = parseFloat(values.monthlyExpenses) || 0
  const monthlyCashFlow = monthlyRent - monthlyExpenses
  const annualCashFlow = monthlyCashFlow * 12

  const roi = leftInDeal > 0 ? ((annualCashFlow / leftInDeal) * 100).toFixed(2) : 'N/A'

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">BRRRR Calculator</h2>
        <p className="text-sm text-gray-600 mb-6">Buy, Rehab, Rent, Refinance, Repeat</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purchase & Rehab */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Purchase & Rehab</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
              <input
                type="number"
                value={values.purchasePrice}
                onChange={(e) => setValues({ ...values, purchasePrice: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rehab Costs</label>
              <input
                type="number"
                value={values.rehabCosts}
                onChange={(e) => setValues({ ...values, rehabCosts: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Closing Costs</label>
              <input
                type="number"
                value={values.closingCosts}
                onChange={(e) => setValues({ ...values, closingCosts: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">After Repair Value (ARV)</label>
              <input
                type="number"
                value={values.arv}
                onChange={(e) => setValues({ ...values, arv: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
          </div>

          {/* Refinance & Rental */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Refinance & Rental</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Refinance % of ARV</label>
              <input
                type="number"
                value={values.refinancePercentage}
                onChange={(e) => setValues({ ...values, refinancePercentage: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
              <input
                type="number"
                value={values.monthlyRent}
                onChange={(e) => setValues({ ...values, monthlyRent: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Expenses (Total)</label>
              <input
                type="number"
                value={values.monthlyExpenses}
                onChange={(e) => setValues({ ...values, monthlyExpenses: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Investment</p>
              <p className="text-xl font-bold text-blue-600">${totalInvestment.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Refinance Amount</p>
              <p className="text-xl font-bold text-green-600">${refinanceAmount.toLocaleString()}</p>
            </div>
            <div className={`${cashRecovered >= 0 ? 'bg-purple-50' : 'bg-red-50'} p-4 rounded-lg`}>
              <p className="text-sm text-gray-600">Cash Recovered</p>
              <p className={`text-xl font-bold ${cashRecovered >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                ${cashRecovered.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Left in Deal</p>
              <p className="text-xl font-bold text-orange-600">${Math.max(0, leftInDeal).toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Cash Flow</p>
              <p className={`text-xl font-bold ${monthlyCashFlow >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                ${monthlyCashFlow.toLocaleString()}
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Annual Cash Flow</p>
              <p className="text-xl font-bold text-pink-600">${annualCashFlow.toLocaleString()}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cash-on-Cash ROI</p>
              <p className="text-xl font-bold text-teal-600">{roi}%</p>
            </div>
            <div className={`${cashRecovered >= totalInvestment ? 'bg-green-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-sm font-bold ${cashRecovered >= totalInvestment ? 'text-green-600' : 'text-yellow-600'}`}>
                {cashRecovered >= totalInvestment ? 'Infinite Return!' : 'Partial Return'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
