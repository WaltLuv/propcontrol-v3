import { Link } from 'react-router-dom'
import { Calculator, DollarSign, TrendingUp, Home } from 'lucide-react'

export default function Dashboard() {
  const tools = [
    {
      name: 'ARV Calculator',
      description: 'Calculate After Repair Value for your properties',
      icon: Calculator,
      path: '/arv',
      color: 'bg-blue-500'
    },
    {
      name: 'Cash Flow Calculator',
      description: 'Analyze rental income and expenses',
      icon: DollarSign,
      path: '/cashflow',
      color: 'bg-green-500'
    },
    {
      name: 'BRRRR Calculator',
      description: 'Buy, Rehab, Rent, Refinance, Repeat strategy',
      icon: TrendingUp,
      path: '/brrrr',
      color: 'bg-purple-500'
    },
    {
      name: 'Flip Calculator',
      description: 'Calculate profit potential for fix-and-flip deals',
      icon: Home,
      path: '/flip',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Property Management Dashboard</h2>
        <p className="mt-2 text-gray-600">Select a calculator to analyze your deals</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.name}
              to={tool.path}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className={`inline-flex rounded-lg p-3 ${tool.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{tool.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{tool.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
