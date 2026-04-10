import { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

// ─── Status types ────────────────────────────────────────────────────────────
type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; charCount: number }
  | { kind: 'error'; msg: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip any stray markdown fences the model might output despite instructions */
function stripFences(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z]*\n?/m, '')
    .replace(/```\s*$/m, '')
    .trim();
}

/** Inject code into the editor. Uses Yjs Y.Text (collaborative) when available,
 *  falls back to the Monaco instance setValue otherwise. */
function injectCodeToEditor(code: string) {
  const collabDoc = (window as any).__collabDoc;
  const activeFileId = (window as any).__collabActiveFileId;

  if (collabDoc && activeFileId) {
    try {
      const ytext = collabDoc.getText(activeFileId);
      collabDoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, code);
      });
      return; // done via Yjs
    } catch (_) {
      // fall through to Monaco
    }
  }

  // Fallback: direct Monaco setValue
  const editor = (window as any).__monacoEditorInstance;
  if (editor) {
    editor.setValue(code);
    editor.focus();
  }
}

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { emoji: '🏠', label: 'Landing page', prompt: 'Create a stunning dark-mode SaaS landing page with hero, features, and CTA.' },
  { emoji: '📊', label: 'Dashboard', prompt: 'Build a futuristic analytics dashboard with stat cards, a chart placeholder, and sidebar nav.' },
  { emoji: '🛒', label: 'Product page', prompt: 'Design a premium product page for a luxury watch brand with gallery and buy button.' },
  { emoji: '📝', label: 'Blog', prompt: 'Make a minimal blog homepage with featured article cards and dark/light toggle.' },
  { emoji: '🎨', label: 'Portfolio', prompt: 'Create a glassmorphism developer portfolio with projects grid and contact form.' },
  { emoji: '💳', label: 'Pricing', prompt: 'Design a three-tier SaaS pricing page with highlighted recommended plan.' },
];

// ─────────────────────────────────────────────────────────────────────────────

export const WebDevAIPanel = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose activeFileId globally so injectCodeToEditor can read it
  const syncActiveFile = useCallback(() => {
    const storeState = (window as any).__collabStoreGetState?.();
    if (storeState?.activeFileId) {
      (window as any).__collabActiveFileId = storeState.activeFileId;
    }
  }, []);

  const getEditorCode = useCallback((): string => {
    const editor = (window as any).__monacoEditorInstance;
    return editor ? editor.getValue() : '';
  }, []);

  const generate = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || status.kind === 'loading') return;

    syncActiveFile();
    setStatus({ kind: 'loading' });

    try {
      const codeContext = getEditorCode();
      const { data } = await api.post('/ai/web-generate', {
        prompt: trimmed,
        codeContext,
      });

      const clean = stripFences(data.response || '');
      if (!clean) {
        setStatus({ kind: 'error', msg: 'AI returned empty response.' });
        return;
      }

      injectCodeToEditor(clean);
      setStatus({ kind: 'success', charCount: clean.length });
      setInput('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Generation failed. Try again.';
      setStatus({ kind: 'error', msg });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(input);
  };

  const isLoading = status.kind === 'loading';

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-[#1e2a3a]">
      {/* ── Header ─────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-base shadow-[0_0_20px_rgba(16,185,129,0.35)]">
            ✦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-['Space_Grotesk'] font-semibold text-[#f1f3fc] leading-none">
              Web Weaver AI
            </p>
            <p className="text-[11px] text-[#4a6741] font-['Inter'] mt-0.5">
              Vibe → Code → Preview
            </p>
          </div>

          {isLoading && (
            <div className="w-4 h-4 border-2 border-[#1e2a3a] border-t-[#10b981] rounded-full animate-spin flex-shrink-0" />
          )}
        </div>
      </div>

      {/* ── Status Banner ──────────────────── */}
      {status.kind !== 'idle' && status.kind !== 'loading' && (
        <div
          className={`mx-3 mt-3 px-3 py-2.5 rounded-lg text-xs font-['Inter'] flex items-start gap-2 flex-shrink-0 ${
            status.kind === 'success'
              ? 'bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981]'
              : 'bg-red-900/15 border border-red-500/20 text-red-400'
          }`}
        >
          <span className="flex-shrink-0 mt-px">{status.kind === 'success' ? '✓' : '⚠'}</span>
          <span>
            {status.kind === 'success'
              ? `Generated ${status.charCount.toLocaleString()} chars → injected into index.html. Switch to Preview ↗`
              : status.msg}
          </span>
          <button
            onClick={() => setStatus({ kind: 'idle' })}
            className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Loading State ───────────────────── */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#10b981]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#10b981] animate-spin" />
            <div className="absolute inset-3 rounded-full bg-[#10b981]/10 flex items-center justify-center text-xl">
              ✦
            </div>
          </div>
          <div className="text-center">
            <p className="text-[#f1f3fc] text-sm font-['Space_Grotesk'] font-medium">Weaving your site...</p>
            <p className="text-[#4a5568] text-xs font-['Inter'] mt-1">Building HTML · CSS · JS</p>
          </div>
          <div className="flex gap-1.5 mt-1">
            {['#10b981', '#059669', '#047857'].map((c, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: c, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Idle empty state ─────────────────── */}
      {!isLoading && status.kind === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            ✦
          </div>
          <div>
            <h3 className="text-[#f1f3fc] font-['Space_Grotesk'] font-semibold text-base mb-1.5">
              Describe your vision
            </h3>
            <p className="text-[#4a5568] text-xs font-['Inter'] leading-relaxed max-w-[210px]">
              One sentence is enough. The AI will craft a complete, responsive, single-file HTML website and drop it straight into <code className="text-[#10b981]">index.html</code>.
            </p>
          </div>

          {/* Quick prompts grid */}
          <div className="w-full grid grid-cols-2 gap-1.5 mt-1">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => generate(q.prompt)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#111720] border border-[#1e2a3a] hover:border-[#10b981]/40 hover:bg-[#10b981]/5 transition-all text-left group"
              >
                <span className="text-sm flex-shrink-0">{q.emoji}</span>
                <span className="text-[11px] text-[#8a98b3] group-hover:text-[#f1f3fc] font-['Inter'] transition-colors">
                  {q.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Post-success Re-prompt nudge ─────── */}
      {!isLoading && status.kind === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 border border-[#10b981]/25 flex items-center justify-center text-xl">
            ✓
          </div>
          <p className="text-[#8a98b3] text-xs font-['Inter'] leading-relaxed max-w-[200px]">
            Code is live in the editor. Switch to <span className="text-[#a78bfa]">Preview</span> to see it, or type another prompt to iterate.
          </p>
        </div>
      )}

      {/* ── Input ────────────────────────────── */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#1e2a3a] flex-shrink-0 bg-[#0a0d12]">
        <div className="rounded-xl bg-[#111720] border border-[#1e2a3a] focus-within:border-[#10b981]/50 transition-colors shadow-inner overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            disabled={isLoading}
            rows={3}
            placeholder={
              isLoading
                ? 'Generating...'
                : "Describe your site's vibe...  (e.g. 'glassmorphism SaaS dashboard with dark mode')"
            }
            className="w-full bg-transparent text-sm text-[#f1f3fc] font-['Inter'] placeholder-[#2d3748] focus:outline-none resize-none px-3 py-3 max-h-40 disabled:opacity-40"
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#1a2332]">
            <span className="text-[10px] text-[#2d3748] font-['Inter']">↵ to generate · Shift+↵ newline</span>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981] text-[#022c22] text-xs font-['Inter'] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#34d399] active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            >
              {isLoading ? (
                'Generating…'
              ) : (
                <>
                  Vibe it
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
