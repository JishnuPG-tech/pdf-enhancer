import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ScanSearch, Columns2, RotateCcw, SlidersHorizontal, Loader2, Zap, Download } from 'lucide-react';
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
    isLoupeActive,
    setIsLoupeActive,
    isAdjustOpen,
    toggleAdjust,
    toggleFilmstrip,
    pageRange,
    startBatch,
    isProcessing,
    isComplete,
    taskId
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const splitPosRef = useRef(50);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [loupeVisible, setLoupeVisible] = useState(false);

  // Synchronize CSS variable for split divider
  const updateSplitPosition = useCallback((percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    splitPosRef.current = clamped;
    if (dividerRef.current) {
      dividerRef.current.style.left = `${clamped}%`;
    }
    if (clipLayerRef.current) {
      clipLayerRef.current.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    }
  }, []);

  // Instant abortable preview fetching
  const fetchPreview = useCallback(async (pageIdx: number) => {
    if (!sessionId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingPreview(true);

    try {
      const res = await fetch('api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: sessionId,
          page: pageIdx,
          mode,
          sauvola_k: sauvolaK,
          white_cutoff: whiteCutoff,
          black_cutoff: blackCutoff,
          despeckle,
          margin_percent: marginPercent,
          contrast_thresh: contrastThresh,
          adaptive: adaptiveProfiling,
          word_envelope: wordEnvelope,
          dpi: 100
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
  }, [
    sessionId,
    mode,
    sauvolaK,
    whiteCutoff,
    blackCutoff,
    despeckle,
    marginPercent,
    contrastThresh,
    adaptiveProfiling,
    wordEnvelope,
    setPreviewData,
    setIsLoadingPreview
  ]);

  // Fetch on page change
  useEffect(() => {
    fetchPreview(currentPage);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [currentPage, fetchPreview]);

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
        updateSplitPosition(splitPosRef.current > 50 ? 0 : 100);
      } else if (e.key.toLowerCase() === 'a') {
        toggleAdjust();
      } else if (e.key.toLowerCase() === 't') {
        toggleFilmstrip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, setCurrentPage, updateSplitPosition, toggleAdjust, toggleFilmstrip]);

  // Direct Batch Clean Trigger
  const handleCleanDocument = async () => {
    if (!sessionId || isProcessing) return;

    try {
      const res = await fetch('api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          pages: pageRange || 'all',
          mode,
          sauvola_k: sauvolaK,
          white_cutoff: whiteCutoff,
          black_cutoff: blackCutoff,
          despeckle,
          margin_percent: marginPercent,
          contrast_thresh: contrastThresh,
          adaptive: adaptiveProfiling,
          word_envelope: wordEnvelope,
          dpi: 300
        })
      });

      if (res.ok) {
        const data = await res.json();
        startBatch(data.task_id);
      }
    } catch (e) {
      console.error('Batch start error:', e);
    }
  };

  // Pointer Events: Slider Dragging & 120 FPS Optical Loupe Tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isLoupeActive) {
      isDraggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handlePointerMove(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageBoxRef.current) return;
    const rect = imageBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    if (isDraggingRef.current) {
      const pos = Math.round((x / rect.width) * 100);
      updateSplitPosition(pos);
    }

    // Dynamic 2.5x Optical Magnifier
    if (isLoupeActive && loupeRef.current) {
      const loupeRadius = 90;
      const scale = 2.5;

      loupeRef.current.style.transform = `translate3d(${x - loupeRadius}px, ${y - loupeRadius}px, 0)`;

      const bgW = rect.width * scale;
      const bgH = rect.height * scale;
      const bgX = -(x * scale - loupeRadius);
      const bgY = -(y * scale - loupeRadius);

      loupeRef.current.style.backgroundSize = `${bgW}px ${bgH}px`;
      loupeRef.current.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative select-none"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      
      {/* Main Full-Bleed Document Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="flex-1 flex items-center justify-center px-4 pt-2 pb-16 relative overflow-hidden">
        
        {/* Loading Spinner Ribbon */}
        {isLoadingPreview && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1 rounded-full border shadow-xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--accent)' }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
            <span className="text-[11px] font-semibold text-[var(--text-primary)]">
              Rendering Page {currentPage + 1}...
            </span>
          </div>
        )}

        {previewRaw && previewClean ? (
          <div
            ref={imageBoxRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onMouseEnter={() => setLoupeVisible(true)}
            onMouseLeave={() => {
              isDraggingRef.current = false;
              setLoupeVisible(false);
            }}
            className={`relative max-h-[calc(100vh-8.5rem)] max-w-[calc(100vw-3rem)] rounded-xl shadow-2xl overflow-hidden border touch-none flex items-center justify-center ${
              isLoupeActive ? 'cursor-crosshair' : 'cursor-ew-resize'
            }`}
            style={{ borderColor: 'var(--border)' }}>
            
            {/* Cleaned Document (Bottom Layer) */}
            <img
              src={previewClean}
              alt="Cleaned Document"
              className="max-h-[calc(100vh-8.5rem)] max-w-[calc(100vw-3rem)] w-auto h-auto object-contain block pointer-events-none"
              draggable={false}
            />

            {/* Original Scanned Document (Top Clipped Layer) */}
            <div
              ref={clipLayerRef}
              className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - splitPosRef.current}% 0 0)` }}>
              <img
                src={previewRaw}
                alt="Original Scanned Document"
                className="max-h-[calc(100vh-8.5rem)] max-w-[calc(100vw-3rem)] w-auto h-auto object-contain block"
                draggable={false}
              />
            </div>

            {/* Split Slider Divider */}
            {!isLoupeActive && (
              <div
                ref={dividerRef}
                className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
                style={{
                  left: `${splitPosRef.current}%`,
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent-glow)',
                  willChange: 'left'
                }}>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-2xl cursor-grab active:cursor-grabbing border-2 border-white pointer-events-auto"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 16px var(--accent-glow)'
                  }}>
                  <Columns2 className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Top Corner Badges */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-black/70 text-white/90 backdrop-blur-md border border-white/10 pointer-events-none">
              Original Scan
            </div>
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-mono-hud font-bold tracking-wider uppercase z-10 bg-[var(--accent)] text-white backdrop-blur-md shadow-sm pointer-events-none">
              Lucent (#FFFFFF)
            </div>

            {/* Dynamic 2.5x Optical Magnifier Loupe */}
            {isLoupeActive && (
              <div
                ref={loupeRef}
                className={`absolute top-0 left-0 pointer-events-none z-30 rounded-full border-2 shadow-2xl transition-opacity duration-150 ${
                  loupeVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  width: '180px',
                  height: '180px',
                  backgroundImage: `url(${previewClean})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--accent)',
                  boxShadow: '0 0 25px var(--accent-glow), 0 10px 30px rgba(0,0,0,0.7)',
                  willChange: 'transform, background-position'
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            Loading high-resolution page matrix...
          </div>
        )}
      </div>

      {/* Floating Bottom Control Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-all duration-200 select-none"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
        {/* Page Nav */}
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
            className="px-2.5 py-0.5 rounded-full text-xs font-mono-hud font-bold hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer flex items-center gap-1"
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
          <ScanSearch className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">2.5x Loupe</span>
        </button>

        {/* Reset Split to 50% */}
        <button
          onClick={() => updateSplitPosition(50)}
          className="p-1.5 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors cursor-pointer"
          title="Center Split (Space)">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Adjust Drawer Toggle */}
        <button
          onClick={toggleAdjust}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isAdjustOpen
              ? 'bg-[var(--bg-surface-2)] text-[var(--accent)] border border-[var(--accent)]'
              : 'hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]'
          }`}
          title="Fine-tune parameters (A)">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Adjust</span>
        </button>

        {/* PRIMARY ACTION: Clean Document / Download Clean PDF */}
        {isComplete && taskId ? (
          <a
            href={`api/download/${taskId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
            style={{
              backgroundColor: 'var(--success)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
            }}
            title="Download Clean PDF">
            <Download className="w-3.5 h-3.5" />
            <span>Download Clean PDF</span>
          </a>
        ) : (
          <button
            onClick={handleCleanDocument}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              boxShadow: '0 0 18px var(--accent-glow)'
            }}
            title="Clean all document pages with current settings">
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cleaning...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Clean Document</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Floating Glass Adjust Panel */}
      <AdjustPanel />

      {/* Bottom Horizontal Filmstrip */}
      <Filmstrip />
    </div>
  );
};
