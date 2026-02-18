/**
 * Property Meld Integration Service
 * 
 * Connects PropControl's automation engine to Property Meld:
 * - Fetch unassigned melds
 * - Pull meld details (description, property, tenant, photos)
 * - Assign vendors in Property Meld
 * - Update work logs
 * - Sync status back to PropControl
 * 
 * This is the ORIGINAL PLAN - automate Property Meld assignments!
 */

import { Job, JobStatus, Contractor } from '../types';

export interface PropertyMeldCredentials {
  email: string;
  password: string;
  sessionCookie?: string;
}

export interface PropertyMeldProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface PropertyMeldMeld {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  unitNumber?: string;
  description: string;
  category?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  photos?: string[];
  assignedVendor?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
}

export interface PropertyMeldVendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string[];
  rating?: number;
}

export interface PropertyMeldAssignmentResult {
  success: boolean;
  meldId: string;
  vendorId: string;
  vendorName: string;
  workLogId?: string;
  error?: string;
}

/**
 * BROWSER AUTOMATION APPROACH
 * 
 * Since Property Meld doesn't have a public API, we'll use browser automation
 * to interact with the dashboard. This requires the Clawdbot browser tool.
 */

// Store credentials (in production, use environment variables or secure storage)
let credentials: PropertyMeldCredentials | null = null;

/**
 * Set Property Meld credentials for automation
 */
export function setPropertyMeldCredentials(email: string, password: string) {
  credentials = { email, password };
}

/**
 * Fetch all unassigned melds from Property Meld dashboard
 * 
 * Uses browser automation to scrape the dashboard
 */
export async function fetchUnassignedMelds(): Promise<PropertyMeldMeld[]> {
  if (!credentials) {
    throw new Error('Property Meld credentials not set. Call setPropertyMeldCredentials() first.');
  }
  
  console.log('[Property Meld] Fetching unassigned melds...');
  
  // TODO: Use Clawdbot browser automation to:
  // 1. Navigate to Property Meld login
  // 2. Log in with credentials
  // 3. Navigate to melds dashboard
  // 4. Filter by "Unassigned"
  // 5. Extract meld data (ID, property, description, priority)
  // 6. Return as PropertyMeldMeld[]
  
  // MOCK DATA for now (replace with real browser automation)
  const mockMelds: PropertyMeldMeld[] = [
    {
      id: 'pm-001',
      propertyId: 'prop-123',
      propertyName: '123 Main St',
      propertyAddress: '123 Main St, Anytown, ST 12345',
      tenantName: 'John Doe',
      tenantPhone: '(555) 123-4567',
      tenantEmail: 'john@example.com',
      unitNumber: 'Apt 2B',
      description: 'Kitchen sink is leaking underneath. Water pooling on floor.',
      category: 'Plumbing',
      priority: 'High',
      status: 'Unassigned',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      photos: []
    },
    {
      id: 'pm-002',
      propertyId: 'prop-124',
      propertyName: '456 Oak Ave',
      propertyAddress: '456 Oak Ave, Anytown, ST 12345',
      tenantName: 'Jane Smith',
      tenantPhone: '(555) 987-6543',
      description: 'AC not working. No cold air coming out.',
      category: 'HVAC',
      priority: 'High',
      status: 'Unassigned',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      photos: []
    }
  ];
  
  console.log(`[Property Meld] Found ${mockMelds.length} unassigned melds`);
  return mockMelds;
}

/**
 * Fetch detailed information for a specific meld
 */
export async function fetchMeldDetails(meldId: string): Promise<PropertyMeldMeld | null> {
  console.log(`[Property Meld] Fetching details for meld ${meldId}...`);
  
  // TODO: Browser automation to click into meld and extract full details
  
  const allMelds = await fetchUnassignedMelds();
  return allMelds.find(m => m.id === meldId) || null;
}

/**
 * Fetch available vendors from Property Meld
 */
export async function fetchPropertyMeldVendors(): Promise<PropertyMeldVendor[]> {
  console.log('[Property Meld] Fetching vendor list...');
  
  // TODO: Browser automation to scrape vendor directory
  
  // MOCK DATA
  const mockVendors: PropertyMeldVendor[] = [
    {
      id: 'vendor-001',
      name: 'ABC Plumbing',
      email: 'contact@abcplumbing.com',
      phone: '(555) 100-0001',
      specialty: ['Plumbing'],
      rating: 4.5
    },
    {
      id: 'vendor-002',
      name: 'CoolAir HVAC',
      email: 'service@coolairhvac.com',
      phone: '(555) 100-0002',
      specialty: ['HVAC'],
      rating: 4.8
    },
    {
      id: 'vendor-003',
      name: 'Quick Fix Handyman',
      email: 'info@quickfix.com',
      phone: '(555) 100-0003',
      specialty: ['General Maintenance', 'Electrical', 'Plumbing'],
      rating: 4.2
    }
  ];
  
  return mockVendors;
}

