/**
 * Maintenance Automation Orchestrator
 * 
 * Central coordination for BOTH PropControl and Property Meld automation:
 * 
 * MODE 1: PropControl Native (tenant portal → AI → vendor assignment)
 * MODE 2: Property Meld Sync (fetch melds → AI → assign in Property Meld)
 * MODE 3: Hybrid (accept from both, dedupe, process)
 * 
 * This is the "brain" that runs on heartbeat/cron and coordinates everything.
 */

import { Job, JobStatus, Contractor, Tenant, Asset } from '../types';
import { 
  automateMaintenanceRequest, 
  triageRequest, 
  assignContractor 
} from './vendorAssignmentService';
import {
  automatePropertyMeldAssignments,
  fetchUnassignedMelds,
  convertMeldToJob,
  generateAutomationReport,
  setPropertyMeldCredentials
} from './propertyMeldService';
import {
  notifyRequestCreated,
  notifyContractorAssigned,
  notifyStatusChange
} from './maintenanceNotificationService';
import { classifyTenantMessage } from '../geminiService';

export interface AutomationConfig {
  mode: 'propcontrol_only' | 'property_meld_only' | 'hybrid';
  autoAssignThreshold: number; // confidence % needed for auto-assignment
  ownerApprovalThreshold: number; // dollar amount requiring owner approval
  emergencyAutoAssign: boolean; // always auto-assign emergencies
  notifyOnAssignment: boolean; // send emails/SMS on assignment
  propertyMeldCredentials?: {
    email: string;
    password: string;
  };
}

export interface AutomationRun {
  runId: string;
  startTime: string;
  endTime?: string;
  mode: string;
  processed: number;
  autoAssigned: number;
  manualReviewNeeded: number;
  errors: number;
  results: AutomationResult[];
}

export interface AutomationResult {
  requestId: string;
  source: 'propcontrol' | 'property_meld';
  action: 'auto_assigned' | 'needs_review' | 'owner_approval_needed' | 'error';
  contractorName?: string;
  estimatedCost?: number;
  confidence?: number;
  error?: string;
}

const DEFAULT_CONFIG: AutomationConfig = {
  mode: 'hybrid',
  autoAssignThreshold: 70, // 70% confidence or higher = auto-assign
  ownerApprovalThreshold: 1000, // $1000+
  emergencyAutoAssign: true,
  notifyOnAssignment: true
};

/**
 * Initialize automation with config
 */
export function initializeAutomation(config: Partial<AutomationConfig> = {}): AutomationConfig {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Set Property Meld credentials if provided
  if (finalConfig.propertyMeldCredentials) {
    setPropertyMeldCredentials(
      finalConfig.propertyMeldCredentials.email,
      finalConfig.propertyMeldCredentials.password
    );
  }
  
  return finalConfig;
}

/**
 * MAIN AUTOMATION ENTRY POINT
 * 
 * Run this on heartbeat/cron to process pending maintenance requests
 */
