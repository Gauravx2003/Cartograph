import { create } from 'zustand';

export interface FileScore {
  id: string;
  scanId: string;
  filePath: string;
  churnCount: number;
  complexityCyclomatic: number;
  complexityMaxNesting: number;
  fileLengthLines: number;
  uniqueContributors: number;
  topContributorPct: number;
  normalizedChurn: number;
  normalizedComplexity: number;
  busFactorPenalty: number;
  riskScore: number;
  explanation?: string;
  createdAt: string;
}

export interface ActiveFilters {
  minRisk?: number;
  directory?: string;
  busFactorOnly?: boolean;
}

export interface ScanMeta {
  isAnonymous: boolean;
  explanationsRequested: boolean;
  fileCount?: number;
  status?: string;
}

interface ScanStoreState {
  fileScores: FileScore[];
  selectedFilePath: string | null;
  hoveredFilePath: string | null;
  searchQuery: string;
  activeFilters: ActiveFilters;
  scanMeta: ScanMeta | null;
  
  // Actions
  setFileScores: (scores: FileScore[]) => void;
  setSelectedFilePath: (path: string | null) => void;
  setHoveredFilePath: (path: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<ActiveFilters>) => void;
  setScanMeta: (meta: ScanMeta) => void;
  resetScanState: () => void;
}

const initialState = {
  fileScores: [],
  selectedFilePath: null,
  hoveredFilePath: null,
  searchQuery: '',
  activeFilters: {},
  scanMeta: null,
};

export const useScanStore = create<ScanStoreState>()((set) => ({
  ...initialState,

  setFileScores: (scores) => set({ fileScores: scores }),
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),
  setHoveredFilePath: (path) => set({ hoveredFilePath: path }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set((state) => ({ 
    activeFilters: { ...state.activeFilters, ...filters } 
  })),
  setScanMeta: (meta) => set({ scanMeta: meta }),
  resetScanState: () => set(initialState),
}));
