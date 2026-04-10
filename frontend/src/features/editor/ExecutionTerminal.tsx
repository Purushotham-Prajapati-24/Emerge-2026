import { useState, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';

const MAX_HISTORY = 50;

interface ExecutionTerminalProps {
  defaultLanguage?: string;
}

export const ExecutionTerminal = ({ defaultLanguage = 'javascript' }: ExecutionTerminalProps) => {
  const [output, setOutput] = useState<string[]>(['// Terminal ready. Run code to see output.']);
  const [input] = useState('');
  const [running, setRunning] = useState(false);
  const { accessToken } = useAuthStore();
  const { files, activeFileId } = useCollaborationStore();
  
  const language = files.find(f => f.id === activeFileId)?.language || defaultLanguage;

  const getEditorContent = useCallback((): string => {
    // Read code from Monaco editor global registry if available
    const editorInstance = (window as any).__monacoEditorInstance;
    if (editorInstance) {
      return editorInstance.getValue();
    }
    // Fallback: use terminal input area as code
    return input;
  }, [input]);

  const runCode = async () => {
    if (!accessToken) {
      setOutput((prev) => [...prev.slice(-MAX_HISTORY), '⚠ Please log in to execute code.']);
      return;
    }

    const code = getEditorContent();
    if (!code.trim()) {
      setOutput((prev) => [...prev.slice(-MAX_HISTORY), '// No code to execute.']);
      return;
    }

    setRunning(true);
    setOutput((prev) => [
      ...prev.slice(-MAX_HISTORY),
      `$ Running ${language} code...`,
      '─'.repeat(40),
    ]);

    try {
      const { data } = await api.post('/execute', { code, language });
      const lines = (data.output || '').split('\n');
      setOutput((prev) => [
        ...prev.slice(-MAX_HISTORY),
        ...lines,
        '─'.repeat(40),
        `✓ Execution complete`,
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.output || 'Execution failed';
      setOutput((prev) => [
        ...prev.slice(-MAX_HISTORY),
        `✗ Error: ${msg}`,
      ]);
    } finally {
      setRunning(false);
    }
  };

  const clearTerminal = () => {
    setOutput(['// Terminal cleared.']);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] font-['JetBrains_Mono',_monospace]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0d12] border-b border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-[#8a98b3] ml-2">
            Terminal — {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="text-xs text-[#3a4458] hover:text-[#8a98b3] font-['Inter'] transition-colors"
          >
            Clear
          </button>
          <button
            onClick={runCode}
            disabled={running}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-['Inter'] font-medium transition-all duration-200 ${
              running
                ? 'bg-[#1e2a3a] text-[#3a4458] cursor-not-allowed'
                : 'bg-[#28c840]/15 text-[#28c840] border border-[#28c840]/30 hover:bg-[#28c840]/25'
            }`}
          >
            {running ? (
              <>
                <span className="w-3 h-3 border border-[#3a4458] border-t-[#8a98b3] rounded-full animate-spin" />
                Running
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
        {output.map((line, i) => (
          <div
            key={i}
            className={`${
              line.startsWith('✗')
                ? 'text-red-400'
                : line.startsWith('✓')
                ? 'text-[#28c840]'
                : line.startsWith('$')
                ? 'text-[#a78bfa]'
                : line.startsWith('─')
                ? 'text-[#1e2a3a]'
                : 'text-[#c9d1d9]'
            }`}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
