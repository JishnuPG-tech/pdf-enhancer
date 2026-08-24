import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { DocumentViewer } from './components/DocumentViewer';
import { BatchProgressBar } from './components/BatchProgressBar';
import { CommandPalette } from './components/CommandPalette';

export const App: React.FC = () => {
  const { theme, sessionId } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col transition-colors duration-150 overflow-hidden select-none"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* 48px Minimalist Top Bar */}
      <Header />

      {/* Focus-First Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {!sessionId ? (
          <Dropzone />
        ) : (
          <DocumentViewer />
        )}
      </main>

      {/* Floating Progress Bar & CTA */}
      <BatchProgressBar />

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default App;
