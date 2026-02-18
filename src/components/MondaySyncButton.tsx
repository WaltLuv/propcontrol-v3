import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Key, ExternalLink } from 'lucide-react';
import { 
  fetchMondayTasks, 
  getMondayApiToken, 
  setMondayApiToken,
  getMondayBoards 
} from '../services/mondayApiIntegration';
import { FollowUpServiceLocal } from '../services/followUpServiceLocal';

export function MondaySyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [hasToken, setHasToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [boards, setBoards] = useState<any[]>([]);
  const [useBrowserMode, setUseBrowserMode] = useState(true); // Default to browser mode

  useEffect(() => {
    const token = getMondayApiToken();
    setHasToken(!!token);
  }, []);

  const handleSaveToken = () => {
    if (!tokenInput.trim()) {
      setError('Please enter your Monday.com API token');
      return;
    }

    setMondayApiToken(tokenInput.trim());
    setHasToken(true);
    setShowTokenInput(false);
    setTokenInput('');
    setError(null);
  };

  const handleSync = async () => {
    if (!hasToken && !useBrowserMode) {
      setError('Please set your Monday.com API token first');
      setShowTokenInput(true);
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      let result;
      
      if (useBrowserMode) {
        // Use browser automation fallback
        const { fetchMondayTasks: fetchBrowser } = await import('../services/mondayBrowserAutomation');
        const tasks = await fetchBrowser();
        result = {
          success: true,
          tasks: tasks.map((t: any) => ({
            ...t,
            type: 'GENERAL' as any,
            status: 'PENDING' as any,
            priority: 'MEDIUM' as any,
            createdAt: new Date().toISOString(),
            remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            remindersSent: 0
          }))
        };
      } else {
        // Use API
        result = await fetchMondayTasks();
      }

      if (result.success) {
        // Import tasks as follow-ups
        let imported = 0;
        for (const task of result.tasks) {
          try {
            await FollowUpServiceLocal.createFollowUp({
              type: task.type,
              title: task.title,
              description: task.description,
              actionNeeded: task.actionNeeded,
              propertyAddress: task.propertyAddress,
              priority: task.priority,
              dueDate: task.dueDate,
              metadata: task.metadata
            });
            imported++;
          } catch (err) {
            console.warn('Duplicate or error importing task:', task.id);
          }
        }

        setImportedCount(imported);
        setLastSync(new Date());
        
        if (imported === 0 && result.tasks.length > 0) {
          setError('Tasks found but already imported (no duplicates created)');
        }
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const loadBoards = async () => {
    if (!hasToken) return;
    
    try {
      const boardList = await getMondayBoards();
      setBoards(boardList);
    } catch (err: any) {
      console.error('Failed to load boards:', err);
    }
  };

  useEffect(() => {
    if (hasToken) {
      loadBoards();
    }
  }, [hasToken]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Monday.com Integration</h2>
            <p className="text-sm text-gray-600">
              {useBrowserMode ? '🌐 Browser Automation Mode' : '⚡ GraphQL API Mode'} • Inspections & field visits
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUseBrowserMode(!useBrowserMode)}
            className={`px-3 py-2 rounded text-xs font-medium ${
              useBrowserMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            title="Toggle between API and browser automation"
          >
            {useBrowserMode ? '🌐 Browser' : '⚡ API'}
          </button>
          {!hasToken && !useBrowserMode && (
            <button
              onClick={() => setShowTokenInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium"
            >
              <Key className="w-4 h-4" />
              Set API Token
            </button>
          )}
          <button
            onClick={handleSync}
            disabled={syncing || (!hasToken && !useBrowserMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium ${
              syncing || (!hasToken && !useBrowserMode)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : '🔄 Sync Inspections'}
          </button>
        </div>
      </div>

      {/* API Token Input */}
      {showTokenInput && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <Key className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">Monday.com API Token</h3>
              <p className="text-sm text-purple-700 mb-2">
                Get your token: Profile → Developers → API
              </p>
              <a
                href="https://monday.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open Monday.com Developers
              </a>
            </div>
          </div>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your API token here"
            className="w-full px-3 py-2 border border-purple-300 rounded mb-2 font-mono text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveToken}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
            >
              Save Token
            </button>
            <button
              onClick={() => {
                setShowTokenInput(false);
                setTokenInput('');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      {hasToken && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
          <span className="text-green-800 font-medium">✓ API Token Connected</span>
          {boards.length > 0 && (
            <span className="text-green-600 ml-2">• {boards.length} boards accessible</span>
          )}
        </div>
      )}

      {lastSync && (
        <p className="text-sm text-gray-600 mb-2">
          Last synced: {lastSync.toLocaleTimeString()} • Imported {importedCount} new tasks
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-4 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">What gets synced:</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Move-in / Move-out inspections</li>
          <li>• Periodic inspections</li>
          <li>• Onboarding tasks</li>
          <li>• Field visit follow-ups</li>
          <li>• All boards with inspection-related items</li>
        </ul>
      </div>
    </div>
  );
}
