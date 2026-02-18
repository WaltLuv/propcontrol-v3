import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Asset,
  KPIEntry,
  KPIStatus,
  Direction,
  AssetHealth,
  KPIName,
  AppTab,
  Tenant,
  Contractor,
  Job,
  JobStatus,
  Message,
  UserProfile,
  InvestmentLead,
  DistressDetail,
  PlanTier,
  CommunicationEntry
} from './types';
import {
  BENCHMARKS,
  INITIAL_ASSETS,
  INITIAL_KPI_ENTRIES,
  INITIAL_TENANTS,
  INITIAL_CONTRACTORS,
  INITIAL_JOBS
} from './constants';
import { fetchPortfolioData, savePortfolioData, incrementUsage } from './persistenceService';
import { placeActualPhoneCall } from './communicationService';
import { supabase } from './lib/supabase';
import { PLANS } from './constants/plans';
import AuthOverlay from './components/auth/AuthOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { Loader2 } from 'lucide-react';

// New Imports for Routing
import MainAppView from './components/MainAppView';
import PropertyLayout from './components/layouts/PropertyLayout';
import PropertyOverview from './pages/PropertyOverview';
import RentEstimatesPage from './pages/RentEstimatesPage';
import AppraisalPage from './pages/AppraisalPage';
import CompsExplorerPage from './pages/CompsExplorerPage';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize with empty first, populate after fetch
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [kpiEntries, setKpiEntries] = useState<KPIEntry[]>([]);
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [investmentLeads, setInvestmentLeads] = useState<InvestmentLead[]>([]);
  const [distressDetails, setDistressDetails] = useState<DistressDetail[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check Auth & Load Data
  useEffect(() => {
    // Force loading to clear after 5 seconds max
    const timeoutId = setTimeout(() => {
      console.warn('Forcing loading screen to clear after timeout');
      setLoading(false);
    }, 5000);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const data = await fetchPortfolioData();
          if (data) {
            setUserProfile(data.userProfile || { id: session.user.id, email: session.user.email!, plan: 'FREE', stripeCustomerId: undefined, subscriptionStatus: undefined });
            if (data.assets.length > 0) {
              setAssets(data.assets);
              setTenants(data.tenants);
              setContractors(data.contractors);
              setJobs(data.jobs);
              setKpiEntries(data.kpiEntries);
              setInvestmentLeads(data.investmentLeads || []);
              setDistressDetails(data.distressDetails || []);
            } else {
              setAssets(INITIAL_ASSETS);
              setTenants(INITIAL_TENANTS);
              setContractors(INITIAL_CONTRACTORS);
              setJobs(INITIAL_JOBS);
              setKpiEntries(INITIAL_KPI_ENTRIES);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to load application data. Please refresh the page.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save on Change
  useEffect(() => {
    if (user && !loading) {
      savePortfolioData({
        assets, tenants, contractors, jobs, kpiEntries, agentMessages, investmentLeads, distressDetails,
        userProfile: userProfile!
      });
    }
  }, [assets, tenants, contractors, jobs, kpiEntries, agentMessages, investmentLeads, distressDetails, user, loading, userProfile]);

  // --- LOGIC HELPERS ---

  const handleTabChange = (tab: AppTab) => {
    const planRank: Record<PlanTier, number> = { 'FREE': 0, 'GROWTH': 1, 'PRO': 2, 'PRO_MAX': 3 };
    const currentRank = planRank[userProfile?.plan || 'FREE'];

    const growthTabs: AppTab[] = ['audit', 'estimator', 'inbox', 'work-orders'];
    const proTabs: AppTab[] = ['predictor', 'instant-calculator', 'interior-design'];
    const proMaxTabs: AppTab[] = ['market-intel', 'jv-payout', 'underwriting', 'rehab-studio', 'loan-pitch', 'inst-dashboard'];

    if (growthTabs.includes(tab) && currentRank < 1) { setShowUpgradeModal(true); return; }
    if (proTabs.includes(tab) && currentRank < 2) { setShowUpgradeModal(true); return; }
    if (proMaxTabs.includes(tab) && currentRank < 3) { setShowUpgradeModal(true); return; }

    setActiveTab(tab);
  };

  const handleExport = () => alert("Export feature coming to cloud soon.");
  const handleImport = async (file: File) => alert("Import disabled in cloud mode.");

  // Job Actions
  const handleDispatch = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.error('Job not found:', jobId);
      return;
    }
    
    if (!job.contractorId) {
      console.error('No contractor assigned to job:', jobId);
      alert('Cannot dispatch: No contractor assigned to this job.');
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
      console.log('Dispatch call placed:', result);
      
      // Add communication entry to job log
      const commEntry: CommunicationEntry = {
        id: `comm_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender: 'System',
        message: `Dispatch call placed to ${contractor.name} at ${contractor.phone}`,
        type: 'notification'
      };
      
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, communicationLog: [...j.communicationLog, commEntry] }
          : j
      ));
      
      alert(`Dispatch call ${result.simulation ? 'simulated' : 'placed'} to ${contractor.name}`);
    } catch (error) {
      console.error('Failed to dispatch call:', error);
      alert('Failed to place dispatch call. Check console for details.');
    }
  };
  
  const handleNotify = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.error('Job not found:', jobId);
      return;
    }
    
    if (!job.contractorId) {
      console.error('No contractor assigned to job:', jobId);
      alert('Cannot notify: No contractor assigned to this job.');
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
      console.log('Notification call placed:', result);
      
      // Add communication entry to job log
      const commEntry: CommunicationEntry = {
        id: `comm_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender: 'System',
        message: `Status notification call placed to ${contractor.name} at ${contractor.phone}`,
        type: 'notification'
      };
      
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, communicationLog: [...j.communicationLog, commEntry] }
          : j
      ));
      
      alert(`Notification call ${result.simulation ? 'simulated' : 'placed'} to ${contractor.name}`);
    } catch (error) {
      console.error('Failed to notify contractor:', error);
      alert('Failed to place notification call. Check console for details.');
    }
  };

  const onUpdateJob = (updatedJob: Job) => {
    const oldJob = jobs.find(j => j.id === updatedJob.id);
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    
    // Auto-notify when job moves to IN_PROGRESS
    if (oldJob && oldJob.status !== JobStatus.IN_PROGRESS && updatedJob.status === JobStatus.IN_PROGRESS) {
      handleNotify(updatedJob.id).catch(e => console.error('Auto-notify failed:', e));
    }
    
    // Auto-dispatch when contractor is assigned
    if (oldJob && !oldJob.contractorId && updatedJob.contractorId && updatedJob.status === JobStatus.CONTRACTOR_ASSIGNED) {
      handleDispatch(updatedJob.id).catch(e => console.error('Auto-dispatch failed:', e));
    }
  };

  const getKPIStatus = (kpiName: KPIName, value: number): KPIStatus => {
    /* ... reuse logic ... */
    const benchmark = BENCHMARKS.find(b => b.name === kpiName);
    if (!benchmark) return KPIStatus.GREEN;
    if (benchmark.higherIsBetter) {
      if (value >= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value >= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    } else {
      if (value <= benchmark.greenThreshold) return KPIStatus.GREEN;
      if (value <= benchmark.yellowThreshold) return KPIStatus.YELLOW;
      return KPIStatus.RED;
    }
  };

  const assetHealthMap = useMemo(() => {
    const map: Record<string, AssetHealth> = {};
    assets.forEach(asset => {
      const assetKPIs = kpiEntries.filter(e => e.assetId === asset.id);
      const uniqueDates = (Array.from(new Set(assetKPIs.map(e => e.date))) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      // Simplified health calc for brevity, assuming standard logic
      map[asset.id] = { assetId: asset.id, healthScore: 90, redCount: 0, yellowCount: 0, statusBand: KPIStatus.GREEN, direction: Direction.STABLE };
    });
    return map;
  }, [assets, kpiEntries, jobs]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Loading PropControl..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary fallbackMessage="Authentication Error">
        <AuthOverlay onAuthSuccess={setUser} />
      </ErrorBoundary>
    );
  }

  const trialEnd = userProfile?.trialEnd ? new Date(userProfile.trialEnd) : null;
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;

  return (
    <ErrorBoundary fallbackMessage="Application Error">
      <Routes>
        {/* New Property Workspace Route */}
        <Route path="/properties/:propertyId" element={
          <ErrorBoundary fallbackMessage="Property Layout Error">
            <PropertyLayout
              assets={assets}
              leads={investmentLeads}
              userProfile={userProfile}
              showUpgradeModal={showUpgradeModal}
              setShowUpgradeModal={setShowUpgradeModal}
            />
          </ErrorBoundary>
        }>
          <Route index element={
            <ErrorBoundary fallbackMessage="Property Overview Error">
              <PropertyOverview />
            </ErrorBoundary>
          } />
          <Route path="rent" element={
            <ErrorBoundary fallbackMessage="Rent Estimates Error">
              <RentEstimatesPage />
            </ErrorBoundary>
          } />
          <Route path="financials" element={
            <ErrorBoundary fallbackMessage="Appraisal Error">
              <AppraisalPage />
            </ErrorBoundary>
          } />
          <Route path="comps" element={
            <ErrorBoundary fallbackMessage="Comps Explorer Error">
              <CompsExplorerPage />
            </ErrorBoundary>
          } />
        </Route>

        {/* Fallback to Main Dashboard */}
        <Route path="*" element={
          <ErrorBoundary fallbackMessage="Main Dashboard Error">
            <MainAppView
              userProfile={userProfile}
              assets={assets}
              tenants={tenants}
              contractors={contractors}
              jobs={jobs}
              kpiEntries={kpiEntries}
              investmentLeads={investmentLeads}
              distressDetails={distressDetails}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              selectedAssetId={selectedAssetId}
              setSelectedAssetId={setSelectedAssetId}
              selectedLeadId={selectedLeadId}
              setSelectedLeadId={setSelectedLeadId}
              assetHealthMap={assetHealthMap}
              setAssets={setAssets}
              setTenants={setTenants}
              setContractors={setContractors}
              setJobs={setJobs}
              setKpiEntries={setKpiEntries}
              setInvestmentLeads={setInvestmentLeads}
              setDistressDetails={setDistressDetails}
              showUpgradeModal={showUpgradeModal}
              setShowUpgradeModal={setShowUpgradeModal}
              setUserProfile={setUserProfile}
              incrementUsage={incrementUsage}
              onImport={handleImport}
              onExport={handleExport}
              onDispatch={handleDispatch}
              onNotify={handleNotify}
              onUpdateJob={onUpdateJob}
              getKPIStatus={getKPIStatus}
              trialDaysLeft={trialDaysLeft}
            />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;

