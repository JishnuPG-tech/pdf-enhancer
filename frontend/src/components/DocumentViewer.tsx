import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Split, RotateCcw, Sliders, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AdjustPanel } from './AdjustPanel';
import { Filmstrip } from './Filmstrip';

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
    setIsLoupeActive,
    isAdjustOpen,
    toggleAdjust,
    toggleFilmstrip
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const loupeImgRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const [loupeVisible, setLoupeVisible] = useState(false);

  // Debounced, abortable preview fetching
  const fetchPreview = useCallback(() => {
    if (!sessionId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingPreview(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Preview error:', e);
        }
      } finally {
        setIsLoadingPreview(false);
      }
    }, 60);
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
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchPreview]);

  // Global Keyboard Shortcuts
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
      } else if (e.key.toLowerCase() === 'a') {
        toggleAdjust();
      } else if (e.key.toLowerCase() === 't') {
        toggleFilmstrip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, setCurrentPage, sliderPosition, setSliderPosition, toggleAdjust, toggleFilmstrip]);

  // 120 FPS Direct DOM transforms for cursor tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    if (isDraggingRef.current) {
      const pos = Math.round((x / rect.width) * 100);
      setSliderPosition(Math.max(0, Math.min(100, pos)));
    }

    if (isLoupeActive && loupeRef.current) {
      loupeRef.current.style.transform = `translate3d(${x - 90}px, ${y - 90}px, 0)`;
      if (loupeImgRef.current) {
        loupeImgRef.current.style.transformOrigin = `${x}px ${y}px`;
      }
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
    <div className="flex-1 flex flex-col h-[calc(100vh-3rem)] overflow-hidden relative"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      
      {/* Full-Bleed Document Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={() => { isDraggingRef.current = true; }}
        onMouseUp={() => { isDraggingRef.current = false; }}
        onMouseEnter={() => setLoupeVisible(true)}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          setLoupeVisible(false);
        }}
        onTouchMove={handleTouchMove}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none cursor-ew-resize">
        
        {isLoadingPreview && !previewClean && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--accent)' }}>
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Restoring Page Optical Ribbon...
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
              className="max-h-[calc(100vh-7rem)] w-auto object-contain block pointer-events-none"
            />

            {/* Foreground Clipped Image: Original Scanned */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
              <img
                src={previewRaw}
                alt="Original Scanned Document"
                className="max-h-[calc(100vh-7rem)] w-auto object-contain block"
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

            {/* Subtle Overlay Corner Badges */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-black/60 text-white/80 backdrop-blur-md border border-white/10">
              Original Scan
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-[var(--accent)] text-white backdrop-blur-md shadow-sm">
              Lucent (#FFFFFF)
            </div>

            {/* 2.5x Optical Magnifier Loupe */}
            {isLoupeActive && (
              <div
                ref={loupeRef}
                className={`absolute top-0 left-0 pointer-events-none z-30 rounded-full border-2 shadow-2xl overflow-hidden transition-opacity duration-150 ${
                  loupeVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  width: '180px',
                  height: '180px',
                  borderColor: 'var(--accent)',
                  boxShadow: '0 0 25px var(--accent-glow), 0 10px 30px rgba(0,0,0,0.6)',
                  willChange: 'transform'
                }}>
                <div className="w-full h-full relative" style={{ transform: 'scale(2.5)' }}>
                  <img
                    ref={loupeImgRef}
                    src={previewClean}
                    alt="Loupe Clean"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
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

      {/* Floating Bottom Control Pill (Auto-Center, Minimalist Glass) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-all duration-200 select-none"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
        {/* Page Nav Cluster */}
        <div className="flex items-center gap-1 px-1">
          <button
            onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-1 rounded-full hover:bg-[var(--bg-surface-2)] disabled:opacity-30 transition-colors cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            title="Previous Page (←)">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={toggleFilmstrip}
            className="px-2.5 py-1 rounded-full text-xs font-mono-hud font-bold hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer flex items-center gap-1"
            style={{ color: 'var(--text-primary)' }}
            title="Open Page Filmstrip (T)">
            <span>{currentPage + 1}</span>
            <span className="text-[var(--text-secondary)] font-normal">/</span>
            <span className="text-[var(--text-secondary)]">{totalPages}</span>
          </button>

          <button
            onClick={() => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-1 rounded-full hover:bg-[var(--bg-surface-2)] disabled:opacity-30 transition-colors cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            title="Next Page (→)">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Loupe Toggle */}
        <button
          onClick={() => setIsLoupeActive(!isLoupeActive)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            isLoupeActive
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]'
          }`}
          title="Toggle 2.5x Optical Loupe Magnifier">
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline">Loupe</span>
        </button>

        {/* Reset Split */}
        <button
          onClick={() => setSliderPosition(50)}
          className="p-1.5 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors cursor-pointer"
          title="Center Split (Space)">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Adjust Drawer Toggle */}
        <button
          onClick={toggleAdjust}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            isAdjustOpen
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
          }`}
          title="Adjust Restoration Parameters (A)">
          <Sliders className="w-3.5 h-3.5" />
          <span>Adjust</span>
        </button>
      </div>

      {/* Floating Glass Adjust Panel */}
      <AdjustPanel />

      {/* Bottom Horizontal Filmstrip */}
      <Filmstrip />
    </div>
  );
};
