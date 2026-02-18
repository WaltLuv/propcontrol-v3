/**
 * Property Meld Sync Service
 * 
 * Syncs work orders between PropControl and Property Meld
 * Uses Clawdbot browser automation
 */

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
  assignedTo?: string;
}

const API_BASE = '/.netlify/functions';

/**
 * Fetch unassigned melds from Property Meld
 */
export async function fetchUnassignedMelds(): Promise<PropertyMeldWork[]> {
  try {
    console.log('📋 Fetching unassigned melds from Property Meld...');
    
    const response = await fetch(`${API_BASE}/sync-melds`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch melds');
    }
    
    console.log(`✅ Found ${data.melds.length} unassigned melds`);
    
    return data.melds;
    
  } catch (error) {
    console.error('Failed to fetch Property Meld data:', error);
    throw error;
  }
}

// Parsing moved to backend API

/**
 * Create new meld in Property Meld
 */
export async function createMeld(data: {
  property: string;
  description: string;
  priority?: string;
  photos?: string[];
}): Promise<{ success: boolean; meldId?: string; error?: string }> {
  try {
    console.log('📝 Creating meld in Property Meld:', data);
    
    const response = await fetch(`${API_BASE}/melds/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Meld created:', result.meldId);
    
    return result;
    
  } catch (error) {
    console.error('Failed to create meld:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync button handler - fetches latest from Property Meld
 */
export async function syncWithPropertyMeld(): Promise<{
  success: boolean;
  melds?: PropertyMeldWork[];
  error?: string;
}> {
  try {
    console.log('🔄 Syncing with Property Meld...');
    
    const melds = await fetchUnassignedMelds();
    
    console.log(`✅ Synced ${melds.length} unassigned melds`);
    
    return {
      success: true,
      melds
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    };
  }
}
