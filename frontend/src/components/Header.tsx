import React, { useEffect, useState } from 'react';
import { Sun, Moon, Command, Download, Sparkles, FileText } from 'lucide-react';
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
    latencyMs
  } = useAppStore();

  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [pingLatency, setPingLatency] = useState<number>(1);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const t0 = performance.now();
        const res = await fetch('/api/health');
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
      window.open(`/api/download/${taskId}`, '_blank');
    }
  };

  return (
    <header className="h-16 px-5 flex items-center justify-between border-b transition-colors duration-150"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}>
      {/* Brand & Document Name */}
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
          style={{ backgroundColor: 'var(--accent)' }}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              CleanPDF
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono-hud font-medium"
              style={{
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)'
              }}>
              AI ENGINE v2.0
            </span>
          </div>
          {filename && (
            <div className="flex items-center gap-1.5 text-xs truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              <FileText className="w-3 h-3" />
              <span className="truncate">{filename}</span>
              <span className="font-mono-hud font-semibold px-1 rounded" style={{ color: 'var(--text-primary)' }}>
                Page {currentPage + 1}/{totalPages}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center / Right Control Cluster */}
      <div className="flex items-center gap-3">
        {/* Backend Latency Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-hud border"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}>
          <span className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: healthStatus === 'healthy' ? 'var(--success)' : healthStatus === 'warning' ? 'var(--accent)' : 'var(--danger)'
            }} />
          <span>{latencyMs > 0 ? `${latencyMs}ms` : `${pingLatency}ms`}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}
          title="Open Command Palette (⌘K)">
          <Command className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-mono-hud">⌘K</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Download Button (Active on Complete) */}
        {isComplete && taskId && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--accent)'
            }}>
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        )}
      </div>
    </header>
  );
};
