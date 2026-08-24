import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type CleaningMode = 'laser' | 'smooth' | 'color' | 'adaptive';

export interface TelemetryData {
  noise_energy_pct: number;
  optical_thresh: number;
  dots_erased_approx: number;
  text_pixels_kept: number;
  char_preservation_rate: number;
}

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Session & Document
  sessionId: string | null;
  filename: string | null;
  totalPages: number;
  currentPage: number;
  thumbnails: string[];
  setDocument: (sessionId: string, filename: string, totalPages: number, thumbnails: string[]) => void;
  setCurrentPage: (page: number) => void;
  resetDocument: () => void;

  // Live Preview & Telemetry
  previewRaw: string | null;
  previewClean: string | null;
  isLoadingPreview: boolean;
  telemetry: TelemetryData | null;
  latencyMs: number;
  setPreviewData: (raw: string, clean: string, telemetry: TelemetryData, latency: number) => void;
  setIsLoadingPreview: (loading: boolean) => void;

  // Parameters
  mode: CleaningMode;
  sauvolaK: number;
  whiteCutoff: number;
  blackCutoff: number;
  despeckle: boolean;
  marginPercent: number;
  contrastThresh: number;
  adaptiveProfiling: boolean;
  wordEnvelope: boolean;
  dpi: number;
  pageRange: string;
  setMode: (mode: CleaningMode) => void;
  setSauvolaK: (k: number) => void;
  setContrastThresh: (t: number) => void;
  setAdaptiveProfiling: (val: boolean) => void;
  setWordEnvelope: (val: boolean) => void;
  setDespeckle: (val: boolean) => void;
  setDpi: (dpi: number) => void;
  setPageRange: (range: string) => void;
  setMarginPercent: (val: number) => void;
  setWhiteCutoff: (val: number) => void;
  setBlackCutoff: (val: number) => void;

  // Batch Processing
  isProcessing: boolean;
  taskId: string | null;
  progressPercent: number;
  progressMessage: string;
  etaSeconds: number;
  isComplete: boolean;
  startBatch: (taskId: string) => void;
  updateProgress: (percent: number, msg: string, eta: number) => void;
  completeBatch: () => void;
  cancelBatch: () => void;

  // UI Interactive States
  sliderPosition: number;
  setSliderPosition: (pos: number) => void;
  isLoupeActive: boolean;
  setIsLoupeActive: (active: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isLeftRailExpanded: boolean;
  setIsLeftRailExpanded: (expanded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme default: dark
  theme: (localStorage.getItem('pdf_enhancer_theme') as Theme) || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('pdf_enhancer_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pdf_enhancer_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  // Session
  sessionId: null,
  filename: null,
  totalPages: 0,
  currentPage: 0,
  thumbnails: [],
  setDocument: (sessionId, filename, totalPages, thumbnails) =>
    set({ sessionId, filename, totalPages, thumbnails, currentPage: 0, previewRaw: null, previewClean: null }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  resetDocument: () =>
    set({
      sessionId: null,
      filename: null,
      totalPages: 0,
      currentPage: 0,
      thumbnails: [],
      previewRaw: null,
      previewClean: null,
      telemetry: null,
      isComplete: false,
      isProcessing: false,
      taskId: null
    }),

  // Preview & Telemetry
  previewRaw: null,
  previewClean: null,
  isLoadingPreview: false,
  telemetry: null,
  latencyMs: 0,
  setPreviewData: (previewRaw, previewClean, telemetry, latencyMs) =>
    set({ previewRaw, previewClean, telemetry, latencyMs, isLoadingPreview: false }),
  setIsLoadingPreview: (isLoadingPreview) => set({ isLoadingPreview }),

  // Tuning Parameters
  mode: 'laser',
  sauvolaK: 0.15,
  whiteCutoff: 210,
  blackCutoff: 80,
  despeckle: true,
  marginPercent: 0.008,
  contrastThresh: 38.0,
  adaptiveProfiling: true,
  wordEnvelope: true,
  dpi: 150,
  pageRange: 'all',
  setMode: (mode) => set({ mode }),
  setSauvolaK: (sauvolaK) => set({ sauvolaK }),
  setContrastThresh: (contrastThresh) => set({ contrastThresh }),
  setAdaptiveProfiling: (adaptiveProfiling) => set({ adaptiveProfiling }),
  setWordEnvelope: (wordEnvelope) => set({ wordEnvelope }),
  setDespeckle: (despeckle) => set({ despeckle }),
  setDpi: (dpi) => set({ dpi }),
  setPageRange: (pageRange) => set({ pageRange }),
  setMarginPercent: (marginPercent) => set({ marginPercent }),
  setWhiteCutoff: (whiteCutoff) => set({ whiteCutoff }),
  setBlackCutoff: (blackCutoff) => set({ blackCutoff }),

  // Batch Processing
  isProcessing: false,
  taskId: null,
  progressPercent: 0,
  progressMessage: '',
  etaSeconds: 0,
  isComplete: false,
  startBatch: (taskId) => set({ isProcessing: true, taskId, progressPercent: 0, progressMessage: 'Starting restoration...', isComplete: false }),
  updateProgress: (progressPercent, progressMessage, etaSeconds) => set({ progressPercent, progressMessage, etaSeconds }),
  completeBatch: () => set({ isProcessing: false, isComplete: true, progressPercent: 100, progressMessage: 'Complete' }),
  cancelBatch: () => set({ isProcessing: false, taskId: null, progressPercent: 0, progressMessage: '' }),

  // Interactive Viewport
  sliderPosition: 50,
  setSliderPosition: (sliderPosition) => set({ sliderPosition }),
  isLoupeActive: false,
  setIsLoupeActive: (isLoupeActive) => set({ isLoupeActive }),
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  isLeftRailExpanded: false,
  setIsLeftRailExpanded: (isLeftRailExpanded) => set({ isLeftRailExpanded })
}));
