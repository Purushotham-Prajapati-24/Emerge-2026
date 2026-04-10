import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CollaborationEngine } from './yjsProvider';
import { useAuthStore } from '../../store/useAuthStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';
// @ts-ignore
import { MonacoBinding } from 'y-monaco';
import './collaboration.css';

interface MonacoCollaborativeProps {
  projectId: string;
  language?: string;
  role?: string;
  projectType?: 'programming' | 'web-development';
}

// Deterministic color from user ID so the same user always gets the same color
function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export const MonacoCollaborative = ({ projectId, language = 'javascript', role = 'editor', projectType = 'programming' }: MonacoCollaborativeProps) => {
  const editorRef = useRef<any>(null);
  const engineRef = useRef<CollaborationEngine | null>(null);
  const bindingRef = useRef<any>(null);
  const [engineReady, setEngineReady] = useState(false);
  const { user } = useAuthStore();
  const { activeFileId, files } = useCollaborationStore();

  // Find language for active file
  const activeLang = files.find(f => f.id === activeFileId)?.language || language;

  // owner and editor roles can type; reader/commenter cannot
  const isReadOnly = role === 'reader' || role === 'commenter';
  // Note: 'owner' and 'editor' both allow editing

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    (window as any).__monacoEditorInstance = editor;

    // Kinetic Terminal theme
    monacoInstance.editor.defineTheme('kinetic-terminal', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '0a0e14' },
        { token: 'keyword', foreground: 'b6a0ff' },
        { token: 'string', foreground: '98d379' },
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'number', foreground: 'e5c07b' },
      ],
      colors: {
        'editor.background': '#0a0e14',
        'editor.foreground': '#abb2bf',
        'editorCursor.foreground': '#a78bfa',
        'editor.selectionBackground': '#a78bfa30',
        'editor.lineHighlightBackground': '#ffffff06',
        'editorIndentGuide.background': '#ffffff0a',
        'editorIndentGuide.activeBackground': '#ffffff2a',
        'editorLineNumber.foreground': '#3a4458',
        'editorLineNumber.activeForeground': '#8a98b3',
      },
    });
    monacoInstance.editor.setTheme('kinetic-terminal');

    setEngineReady(true);
  };

  useEffect(() => {
    if (!user || !editorRef.current || !engineReady) return;

    const userId = user.id || user._id || 'anon';
    const userName = user.name || user.username || 'Anonymous';

    // Tear down previous engine
    if (engineRef.current) {
      engineRef.current.disconnect();
      engineRef.current = null;
    }

    // Helper language for seeding
    (window as any).__collabDefaultLang = language;
    (window as any).__collabProjectType = projectType;

    const engine = new CollaborationEngine();
    engineRef.current = engine;

    // Expose globally so ChatPanel can call engine.sendMessage()
    (window as any).__collabEngine = engine;

    engine.connect({
      projectId,
      user: {
        id: userId,
        name: userName,
        color: colorFromId(userId),
      },
      editor: editorRef.current,
      monacoModel: editorRef.current.getModel(),
    });

    return () => {
      engine.disconnect();
      engineRef.current = null;
      (window as any).__collabEngine = null;
    };
  }, [user, projectId, engineReady, language]);

  // Handle active file changing - rebinding the CRDT
  useEffect(() => {
    if (!engineRef.current || !editorRef.current || !activeFileId) return;
    
    const doc = engineRef.current.doc;
    const provider = (engineRef.current as any).provider;
    
    if (!doc || !provider) return;

    // Destroy existing binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ytext = doc.getText(activeFileId);
    
    // Create new binding
    bindingRef.current = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFileId, engineReady]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#0a0e14] shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col">
      {/* File Tabs header (optional padding if we want tabs here later, but WorkspacePage has Explorer) */}
      <div className="h-2 w-full bg-[#111720]" />
      <Editor
        height="calc(100% - 8px)"
        language={activeLang}
        defaultValue={`// ... Loading\n`}
        onMount={handleEditorDidMount}
        options={{
          readOnly: isReadOnly,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontLigatures: true,
          fontSize: 14,
          lineHeight: 24,
          minimap: { enabled: false },
          renderLineHighlight: 'line',
          hideCursorInOverviewRuler: true,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          suggest: { showIcons: true },
          tabSize: 2,
        }}
      />
      {isReadOnly && (
        <div className="absolute top-3 right-4 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e2a3a] text-[#8a98b3]">
          read-only
        </div>
      )}
    </div>
  );
};
