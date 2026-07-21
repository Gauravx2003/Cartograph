import { create } from 'zustand';

export interface FileScoreContributor {
  id: string;
  fileScoreId: string;
  name: string;
  email: string;
  commitCount: number;
  percentage: number;
}

export interface FileScore {
  id: string;
  scanId: string;
  filePath: string;
  churnCount: number;
  churnHistory?: { date: string; commits: number }[];
  contributors?: FileScoreContributor[];
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

export interface FileDependency {
  fromPath: string;
  toPath: string;
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
  repo?: {
    owner: string;
    name: string;
    defaultBranch: string;
  };
}

interface ScanStoreState {
  fileScores: FileScore[];
  dependencies: FileDependency[];
  selectedFilePath: string | null;
  hoveredFilePath: string | null;
  searchQuery: string;
  activeFilters: ActiveFilters;
  scanMeta: ScanMeta | null;
  
  // Actions
  setFileScores: (scores: FileScore[]) => void;
  setDependencies: (deps: FileDependency[]) => void;
  setSelectedFilePath: (path: string | null) => void;
  setHoveredFilePath: (path: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<ActiveFilters>) => void;
  setScanMeta: (meta: ScanMeta) => void;
  resetScanState: () => void;
}

const initialState = {
  fileScores: [],
  dependencies: [],
  selectedFilePath: null,
  hoveredFilePath: null,
  searchQuery: '',
  activeFilters: {},
  scanMeta: null,
};

export const useScanStore = create<ScanStoreState>()((set) => ({
  ...initialState,

  setFileScores: (scores) => set({ fileScores: scores }),
  setDependencies: (deps) => set({ dependencies: deps }),
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),
  setHoveredFilePath: (path) => set({ hoveredFilePath: path }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set((state) => ({ 
    activeFilters: { ...state.activeFilters, ...filters } 
  })),
  setScanMeta: (meta) => set({ scanMeta: meta }),
  resetScanState: () => set(initialState),
}));
