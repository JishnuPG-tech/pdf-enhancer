import React, { useEffect, useState } from 'react';
import { Sun, Moon, Command, ArrowDownToLine, FileText, Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    filename,
    currentPage,
    totalPages,
    isComplete,
    taskId,
    setIsCommandPaletteOpen,
    resetDocument,
    latencyMs
  } = useAppStore();

  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [pingLatency, setPingLatency] = useState<number>(1);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const t0 = performance.now();
        const res = await fetch('api/health');
        const t1 = performance.now();
        if (res.ok) {
          const l = Math.round(t1 - t0);
          setPingLatency(l);
          setHealthStatus(l < 150 ? 'healthy' : l < 400 ? 'warning' : 'error');
        } else {
          setHealthStatus('error');
        }
      } catch {
        setHealthStatus('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (taskId && isComplete) {
      window.open(`api/download/${taskId}`, '_blank');
    }
  };

  return (
    <header className="h-12 px-6 flex items-center justify-between border-b transition-all duration-200 z-40 select-none backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}>
      {/* Brand Wordmark */}
      <div className="flex items-center gap-4">
        <div
          onClick={filename ? resetDocument : undefined}
          className="flex items-center gap-1.5 cursor-pointer group"
          title="lucent — Click to upload a new document">
          <div className="relative font-bold text-lg tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}>
            l
            <span className="relative">
              u
              <span
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent-glow)'
                }}
              />
            </span>
            cent
          </div>
        </div>

        {/* Active Document Pill */}
        {filename && (
          <div className="hidden sm:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}>
            <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="max-w-[140px] truncate font-medium" style={{ color: 'var(--text-primary)' }}>
              {filename}
            </span>
            <span className="font-mono-hud font-semibold text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-[var(--accent)]">
              {currentPage + 1}/{totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Upload Another PDF */}
        {filename && (
          <button
            onClick={resetDocument}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-[var(--bg-surface-2)]"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
            title="Upload Another Document">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Upload</span>
          </button>
        )}

        {/* Latency Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-hud border"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}>
          <span className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: healthStatus === 'healthy' ? 'var(--success)' : healthStatus === 'warning' ? 'var(--accent)' : 'var(--danger)'
            }} />
          <span>{latencyMs > 0 ? `${latencyMs}ms` : `${pingLatency}ms`}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer hover:bg-[var(--bg-surface-2)]"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}
          title="Command Palette (⌘K / Ctrl+K)">
          <Command className="w-3.5 h-3.5" />
          <span className="font-mono-hud text-[10px]">⌘K</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border transition-all cursor-pointer hover:bg-[var(--bg-surface-2)] active:scale-95"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>

        {/* Export PDF Button */}
        {isComplete && taskId && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--accent)' }}>
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        )}
      </div>
    </header>
  );
};
