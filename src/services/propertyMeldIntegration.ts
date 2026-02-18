/**
 * Property Meld Full Integration
 * Syncs entire work order workflow between PropControl and Property Meld
 */

import { Job, JobStatus, Contractor, Asset } from '../types';
import { createPropertyMeldWorkOrder } from './propertyMeldService';

const PM_CREDENTIALS = {
  email: 'mmanager@10xpropertymanagers.com',
  password: 'Fieldmanager17!'
};

/**
 * Sync all work orders from Property Meld to PropControl
 */
export async function syncWorkOrdersFromPropertyMeld(): Promise<{
  success: boolean;
  imported: number;
  jobs: Job[];
  error?: string;
}> {
  try {
    console.log('[PM Sync] Fetching work orders from Property Meld...');
    
    // Call backend automation to scrape Property Meld dashboard
    const response = await fetch('/api/property-meld/sync-melds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PM_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      imported: data.melds.length,
      jobs: data.melds.map(convertMeldToJob)
    };
    
  } catch (error: any) {
    console.error('[PM Sync] Error:', error);
    return {
      success: false,
      imported: 0,
      jobs: [],
      error: error.message
    };
  }
}

/**
 * Push a work order from PropControl to Property Meld
 */
export async function pushWorkOrderToPropertyMeld(job: Job, property: Asset): Promise<{
  success: boolean;
  meldId?: string;
  error?: string;
}> {
  return createPropertyMeldWorkOrder({
    propertyAddress: property.address,
    description: job.description,
    photos: [],
    pdfFiles: []
  });
}

/**
 * Assign a contractor to a meld in Property Meld
 */
export async function assignContractorInPropertyMeld(
  meldId: string,
  contractor: Contractor
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PM Assign] Assigning contractor to meld:', meldId);
    
    const response = await fetch('/api/property-meld/assign-vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...PM_CREDENTIALS,
        meldId,
        vendorName: contractor.name,
        vendorEmail: contractor.email,
        vendorPhone: contractor.phone
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true };
    
  } catch (error: any) {
    console.error('[PM Assign] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update work order status in Property Meld
 */
export async function updatePropertyMeldStatus(
  meldId: string,
  status: JobStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PM Status] Updating meld status:', meldId, status);
    
    const pmStatus = convertJobStatusToPMStatus(status);
    
    const response = await fetch('/api/property-meld/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...PM_CREDENTIALS,
        meldId,
        status: pmStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true };
    
  } catch (error: any) {
    console.error('[PM Status] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Full two-way sync: PropControl ↔ Property Meld
 */
export async function fullSync(
  localJobs: Job[],
  assets: Asset[]
): Promise<{
  imported: number;
  exported: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let exported = 0;
  let updated = 0;

  // Step 1: Import melds from Property Meld
  const syncResult = await syncWorkOrdersFromPropertyMeld();
  if (syncResult.success) {
    imported = syncResult.imported;
  } else {
    errors.push(`Import failed: ${syncResult.error}`);
  }

  // Step 2: Export local jobs that don't have meld IDs
  for (const job of localJobs) {
    if (!job.id.startsWith('PM-') && !job.id.startsWith('MELD-')) {
      const property = assets.find(a => a.id === job.propertyId);
      if (property) {
        const pushResult = await pushWorkOrderToPropertyMeld(job, property);
        if (pushResult.success) {
          exported++;
        } else {
          errors.push(`Export job ${job.id} failed: ${pushResult.error}`);
        }
      }
    }
  }

  return {
    imported,
    exported,
    updated,
    errors
  };
}

/**
 * Convert Property Meld meld to PropControl Job
 */
function convertMeldToJob(meld: any): Job {
  return {
    id: meld.id,
    propertyId: meld.propertyId || '',
    tenantId: '',
    issueType: meld.category || 'General',
    description: meld.description,
    status: convertPMStatusToJobStatus(meld.status),
    contractorId: meld.assignedVendor?.id,
    costEstimate: meld.estimatedCost,
    finalCost: meld.actualCost,
    createdAt: meld.createdAt,
    updatedAt: meld.updatedAt,
    communicationLog: [
      {
        id: `log-${Date.now()}`,
        timestamp: meld.createdAt,
        sender: 'System',
        message: `Imported from Property Meld (${meld.id})`,
        type: 'status_change'
      }
    ]
  };
}

/**
 * Convert Property Meld status to JobStatus
 */
function convertPMStatusToJobStatus(pmStatus: string): JobStatus {
  switch (pmStatus?.toLowerCase()) {
    case 'unassigned':
      return JobStatus.REPORTED;
    case 'assigned':
      return JobStatus.CONTRACTOR_ASSIGNED;
    case 'in progress':
      return JobStatus.IN_PROGRESS;
    case 'completed':
      return JobStatus.COMPLETED;
    case 'cancelled':
      return JobStatus.CANCELLED;
    default:
      return JobStatus.REPORTED;
  }
}

/**
 * Convert JobStatus to Property Meld status
 */
function convertJobStatusToPMStatus(status: JobStatus): string {
  switch (status) {
    case JobStatus.REPORTED:
    case JobStatus.AI_CLASSIFIED:
      return 'Unassigned';
    case JobStatus.CONTRACTOR_ASSIGNED:
      return 'Assigned';
    case JobStatus.IN_PROGRESS:
      return 'In Progress';
    case JobStatus.COMPLETED:
      return 'Completed';
    case JobStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unassigned';
  }
}

/**
 * Enable auto-sync (poll Property Meld every X minutes)
 */
export function enableAutoSync(
  intervalMinutes: number,
  onSync: (result: any) => void
): () => void {
  const intervalId = setInterval(async () => {
    console.log('[PM AutoSync] Running sync...');
    const result = await syncWorkOrdersFromPropertyMeld();
    onSync(result);
  }, intervalMinutes * 60 * 1000);

  return () => clearInterval(intervalId);
}
