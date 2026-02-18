import { useState } from 'react'

export default function FlipCalculator() {
  const [values, setValues] = useState({
    purchasePrice: '',
    rehabCosts: '',
    closingCostsBuy: '',
    holdingCosts: '',
    sellingPrice: '',
    realtorFees: '6',
    closingCostsSell: ''
  })

  const purchasePrice = parseFloat(values.purchasePrice) || 0
  const rehabCosts = parseFloat(values.rehabCosts) || 0
  const closingCostsBuy = parseFloat(values.closingCostsBuy) || 0
  const holdingCosts = parseFloat(values.holdingCosts) || 0
  const sellingPrice = parseFloat(values.sellingPrice) || 0
  const realtorFees = sellingPrice * (parseFloat(values.realtorFees) / 100)
  const closingCostsSell = parseFloat(values.closingCostsSell) || 0

  const totalCosts = purchasePrice + rehabCosts + closingCostsBuy + holdingCosts + realtorFees + closingCostsSell
  const grossProfit = sellingPrice - totalCosts
  const roi = purchasePrice > 0 ? ((grossProfit / purchasePrice) * 100).toFixed(2) : 0

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Flip Calculator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purchase & Rehab */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Acquisition & Rehab</h3>
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
              <label className="block text-sm font-medium text-gray-700">Closing Costs (Buy)</label>
              <input
                type="number"
                value={values.closingCostsBuy}
                onChange={(e) => setValues({ ...values, closingCostsBuy: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Holding Costs (Utilities, Insurance, etc.)</label>
              <input
                type="number"
                value={values.holdingCosts}
                onChange={(e) => setValues({ ...values, holdingCosts: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
          </div>

          {/* Sale */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Sale</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price</label>
              <input
                type="number"
                value={values.sellingPrice}
                onChange={(e) => setValues({ ...values, sellingPrice: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Realtor Fees (%)</label>
              <input
                type="number"
                value={values.realtorFees}
                onChange={(e) => setValues({ ...values, realtorFees: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="6"
              />
              <p className="mt-1 text-sm text-gray-500">${realtorFees.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Closing Costs (Sell)</label>
              <input
                type="number"
                value={values.closingCostsSell}
                onChange={(e) => setValues({ ...values, closingCostsSell: e.target.value })}
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
              <p className="text-xl font-bold text-blue-600">${totalCosts.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sale Price</p>
              <p className="text-xl font-bold text-green-600">${sellingPrice.toLocaleString()}</p>
            </div>
            <div className={`${grossProfit >= 0 ? 'bg-purple-50' : 'bg-red-50'} p-4 rounded-lg`}>
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                ${grossProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-xl font-bold text-orange-600">{roi}%</p>
            </div>
          </div>

          {/* Profit Margin Indicator */}
          <div className="mt-4">
            {grossProfit >= purchasePrice * 0.3 && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-bold">Strong Deal!</p>
                <p className="text-sm">Profit is 30%+ of purchase price</p>
              </div>
            )}
            {grossProfit > 0 && grossProfit < purchasePrice * 0.3 && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p className="font-bold">Marginal Deal</p>
                <p className="text-sm">Profit is less than 30% of purchase price</p>
              </div>
            )}
            {grossProfit <= 0 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Loss!</p>
                <p className="text-sm">This deal would lose money</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