export async function runMaintenanceAutomation(
  config: AutomationConfig,
  contractors: Contractor[],
  existingJobs: Job[],
  assets: Asset[],
  tenants: Tenant[]
): Promise<AutomationRun> {
  
  const runId = `auto-${Date.now()}`;
  const startTime = new Date().toISOString();
  
  console.log(`[Automation] Starting run ${runId} in ${config.mode} mode...`);
  
  const results: AutomationResult[] = [];
  let autoAssigned = 0;
  let manualReviewNeeded = 0;
  let errors = 0;
  
  try {
    // MODE 1 & 3: Process PropControl native requests
    if (config.mode === 'propcontrol_only' || config.mode === 'hybrid') {
      console.log('[Automation] Processing PropControl requests...');
      
      // Find unassigned jobs in PropControl
      const unassignedJobs = existingJobs.filter(j => 
        j.status === JobStatus.REPORTED || j.status === JobStatus.AI_CLASSIFIED
      );
      
      for (const job of unassignedJobs) {
        const result = await processJobForAutomation(
          job,
          config,
          contractors,
          existingJobs,
          assets,
          tenants
        );
        
        results.push(result);
        
        if (result.action === 'auto_assigned') autoAssigned++;
        else if (result.action === 'needs_review' || result.action === 'owner_approval_needed') manualReviewNeeded++;
        else if (result.action === 'error') errors++;
      }
    }
    
    // MODE 2 & 3: Process Property Meld melds
    if (config.mode === 'property_meld_only' || config.mode === 'hybrid') {
      console.log('[Automation] Processing Property Meld melds...');
      
      const propertyMeldResults = await automatePropertyMeldAssignments(contractors);
      
      // Convert Property Meld results to our format
      propertyMeldResults.results.forEach(r => {
        results.push({
          requestId: r.meldId,
          source: 'property_meld',
          action: r.success ? 'auto_assigned' : 'error',
          contractorName: r.vendorName,
          error: r.error
        });
        
        if (r.success) autoAssigned++;
        else errors++;
      });
    }
    
    const endTime = new Date().toISOString();
    
    console.log(`[Automation] Run ${runId} complete: ${autoAssigned} auto-assigned, ${manualReviewNeeded} need review, ${errors} errors`);
    
    return {
      runId,
      startTime,
      endTime,
      mode: config.mode,
      processed: results.length,
      autoAssigned,
      manualReviewNeeded,
      errors,
      results
    };
    
  } catch (error) {
    console.error('[Automation] Fatal error:', error);
    
    return {
      runId,
      startTime,
      endTime: new Date().toISOString(),
      mode: config.mode,
      processed: results.length,
      autoAssigned,
      manualReviewNeeded,
      errors: errors + 1,
      results
    };
  }
}

/**
 * Process a single job for automation
 */
