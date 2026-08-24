import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Filmstrip: React.FC = () => {
  const {
    isFilmstripOpen,
    setIsFilmstripOpen,
    totalPages,
    currentPage,
    setCurrentPage,
    thumbnails
  } = useAppStore();

  if (!isFilmstripOpen || totalPages === 0) return null;

  return (
    <div
      onClick={() => setIsFilmstripOpen(false)}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-end justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-2xl p-4 space-y-3 animate-in slide-in-from-bottom-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 25px var(--accent-glow)'
        }}>
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Page Navigator ({totalPages} Pages)
          </span>
          <button
            onClick={() => setIsFilmstripOpen(false)}
            className="p-1 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Filmstrip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {Array.from({ length: totalPages }).map((_, index) => {
            const isActive = currentPage === index;
            const thumb = thumbnails[index];

            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentPage(index);
                  setIsFilmstripOpen(false);
                }}
                className={`flex-shrink-0 w-24 p-1.5 rounded-xl border transition-all duration-150 flex flex-col items-center cursor-pointer ${
                  isActive
                    ? 'border-2 border-[var(--accent)] shadow-md scale-105'
                    : 'hover:border-[var(--border-hover)] opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)'
                }}>
                <div className="w-full aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center mb-1 relative border border-white/5">
                  {thumb ? (
                    <img src={thumb} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-4 h-4 text-neutral-600" />
                  )}
                  {isActive && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[var(--accent)] text-white">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-mono-hud font-bold ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  P.{index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
