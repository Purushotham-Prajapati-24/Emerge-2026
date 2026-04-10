import { useState } from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';

interface FileExplorerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const FileExplorer = ({ isOpen = true, onToggle }: FileExplorerProps) => {
  const { files, activeFileId, setActiveFileId } = useCollaborationStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');

  const getLanguageFromExtension = (filename: string) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'javascript'; // Default
  };
  
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) return '🟨';
    if (filename.endsWith('.ts')) return '🟦';
    if (filename.endsWith('.py')) return '🐍';
    if (filename.endsWith('.html')) return '🌐';
    if (filename.endsWith('.css')) return '🎨';
    if (filename.endsWith('.json')) return '📦';
    return '📄';
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }
    
    let name = newFileName.trim();
    if (!name.includes('.')) {
      name += '.js';
    }
    
    const fileId = 'file_' + Math.random().toString(36).substring(2, 11);
    const language = getLanguageFromExtension(name);
    
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta) {
      yFilesMeta.set(fileId, {
        id: fileId,
        name,
        language,
        isMain: false
      });
      setActiveFileId(fileId);
    }
    
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent | React.FocusEvent, fileId: string) => {
    e.preventDefault();
    if (!editFileName.trim()) {
      setEditingFileId(null);
      return;
    }
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta && yFilesMeta.has(fileId)) {
      const fileData = yFilesMeta.get(fileId);
      yFilesMeta.set(fileId, { ...fileData, name: editFileName.trim(), language: getLanguageFromExtension(editFileName.trim()) });
    }
    setEditingFileId(null);
  };

  const handleDeleteFile = (fileId: string, isMain: boolean) => {
    if (isMain) return; // Cannot delete main file
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta && yFilesMeta.has(fileId)) {
      yFilesMeta.delete(fileId);
      if (activeFileId === fileId) {
        const nextFile = files.find(f => f.id !== fileId);
        if (nextFile) setActiveFileId(nextFile.id);
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-3 w-full h-full bg-[#0d1117] border-transaprent">
        <button 
          onClick={onToggle}
          className="p-2 mb-4 hover:bg-[#1e2a3a] rounded-lg text-[#8a98b3] hover:text-[#f1f3fc] transition-colors"
          title="Expand Explorer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 18 6-6-6-6"/><path d="M5 18l6-6-6-6"/></svg>
        </button>
        <div className="flex flex-col gap-2 w-full px-2" title="Expand to view files">
          {files.slice(0, 5).map(f => (
            <div key={f.id} onClick={onToggle} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1e2a3a] cursor-pointer text-xs opacity-70 hover:opacity-100 transition-opacity">
              {getFileIcon(f.name)}
            </div>
          ))}
          {files.length > 5 && (
            <div className="w-8 h-8 flex items-center justify-center rounded-lg text-xs text-[#8a98b3] opacity-70">
              +{files.length - 5}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-transparent w-full">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0d12] border-b border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-center gap-2">
           <button 
             onClick={onToggle}
             className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#1e2a3a] text-[#8a98b3] hover:text-[#f1f3fc] transition-colors"
             title="Collapse Explorer"
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 18-6-6 6-6"/><path d="M19 18l-6-6 6-6"/></svg>
           </button>
           <h3 className="font-['Space_Grotesk'] font-semibold text-xs text-[#8a98b3] uppercase tracking-wider">Explorer</h3>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#1e2a3a] text-[#8a98b3] hover:text-[#f1f3fc] transition-colors"
          title="New File"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 group">
        {files.map(file => (
          <div 
            key={file.id}
            className={`w-full group/file flex items-center justify-between px-4 py-1.5 text-sm font-['Inter'] transition-colors ${
              activeFileId === file.id
                ? 'bg-[#1e2a3a]/50 text-[#f1f3fc] border-l-2 border-[#a78bfa]'
                : 'text-[#8a98b3] hover:bg-[#1e2a3a]/30 hover:text-[#c9d1d9] border-l-2 border-transparent'
            }`}
          >
            {editingFileId === file.id ? (
              <form onSubmit={(e) => handleRenameSubmit(e, file.id)} className="flex-1 flex items-center gap-2">
                <span className="opacity-80 text-xs">{getFileIcon(file.name)}</span>
                <input
                  type="text"
                  autoFocus
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  onBlur={(e) => handleRenameSubmit(e, file.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingFileId(null);
                    }
                  }}
                  className="flex-1 bg-transparent border-b border-[#a78bfa] outline-none text-[#f1f3fc] text-sm"
                />
              </form>
            ) : (
              <>
                <button
                  onClick={() => setActiveFileId(file.id)}
                  className="flex-1 flex items-center gap-2 truncate text-left"
                >
                  <span className="opacity-80 text-xs flex-shrink-0">{getFileIcon(file.name)}</span>
                  <span className="truncate">{file.name}</span>
                </button>
                <div className="hidden group-hover/file:flex items-center gap-1 flex-shrink-0">
                  {!file.isMain && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id); setEditFileName(file.name); }} 
                        className="p-1 min-w-[24px] flex items-center justify-center hover:bg-[#2d3a4a] rounded text-[#8a98b3] hover:text-[#f1f3fc] transition-colors" 
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, !!file.isMain); }} 
                        className="p-1 min-w-[24px] flex items-center justify-center hover:bg-red-900/30 rounded text-[#8a98b3] hover:text-red-400 transition-colors" 
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        
        {isCreating && (
          <form onSubmit={handleCreateFile} className="px-4 py-1.5 flex items-center gap-2 border-l-2 border-transparent">
            <span className="opacity-80 text-xs">📄</span>
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => {
                if (!newFileName.trim()) setIsCreating(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              placeholder="filename.ext"
              className="flex-1 bg-transparent border-none outline-none text-[#f1f3fc] text-sm font-['Inter'] placeholder-[#3a4458]"
            />
          </form>
        )}
      </div>
    </div>
  );
};
