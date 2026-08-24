import React, { useState, useRef } from 'react';
import { UploadCloud, ShieldCheck, Zap, Printer, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Dropzone: React.FC = () => {
  const { setDocument } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid .pdf document.');
      return;
    }

    setErrorMsg(null);
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
      setDocument(data.session_id, data.filename, data.total_pages, data.thumbnails);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading document.');
    } finally {
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-xl p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden ${
          isDragging ? 'scale-[1.02] shadow-xl' : 'hover:border-[var(--accent)]'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
          boxShadow: isDragging ? '0 0 30px var(--accent-glow)' : 'none'
        }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Upload Icon with Accent Background */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200"
          style={{
            backgroundColor: 'var(--accent-muted)',
            color: 'var(--accent)'
          }}>
          <UploadCloud className={`w-8 h-8 ${isUploading ? 'animate-bounce' : ''}`} />
        </div>

        <h2 className="text-xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {isUploading ? 'Analyzing Document Architecture...' : 'Drop your document PDF here'}
        </h2>
        <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {isUploading
            ? 'Rendering high-resolution vector matrices and page ribbons...'
            : 'Supports camera-shot notes, scanned books, and shadow-darkened pages up to 500 pages.'}
        </p>

        <button
          type="button"
          disabled={isUploading}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95"
          style={{ backgroundColor: 'var(--accent)' }}>
          {isUploading ? 'Uploading...' : 'Browse Local Files'}
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
    </div>
  );
};
