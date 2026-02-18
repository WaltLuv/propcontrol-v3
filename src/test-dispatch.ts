/**
 * Test script for dispatch and notify functions
 * Verifies that placeActualPhoneCall is called correctly
 */

import { placeActualPhoneCall } from './communicationService';

async function testDispatchFlow() {
  console.log('🧪 Testing Dispatch Flow...\n');
  
  // Simulate dispatch scenario
  const contractorName = 'John Smith';
  const contractorPhone = '+15555551234';
  const issueType = 'HVAC Repair';
  const propertyAddress = '123 Main St, Boston';
  const description = 'Air conditioning unit not cooling properly';
  
  const dispatchScript = `Hello ${contractorName}, this is PropControl dispatch. You have been assigned a new work order for ${issueType} at ${propertyAddress}. Job description: ${description}. Please check your dashboard for full details. Thank you.`;
  
  console.log('📞 Placing dispatch call...');
  console.log(`   To: ${contractorPhone}`);
  console.log(`   Contractor: ${contractorName}`);
  console.log(`   Script: "${dispatchScript}"\n`);
  
  try {
    const result = await placeActualPhoneCall(contractorPhone, contractorName, dispatchScript);
    console.log('✅ Dispatch call result:', result);
    console.log(`   ${result.simulation ? '(Simulated)' : '(Real call placed)'}\n`);
  } catch (error) {
    console.error('❌ Dispatch call failed:', error);
  }
}

async function testNotifyFlow() {
  console.log('🧪 Testing Notify Flow...\n');
  
  // Simulate notify scenario
  const contractorName = 'Jane Doe';
  const contractorPhone = '+15555555678';
  const jobId = 'wo_12345678';
  const issueType = 'Plumbing';
  const propertyAddress = '456 Oak Ave, Cambridge';
  const description = 'Leaking faucet in kitchen';
  
  const notifyScript = `Hello ${contractorName}, this is PropControl. Work order ${jobId.substring(0, 8)} at ${propertyAddress} is now in progress. Status update: ${issueType} - ${description}. Please confirm receipt and estimated completion time.`;
  
  console.log('📞 Placing notification call...');
  console.log(`   To: ${contractorPhone}`);
  console.log(`   Contractor: ${contractorName}`);
  console.log(`   Script: "${notifyScript}"\n`);
  
  try {
    const result = await placeActualPhoneCall(contractorPhone, contractorName, notifyScript);
    console.log('✅ Notification call result:', result);
    console.log(`   ${result.simulation ? '(Simulated)' : '(Real call placed)'}\n`);
  } catch (error) {
    console.error('❌ Notification call failed:', error);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  PropControl Dispatch & Notify Test Suite');
  console.log('═══════════════════════════════════════════════\n');
  
  await testDispatchFlow();
  console.log('─────────────────────────────────────────────\n');
  await testNotifyFlow();
  
  console.log('═══════════════════════════════════════════════');
  console.log('  Tests Complete!');
  console.log('═══════════════════════════════════════════════');
}

runTests().catch(console.error);
