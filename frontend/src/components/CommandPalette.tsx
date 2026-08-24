import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { Sparkles, Sun, Moon, ArrowRight, ArrowLeft, RotateCcw, Shield, Layers, Sliders } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    toggleTheme,
    theme,
    setMode,
    setAdaptiveProfiling,
    adaptiveProfiling,
    setWordEnvelope,
    wordEnvelope,
    currentPage,
    totalPages,
    setCurrentPage,
    resetDocument
  } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      onClick={() => setIsCommandPaletteOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)'
        }}>
        <Command label="Command Palette" className="w-full">
          <div className="p-3 border-b flex items-center gap-2.5" style={{ borderColor: 'var(--border)' }}>
            <Command.Input
              placeholder="Type a command or search actions..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-tertiary)]"
              style={{ color: 'var(--text-primary)' }}
            />
            <span className="text-[10px] font-mono-hud px-1.5 py-0.5 rounded border text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}>
              ESC
            </span>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2 text-xs space-y-1">
            <Command.Empty className="p-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              No matching actions found.
            </Command.Empty>

            {/* Group: Navigation */}
            <Command.Group heading="Navigation" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 text-[var(--text-secondary)]">
              <Command.Item
                onSelect={() => {
                  if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                <span>Next Page</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  if (currentPage > 0) setCurrentPage(currentPage - 1);
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <ArrowLeft className="w-4 h-4 text-[var(--accent)]" />
                <span>Previous Page</span>
              </Command.Item>
            </Command.Group>

            {/* Group: Modes */}
            <Command.Group heading="Cleaning Modes" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 text-[var(--text-secondary)]">
              <Command.Item
                onSelect={() => {
                  setMode('laser');
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <Sliders className="w-4 h-4 text-[var(--accent)]" />
                <span>Set Mode: Laser Binarized (1-bit Pure B&W)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setMode('smooth');
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <span>Set Mode: Smooth Grayscale (Anti-Aliased)</span>
              </Command.Item>
            </Command.Group>

            {/* Group: AI & Theme */}
            <Command.Group heading="Preferences & Actions" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 text-[var(--text-secondary)]">
              <Command.Item
                onSelect={() => {
                  setAdaptiveProfiling(!adaptiveProfiling);
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span>Toggle AI Dynamic Auto-Tuner ({adaptiveProfiling ? 'Disable' : 'Enable'})</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setWordEnvelope(!wordEnvelope);
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                <Shield className="w-4 h-4 text-[var(--accent)]" />
                <span>Toggle Word-Level Envelope Protection ({wordEnvelope ? 'Disable' : 'Enable'})</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  toggleTheme();
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)]">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  resetDocument();
                  setIsCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-red-500/10 text-red-400">
                <RotateCcw className="w-4 h-4" />
                <span>Reset and Upload New Document</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
