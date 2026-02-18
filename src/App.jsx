import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Calculator, DollarSign, TrendingUp, Home } from 'lucide-react'
import ARVCalculator from './components/ARVCalculator'
import CashFlowCalculator from './components/CashFlowCalculator'
import BRRRRCalculator from './components/BRRRRCalculator'
import FlipCalculator from './components/FlipCalculator'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-blue-600">PropControl</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/arv"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    ARV Calculator
                  </Link>
                  <Link
                    to="/cashflow"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cash Flow
                  </Link>
                  <Link
                    to="/brrrr"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    BRRRR
                  </Link>
                  <Link
                    to="/flip"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Flip Calculator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/arv" element={<ARVCalculator />} />
            <Route path="/cashflow" element={<CashFlowCalculator />} />
            <Route path="/brrrr" element={<BRRRRCalculator />} />
            <Route path="/flip" element={<FlipCalculator />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
