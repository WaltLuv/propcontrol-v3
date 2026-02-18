import React, { useState, useRef } from 'react';
import { Camera, Mic, Upload, CheckCircle, Loader2, Send } from 'lucide-react';

interface InspectionCaptureProps {
  propertyAddress: string;
  onSubmit: (data: {
    photos: string[];
    notes: string;
    voiceNotes?: string;
    pdfFiles?: File[];
  }) => void;
}

export function InspectionCapture({ propertyAddress, onSubmit }: InspectionCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          // Would transcribe audio here - for now just append note
          setNotes(prev => prev + '\n[Voice note recorded]');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPdfFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    setUploading(true);
    
    try {
      await onSubmit({
        photos,
        notes,
        pdfFiles,
      });
      
      // Reset form
      setPhotos([]);
      setNotes('');
      setPdfFiles([]);
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      alert('Failed to submit inspection');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">Quick Inspection</h3>
        <p className="text-sm text-slate-400">{propertyAddress}</p>
      </div>

      {/* Photo Upload */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Take / Upload Photos ({photos.length})
        </button>

        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length > 6 && (
              <div className="aspect-square bg-slate-700 rounded-lg flex items-center justify-center text-white text-sm">
                +{photos.length - 6} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice Notes */}
      <div className="mb-4">
        <button
          onClick={recording ? stopVoiceRecording : startVoiceRecording}
          className={`w-full ${recording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2`}
        >
          <Mic className={`w-5 h-5 ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'Stop Recording' : 'Voice Notes'}
        </button>
      </div>

      {/* PDF Upload */}
      <div className="mb-4">
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handlePdfUpload}
          className="hidden"
        />
        
        <button
          onClick={() => pdfInputRef.current?.click()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Inspection PDFs ({pdfFiles.length})
        </button>

        {pdfFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {pdfFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-700 rounded p-2">
                <span className="text-sm text-white truncate">{file.name}</span>
                <button
                  onClick={() => setPdfFiles(pdfFiles.filter((_, i) => i !== idx))}
                  className="bg-red-600 text-white w-6 h-6 rounded text-xs ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Text Notes */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Inspection Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
          rows={6}
          placeholder="Describe issues found, work needed, etc..."
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={uploading || (photos.length === 0 && !notes.trim() && pdfFiles.length === 0)}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Work Order...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit to Property Meld
          </>
        )}
      </button>
    </div>
  );
}
