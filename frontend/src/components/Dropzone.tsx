import React, { useState, useRef, useEffect } from 'react';
import { FileUp, Cpu, ScanText, Printer, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const LOADING_STEPS = [
  { step: '01', title: 'Decompressing vector page matrices...', subtitle: 'Analyzing high-resolution page geometry' },
  { step: '02', title: 'Profiling optical noise energy (E_noise)...', subtitle: 'Isolating reverse bleed-through artifacts' },
  { step: '03', title: 'Synthesizing word protection envelopes...', subtitle: 'Preserving 100% of text & math characters' },
  { step: '04', title: 'Calibrating 120 FPS interactive viewport...', subtitle: 'Preparing pure-white (#FFFFFF) output' }
];

export const Dropzone: React.FC = () => {
  const { setDocument } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth step advancement
  useEffect(() => {
    if (!isUploading) {
      setCurrentStepIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid .pdf document.');
      return;
    }

    setErrorMsg(null);
    setUploadFileName(file.name);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await response.json();
      
      setTimeout(() => {
        setDocument(data.session_id, data.filename, data.total_pages, data.thumbnails);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading document.');
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const currentStep = LOADING_STEPS[currentStepIdx];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative select-none w-full h-full">
      {!isUploading ? (
        <>
          {/* Main Dropzone Card */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-xl p-10 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl ${
              isDragging ? 'scale-[1.02] shadow-2xl' : 'hover:border-[var(--accent)]'
            }`}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
              boxShadow: isDragging ? '0 0 40px var(--accent-glow)' : '0 10px 30px rgba(0,0,0,0.3)'
            }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Upload Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200"
              style={{
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)'
              }}>
              <FileUp className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold mb-1.5 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Drop your document PDF
            </h2>
            <p className="text-xs max-w-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Erases reverse-side bleed-through dots, shadows, and darkness into pure #FFFFFF laser quality.
            </p>

            <button
              type="button"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--accent)' }}>
              Browse PDF File
            </button>

            {errorMsg && (
              <div
                className="mt-4 px-4 py-2 rounded-lg flex items-center gap-2 text-xs border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)'
                }}>
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-xl w-full">
            <div
              className="p-3 rounded-xl border flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Auto-Tuner</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Dynamic contrast metering</div>
              </div>
            </div>

            <div
              className="p-3 rounded-xl border flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <ScanText className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Word Envelopes</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>100% character protection</div>
              </div>
            </div>

            <div
              className="p-3 rounded-xl border flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Printer className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Laser Print Ready</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Pure #FFFFFF background</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Minimalist, Clean, Uncompressed Orbital Scanner Loading */
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300 max-w-md w-full">
          
          {/* Orbital Radar Sweep Ring */}
          <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 animate-ping opacity-20"
              style={{ borderColor: 'var(--accent)' }}
            />
            
            <div
              className="absolute inset-1 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent)] animate-spin"
              style={{
                animationDuration: '1.2s',
                boxShadow: '0 0 20px var(--accent-glow)'
              }}
            />

            <div
              className="w-18 h-18 rounded-full border flex items-center justify-center shadow-2xl relative z-10"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <FileText className="w-8 h-8 text-[var(--accent)] animate-pulse" />
            </div>

            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent), 0 0 20px var(--accent-glow)'
              }}
            />
          </div>

          {/* Heading & File Name */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)] animate-spin" />
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Restoring Document Matrix
            </h3>
          </div>

          <p className="text-xs font-mono-hud text-[var(--text-secondary)] mb-6 truncate max-w-xs px-3 py-1 rounded-full border bg-black/20"
            style={{ borderColor: 'var(--border)' }}>
            {uploadFileName || 'document.pdf'}
          </p>

          {/* Single Dynamic Live Status Line */}
          <div className="h-14 flex flex-col items-center justify-center mb-6">
            <div className="text-sm font-semibold text-[var(--accent)] flex items-center gap-2 transition-all duration-300">
              <span className="font-mono-hud text-[11px] px-1.5 py-0.5 rounded bg-black/30 text-white/80">
                {currentStep.step}
              </span>
              <span>{currentStep.title}</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1 transition-opacity duration-300">
              {currentStep.subtitle}
            </div>
          </div>

          {/* Sleek Minimalist Laser Progress Bar */}
          <div className="w-64 bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/10 relative">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStepIdx + 1) / LOADING_STEPS.length) * 100}%`,
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent-glow)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
