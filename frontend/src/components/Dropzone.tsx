import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, Zap, Printer, AlertCircle, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const LOADING_STAGES = [
  { step: '01', title: 'Parsing document vector matrix...', detail: 'Extracting high-resolution page ribbons' },
  { step: '02', title: 'Profiling optical noise energy (E_noise)...', detail: 'Detecting reverse-side bleed-through dots' },
  { step: '03', title: 'Synthesizing word envelopes...', detail: 'Protecting characters, math symbols & i-dots' },
  { step: '04', title: 'Rendering pure #FFFFFF canvas...', detail: 'Preparing 120 FPS interactive viewport' }
];

export const Dropzone: React.FC = () => {
  const { setDocument } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle through loading stage animation while uploading
  useEffect(() => {
    if (!isUploading) {
      setCurrentStageIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
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
      
      // Allow the final stage of the animation to complete gracefully
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative select-none">
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
              boxShadow: isDragging ? '0 0 35px var(--accent-glow)' : '0 10px 30px rgba(0,0,0,0.3)'
            }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Upload Icon with Accent Glow */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200"
              style={{
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)'
              }}>
              <UploadCloud className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Drop your document PDF
            </h2>
            <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Erases reverse-side bleed-through dots, shadows, and darkness into pure #FFFFFF laser quality.
            </p>

            <button
              type="button"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--accent)' }}>
              Browse PDF File
            </button>

            {errorMsg && (
              <div
                className="mt-5 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs border"
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

          {/* Feature Badges Under Dropzone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-xl w-full">
            <div
              className="p-3.5 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Auto-Tuner</div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Dynamic contrast metering</div>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Word Envelopes</div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>100% character protection</div>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Laser Print Ready</div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Pure #FFFFFF background</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Cinematic High-Tech Ingestion & Scanning Animation */
        <div
          className="w-full max-w-lg p-8 rounded-3xl border shadow-2xl flex flex-col items-center text-center relative overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-200"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--accent)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px var(--accent-glow)'
          }}>
          
          {/* Animated Holographic Document with Laser Scan */}
          <div className="w-36 h-48 rounded-2xl border relative overflow-hidden mb-6 flex flex-col items-center justify-center p-3 shadow-inner"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)'
            }}>
            {/* Simulated text lines */}
            <div className="w-full space-y-2 opacity-30">
              <div className="h-2 w-3/4 bg-white/40 rounded-full" />
              <div className="h-2 w-full bg-white/40 rounded-full" />
              <div className="h-2 w-5/6 bg-white/40 rounded-full" />
              <div className="h-2 w-2/3 bg-white/40 rounded-full" />
              <div className="h-2 w-4/5 bg-white/40 rounded-full" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <FileText className="w-10 h-10 text-[var(--accent)] opacity-80" />
            </div>

            {/* Glowing Orange Laser Sweep Line */}
            <div
              className="absolute left-0 right-0 h-1 z-20 animate-laser"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 15px var(--accent), 0 0 30px var(--accent-glow)'
              }}
            />
          </div>

          {/* Filename & Heading */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[var(--accent)] animate-spin" />
            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Restoring Document Matrix
            </h3>
          </div>
          <p className="text-xs font-mono-hud text-[var(--text-secondary)] mb-6 truncate max-w-xs">
            {uploadFileName || 'Processing document...'}
          </p>

          {/* Step-by-Step Telemetry Feed */}
          <div className="w-full space-y-2.5 mb-6 text-left">
            {LOADING_STAGES.map((stage, idx) => {
              const isDone = currentStageIdx > idx;
              const isCurrent = currentStageIdx === idx;

              return (
                <div
                  key={stage.step}
                  className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)] shadow-sm'
                      : isDone
                      ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                      : 'border-[var(--border)] opacity-30'
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-hud text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 text-[var(--text-secondary)]">
                      {stage.step}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {stage.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {stage.detail}
                      </div>
                    </div>
                  </div>

                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping flex-shrink-0" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStageIdx + 1) / LOADING_STAGES.length) * 100}%`,
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
