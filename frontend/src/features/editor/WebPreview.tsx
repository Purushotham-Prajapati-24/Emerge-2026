import { useEffect, useState, useRef, useCallback } from 'react';

interface WebPreviewProps {
  isActive: boolean;
}

export const WebPreview = ({ isActive }: WebPreviewProps) => {
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Read the current HTML from Yjs first, then Monaco as fallback */
  const readCurrentCode = useCallback((): string => {
    // Try Yjs (collaborative doc) first — this is the source of truth
    const collabDoc = (window as any).__collabDoc;
    const storeGetState = (window as any).__collabStoreGetState;

    if (collabDoc && storeGetState) {
      const { activeFileId } = storeGetState();
      if (activeFileId) {
        try {
          const ytext = collabDoc.getText(activeFileId);
          const code = ytext.toString();
          if (code.trim()) return code;
        } catch (_) {}
      }
    }

    // Fallback: Monaco editor value
    const editor = (window as any).__monacoEditorInstance;
    return editor ? editor.getValue() : '';
  }, []);

  const refresh = useCallback(() => {
    const code = readCurrentCode();
    if (code.trim()) setSrcDoc(code);
  }, [readCurrentCode]);

  // Refresh when switching to preview
  useEffect(() => {
    if (isActive) refresh();
  }, [isActive, refresh]);

  // Auto-refresh every 2 s while preview is active and autoRefresh is on
  useEffect(() => {
    if (isActive && autoRefresh) {
      pollRef.current = setInterval(refresh, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isActive, autoRefresh, refresh]);

  return (
    <div className={`w-full h-full flex flex-col bg-white rounded-xl overflow-hidden ${!isActive ? 'hidden' : ''}`}>
      {/* Browser chrome bar */}
      <div className="flex items-center gap-3 px-4 h-9 bg-[#1e2a3a] border-b border-[#2d3a4a] flex-shrink-0 select-none">
        {/* Traffic lights */}
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>

        {/* URL bar */}
        <div className="flex-1 bg-[#0a0d12] rounded-md px-3 py-1 text-[10px] font-mono text-[#4a5568] select-none">
          preview://index.html
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            title={autoRefresh ? 'Auto-refresh ON (every 2s)' : 'Auto-refresh OFF'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-['Inter'] transition-all ${
              autoRefresh
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-[#0a0d12] text-[#4a5568] border border-[#2d3a4a]'
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={refresh}
            title="Refresh now"
            className="w-6 h-6 flex items-center justify-center text-[#4a5568] hover:text-[#f1f3fc] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>

      {/* iframe */}
      {srcDoc ? (
        <iframe
          ref={iframeRef}
          title="preview"
          srcDoc={srcDoc}
          className="w-full flex-1 border-none bg-white"
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0d12] gap-3 text-center px-6">
          <span className="text-4xl">🖼️</span>
          <p className="text-[#4a5568] text-sm font-['Inter']">
            Nothing to preview yet.
          </p>
          <p className="text-[#2d3748] text-xs font-['Inter']">
            Use the <span className="text-[#10b981]">Web Weaver AI</span> panel to generate a site, then come back here.
          </p>
        </div>
      )}
    </div>
  );
};
