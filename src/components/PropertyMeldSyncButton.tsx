import React, { useState } from 'react';
import { syncWithPropertyMeld } from '../services/propertyMeldSync';

interface PropertyMeldWork {
  meldId: string;
  meldNumber: string;
  title: string;
  property: string;
  tenant: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: string;
  created: string;
}

export function PropertyMeldSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [melds, setMelds] = useState<PropertyMeldWork[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const result = await syncWithPropertyMeld();
      
      if (result.success && result.melds) {
        setMelds(result.melds);
        setLastSync(new Date());
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Property Meld Integration</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`px-4 py-2 rounded font-medium ${
            syncing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {syncing ? '⏳ Syncing...' : '🔄 Sync Unassigned Melds'}
        </button>
      </div>

      {lastSync && (
        <p className="text-sm text-gray-600 mb-4">
          Last synced: {lastSync.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {melds.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Unassigned Work Orders ({melds.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {melds.map((meld) => (
              <div
                key={meld.meldId}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          meld.priority
                        )}`}
                      />
                      <h4 className="font-semibold">{meld.title}</h4>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      📍 {meld.property}
                    </p>
                    
                    {meld.tenant && (
                      <p className="text-sm text-gray-600">
                        👤 {meld.tenant}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className="font-mono text-gray-500">
                      {meld.meldNumber}
                    </div>
                    <div className="text-gray-400">{meld.created}</div>
                  </div>
                </div>

                {meld.description && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {meld.description}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={async () => {
                      try {
                        // Import to follow-ups
                        const { FollowUpServiceLocal } = await import('../services/followUpServiceLocal');
                        const { FollowUpType, FollowUpStatus, FollowUpPriority } = await import('../followUpTypes');
                        
                        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        const remindAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
                        
                        await FollowUpServiceLocal.createFollowUp({
                          type: FollowUpType.VENDOR_QUOTE_REQUEST,
                          status: FollowUpStatus.PENDING,
                          priority: meld.priority === 'emergency' ? FollowUpPriority.URGENT : 
                                   meld.priority === 'high' ? FollowUpPriority.HIGH : FollowUpPriority.MEDIUM,
                          title: meld.title,
                          description: meld.description,
                          actionNeeded: 'Assign vendor and get quote',
                          propertyAddress: meld.property,
                          createdAt: new Date().toISOString(),
                          dueDate: dueDate.toISOString(),
                          remindAt: remindAt.toISOString(),
                          metadata: {
                            propertyMeldId: meld.meldId,
                            meldNumber: meld.meldNumber,
                            tenant: meld.tenant
                          }
                        });
                        
                        alert(`✅ Imported ${meld.meldNumber} to Follow-Ups!`);
                        
                        // Reload melds to show updated state
                        handleSync();
                      } catch (error) {
                        alert(`❌ Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                  >
                    📥 Import to Follow-Ups
                  </button>
                  
                  <button
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      window.open(
                        `https://app.propertymeld.com/2197/m/2197/meld/${meld.meldId}/summary/`,
                        '_blank'
                      );
                    }}
                  >
                    🔗 Open in Property Meld
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {melds.length === 0 && lastSync && !error && (
        <div className="text-center text-gray-500 py-8">
          ✅ No unassigned melds found
        </div>
      )}
    </div>
  );
}
