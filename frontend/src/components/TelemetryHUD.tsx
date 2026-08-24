import React from 'react';
import { Activity, ShieldCheck, Eraser, Cpu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const TelemetryHUD: React.FC = () => {
  const { telemetry } = useAppStore();

  if (!telemetry) return null;

  return (
    <div className="p-4 rounded-xl border space-y-3"
      style={{
        backgroundColor: 'var(--bg-surface-2)',
        borderColor: 'var(--border)'
      }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: 'var(--text-secondary)' }}>
          <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
          Optical Telemetry HUD
        </span>
        <span className="text-[10px] font-mono-hud px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-semibold">
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 font-mono-hud text-xs">
        {/* Metric 1: Noise Energy */}
        <div className="p-2.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] flex items-center gap-1 text-[var(--text-secondary)] mb-1">
            <Cpu className="w-3 h-3 text-[var(--accent)]" />
            Noise Energy (E)
          </div>
          <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {telemetry.noise_energy_pct}%
          </div>
        </div>

        {/* Metric 2: Dynamic Tau Cutoff */}
        <div className="p-2.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] flex items-center gap-1 text-[var(--text-secondary)] mb-1">
            <Activity className="w-3 h-3 text-[var(--accent)]" />
            Dynamic Cutoff (τ)
          </div>
          <div className="text-base font-bold text-[var(--accent)]">
            {telemetry.optical_thresh}
          </div>
        </div>

        {/* Metric 3: Dots Erased */}
        <div className="p-2.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] flex items-center gap-1 text-[var(--text-secondary)] mb-1">
            <Eraser className="w-3 h-3 text-amber-500" />
            Bleed Dots Erased
          </div>
          <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            ~{telemetry.dots_erased_approx.toLocaleString()}
          </div>
        </div>

        {/* Metric 4: Characters Preserved */}
        <div className="p-2.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] flex items-center gap-1 text-[var(--text-secondary)] mb-1">
            <ShieldCheck className="w-3 h-3 text-[var(--success)]" />
            Text Preserved
          </div>
          <div className="text-base font-bold text-[var(--success)]">
            {telemetry.char_preservation_rate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
