/**
 * Maintenance Notification Service
 * 
 * Sends notifications to tenants, contractors, and property managers
 * via email and SMS
 */

import { Job, Contractor, Tenant, Asset } from '../types';

export interface NotificationPayload {
  to: string; // email or phone
  subject?: string; // for email
  message: string;
  type: 'email' | 'sms';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MaintenanceNotification {
  jobId: string;
  recipientType: 'tenant' | 'contractor' | 'manager';
  notificationType: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  sentAt: string;
  method: 'email' | 'sms' | 'both';
  success: boolean;
}

/**
 * Send notification when a new maintenance request is created
 */
export async function notifyRequestCreated(
  job: Job,
  tenant: Tenant,
  asset: Asset
): Promise<MaintenanceNotification[]> {
  const notifications: MaintenanceNotification[] = [];
  
  // Notify tenant (confirmation)
  const tenantMessage = `Hi ${tenant.name}! We received your maintenance request for ${asset.name}. 

Issue: ${job.description}

We're reviewing it now and will assign a contractor shortly. You can check the status at any time using your request ID: ${job.id}

Track here: ${getStatusUrl(job.id)}

- PropControl Maintenance Team`;

  try {
    await sendNotification({
      to: tenant.email,
      subject: `Maintenance Request Received - ${asset.name}`,
      message: tenantMessage,
      type: 'email',
      priority: 'normal'
    });
    
    notifications.push({
      jobId: job.id,
      recipientType: 'tenant',
      notificationType: 'created',
      sentAt: new Date().toISOString(),
      method: 'email',
      success: true
    });
  } catch (error) {
    console.error('Failed to notify tenant:', error);
    notifications.push({
      jobId: job.id,
      recipientType: 'tenant',
      notificationType: 'created',
      sentAt: new Date().toISOString(),
      method: 'email',
      success: false
    });
  }
  
  return notifications;
}

/**
 * Send notification when a contractor is assigned
 */
export async function notifyContractorAssigned(
  job: Job,
  contractor: Contractor,
  tenant: Tenant,
  asset: Asset,
  estimatedCost: number,
  finalQuote: number
): Promise<MaintenanceNotification[]> {
  const notifications: MaintenanceNotification[] = [];
  
  // Notify contractor (work order)
  const contractorMessage = `New Work Order - ${asset.name}

Property: ${asset.address}, ${asset.city}, ${asset.state} ${asset.zip}
Tenant: ${tenant.name} | ${tenant.phone}

Issue Type: ${job.issueType}
Description: ${job.description}

Estimated Cost: $${estimatedCost}
Your Quote: $${finalQuote}

Job ID: ${job.id}
Priority: ${job.status.includes('EMERGENCY') ? '🚨 EMERGENCY' : 'Standard'}

Please respond within 2 hours to confirm availability.

View full details: ${getContractorJobUrl(job.id)}`;

  try {
    // Send email
    await sendNotification({
      to: contractor.email,
      subject: `New Work Order - ${asset.name} (${job.issueType})`,
      message: contractorMessage,
      type: 'email',
      priority: job.status.includes('EMERGENCY') ? 'urgent' : 'high'
    });
    
    // Send SMS if urgent
    if (job.status.includes('EMERGENCY') || job.description.toLowerCase().includes('emergency')) {
      await sendNotification({
        to: contractor.phone,
        message: `🚨 URGENT: New work order at ${asset.name}. ${job.issueType}. Check email for details or call ${tenant.phone}`,
        type: 'sms',
        priority: 'urgent'
      });
      
      notifications.push({
        jobId: job.id,
        recipientType: 'contractor',
        notificationType: 'assigned',
        sentAt: new Date().toISOString(),
        method: 'both',
        success: true
      });
    } else {
      notifications.push({
        jobId: job.id,
        recipientType: 'contractor',
        notificationType: 'assigned',
        sentAt: new Date().toISOString(),
        method: 'email',
        success: true
      });
    }
  } catch (error) {
    console.error('Failed to notify contractor:', error);
    notifications.push({
      jobId: job.id,
      recipientType: 'contractor',
      notificationType: 'assigned',
      sentAt: new Date().toISOString(),
      method: 'email',
      success: false
    });
  }
  
  // Notify tenant (contractor assigned)
  const tenantUpdateMessage = `Good news! We've assigned a contractor to your maintenance request.

Property: ${asset.name}
Issue: ${job.issueType}

Contractor: ${contractor.name}
Contact: ${contractor.phone}

They'll reach out within 24 hours to schedule. You can track progress here:
${getStatusUrl(job.id)}

- PropControl Maintenance Team`;

  try {
    await sendNotification({
      to: tenant.email,
      subject: `Contractor Assigned - ${asset.name}`,
      message: tenantUpdateMessage,
      type: 'email',
      priority: 'normal'
    });
    
    notifications.push({
      jobId: job.id,
      recipientType: 'tenant',
      notificationType: 'assigned',
      sentAt: new Date().toISOString(),
      method: 'email',
      success: true
    });
  } catch (error) {
    console.error('Failed to notify tenant of assignment:', error);
  }
  
  return notifications;
}

/**
 * Send notification when job status changes
 */
export async function notifyStatusChange(
  job: Job,
  tenant: Tenant,
  asset: Asset,
  newStatus: string,
  contractor?: Contractor
): Promise<MaintenanceNotification> {
  
  let tenantMessage = '';
  let subject = '';
  
  switch (newStatus) {
    case 'IN_PROGRESS':
      subject = `Work Started - ${asset.name}`;
      tenantMessage = `Your maintenance request is now in progress!

Property: ${asset.name}
Issue: ${job.issueType}
Contractor: ${contractor?.name || 'Assigned'}

They're working on it now. Track progress: ${getStatusUrl(job.id)}`;
      break;
      
    case 'COMPLETED':
      subject = `Work Completed - ${asset.name}`;
      tenantMessage = `Great news! Your maintenance request has been completed.

Property: ${asset.name}
Issue: ${job.issueType}
Completed by: ${contractor?.name || 'Our team'}

If there are any issues, please let us know within 48 hours.

Final details: ${getStatusUrl(job.id)}`;
      break;
      
    case 'PENDING_APPROVAL':
      subject = `Quote Pending Approval - ${asset.name}`;
      tenantMessage = `We've received a quote for your maintenance request.

Property: ${asset.name}
Issue: ${job.issueType}
Estimated Cost: $${job.costEstimate || 'TBD'}

We're reviewing it and will update you shortly.`;
      break;
      
    default:
      subject = `Maintenance Update - ${asset.name}`;
      tenantMessage = `Your maintenance request has been updated.

Property: ${asset.name}
Status: ${newStatus}

Track progress: ${getStatusUrl(job.id)}`;
  }
  
  try {
    await sendNotification({
      to: tenant.email,
      subject,
      message: tenantMessage,
      type: 'email',
      priority: 'normal'
    });
    
    return {
      jobId: job.id,
      recipientType: 'tenant',
      notificationType: newStatus.toLowerCase() as any,
      sentAt: new Date().toISOString(),
      method: 'email',
      success: true
    };
  } catch (error) {
    console.error('Failed to notify status change:', error);
    return {
      jobId: job.id,
      recipientType: 'tenant',
      notificationType: newStatus.toLowerCase() as any,
      sentAt: new Date().toISOString(),
      method: 'email',
      success: false
    };
  }
}

/**
 * Core notification sender (uses Supabase Edge Functions or external service)
 */
async function sendNotification(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with actual email/SMS service
  // Options:
  // 1. Supabase Edge Functions + Resend/SendGrid for email
  // 2. Twilio for SMS (already configured in PropControl)
  // 3. Combined service
  
  console.log(`[NOTIFICATION] Sending ${payload.type} to ${payload.to}:`);
  console.log(payload.message);
  
  // For now, log to console. In production, this would call:
  // - Resend API for email
  // - Twilio API for SMS
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
}

/**
 * Generate status tracking URL for tenants
 */
function getStatusUrl(jobId: string): string {
  // In production, this would be your PropControl domain
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://propcontrol.app';
  
  return `${baseUrl}/maintenance/status/${jobId}`;
}

/**
 * Generate contractor job view URL
 */
function getContractorJobUrl(jobId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://propcontrol.app';
  
  return `${baseUrl}/contractor/job/${jobId}`;
}

/**
 * Batch send notifications (for multiple jobs)
 */
export async function batchNotify(
  jobs: Job[],
  notificationType: 'created' | 'assigned' | 'in_progress' | 'completed',
  getRecipients: (job: Job) => Promise<{ tenant: Tenant; asset: Asset; contractor?: Contractor }>
): Promise<MaintenanceNotification[]> {
  const allNotifications: MaintenanceNotification[] = [];
  
  for (const job of jobs) {
    try {
      const { tenant, asset, contractor } = await getRecipients(job);
      
      if (notificationType === 'assigned' && contractor) {
        const notifications = await notifyContractorAssigned(
          job,
          contractor,
          tenant,
          asset,
          job.costEstimate || 0,
          job.finalCost || 0
        );
        allNotifications.push(...notifications);
      } else {
        const notification = await notifyStatusChange(job, tenant, asset, notificationType, contractor);
        allNotifications.push(notification);
      }
    } catch (error) {
      console.error(`Failed to send notification for job ${job.id}:`, error);
    }
  }
  
  return allNotifications;
}
