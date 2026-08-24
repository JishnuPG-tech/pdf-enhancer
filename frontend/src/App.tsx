import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { LeftRail } from './components/LeftRail';
import { DocumentViewer } from './components/DocumentViewer';
import { ControlPanel } from './components/ControlPanel';
import { BatchProgressBar } from './components/BatchProgressBar';
import { CommandPalette } from './components/CommandPalette';

export const App: React.FC = () => {
  const { theme, sessionId } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-150 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Global Header */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {!sessionId ? (
          <Dropzone />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* 1. Left Thumbnail Strip */}
            <LeftRail />

            {/* 2. Center Document Viewport (Curtain Slider & Loupe) */}
            <DocumentViewer />

            {/* 3. Right Control Panel & Telemetry HUD */}
            <ControlPanel />
          </div>
        )}
      </main>

      {/* Bottom Floating Batch Progress Bar */}
      <BatchProgressBar />

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default App;
