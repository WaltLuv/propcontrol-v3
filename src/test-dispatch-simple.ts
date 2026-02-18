/**
 * Simplified test for dispatch and notify functions
 * Tests the logic without actually importing communicationService
 */

// Mock placeActualPhoneCall function
async function placeActualPhoneCall(to: string, vendorName: string, script: string) {
  console.log(`[SIMULATION] Twilio credentials missing. Simulating call to ${to} (${vendorName}).`);
  console.log(`[SIMULATION] Script: "${script}"`);
  return {
    sid: `SIMULATED_CALL_${Date.now()}`,
    status: 'queued',
    simulation: true
  };
}

// Mock data structures
interface Job {
  id: string;
  propertyId: string;
  issueType: string;
  description: string;
  contractorId?: string;
}

interface Contractor {
  id: string;
  name: string;
  phone: string;
}

interface Asset {
  id: string;
  address: string;
  city: string;
}

// Simulate the handleDispatch function
async function handleDispatch(
  jobId: string, 
  jobs: Job[], 
  contractors: Contractor[], 
  assets: Asset[]
) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    console.error('Job not found:', jobId);
    return;
  }
  
  if (!job.contractorId) {
    console.error('No contractor assigned to job:', jobId);
    return;
  }
  
  const contractor = contractors.find(c => c.id === job.contractorId);
  if (!contractor) {
    console.error('Contractor not found:', job.contractorId);
    return;
  }
  
  const asset = assets.find(a => a.id === job.propertyId);
  const propertyAddress = asset ? `${asset.address}, ${asset.city}` : 'Unknown Property';
  
  const script = `Hello ${contractor.name}, this is PropControl dispatch. You have been assigned a new work order for ${job.issueType} at ${propertyAddress}. Job description: ${job.description}. Please check your dashboard for full details. Thank you.`;
  
  try {
    const result = await placeActualPhoneCall(contractor.phone, contractor.name, script);
    console.log('✅ Dispatch call placed:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to dispatch call:', error);
    throw error;
  }
}

// Simulate the handleNotify function
async function handleNotify(
  jobId: string, 
  jobs: Job[], 
  contractors: Contractor[], 
  assets: Asset[]
) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    console.error('Job not found:', jobId);
    return;
  }
  
  if (!job.contractorId) {
    console.error('No contractor assigned to job:', jobId);
    return;
  }
  
  const contractor = contractors.find(c => c.id === job.contractorId);
  if (!contractor) {
    console.error('Contractor not found:', job.contractorId);
    return;
  }
  
  const asset = assets.find(a => a.id === job.propertyId);
  const propertyAddress = asset ? `${asset.address}, ${asset.city}` : 'Unknown Property';
  
  const script = `Hello ${contractor.name}, this is PropControl. Work order ${job.id.substring(0, 8)} at ${propertyAddress} is now in progress. Status update: ${job.issueType} - ${job.description}. Please confirm receipt and estimated completion time.`;
  
  try {
    const result = await placeActualPhoneCall(contractor.phone, contractor.name, script);
    console.log('✅ Notification call placed:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to notify contractor:', error);
    throw error;
  }
}

// Test data
const mockJobs: Job[] = [
  {
    id: 'job_001',
    propertyId: 'asset_001',
    issueType: 'HVAC Repair',
    description: 'Air conditioning unit not cooling properly',
    contractorId: 'contractor_001'
  },
  {
    id: 'job_002',
    propertyId: 'asset_002',
    issueType: 'Plumbing',
    description: 'Leaking faucet in kitchen',
    contractorId: 'contractor_002'
  }
];

const mockContractors: Contractor[] = [
  {
    id: 'contractor_001',
    name: 'John Smith',
    phone: '+15555551234'
  },
  {
    id: 'contractor_002',
    name: 'Jane Doe',
    phone: '+15555555678'
  }
];

const mockAssets: Asset[] = [
  {
    id: 'asset_001',
    address: '123 Main St',
    city: 'Boston'
  },
  {
    id: 'asset_002',
    address: '456 Oak Ave',
    city: 'Cambridge'
  }
];

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  PropControl Dispatch & Notify Test Suite');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('🧪 Test 1: Dispatch Call (New Assignment)');
  console.log('─────────────────────────────────────────────');
  await handleDispatch('job_001', mockJobs, mockContractors, mockAssets);
  
  console.log('\n\n🧪 Test 2: Notify Call (Status Change to IN_PROGRESS)');
  console.log('─────────────────────────────────────────────');
  await handleNotify('job_002', mockJobs, mockContractors, mockAssets);
  
  console.log('\n\n🧪 Test 3: Error Handling (Job without contractor)');
  console.log('─────────────────────────────────────────────');
  const jobWithoutContractor: Job = {
    id: 'job_003',
    propertyId: 'asset_001',
    issueType: 'Electrical',
    description: 'Light switch not working',
  };
  await handleDispatch('job_003', [...mockJobs, jobWithoutContractor], mockContractors, mockAssets);
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ All Tests Complete!');
  console.log('═══════════════════════════════════════════════');
}

runTests().catch(console.error);
