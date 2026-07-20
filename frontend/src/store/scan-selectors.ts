import { useMemo } from 'react';
import { useScanStore, type FileScore } from './scan-store';

export const useVisibleFileScores = () => {
  const fileScores = useScanStore((state) => state.fileScores);
  const searchQuery = useScanStore((state) => state.searchQuery);
  const activeFilters = useScanStore((state) => state.activeFilters);

  return useMemo(() => {
    return fileScores.filter((file) => {
      // 1. Search Query filter (matches file path)
      if (searchQuery && !file.filePath.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Min Risk filter
      if (activeFilters.minRisk !== undefined && file.riskScore < activeFilters.minRisk) {
        return false;
      }

      // 3. Directory filter
      if (activeFilters.directory && !file.filePath.startsWith(activeFilters.directory)) {
        return false;
      }

      // 4. Bus Factor Only filter
      // The PRD mentions bus factor penalty > 0
      if (activeFilters.busFactorOnly && file.busFactorPenalty === 0) {
        return false;
      }

      return true;
    });
  }, [fileScores, searchQuery, activeFilters]);
};

export interface DirectoryNode {
  name: string;
  path: string; // full path
  children?: DirectoryNode[];
  fileScore?: FileScore; // present only on leaf nodes (files)
  riskScore: number;     // max risk among children for directories, or own risk for files
  loc?: number;
  churn?: number;
  complexity?: number;
}

export const useDirectoryTree = () => {
  const fileScores = useScanStore((state) => state.fileScores);

  return useMemo(() => {
    const root: DirectoryNode = { name: 'root', path: '', children: [], riskScore: 0 };

    fileScores.forEach((file) => {
      // Using forward slash as standard path separator
      const parts = file.filePath.split('/');
      let currentNode = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (isLeaf) {
          currentNode.children = currentNode.children || [];
          currentNode.children.push({
            name: part,
            path: currentPath,
            fileScore: file,
            riskScore: file.riskScore,
            loc: Math.max(1, file.fileLengthLines || 1),
            churn: Math.max(1, file.churnCount || 0),
            complexity: Math.max(1, file.complexityCyclomatic || 0),
          });
        } else {
          currentNode.children = currentNode.children || [];
          let childNode = currentNode.children.find((c) => c.name === part);
          
          if (!childNode) {
            childNode = {
              name: part,
              path: currentPath,
              children: [],
              riskScore: 0,
            };
            currentNode.children.push(childNode);
          }
          currentNode = childNode;
        }
      }
    });

    // Compute aggregated risk scores bottom-up (Max risk of descendants)
    const computeRisk = (node: DirectoryNode): number => {
      if (node.fileScore) {
        return node.riskScore;
      }
      if (node.children && node.children.length > 0) {
        node.riskScore = Math.max(...node.children.map(computeRisk));
        return node.riskScore;
      }
      return 0;
    };

    // Special case: if there are no files, return root as is.
    if (root.children && root.children.length > 0) {
      computeRisk(root);
      
      // If all files are inside a single top-level directory, we might want to unwrap it,
      // but returning a stable 'root' node is generally safer for tree visualization.
    }

    return root;
  }, [fileScores]);
};

export const useFileDependencies = (filePath: string | null) => {
  const dependencies = useScanStore((state) => state.dependencies);
  
  return useMemo(() => {
    if (!filePath) return { imports: [], importedBy: [] };
    
    const imports = dependencies
      .filter((d) => d.fromPath === filePath)
      .map((d) => d.toPath);
      
    const importedBy = dependencies
      .filter((d) => d.toPath === filePath)
      .map((d) => d.fromPath);
      
    return { imports, importedBy };
  }, [dependencies, filePath]);
};
