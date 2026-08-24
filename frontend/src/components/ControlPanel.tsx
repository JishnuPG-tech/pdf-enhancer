import React, { useState } from 'react';
import { Sliders, Sparkles, Shield, Layers, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { CleaningMode } from '../store/useAppStore';
import { TelemetryHUD } from './TelemetryHUD';

export const ControlPanel: React.FC = () => {
  const {
    mode,
    setMode,
    sauvolaK,
    setSauvolaK,
    contrastThresh,
    setContrastThresh,
    adaptiveProfiling,
    setAdaptiveProfiling,
    wordEnvelope,
    setWordEnvelope,
    despeckle,
    setDespeckle,
    marginPercent,
    setMarginPercent,
    whiteCutoff,
    blackCutoff,
    pageRange,
    setPageRange,
    sessionId,
    startBatch,
    isProcessing
  } = useAppStore();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleStartBatch = async () => {
    if (!sessionId || isProcessing) return;

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          pages: pageRange,
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

  return (
    <div
      className="w-80 h-[calc(100vh-4rem)] border-l p-4 flex flex-col justify-between overflow-y-auto space-y-4 select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}>
      <div className="space-y-4">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-primary)' }}>
            <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
            Restoration Controls
          </span>
          <span className="text-[10px] font-mono-hud font-bold px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)]">
            PRECISION
          </span>
        </div>

        {/* 1. Mode Segmented Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            1. Cleaning Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
            {[
              { id: 'laser', label: 'Laser (1-bit)' },
              { id: 'smooth', label: 'Smooth Gray' },
              { id: 'color', label: 'Color White' },
              { id: 'adaptive', label: 'Gaussian' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as CleaningMode)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  mode === item.id
                    ? 'bg-[var(--accent)] text-white shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Smart AI & Feature Toggles */}
        <div className="space-y-2.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            2. AI Adaptive Filters
          </label>

          {/* Toggle 1: Adaptive Profiler */}
          <div
            onClick={() => setAdaptiveProfiling(!adaptiveProfiling)}
            className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-[var(--border-hover)]"
            style={{
              backgroundColor: adaptiveProfiling ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
              borderColor: adaptiveProfiling ? 'var(--accent)' : 'var(--border)'
            }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI Dynamic Auto-Tuner
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Meters noise energy per page
                </div>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${adaptiveProfiling ? 'bg-[var(--accent)]' : 'bg-neutral-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${adaptiveProfiling ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>

          {/* Toggle 2: Word Envelope Protection */}
          <div
            onClick={() => setWordEnvelope(!wordEnvelope)}
            className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-[var(--border-hover)]"
            style={{
              backgroundColor: wordEnvelope ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
              borderColor: wordEnvelope ? 'var(--accent)' : 'var(--border)'
            }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Word-Level Envelopes
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Protects i-dots & math symbols
                </div>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${wordEnvelope ? 'bg-[var(--accent)]' : 'bg-neutral-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${wordEnvelope ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>

          {/* Toggle 3: Despeckle */}
          <div
            onClick={() => setDespeckle(!despeckle)}
            className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:border-[var(--border-hover)]"
            style={{
              backgroundColor: despeckle ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
              borderColor: despeckle ? 'var(--accent)' : 'var(--border)'
            }}>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Despeckle Filter
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Erases salt & pepper artifacts
                </div>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${despeckle ? 'bg-[var(--accent)]' : 'bg-neutral-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${despeckle ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        {/* 3. Advanced Drawer */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full p-2.5 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}>
            <span>Advanced Physics Tuning</span>
            {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isAdvancedOpen && (
            <div className="p-3 space-y-3 font-mono-hud text-[11px]" style={{ backgroundColor: 'var(--bg-surface)' }}>
              {/* Sauvola k Slider */}
              <div>
                <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                  <span>Sauvola Sensitivity (k)</span>
                  <span className="text-[var(--accent)] font-bold">{sauvolaK.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.35"
                  step="0.01"
                  value={sauvolaK}
                  onChange={(e) => setSauvolaK(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Base Optical Contrast Slider */}
              <div>
                <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                  <span>Base Optical Threshold</span>
                  <span className="text-[var(--accent)] font-bold">{contrastThresh.toFixed(0)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  step="1"
                  value={contrastThresh}
                  onChange={(e) => setContrastThresh(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Margin Crop % */}
              <div>
                <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                  <span>Outer Margin Crop</span>
                  <span className="text-[var(--accent)] font-bold">{(marginPercent * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.03"
                  step="0.002"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Telemetry HUD */}
        <TelemetryHUD />
      </div>

      {/* 5. Bottom Batch Action Box */}
      <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border)' }}>
        {/* Page Range Input */}
        <div>
          <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
            Pages to Process (e.g. 'all' or '1-10, 15'):
          </label>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="all"
            className="w-full px-3 py-1.5 rounded-lg text-xs font-mono-hud border focus:outline-none focus:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Start Batch Button */}
        <button
          onClick={handleStartBatch}
          disabled={!sessionId || isProcessing}
          className="w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer hover:opacity-95 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}>
          <Play className="w-4 h-4 fill-white" />
          <span>{isProcessing ? 'Processing Document...' : 'Clean All Document Pages'}</span>
        </button>
      </div>
    </div>
  );
};