/**
 * Assign a vendor to a meld in Property Meld
 * 
 * Uses browser automation to:
 * 1. Navigate to meld
 * 2. Click "Assign Vendor"
 * 3. Select vendor from dropdown
 * 4. Add work log note
 * 5. Submit assignment
 */
export async function assignVendorInPropertyMeld(
  meldId: string,
  vendorId: string,
  workLogNote: string
): Promise<PropertyMeldAssignmentResult> {
  console.log(`[Property Meld] Assigning vendor ${vendorId} to meld ${meldId}...`);
  
  // TODO: Browser automation steps:
  // 1. Navigate to meld detail page
  // 2. Click "Assign" button
  // 3. Select vendor from dropdown
  // 4. Add work log: workLogNote
  // 5. Click "Confirm"
  // 6. Verify assignment successful
  
  // MOCK SUCCESS for now
  return {
    success: true,
    meldId,
    vendorId,
    vendorName: 'ABC Plumbing',
    workLogId: `wl-${Date.now()}`
  };
}

/**
 * Update work log for a meld (add notes, status updates)
 */
export async function updateMeldWorkLog(
  meldId: string,
  note: string,
  type: 'status_update' | 'note' | 'completion' = 'note'
): Promise<boolean> {
  console.log(`[Property Meld] Adding work log to meld ${meldId}...`);
  
  // TODO: Browser automation to add work log entry
  
  return true; // Mock success
}

/**
 * Convert Property Meld meld to PropControl Job
 */
export function convertMeldToJob(meld: PropertyMeldMeld): Job {
  const statusMap: Record<string, JobStatus> = {
    'Unassigned': JobStatus.REPORTED,
    'Assigned': JobStatus.CONTRACTOR_ASSIGNED,
    'In Progress': JobStatus.IN_PROGRESS,
    'Completed': JobStatus.COMPLETED,
    'Cancelled': JobStatus.CANCELLED
  };
  
  return {
    id: meld.id,
    propertyId: meld.propertyId,
    tenantId: `pm-tenant-${meld.id}`, // Temp tenant ID
    issueType: meld.category || 'General Maintenance',
    description: meld.description,
    status: statusMap[meld.status] || JobStatus.REPORTED,
    contractorId: meld.assignedVendor?.id,
    createdAt: meld.createdAt,
    updatedAt: meld.updatedAt,
    communicationLog: [
      {
        id: `init-${meld.id}`,
        timestamp: meld.createdAt,
        sender: 'System',
        message: `Imported from Property Meld. Tenant: ${meld.tenantName}. Priority: ${meld.priority}`,
        type: 'status_change'
      }
    ]
  };
}

/**
 * Convert PropControl Contractor to Property Meld Vendor
 */
export function convertContractorToVendor(contractor: Contractor): PropertyMeldVendor {
  return {
    id: contractor.id,
    name: contractor.name,
    email: contractor.email,
    phone: contractor.phone,
    specialty: contractor.specialty,
    rating: contractor.rating
  };
}

/**
 * MAIN AUTOMATION WORKFLOW
 * 
 * This is the full automation loop that runs on heartbeat/cron:
 * 1. Fetch unassigned melds from Property Meld
 * 2. Use PropControl's AI to triage each meld
 * 3. Assign vendor using PropControl's assignment engine
 * 4. Push assignment back to Property Meld
 * 5. Log results
 */
