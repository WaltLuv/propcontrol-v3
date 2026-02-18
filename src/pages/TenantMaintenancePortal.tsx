/**
 * Tenant Maintenance Portal
 * 
 * Public page where tenants can:
 * - Submit maintenance requests (no login required)
 * - Upload photos
 * - Check status of existing requests
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wrench, Upload, Send, CheckCircle2, AlertCircle, 
  Loader2, Camera, X, Clock, MapPin 
} from 'lucide-react';
import { Job, JobStatus, Asset } from '../types';
import { classifyTenantMessage } from '../geminiService';
import { automateMaintenanceRequest } from '../services/vendorAssignmentService';
import { notifyRequestCreated, notifyContractorAssigned } from '../services/maintenanceNotificationService';

interface TenantMaintenancePortalProps {
  assets: Asset[];
  onSubmitRequest: (request: Partial<Job>) => void;
}

const TenantMaintenancePortal: React.FC<TenantMaintenancePortalProps> = ({ 
  assets,
  onSubmitRequest 
}) => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property') || '';
  const unit = searchParams.get('unit') || '';
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState(unit);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Load property if provided in URL
  useEffect(() => {
    if (propertyId) {
      const asset = assets.find(a => a.id === propertyId);
      if (asset) setSelectedAsset(asset);
    }
  }, [propertyId, assets]);
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }
    
    setPhotos([...photos, ...files]);
    
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAsset || !description || !tenantName || !tenantEmail) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Step 1: AI classification
      const aiAnalysis = await classifyTenantMessage(description);
      
      // Step 2: Create job
      const newJob: Partial<Job> = {
        id: `req-${Date.now()}`,
        propertyId: selectedAsset.id,
        tenantId: `temp-${Date.now()}`, // Temporary tenant ID
        issueType: aiAnalysis.category,
        description,
        status: JobStatus.REPORTED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        communicationLog: [
          {
            id: `init-${Date.now()}`,
            timestamp: new Date().toISOString(),
            sender: 'System',
            message: `Maintenance request submitted by ${tenantName} via tenant portal. AI classified as: ${aiAnalysis.category} (${aiAnalysis.priority} priority)`,
            type: 'status_change'
          }
        ]
      };
      
      // Step 3: Submit to PropControl
      onSubmitRequest(newJob);
      
      // Step 4: Show success
      setRequestId(newJob.id || '');
      setSubmitted(true);
      
      // TODO: Upload photos to Supabase Storage
      // TODO: Send confirmation notifications
      
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again or call the office.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitted && requestId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-4">Request Submitted!</h2>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            We've received your maintenance request and are reviewing it now. 
            You'll receive an email confirmation shortly.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Request ID</p>
            <p className="text-2xl font-bold text-indigo-600 font-mono">{requestId}</p>
            <p className="text-sm text-slate-500 mt-2">Save this ID to check your request status</p>
          </div>
          
          <div className="space-y-3">
            <a 
              href={`/maintenance/status/${requestId}`}
              className="block w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition"
            >
              Track Request Status
            </a>
            
            <button
              onClick={() => {
                setSubmitted(false);
                setRequestId(null);
                setDescription('');
                setPhotos([]);
                setPhotoPreviews([]);
              }}
              className="block w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-full mb-6">
            <Wrench className="w-6 h-6" />
            <span className="font-black uppercase tracking-widest text-sm">Maintenance Request</span>
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 mb-4">
            Submit a Maintenance Request
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Report an issue at your property and we'll assign a contractor right away.
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          
          {/* Property Selection */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Property Address *
            </label>
            <select
              value={selectedAsset?.id || ''}
              onChange={(e) => setSelectedAsset(assets.find(a => a.id === e.target.value) || null)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select your property...</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} - {asset.address}, {asset.city}
                </option>
              ))}
            </select>
          </div>
          
          {/* Contact Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Unit Number
              </label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="Apt 2B"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Email *
              </label>
              <input
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                required
                placeholder="john@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                required
                placeholder="(555) 123-4567"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          {/* Urgency Level */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              How Urgent? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  className={`py-4 px-4 rounded-xl font-bold text-sm uppercase tracking-wide transition ${
                    urgency === level
                      ? level === 'EMERGENCY' 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level === 'EMERGENCY' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          {/* Issue Description */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Describe the Issue *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              placeholder="Example: The kitchen sink is leaking underneath and there's water on the floor. It started yesterday evening..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">Be as detailed as possible - this helps us respond faster!</p>
          </div>
          
          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Photos (Optional, up to 5)
            </label>
            
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {photoPreviews.map((preview, i) => (
                  <div key={i} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Upload ${i + 1}`} 
                      className="w-full h-32 object-cover rounded-xl border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {photos.length < 5 && (
              <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-bold text-slate-700">Click to upload photos</p>
                <p className="text-sm text-slate-500 mt-1">JPG, PNG up to 10MB each</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition shadow-lg ${
              isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                Submit Request
              </>
            )}
          </button>
        </form>
        
        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            <strong>Need immediate help?</strong> For emergencies (gas leaks, flooding, no heat), call us directly at{' '}
            <a href="tel:555-PROPERTY" className="text-indigo-600 font-bold hover:underline">
              (555) PROPERTY
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantMaintenancePortal;
