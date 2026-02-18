/**
 * Maintenance Automation Dashboard
 * 
 * Control panel for the automated maintenance system
 * Shows queue status, recent assignments, and manual controls
 */

import React, { useState, useEffect } from 'react';
import { Bot, Play, Pause, RefreshCw, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Job, JobStatus, Contractor, Tenant, Asset } from '../types';
import { 
  runMaintenanceAutomation, 
  initializeAutomation, 
  getAutomationQueueStatus,
  generateHumanReport,
  AutomationConfig,
  AutomationRun 
} from '../services/maintenanceAutomationOrchestrator';

interface MaintenanceAutomationDashboardProps {
  jobs: Job[];
  contractors: Contractor[];
  tenants: Tenant[];
  assets: Asset[];
  onJobsUpdate: (jobs: Job[]) => void;
}

const MaintenanceAutomationDashboard: React.FC<MaintenanceAutomationDashboardProps> = ({
  jobs,
  contractors,
  tenants,
  assets,
  onJobsUpdate
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<AutomationRun | null>(null);
  const [queueStatus, setQueueStatus] = useState({ propControlPending: 0, propertyMeldPending: 0, total: 0 });
  const [config, setConfig] = useState<AutomationConfig>(
    initializeAutomation({
      mode: 'hybrid',
      autoAssignThreshold: 70,
      ownerApprovalThreshold: 1000,
      emergencyAutoAssign: true,
      notifyOnAssignment: true
    })
  );

  // Load queue status on mount
  useEffect(() => {
    loadQueueStatus();
  }, [jobs]);

  const loadQueueStatus = async () => {
    const status = await getAutomationQueueStatus(jobs);
    setQueueStatus(status);
  };

  const handleRunAutomation = async () => {
    setIsRunning(true);
    
    try {
      const run = await runMaintenanceAutomation(
        config,
        contractors,
        jobs,
        assets,
        tenants
      );
      
      setLastRun(run);
      
      // Refresh queue status
      await loadQueueStatus();
      
      // Generate report
      const report = generateHumanReport(run);
      console.log(report);
      alert(`Automation complete!\n\n${report}`);
      
    } catch (error) {
      console.error('Automation failed:', error);
      alert('Automation failed. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const stats = [
    {
      label: 'Pending Assignment',
      value: queueStatus.total,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'PropControl Queue',
      value: queueStatus.propControlPending,
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Property Meld Queue',
      value: queueStatus.propertyMeldPending,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Auto-Assigned Today',
      value: lastRun?.autoAssigned || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Maintenance Automation</h2>
            <p className="text-sm text-slate-600">AI-powered request triage & vendor assignment</p>
          </div>
        </div>

        <button
          onClick={handleRunAutomation}
          disabled={isRunning || queueStatus.total === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition ${
            isRunning || queueStatus.total === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Automation
            </>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-black text-slate-900 mb-4">Automation Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Mode
            </label>
            <select
              value={config.mode}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="propcontrol_only">PropControl Only</option>
              <option value="property_meld_only">Property Meld Only</option>
              <option value="hybrid">Hybrid (Both)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Auto-Assign Confidence Threshold
            </label>
            <input
              type="number"
              value={config.autoAssignThreshold}
              onChange={(e) => setConfig({ ...config, autoAssignThreshold: parseInt(e.target.value) })}
              min="50"
              max="100"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">{config.autoAssignThreshold}% or higher = auto-assign</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Owner Approval Threshold
            </label>
            <input
              type="number"
              value={config.ownerApprovalThreshold}
              onChange={(e) => setConfig({ ...config, ownerApprovalThreshold: parseInt(e.target.value) })}
              min="0"
              step="100"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Quotes over ${config.ownerApprovalThreshold} need approval</p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.emergencyAutoAssign}
                onChange={(e) => setConfig({ ...config, emergencyAutoAssign: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-700">Always auto-assign emergencies</span>
            </label>
          </div>
        </div>
      </div>

      {/* Last Run Report */}
      {lastRun && (
        <div className="bg-slate-900 text-white rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black">Last Run Report</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Processed</p>
              <p className="text-2xl font-black">{lastRun.processed}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Auto-Assigned</p>
              <p className="text-2xl font-black text-emerald-400">{lastRun.autoAssigned}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Need Review</p>
              <p className="text-2xl font-black text-amber-400">{lastRun.manualReviewNeeded}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Errors</p>
              <p className="text-2xl font-black text-rose-400">{lastRun.errors}</p>
            </div>
          </div>

          <pre className="bg-slate-800 rounded-xl p-4 text-xs overflow-x-auto">
            {generateHumanReport(lastRun)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAutomationDashboard;