async function processJobForAutomation(
  job: Job,
  config: AutomationConfig,
  contractors: Contractor[],
  existingJobs: Job[],
  assets: Asset[],
  tenants: Tenant[]
): Promise<AutomationResult> {
  
  try {
    console.log(`[Automation] Processing job ${job.id}...`);
    
    // Step 1: AI classification (if not already done)
    let aiCategory = job.issueType;
    if (job.status === JobStatus.REPORTED) {
      const aiAnalysis = await classifyTenantMessage(job.description);
      aiCategory = aiAnalysis.category;
    }
    
    // Step 2: Run automation engine
    const automation = automateMaintenanceRequest(
      job.description,
      aiCategory,
      contractors,
      existingJobs
    );
    
    // Step 3: Determine action
    
    // No contractor found
    if (!automation.assignment) {
      console.log(`[Automation] No contractor available for job ${job.id}`);
      return {
        requestId: job.id,
        source: 'propcontrol',
        action: 'needs_review',
        error: 'No suitable contractor available'
      };
    }
    
    // Needs owner approval (high cost)
    if (automation.requiresOwnerApproval) {
      console.log(`[Automation] Job ${job.id} needs owner approval ($${automation.assignment.finalQuote})`);
      return {
        requestId: job.id,
        source: 'propcontrol',
        action: 'owner_approval_needed',
        contractorName: automation.assignment.contractor.name,
        estimatedCost: automation.assignment.finalQuote,
        confidence: automation.assignment.confidence
      };
    }
    
    // Low confidence - needs manual review
    if (automation.assignment.confidence < config.autoAssignThreshold && !automation.triage.isEmergency) {
      console.log(`[Automation] Job ${job.id} has low confidence (${automation.assignment.confidence}%)`);
      return {
        requestId: job.id,
        source: 'propcontrol',
        action: 'needs_review',
        contractorName: automation.assignment.contractor.name,
        estimatedCost: automation.assignment.finalQuote,
        confidence: automation.assignment.confidence
      };
    }
    
    // AUTO-ASSIGN!
    console.log(`[Automation] ✅ Auto-assigning job ${job.id} to ${automation.assignment.contractor.name}`);
    
    // Update job status
    job.status = JobStatus.CONTRACTOR_ASSIGNED;
    job.contractorId = automation.assignment.contractorId;
    job.costEstimate = automation.assignment.estimatedCost;
    job.finalCost = automation.assignment.finalQuote;
    job.updatedAt = new Date().toISOString();
    
    // Add to communication log
    job.communicationLog.push({
      id: `auto-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'AI Agent',
      message: automation.assignment.reasoning,
      type: 'status_change'
    });
    
    // Send notifications (if enabled)
    if (config.notifyOnAssignment) {
      const asset = assets.find(a => a.id === job.propertyId);
      const tenant = tenants.find(t => t.id === job.tenantId);
      
      if (asset && tenant) {
        await notifyContractorAssigned(
          job,
          automation.assignment.contractor,
          tenant,
          asset,
          automation.assignment.estimatedCost,
          automation.assignment.finalQuote
        );
      }
    }
    
    return {
      requestId: job.id,
      source: 'propcontrol',
      action: 'auto_assigned',
      contractorName: automation.assignment.contractor.name,
      estimatedCost: automation.assignment.finalQuote,
      confidence: automation.assignment.confidence
    };
    
  } catch (error) {
    console.error(`[Automation] Error processing job ${job.id}:`, error);
    return {
      requestId: job.id,
      source: 'propcontrol',
      action: 'error',
      error: String(error)
    };
  }
}

/**
 * Generate a human-readable report for Walter
 */
export function generateHumanReport(run: AutomationRun): string {
  const duration = run.endTime 
    ? Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)
    : 0;
  
  let report = `🤖 **Maintenance Automation Report**\n\n`;
  report += `**Run ID:** ${run.runId}\n`;
  report += `**Duration:** ${duration}s\n`;
  report += `**Mode:** ${run.mode}\n\n`;
  
  report += `📊 **Summary:**\n`;
  report += `- Processed: ${run.processed} requests\n`;
  report += `- ✅ Auto-Assigned: ${run.autoAssigned}\n`;
  report += `- 👀 Needs Review: ${run.manualReviewNeeded}\n`;
  report += `- ❌ Errors: ${run.errors}\n\n`;
  
  // Auto-assigned
  const autoAssigned = run.results.filter(r => r.action === 'auto_assigned');
  if (autoAssigned.length > 0) {
    report += `✅ **Auto-Assigned:**\n`;
    autoAssigned.forEach(r => {
      report += `• ${r.requestId} → ${r.contractorName} ($${r.estimatedCost}, ${r.confidence}% confidence)\n`;
    });
    report += `\n`;
  }
  
  // Needs review
  const needsReview = run.results.filter(r => r.action === 'needs_review');
  if (needsReview.length > 0) {
    report += `👀 **Needs Your Review:**\n`;
    needsReview.forEach(r => {
      report += `• ${r.requestId}: ${r.error || `Low confidence (${r.confidence}%)`}\n`;
    });
    report += `\n`;
  }
  
  // Owner approval
  const ownerApproval = run.results.filter(r => r.action === 'owner_approval_needed');
  if (ownerApproval.length > 0) {
    report += `💰 **Owner Approval Needed:**\n`;
    ownerApproval.forEach(r => {
      report += `• ${r.requestId} → ${r.contractorName} ($${r.estimatedCost}) - High cost\n`;
    });
    report += `\n`;
  }
  
  // Errors
  const errorResults = run.results.filter(r => r.action === 'error');
  if (errorResults.length > 0) {
    report += `❌ **Errors:**\n`;
    errorResults.forEach(r => {
      report += `• ${r.requestId}: ${r.error}\n`;
    });
  }
  
  return report;
}

/**
 * Quick check: How many requests are waiting?
 */
export async function getAutomationQueueStatus(
  existingJobs: Job[]
): Promise<{
  propControlPending: number;
  propertyMeldPending: number;
  total: number;
}> {
  
  const propControlPending = existingJobs.filter(j => 
    j.status === JobStatus.REPORTED || j.status === JobStatus.AI_CLASSIFIED
  ).length;
  
  let propertyMeldPending = 0;
  try {
    const melds = await fetchUnassignedMelds();
    propertyMeldPending = melds.length;
  } catch (error) {
    console.error('Failed to fetch Property Meld status:', error);
  }
  
  return {
    propControlPending,
    propertyMeldPending,
    total: propControlPending + propertyMeldPending
  };
}
