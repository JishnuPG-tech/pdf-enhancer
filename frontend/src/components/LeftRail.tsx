import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ThumbnailItemProps {
  index: number;
  isActive: boolean;
  thumb?: string;
  isExpanded: boolean;
  onSelect: (index: number) => void;
}

const ThumbnailItem = memo(({ index, isActive, thumb, isExpanded, onSelect }: ThumbnailItemProps) => {
  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full p-2 rounded-xl text-left border transition-colors duration-100 flex flex-col items-center cursor-pointer relative ${
        isActive
          ? 'border-l-4 shadow-sm'
          : 'hover:border-[var(--border-hover)] opacity-80 hover:opacity-100'
      }`}
      style={{
        backgroundColor: isActive ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
        borderColor: isActive ? 'var(--accent)' : 'var(--border)'
      }}>
      <div className="w-full aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 border border-white/5 relative pointer-events-none">
        {thumb ? (
          <img src={thumb} alt={`Page ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileText className="w-5 h-5 text-neutral-600" />
        )}
        {isActive && (
          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[var(--accent)] text-white">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        )}
      </div>

      <span
        className={`text-[11px] font-mono-hud font-semibold ${
          isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
        }`}>
        {isExpanded ? `Page ${index + 1}` : `P.${index + 1}`}
      </span>
    </button>
  );
});

ThumbnailItem.displayName = 'ThumbnailItem';

export const LeftRail: React.FC = () => {
  const {
    totalPages,
    currentPage,
    setCurrentPage,
    thumbnails,
    isLeftRailExpanded,
    setIsLeftRailExpanded
  } = useAppStore();

  if (totalPages === 0) return null;

  return (
    <aside
      className={`h-[calc(100vh-4rem)] border-r transition-all duration-150 flex flex-col relative z-10 select-none ${
        isLeftRailExpanded ? 'w-56' : 'w-20'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}>
      {/* Header with expand toggle */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <span className={`text-xs font-semibold uppercase tracking-wider truncate ${isLeftRailExpanded ? 'block' : 'hidden'}`}
          style={{ color: 'var(--text-secondary)' }}>
          Pages ({totalPages})
        </span>
        <button
          onClick={() => setIsLeftRailExpanded(!isLeftRailExpanded)}
          className="p-1.5 rounded-lg border hover:bg-[var(--bg-surface-2)] transition-colors duration-100 mx-auto cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          title={isLeftRailExpanded ? 'Collapse Thumbnails' : 'Expand Thumbnails'}>
          {isLeftRailExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Scrollable Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <ThumbnailItem
            key={index}
            index={index}
            isActive={currentPage === index}
            thumb={thumbnails[index]}
            isExpanded={isLeftRailExpanded}
            onSelect={setCurrentPage}
          />
        ))}
      </div>
    </aside>
  );
};
