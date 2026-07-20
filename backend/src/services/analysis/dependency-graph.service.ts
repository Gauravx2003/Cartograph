import { Project, Node, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

export interface FileDependencyEdge {
  fromPath: string;
  toPath: string;
}

export function extractDependencies(repoPath: string): FileDependencyEdge[] {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      resolveJsonModule: true,
      esModuleInterop: true,
    }
  });
  
  // Adding files to Project allows ts-morph to resolve imports between them
  project.addSourceFilesAtPaths([
    path.join(repoPath, '**/*.ts').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.tsx').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.js').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.jsx').replace(/\\/g, '/'),
  ]);

  const edges: FileDependencyEdge[] = [];
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    if (sourceFile.getFilePath().includes('node_modules')) {
      continue;
    }

    let fromPath = path.relative(repoPath, sourceFile.getFilePath()).replace(/\\/g, '/');

    // Handle imports
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpecifierSourceFile = imp.getModuleSpecifierSourceFile();
      if (moduleSpecifierSourceFile) {
        if (moduleSpecifierSourceFile.getFilePath().includes('node_modules')) continue;
        let toPath = path.relative(repoPath, moduleSpecifierSourceFile.getFilePath()).replace(/\\/g, '/');
        edges.push({ fromPath, toPath });
      }
    }

    // Handle re-exports
    const exports = sourceFile.getExportDeclarations();
    for (const exp of exports) {
      const moduleSpecifierSourceFile = exp.getModuleSpecifierSourceFile();
      if (moduleSpecifierSourceFile) {
        if (moduleSpecifierSourceFile.getFilePath().includes('node_modules')) continue;
        let toPath = path.relative(repoPath, moduleSpecifierSourceFile.getFilePath()).replace(/\\/g, '/');
        edges.push({ fromPath, toPath });
      }
    }

    // Handle CommonJS require() calls
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      if (call.getExpression().getText() === 'require') {
        const args = call.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const importPath = args[0].getLiteralText();
          if (importPath.startsWith('.')) {
            // It's a relative internal import
            const dir = path.dirname(sourceFile.getFilePath());
            const resolvedPath = path.resolve(dir, importPath);
            
            // Try to find the matching source file in the project
            // CommonJS might omit extensions like .js, .jsx, .ts, .tsx or index.js
            const possibleExtensions = ['', '.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts'];
            
            for (const ext of possibleExtensions) {
              const checkPath = resolvedPath + ext;
              const targetFile = project.getSourceFile(checkPath);
              if (targetFile && !targetFile.getFilePath().includes('node_modules')) {
                let toPath = path.relative(repoPath, targetFile.getFilePath()).replace(/\\/g, '/');
                edges.push({ fromPath, toPath });
                break;
              }
            }
          }
        }
      }
    }
  }

  // Deduplicate edges
  const uniqueEdges = new Map<string, FileDependencyEdge>();
  for (const edge of edges) {
    const key = `${edge.fromPath}->${edge.toPath}`;
    if (!uniqueEdges.has(key)) {
      uniqueEdges.set(key, edge);
    }
  }

  return Array.from(uniqueEdges.values());
}
