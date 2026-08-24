import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Split, RotateCcw, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DocumentViewer: React.FC = () => {
  const {
    sessionId,
    currentPage,
    totalPages,
    setCurrentPage,
    previewRaw,
    previewClean,
    isLoadingPreview,
    setPreviewData,
    setIsLoadingPreview,
    mode,
    sauvolaK,
    whiteCutoff,
    blackCutoff,
    despeckle,
    marginPercent,
    contrastThresh,
    adaptiveProfiling,
    wordEnvelope,
    dpi,
    sliderPosition,
    setSliderPosition,
    isLoupeActive,
    setIsLoupeActive
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loupeVisible, setLoupeVisible] = useState(false);

  // Fetch page preview from backend
  const fetchPreview = useCallback(async () => {
    if (!sessionId) return;
    setIsLoadingPreview(true);

    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          page: currentPage,
          mode,
          sauvola_k: sauvolaK,
          white_cutoff: whiteCutoff,
          black_cutoff: blackCutoff,
          despeckle,
          margin_percent: marginPercent,
          contrast_thresh: contrastThresh,
          adaptive: adaptiveProfiling,
          word_envelope: wordEnvelope,
          dpi
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data.raw_image, data.clean_image, data.telemetry, data.latency_ms);
      }
    } catch (e) {
      console.error('Preview error:', e);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [
    sessionId,
    currentPage,
    mode,
    sauvolaK,
    whiteCutoff,
    blackCutoff,
    despeckle,
    marginPercent,
    contrastThresh,
    adaptiveProfiling,
    wordEnvelope,
    dpi,
    setPreviewData,
    setIsLoadingPreview
  ]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        if (currentPage > 0) setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setSliderPosition(sliderPosition > 50 ? 0 : 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, setCurrentPage, sliderPosition, setSliderPosition]);

  // Slider Dragging Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setMousePos({ x, y });

    if (isDragging) {
      const pos = Math.round((x / rect.width) * 100);
      setSliderPosition(Math.max(0, Math.min(100, pos)));
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const pos = Math.round((x / rect.width) * 100);
    setSliderPosition(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Top Canvas Toolbar */}
      <div className="h-12 px-6 border-b flex items-center justify-between z-10"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}>
        {/* Page Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg border hover:bg-[var(--bg-surface-2)] disabled:opacity-40 transition-all cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Previous Page (←)">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono-hud font-semibold px-2" style={{ color: 'var(--text-primary)' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg border hover:bg-[var(--bg-surface-2)] disabled:opacity-40 transition-all cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Next Page (→)">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Split indicator */}
          <span className="text-xs font-mono-hud text-[var(--text-secondary)] mr-2">
            Split: {sliderPosition}%
          </span>

          {/* Optical Loupe Toggle */}
          <button
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isLoupeActive
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                : 'hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
            title="Toggle 2.5x Optical Magnifier Loupe">
            <Search className="w-3.5 h-3.5" />
            <span>2.5x Loupe</span>
          </button>

          {/* Reset Split to 50% */}
          <button
            onClick={() => setSliderPosition(50)}
            className="p-1.5 rounded-lg border hover:bg-[var(--bg-surface-2)] transition-all cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title="Reset Split to Center">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseEnter={() => setLoupeVisible(true)}
        onMouseLeave={() => {
          setIsDragging(false);
          setLoupeVisible(false);
        }}
        onTouchMove={handleTouchMove}
        className="flex-1 flex items-center justify-center p-6 relative overflow-hidden select-none cursor-ew-resize">
        
        {isLoadingPreview && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--accent)' }}>
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Restoring Document Ribbon...
              </span>
            </div>
          </div>
        )}

        {previewRaw && previewClean ? (
          <div className="relative max-h-full max-w-full aspect-auto rounded-xl shadow-2xl overflow-hidden border"
            style={{ borderColor: 'var(--border)' }}>
            
            {/* Background Image: Cleaned Output */}
            <img
              src={previewClean}
              alt="Cleaned Document"
              className="max-h-[calc(100vh-10rem)] w-auto object-contain block pointer-events-none"
            />

            {/* Foreground Clipped Image: Original Scanned */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
              <img
                src={previewRaw}
                alt="Original Scanned Document"
                className="max-h-[calc(100vh-10rem)] w-auto object-contain block"
              />
            </div>

            {/* Tactile Split Slider Divider */}
            <div
              className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
              style={{
                left: `${sliderPosition}%`,
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}>
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xl pointer-events-auto cursor-grab active:cursor-grabbing border-2 border-white"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 15px var(--accent-glow)'
                }}>
                <Split className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Badges on Viewer */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-black/70 text-white/90 backdrop-blur-md border border-white/10">
              Original Scanned
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-[var(--accent)] text-white backdrop-blur-md shadow-sm">
              Restored (#FFFFFF)
            </div>

            {/* 2.5x Optical Magnifier Loupe */}
            {isLoupeActive && loupeVisible && (
              <div
                className="absolute pointer-events-none z-30 rounded-full border-2 shadow-2xl overflow-hidden"
                style={{
                  width: '180px',
                  height: '180px',
                  left: `${mousePos.x - 90}px`,
                  top: `${mousePos.y - 90}px`,
                  borderColor: 'var(--accent)',
                  boxShadow: '0 0 25px var(--accent-glow), 0 10px 30px rgba(0,0,0,0.6)'
                }}>
                <div
                  className="w-full h-full relative"
                  style={{
                    transform: 'scale(2.5)',
                    transformOrigin: `${mousePos.x}px ${mousePos.y}px`
                  }}>
                  <img src={previewClean} alt="Loupe Clean" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            Loading high-resolution page matrix...
          </div>
        )}
      </div>
    </div>
  );
};
