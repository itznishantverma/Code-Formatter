import { File, Folder, ChevronRight, ChevronDown, Eye, Edit, FilePlus, AlertCircle, CheckCircle } from 'lucide-react';
import { ParsedFile, getFileName } from '../utils/logParser';

interface FileTreeProps {
  files: ParsedFile[];
  selectedFile: ParsedFile | null;
  onFileSelect: (file: ParsedFile) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

interface DirectoryNode {
  name: string;
  files: ParsedFile[];
  subdirectories: Map<string, DirectoryNode>;
}

function buildTree(files: ParsedFile[]): DirectoryNode {
  const root: DirectoryNode = {
    name: 'root',
    files: [],
    subdirectories: new Map()
  };

  for (const file of files) {
    const parts = file.path.split('/').filter(p => p);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.subdirectories.has(part)) {
        current.subdirectories.set(part, {
          name: part,
          files: [],
          subdirectories: new Map()
        });
      }
      current = current.subdirectories.get(part)!;
    }

    current.files.push(file);
  }

  return root;
}

function DirectoryView({
  node,
  level,
  selectedFile,
  onFileSelect,
  expandedFolders,
  onToggleFolder,
  parentPath
}: {
  node: DirectoryNode;
  level: number;
  selectedFile: ParsedFile | null;
  onFileSelect: (file: ParsedFile) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  parentPath: string;
}) {
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const isExpanded = expandedFolders.has(currentPath);

  return (
    <>
      {node.name !== 'root' && (
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 cursor-pointer group"
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => onToggleFolder(currentPath)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <Folder className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-slate-300 font-medium">{node.name}</span>
        </div>
      )}

      {isExpanded && (
        <>
          {Array.from(node.subdirectories.values()).map(subdir => (
            <DirectoryView
              key={subdir.name}
              node={subdir}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              parentPath={currentPath}
            />
          ))}

          {node.files.map(file => (
            <div
              key={file.path}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedFile?.path === file.path
                  ? 'bg-blue-600/30 border-l-2 border-blue-500'
                  : 'hover:bg-slate-700/50'
              }`}
              style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
              onClick={() => onFileSelect(file)}
            >
              {file.operation === 'Read' && <Eye className="w-4 h-4 text-blue-400" />}
              {file.operation === 'Write' && <FilePlus className="w-4 h-4 text-green-400" />}
              {file.operation === 'Edit' && <Edit className="w-4 h-4 text-amber-400" />}
              {file.operation === 'Other' && <File className="w-4 h-4 text-slate-400" />}
              <span className="text-sm text-slate-300 truncate flex-1">{getFileName(file.path)}</span>
              {file.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
              {file.status === 'success' && file.operation !== 'Read' && <CheckCircle className="w-3 h-3 text-green-400" />}
              <span className="text-xs text-slate-500">{file.lineCount}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export function FileTree({ files, selectedFile, onFileSelect, expandedFolders, onToggleFolder }: FileTreeProps) {
  const tree = buildTree(files);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Files ({files.length})
        </h3>
      </div>
      <div className="py-2 overflow-y-auto flex-1">
        {tree.subdirectories.size > 0 ? (
          Array.from(tree.subdirectories.values()).map(subdir => (
            <DirectoryView
              key={subdir.name}
              node={subdir}
              level={0}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              parentPath=""
            />
          ))
        ) : (
          tree.files.map(file => (
            <div
              key={file.path}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedFile?.path === file.path
                  ? 'bg-blue-600/30 border-l-2 border-blue-500'
                  : 'hover:bg-slate-700/50'
              }`}
              onClick={() => onFileSelect(file)}
            >
              {file.operation === 'Read' && <Eye className="w-4 h-4 text-blue-400" />}
              {file.operation === 'Write' && <FilePlus className="w-4 h-4 text-green-400" />}
              {file.operation === 'Edit' && <Edit className="w-4 h-4 text-amber-400" />}
              {file.operation === 'Other' && <File className="w-4 h-4 text-slate-400" />}
              <span className="text-sm text-slate-300 truncate flex-1">{getFileName(file.path)}</span>
              {file.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
              {file.status === 'success' && file.operation !== 'Read' && <CheckCircle className="w-3 h-3 text-green-400" />}
              <span className="text-xs text-slate-500">{file.lineCount}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
