/**
 * Vendor Assignment Service
 * 
 * Automatically matches maintenance requests to contractors based on:
 * - Issue category
 * - Contractor specialty
 * - Urgency level
 * - Availability
 * - Pricing rules
 */

import { Contractor, Job } from '../types';

export interface VendorRule {
  category: string;
  keywords: string[];
  defaultContractorId?: string;
  emergencyContractorId?: string;
  estimatedCost: {
    min: number;
    max: number;
  };
  markup: number; // percentage (e.g., 15 = 15%)
}

export interface AssignmentResult {
  contractorId: string;
  contractor: Contractor;
  estimatedCost: number;
  markup: number;
  finalQuote: number;
  confidence: number; // 0-100
  reasoning: string;
}

export interface TriageResult {
  category: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  keywords: string[];
  isEmergency: boolean;
  requiresOwnerApproval: boolean;
}

// Default vendor assignment rules
const DEFAULT_VENDOR_RULES: VendorRule[] = [
  {
    category: 'Plumbing',
    keywords: ['leak', 'water', 'pipe', 'drain', 'clog', 'toilet', 'sink', 'faucet', 'shower'],
    estimatedCost: { min: 150, max: 800 },
    markup: 15
  },
  {
    category: 'HVAC',
    keywords: ['heat', 'ac', 'air conditioning', 'furnace', 'thermostat', 'hvac', 'cooling', 'cold'],
    estimatedCost: { min: 200, max: 1500 },
    markup: 15
  },
  {
    category: 'Electrical',
    keywords: ['electric', 'outlet', 'light', 'power', 'breaker', 'wiring', 'switch'],
    estimatedCost: { min: 100, max: 600 },
    markup: 15
  },
  {
    category: 'Appliance',
    keywords: ['refrigerator', 'stove', 'oven', 'dishwasher', 'washer', 'dryer', 'microwave'],
    estimatedCost: { min: 100, max: 500 },
    markup: 12
  },
  {
    category: 'General Maintenance',
    keywords: ['door', 'window', 'lock', 'paint', 'wall', 'floor', 'ceiling', 'drywall'],
    estimatedCost: { min: 75, max: 400 },
    markup: 18
  },
  {
    category: 'Pest Control',
    keywords: ['pest', 'bug', 'rodent', 'mouse', 'rat', 'roach', 'ant', 'insect'],
    estimatedCost: { min: 100, max: 300 },
    markup: 10
  },
  {
    category: 'Locksmith',
    keywords: ['locked out', 'key', 'lock broken', 'locksmith', 'can\'t get in'],
    estimatedCost: { min: 75, max: 200 },
    markup: 20
  }
];

// Emergency keywords that trigger immediate assignment
const EMERGENCY_KEYWORDS = [
  'emergency',
  'flooding',
  'gas leak',
  'no heat',
  'no hot water',
  'major leak',
  'electrical fire',
  'sparking',
  'smoke',
  'sewage backup'
];

// Owner approval thresholds
const OWNER_APPROVAL_THRESHOLD = 1000; // Anything over $1k needs owner approval

/**
 * Triage a maintenance request and determine urgency + category
 */
export function triageRequest(description: string, aiCategory?: string): TriageResult {
  const lowerDesc = description.toLowerCase();
  
  // Check for emergency keywords
  const isEmergency = EMERGENCY_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
  
  // Determine urgency level
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' = 'MEDIUM';
  
  if (isEmergency) {
    urgencyLevel = 'EMERGENCY';
  } else if (lowerDesc.includes('urgent') || lowerDesc.includes('asap')) {
    urgencyLevel = 'HIGH';
  } else if (lowerDesc.includes('when you can') || lowerDesc.includes('not urgent')) {
    urgencyLevel = 'LOW';
  }
  
  // Determine category (use AI category if provided, otherwise match keywords)
  let category = aiCategory || 'General Maintenance';
  const matchedKeywords: string[] = [];
  
  if (!aiCategory) {
    for (const rule of DEFAULT_VENDOR_RULES) {
      const matches = rule.keywords.filter(kw => lowerDesc.includes(kw));
      if (matches.length > 0) {
        category = rule.category;
        matchedKeywords.push(...matches);
        break;
      }
    }
  }
  
  // Determine if owner approval is needed (we'll check cost later)
  const requiresOwnerApproval = false; // Will be set based on quote
  
  return {
    category,
    urgencyLevel,
    keywords: matchedKeywords,
    isEmergency,
    requiresOwnerApproval
  };
}

/**
 * Find the best contractor for a job based on category and urgency
 */