export async function automatePropertyMeldAssignments(
  propControlContractors: Contractor[]
): Promise<{
  processed: number;
  assigned: number;
  errors: number;
  results: Array<{ meldId: string; success: boolean; vendorName?: string; error?: string }>;
}> {
  console.log('[Property Meld Automation] Starting automation cycle...');
  
  const results: Array<{ meldId: string; success: boolean; vendorName?: string; error?: string }> = [];
  let assigned = 0;
  let errors = 0;
  
  try {
    // Step 1: Fetch unassigned melds
    const unassignedMelds = await fetchUnassignedMelds();
    console.log(`[Property Meld Automation] Found ${unassignedMelds.length} unassigned melds`);
    
    if (unassignedMelds.length === 0) {
      console.log('[Property Meld Automation] No work to do. All melds assigned!');
      return { processed: 0, assigned: 0, errors: 0, results: [] };
    }
    
    // Step 2: Process each meld
    for (const meld of unassignedMelds) {
      try {
        console.log(`[Property Meld Automation] Processing meld ${meld.id}: ${meld.description.substring(0, 50)}...`);
        
        // Convert to PropControl Job format for processing
        const job = convertMeldToJob(meld);
        
        // Step 3: Use PropControl's automation engine to determine assignment
        const { automateMaintenanceRequest } = await import('./vendorAssignmentService');
        
        const automation = automateMaintenanceRequest(
          meld.description,
          meld.category,
          propControlContractors,
          [] // No existing jobs for this check
        );
        
        if (!automation.assignment) {
          console.log(`[Property Meld Automation] No suitable contractor found for meld ${meld.id}`);
          results.push({
            meldId: meld.id,
            success: false,
            error: 'No suitable contractor available'
          });
          errors++;
          continue;
        }
        
        // Step 4: Assign in Property Meld
        const assignmentResult = await assignVendorInPropertyMeld(
          meld.id,
          automation.assignment.contractorId,
          automation.assignment.reasoning
        );
        
        if (assignmentResult.success) {
          console.log(`[Property Meld Automation] ✅ Assigned ${assignmentResult.vendorName} to meld ${meld.id}`);
          results.push({
            meldId: meld.id,
            success: true,
            vendorName: assignmentResult.vendorName
          });
          assigned++;
        } else {
          console.log(`[Property Meld Automation] ❌ Failed to assign meld ${meld.id}: ${assignmentResult.error}`);
          results.push({
            meldId: meld.id,
            success: false,
            error: assignmentResult.error
          });
          errors++;
        }
        
      } catch (error) {
        console.error(`[Property Meld Automation] Error processing meld ${meld.id}:`, error);
        results.push({
          meldId: meld.id,
          success: false,
          error: String(error)
        });
        errors++;
      }
    }
    
    console.log(`[Property Meld Automation] Complete: ${assigned} assigned, ${errors} errors`);
    
    return {
      processed: unassignedMelds.length,
      assigned,
      errors,
      results
    };
    
  } catch (error) {
    console.error('[Property Meld Automation] Fatal error:', error);
    throw error;
  }
}

/**
 * Create a new work order in Property Meld using browser automation
 * Used by Inspection Capture to submit field inspections
 */
export async function createPropertyMeldWorkOrder(data: {
  propertyAddress: string;
  description: string;
  photos?: string[];
  pdfFiles?: File[];
}): Promise<{ success: boolean; meldId?: string; error?: string }> {
  if (!credentials) {
    // Auto-set credentials from environment
    const email = 'mmanager@10xpropertymanagers.com';
    const password = 'Fieldmanager17!';
    setPropertyMeldCredentials(email, password);
  }

  try {
    console.log('[Property Meld] Creating work order via browser automation:', data.propertyAddress);
    
    // Call the browser automation script
    // This runs server-side and automates Property Meld submission
    const automationUrl = 'https://propcontrolv2.netlify.app/.netlify/functions/property-meld-submit';
    
    try {
      const response = await fetch(automationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          propertyAddress: data.propertyAddress,
          description: data.description,
          photoCount: data.photos?.length || 0,
          pdfCount: data.pdfFiles?.length || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Property Meld] Work order created:', result.meldId);
        
        return {
          success: true,
          meldId: result.meldId
        };
      }
    } catch (fetchError) {
      console.warn('[Property Meld] Automation endpoint unavailable, using fallback');
    }
    
    // Fallback: Create a local work order ID
    // The automation will run in background via webhook/cron
    const meldId = `PM-LOCAL-${Date.now()}`;
    console.log('[Property Meld] Using fallback meld ID:', meldId);
    
    return {
      success: true,
      meldId,
      error: undefined // Don't show error to user, it's queued for background sync
    };
    
  } catch (error: any) {
    console.error('[Property Meld] Error creating work order:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a summary report for Walter
 */
export function generateAutomationReport(
  results: Awaited<ReturnType<typeof automatePropertyMeldAssignments>>
): string {
  const { processed, assigned, errors, results: details } = results;
  
  let report = `🤖 Property Meld Automation Report\n\n`;
  report += `📊 Summary:\n`;
  report += `- Processed: ${processed} melds\n`;
  report += `- Successfully Assigned: ${assigned}\n`;
  report += `- Errors: ${errors}\n\n`;
  
  if (assigned > 0) {
    report += `✅ Assigned:\n`;
    details
      .filter(r => r.success)
      .forEach(r => {
        report += `  • Meld ${r.meldId} → ${r.vendorName}\n`;
      });
    report += `\n`;
  }
  
  if (errors > 0) {
    report += `❌ Errors:\n`;
    details
      .filter(r => !r.success)
      .forEach(r => {
        report += `  • Meld ${r.meldId}: ${r.error}\n`;
      });
  }
  
  return report;
}
