import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Download, XCircle, Clock, FileCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';

export const BatchProgressBar: React.FC = () => {
  const {
    isProcessing,
    taskId,
    progressPercent,
    progressMessage,
    etaSeconds,
    isComplete,
    updateProgress,
    completeBatch,
    cancelBatch
  } = useAppStore();

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isProcessing || !taskId) return;

    // 1. Connect to Real-Time Server-Sent Events (SSE) Stream
    const streamUrl = `api/stream/${taskId}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'completed') {
          completeBatch();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.9 },
            colors: ['#d97757', '#10b981', '#ffffff']
          });
          es.close();
        } else if (data.status === 'failed') {
          cancelBatch();
          es.close();
        } else {
          updateProgress(data.percent || 0, data.message || 'Processing pages...', data.eta_seconds || 0);
        }
      } catch (e) {
        console.error('SSE JSON parse error:', e);
      }
    };

    es.onerror = () => {
      // Fallback polling if SSE disconnects
      const fallbackPoll = setInterval(async () => {
        try {
          const res = await fetch(`api/progress/${taskId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              completeBatch();
              clearInterval(fallbackPoll);
            } else if (data.status === 'failed') {
              cancelBatch();
              clearInterval(fallbackPoll);
            } else {
              updateProgress(data.percent || 0, data.message || 'Processing...', data.eta_seconds || 0);
            }
          }
        } catch {}
      }, 500);

      es.close();
      return () => clearInterval(fallbackPoll);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isProcessing, taskId, updateProgress, completeBatch, cancelBatch]);

  if (!isProcessing && !isComplete) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl p-4 rounded-2xl border shadow-2xl z-50 flex items-center justify-between gap-4 backdrop-blur-xl transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isComplete ? 'var(--success)' : 'var(--accent)',
        boxShadow: isComplete ? '0 0 30px rgba(16, 185, 129, 0.2)' : '0 0 30px var(--accent-glow)'
      }}>
      {/* Left Progress Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
            ) : (
              <FileCheck className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            )}
            <span>{isComplete ? 'Restoration Finished Successfully!' : progressMessage}</span>
          </div>
          
          <div className="flex items-center gap-1.5 font-mono-hud font-bold text-[var(--accent)]">
            {!isComplete && <Zap className="w-3 h-3 text-[var(--accent)] animate-bounce" />}
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-800">
          <div
            className="h-full rounded-full transition-all duration-300 relative"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: isComplete ? 'var(--success)' : 'var(--accent)'
            }}>
            {!isComplete && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </div>
        </div>

        {/* ETA & Multi-Core Metrics */}
        {!isComplete && (
          <div className="flex items-center justify-between text-[11px] font-mono-hud text-[var(--text-secondary)]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--accent)]" />
              <span>Estimated Remaining: {etaSeconds}s</span>
            </div>
            <span className="text-[10px] text-[var(--accent)] font-semibold">
              ⚡ Multi-Core Accelerated SSE Stream
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {isComplete && taskId ? (
          <a
            href={`api/download/${taskId}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}>
            <Download className="w-4 h-4" />
            <span>Download Clean PDF</span>
          </a>
        ) : (
          <button
            onClick={cancelBatch}
            className="p-2 rounded-xl border hover:bg-red-500/10 text-red-400 border-red-500/30 transition-colors cursor-pointer"
            title="Cancel Batch Processing">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