export function assignContractor(
  triage: TriageResult,
  contractors: Contractor[],
  existingJobs: Job[]
): AssignmentResult | null {
  
  // Get vendor rule for this category
  const rule = DEFAULT_VENDOR_RULES.find(r => r.category === triage.category);
  if (!rule) {
    console.warn(`No vendor rule found for category: ${triage.category}`);
    return null;
  }
  
  // Filter contractors by specialty (match category)
  const eligibleContractors = contractors.filter(c => 
    c.status === 'AVAILABLE' && 
    c.specialty.some(s => s.toLowerCase().includes(triage.category.toLowerCase()))
  );
  
  if (eligibleContractors.length === 0) {
    console.warn(`No available contractors for category: ${triage.category}`);
    return null;
  }
  
  // Sort by rating (highest first) and workload (fewest jobs first)
  const contractorScores = eligibleContractors.map(contractor => {
    const activeJobs = existingJobs.filter(j => 
      j.contractorId === contractor.id && 
      ['REPORTED', 'AI_CLASSIFIED', 'CONTRACTOR_ASSIGNED', 'IN_PROGRESS'].includes(j.status)
    ).length;
    
    // Score = (rating * 20) - (active jobs * 5)
    const score = (contractor.rating * 20) - (activeJobs * 5);
    
    return { contractor, score, activeJobs };
  });
  
  // Sort by score descending
  contractorScores.sort((a, b) => b.score - a.score);
  
  // Pick the best contractor
  const bestMatch = contractorScores[0];
  
  // Calculate estimated cost based on urgency
  let baseCost = (rule.estimatedCost.min + rule.estimatedCost.max) / 2;
  
  // Emergency = higher end of estimate
  if (triage.urgencyLevel === 'EMERGENCY') {
    baseCost = rule.estimatedCost.max * 1.25; // 25% emergency premium
  } else if (triage.urgencyLevel === 'HIGH') {
    baseCost = rule.estimatedCost.max * 1.1;
  }
  
  // Apply markup
  const markupMultiplier = 1 + (rule.markup / 100);
  const finalQuote = Math.round(baseCost * markupMultiplier);
  
  // Calculate confidence (0-100)
  const confidence = Math.min(100, Math.round(
    (bestMatch.contractor.rating / 5 * 50) + // Rating contributes 50%
    (eligibleContractors.length > 2 ? 30 : 15) + // More options = higher confidence
    (bestMatch.activeJobs < 3 ? 20 : 10) // Low workload = higher confidence
  ));
  
  return {
    contractorId: bestMatch.contractor.id,
    contractor: bestMatch.contractor,
    estimatedCost: Math.round(baseCost),
    markup: rule.markup,
    finalQuote,
    confidence,
    reasoning: `Selected ${bestMatch.contractor.name} (rating: ${bestMatch.contractor.rating.toFixed(1)}, active jobs: ${bestMatch.activeJobs}) for ${triage.category} work. Estimated cost: $${Math.round(baseCost)}, markup: ${rule.markup}%, final quote: $${finalQuote}.`
  };
}

/**
 * Complete automation flow: triage + assign + generate quote
 */
export function automateMaintenanceRequest(
  description: string,
  aiCategory: string | undefined,
  contractors: Contractor[],
  existingJobs: Job[]
): {
  triage: TriageResult;
  assignment: AssignmentResult | null;
  requiresOwnerApproval: boolean;
  autoAssignable: boolean;
} {
  
  // Step 1: Triage
  const triage = triageRequest(description, aiCategory);
  
  // Step 2: Assign contractor
  const assignment = assignContractor(triage, contractors, existingJobs);
  
  // Step 3: Determine if owner approval needed
  const requiresOwnerApproval = assignment 
    ? assignment.finalQuote > OWNER_APPROVAL_THRESHOLD 
    : false;
  
  // Step 4: Determine if auto-assignable
  // Auto-assign if:
  // - Emergency (always auto-assign)
  // - Under owner approval threshold
  // - Contractor found with good confidence
  const autoAssignable = 
    triage.isEmergency || 
    (!requiresOwnerApproval && assignment !== null && assignment.confidence >= 60);
  
  return {
    triage,
    assignment,
    requiresOwnerApproval,
    autoAssignable
  };
}

/**
 * Get vendor rules (can be customized per property manager later)
 */
export function getVendorRules(): VendorRule[] {
  return DEFAULT_VENDOR_RULES;
}

/**
 * Add or update a vendor rule
 */
export function updateVendorRule(rule: VendorRule): void {
  const index = DEFAULT_VENDOR_RULES.findIndex(r => r.category === rule.category);
  if (index >= 0) {
    DEFAULT_VENDOR_RULES[index] = rule;
  } else {
    DEFAULT_VENDOR_RULES.push(rule);
  }
}
