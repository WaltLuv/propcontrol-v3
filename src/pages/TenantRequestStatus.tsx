/**
 * Tenant Request Status Page
 * 
 * Public page where tenants can track their maintenance request
 * No login required - just need the request ID
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, Clock, Wrench, User, MapPin, 
  Phone, Mail, AlertCircle, Calendar 
} from 'lucide-react';
import { Job, JobStatus } from '../types';

interface StatusStep {
  status: JobStatus;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

const TenantRequestStatus: React.FC<{ jobs: Job[] }> = ({ jobs }) => {
  const { requestId } = useParams<{ requestId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Find the job by ID
    const foundJob = jobs.find(j => j.id === requestId);
    setJob(foundJob || null);
    setLoading(false);
  }, [requestId, jobs]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading request status...</p>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">Request Not Found</h2>
          <p className="text-slate-600 mb-6">
            We couldn't find a maintenance request with ID: <span className="font-mono font-bold">{requestId}</span>
          </p>
          <a 
            href="/maintenance/request"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            Submit New Request
          </a>
        </div>
      </div>
    );
  }
  
  // Build status timeline
  const steps: StatusStep[] = [
    {
      status: JobStatus.REPORTED,
      label: 'Request Received',
      icon: <CheckCircle2 className="w-5 h-5" />,
      completed: true,
      current: job.status === JobStatus.REPORTED
    },
    {
      status: JobStatus.AI_CLASSIFIED,
      label: 'Review & Classification',
      icon: <Wrench className="w-5 h-5" />,
      completed: [JobStatus.AI_CLASSIFIED, JobStatus.CONTRACTOR_ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.PENDING_APPROVAL, JobStatus.COMPLETED].includes(job.status),
      current: job.status === JobStatus.AI_CLASSIFIED
    },
    {
      status: JobStatus.CONTRACTOR_ASSIGNED,
      label: 'Contractor Assigned',
      icon: <User className="w-5 h-5" />,
      completed: [JobStatus.CONTRACTOR_ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.PENDING_APPROVAL, JobStatus.COMPLETED].includes(job.status),
      current: job.status === JobStatus.CONTRACTOR_ASSIGNED
    },
    {
      status: JobStatus.IN_PROGRESS,
      label: 'Work In Progress',
      icon: <Wrench className="w-5 h-5" />,
      completed: [JobStatus.IN_PROGRESS, JobStatus.PENDING_APPROVAL, JobStatus.COMPLETED].includes(job.status),
      current: job.status === JobStatus.IN_PROGRESS
    },
    {
      status: JobStatus.COMPLETED,
      label: 'Completed',
      icon: <CheckCircle2 className="w-5 h-5" />,
      completed: job.status === JobStatus.COMPLETED,
      current: job.status === JobStatus.COMPLETED
    }
  ];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Request Status</h1>
          <p className="text-slate-600 font-mono text-sm">ID: {job.id}</p>
        </div>
        
        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          
          {/* Current Status Badge */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
                job.status === JobStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                job.status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                job.status === JobStatus.CANCELLED ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                <Clock className="w-4 h-4" />
                {job.status.replace(/_/g, ' ')}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-sm font-semibold text-slate-700">{formatDate(job.createdAt)}</p>
            </div>
          </div>
          
          {/* Progress Timeline */}
          <div className="relative mb-8">
            <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ 
                  width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` 
                }}
              />
            </div>
            
            <div className="relative flex justify-between">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: '20%' }}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                    step.completed ? 'bg-indigo-600 text-white shadow-lg' :
                    step.current ? 'bg-indigo-100 text-indigo-600 ring-4 ring-indigo-200' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {step.icon}
                  </div>
                  <p className={`text-xs font-bold text-center ${
                    step.completed || step.current ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Issue Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Issue Type</p>
              <p className="text-lg font-bold text-slate-900">{job.issueType}</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
              <p className="text-lg font-bold text-slate-900">
                {job.status.includes('EMERGENCY') ? '🚨 Emergency' : 'Standard'}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
            <p className="text-slate-700 leading-relaxed">{job.description}</p>
          </div>
          
          {/* Contractor Info (if assigned) */}
          {job.contractorId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-600" />
                <p className="font-black text-indigo-900 uppercase tracking-widest text-xs">Assigned Contractor</p>
              </div>
              <p className="text-lg font-bold text-indigo-900 mb-2">Contractor Name</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Phone className="w-4 h-4" />
                  <span className="font-semibold">(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-700">
                  <Mail className="w-4 h-4" />
                  <span className="font-semibold">contractor@example.com</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Activity Log */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Activity Log</h3>
          
          <div className="space-y-4">
            {job.communicationLog.map((entry, i) => (
              <div key={entry.id} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900">{entry.sender}</p>
                    <p className="text-xs text-slate-500">{formatDate(entry.timestamp)}</p>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{entry.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Help */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            Questions about your request? Contact us at{' '}
            <a href="tel:555-PROPERTY" className="text-indigo-600 font-bold hover:underline">
              (555) PROPERTY
            </a>
            {' or '}
            <a href="mailto:support@propcontrol.com" className="text-indigo-600 font-bold hover:underline">
              support@propcontrol.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantRequestStatus;
