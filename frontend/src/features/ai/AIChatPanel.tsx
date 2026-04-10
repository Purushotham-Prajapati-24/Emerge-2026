import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAIStore } from '../../store/useAIStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PROMPT_SHORTCUTS = [
  { label: '🔀 Fix Conflicts', prompt: 'Identify and fix any merge conflicts or logical conflicts in my code. Explain what was wrong.' },
  { label: '⚡ Optimize', prompt: 'Analyze my code for performance bottlenecks and suggest optimizations with explanations.' },
  { label: '🐛 Debug', prompt: 'Look for potential bugs, edge cases, or runtime errors in my code and explain how to fix them.' },
  { label: '📝 Document', prompt: 'Add clear JSDoc/docstring comments to my functions and explain the overall structure.' },
  { label: '♻️ Refactor', prompt: 'Suggest clean code refactoring improvements — better naming, smaller functions, reduced complexity.' },
  { label: '🧪 Test Cases', prompt: 'Generate comprehensive test cases for my code covering normal, edge, and error scenarios.' },
];
export const AIChatPanel = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { addMessage, clearHistory, getHistory } = useAIStore();
  
  // Get history for the current project or default to welcome message
  const messages = projectId ? getHistory(projectId) : [];
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(messages.length <= 1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getEditorCode = useCallback((): string => {
    const editorInstance = (window as any).__monacoEditorInstance;
    return editorInstance ? editorInstance.getValue() : '';
  }, []);

  const applyCodeToEditor = (code: string) => {
    const editorInstance = (window as any).__monacoEditorInstance;
    if (!editorInstance) return;
    
    const position = editorInstance.getPosition();
    if (position) {
      const textToInsert = '\n' + code + '\n';
      
      editorInstance.executeEdits("ai-insertion", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: textToInsert,
        forceMoveMarkers: true
      }]);
      editorInstance.focus();
    } else {
      const currentValue = editorInstance.getValue();
      editorInstance.setValue(currentValue ? currentValue + '\n' + code : code);
    }
  };

  const isPureCode = (content: string) => {
    const trimmed = content.trim();
    const codeBlockCount = (trimmed.match(/```/g) || []).length;
    
    // Case 1: Standard markdown code block(s) with minimal narrative text (headers are okay)
    const nonCodeParts = trimmed.split(/```[\s\S]*?```/g)
      .map(p => p.trim())
      .filter(p => {
        // Ignore markdown headers and very short separators
        const cleaned = p.replace(/^#+\s.*$/gm, '').trim();
        return cleaned.length > 0;
      });
    
    if (codeBlockCount >= 2 && nonCodeParts.length === 0) {
      return true;
    }

    // Case 2: No backticks at all, but looks like "pure code" 
    // (Very restrictive: no spaces in start/end that aren't indentation, no common conversation words)
    const conversationWords = ['sure', 'here', 'code', 'help', 'explain', 'hello', 'hi', 'problem', 'fix'];
    const lower = trimmed.toLowerCase();
    const hasConvWords = conversationWords.some(w => lower.includes(w));
    
    if (codeBlockCount === 0 && !hasConvWords && trimmed.length > 0) {
      // Heuristic: If it has semi-colons, brackets, or dots and is short-medium, might be pure code
      const codeMarkers = [';', '{', '}', '(', ')', '='];
      const hasMarkers = codeMarkers.some(m => trimmed.includes(m));
      return hasMarkers && trimmed.length < 500;
    }

    return false;
  };

  const renderMessageContent = (msg: Message) => {
    if (!hasCodeBlock(msg.content)) {
      return <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>;
    }

    const parts = msg.content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.startsWith('```')) {
            const match = part.match(/```(?:([a-z0-9+#-]+)\s*\n)?([\s\S]*?)```/i);
            const lang = match?.[1] || '';
            const code = match?.[2] || '';
            const pureCode = isPureCode(msg.content);
            
            return (
              <div key={idx} className="rounded-lg overflow-hidden border border-[#1e2a3a] bg-[#0a0d12]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#111720] border-b border-[#1e2a3a]">
                  <span className="text-[10px] text-[#8a98b3] font-mono lowercase">{lang || 'code'}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => applyCodeToEditor(code.trim())}
                      className="text-[10px] px-2 py-1 rounded bg-[#a78bfa]/15 text-[#a78bfa] hover:text-[#f1f3fc] border border-[#a78bfa]/30 hover:bg-[#a78bfa] transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                      title="Insert code into editor"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      Insert Code
                    </button>
                  )}
                </div>
                <pre className="p-3 text-xs font-['JetBrains_Mono',_monospace] text-[#c9d1d9] overflow-x-auto whitespace-pre-wrap m-0">
                  {code.trim()}
                </pre>
              </div>
            );
          } else {
            return part.trim() ? (
              <div key={idx} className="whitespace-pre-wrap text-[13px] leading-relaxed">
                {part.trim()}
              </div>
            ) : null;
          }
        })}
      </div>
    );
  };

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    if (projectId) addMessage(projectId, userMsg);
    setInput('');
    setLoading(true);
    setShowShortcuts(false);

    try {
      const codeContext = getEditorCode();
        
      const { data } = await api.post('/ai/chat', {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        codeContext: codeContext || '// No code in editor yet',
      });

      const assistantMsg: Message = { role: 'assistant', content: data.response };
      if (projectId) addMessage(projectId, assistantMsg);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'AI suggestion failed. Please try again.';
      if (projectId) addMessage(projectId, { role: 'assistant', content: `⚠ ${errMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const hasCodeBlock = (content: string) => content.includes('```');

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-sm">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-['Space_Grotesk'] font-semibold text-[#f1f3fc]">AI Assistant</p>
            <p className="text-xs text-[#8a98b3] font-['Inter']">Lead Architect · Strategic Guard</p>
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-[#1e2a3a] border-t-[#a78bfa] rounded-full animate-spin" />
          )}
          <button
            onClick={() => {
              if (projectId) {
                clearHistory(projectId);
                setShowShortcuts(true);
              }
            }}
            title="Clear chat"
            className="text-[#3a4458] hover:text-[#8a98b3] transition-colors text-xs font-['Inter']"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white'
                : 'bg-[#1e2a3a] text-[#8a98b3] font-["Inter"]'
            }`}>
              {msg.role === 'assistant' ? '🤖' : 'U'}
            </div>

            {/* Bubble Container */}
            <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'assistant' && isPureCode(msg.content) && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-[#8a98b3] font-semibold tracking-wide">Developer Companion</span>
                  <button
                    onClick={() => applyCodeToEditor(msg.content.replace(/```(?:\w+)?\s+/g, '').replace(/```/g, ''))}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 hover:bg-[#a78bfa]/20 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    title="Insert this code snippet"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    Insert Code
                  </button>
                </div>
              )}
              {/* Bubble Body */}
              <div className={`rounded-xl px-3.5 py-2.5 text-sm font-['Inter'] ${
                msg.role === 'assistant'
                  ? 'bg-[#111720] text-[#c9d1d9] border border-[#1e2a3a]'
                  : 'bg-[#a78bfa]/15 text-[#f1f3fc] border border-[#a78bfa]/25'
              }`}>
                {renderMessageContent(msg)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-sm">🤖</div>
            <div className="bg-[#111720] border border-[#1e2a3a] rounded-xl px-3.5 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a98b3] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a98b3] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a98b3] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick action shortcuts */}
      {showShortcuts && !loading && (
        <div className="px-3 pb-2 flex-shrink-0">
          <p className="text-xs text-[#3a4458] font-['Inter'] mb-2 pl-1">Quick Actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROMPT_SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.label}
                onClick={() => sendMessage(shortcut.prompt)}
                className="text-left px-3 py-2 rounded-lg bg-[#111720] border border-[#1e2a3a] text-xs text-[#8a98b3] font-['Inter'] hover:border-[#a78bfa]/30 hover:text-[#f1f3fc] hover:bg-[#1e2a3a] transition-all duration-150"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-end gap-2 rounded-xl bg-[#111720] border border-[#1e2a3a] focus-within:border-[#a78bfa]/40 transition-colors p-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
            rows={1}
            placeholder="Ask about your code... (Enter to send)"
            className="flex-1 bg-transparent text-sm text-[#f1f3fc] font-['Inter'] placeholder-[#3a4458] focus:outline-none resize-none px-3 py-2 max-h-24"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex-shrink-0 mb-1 mr-1 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white text-sm disabled:opacity-30 transition-opacity hover:opacity-90"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-[#3a4458] font-['Inter'] mt-1.5 pl-1">
          Sees your editor code automatically · Shift+Enter for newline
        </p>
      </form>
    </div>
  );
};
