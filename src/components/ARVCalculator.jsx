import { useState } from 'react'

export default function ARVCalculator() {
  const [values, setValues] = useState({
    purchasePrice: '',
    rehabCosts: '',
    comparables: ['', '', '']
  })

  const handleCompChange = (index, value) => {
    const newComps = [...values.comparables]
    newComps[index] = value
    setValues({ ...values, comparables: newComps })
  }

  const avgComps = values.comparables
    .filter(c => c !== '')
    .reduce((sum, c) => sum + parseFloat(c), 0) / values.comparables.filter(c => c !== '').length || 0

  const totalInvestment = (parseFloat(values.purchasePrice) || 0) + (parseFloat(values.rehabCosts) || 0)
  const equity = avgComps - totalInvestment
  const roiPercent = totalInvestment > 0 ? ((equity / totalInvestment) * 100).toFixed(2) : 0

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ARV Calculator</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
            <input
              type="number"
              value={values.purchasePrice}
              onChange={(e) => setValues({ ...values, purchasePrice: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="$0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rehab Costs</label>
            <input
              type="number"
              value={values.rehabCosts}
              onChange={(e) => setValues({ ...values, rehabCosts: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="$0"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Comparable Sales</label>
            {values.comparables.map((comp, index) => (
              <input
                key={index}
                type="number"
                value={comp}
                onChange={(e) => handleCompChange(index, e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Comp ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average ARV</p>
              <p className="text-2xl font-bold text-blue-600">${avgComps.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-green-600">${totalInvestment.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Potential Equity</p>
              <p className="text-2xl font-bold text-purple-600">${equity.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-orange-600">{roiPercent}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
