import { useState } from 'react'

export default function CashFlowCalculator() {
  const [values, setValues] = useState({
    monthlyRent: '',
    mortgage: '',
    propertyTax: '',
    insurance: '',
    hoa: '',
    maintenance: '',
    vacancy: '',
    propertyManagement: ''
  })

  const totalIncome = parseFloat(values.monthlyRent) || 0
  const totalExpenses = 
    (parseFloat(values.mortgage) || 0) +
    (parseFloat(values.propertyTax) || 0) +
    (parseFloat(values.insurance) || 0) +
    (parseFloat(values.hoa) || 0) +
    (parseFloat(values.maintenance) || 0) +
    (parseFloat(values.vacancy) || 0) +
    (parseFloat(values.propertyManagement) || 0)

  const monthlyCashFlow = totalIncome - totalExpenses
  const annualCashFlow = monthlyCashFlow * 12
  const cashOnCashReturn = totalIncome > 0 ? ((annualCashFlow / (totalIncome * 12)) * 100).toFixed(2) : 0

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cash Flow Calculator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Income</h3>
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
          </div>

          {/* Expenses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Expenses</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mortgage Payment</label>
              <input
                type="number"
                value={values.mortgage}
                onChange={(e) => setValues({ ...values, mortgage: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Tax (Monthly)</label>
              <input
                type="number"
                value={values.propertyTax}
                onChange={(e) => setValues({ ...values, propertyTax: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance</label>
              <input
                type="number"
                value={values.insurance}
                onChange={(e) => setValues({ ...values, insurance: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">HOA Fees</label>
              <input
                type="number"
                value={values.hoa}
                onChange={(e) => setValues({ ...values, hoa: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Reserve</label>
              <input
                type="number"
                value={values.maintenance}
                onChange={(e) => setValues({ ...values, maintenance: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vacancy Reserve</label>
              <input
                type="number"
                value={values.vacancy}
                onChange={(e) => setValues({ ...values, vacancy: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Management</label>
              <input
                type="number"
                value={values.propertyManagement}
                onChange={(e) => setValues({ ...values, propertyManagement: e.target.value })}
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
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-xl font-bold text-blue-600">${totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Expenses</p>
              <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className={`${monthlyCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
              <p className="text-sm text-gray-600">Monthly Cash Flow</p>
              <p className={`text-xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${monthlyCashFlow.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Annual Cash Flow</p>
              <p className="text-xl font-bold text-purple-600">${annualCashFlow.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
