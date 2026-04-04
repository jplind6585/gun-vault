// Armory Assistant — conversational AI with full vault context
import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import { callArmoryAssistant, buildVaultContext } from './claudeApi';
import { getAllGuns } from './storage';
import { getAllSessions } from './storage';
import { getAllAmmoLots } from './storage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "What guns in my vault are due for cleaning?",
  "How is my shooting trending over the last month?",
  "What ammo do I have and what's running low?",
  "Compare 6.5 Creedmoor vs .308 for long-range hunting",
  "What should I focus on in my next range session?",
  "Give me a drill recommendation for improving my groups",
];

// ── Icons ────────────────────────────────────────────────────────────────────

function IconSend({ color = '#07071a' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSparkle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={theme.accent} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M19 16L19.75 19L22 19.75L19.75 20.5L19 23L18.25 20.5L16 19.75L18.25 19L19 16Z" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 0 4px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: theme.accent,
            opacity: 0.6,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ArmoryAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultContext, setVaultContext] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build vault context once on mount
  useEffect(() => {
    const guns = getAllGuns();
    const sessions = getAllSessions();
    const ammo = getAllAmmoLots();
    setVaultContext(buildVaultContext(guns, sessions, ammo));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const reply = await callArmoryAssistant(vaultContext, nextMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      backgroundColor: theme.bg,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>

      {/* ── Messages area ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>

        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, paddingBottom: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: theme.accentDim,
              border: `1px solid ${theme.accent}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <IconSparkle size={26} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: theme.textPrimary, marginBottom: 6 }}>
              Armory Assistant
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              Ask anything about your vault, ammo, sessions, or the cartridge database.
            </div>

            {/* Suggested prompts */}
            <div style={{ marginTop: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    background: 'none',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: theme.textSecondary,
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = theme.accent + '88';
                    (e.currentTarget as HTMLButtonElement).style.color = theme.textPrimary;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = theme.border;
                    (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary;
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: theme.accentDim,
                border: `1px solid ${theme.accent}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                flexShrink: 0,
                alignSelf: 'flex-end',
              }}>
                <IconSparkle size={14} />
              </div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: msg.role === 'user' ? theme.accent : theme.surface,
              color: msg.role === 'user' ? '#07071a' : theme.textPrimary,
              fontSize: 14,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: msg.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: theme.accentDim,
              border: `1px solid ${theme.accent}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconSparkle size={14} />
            </div>
            <div style={{
              padding: '8px 14px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            backgroundColor: `${theme.red}18`,
            border: `1px solid ${theme.red}44`,
            color: theme.red,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Clear conversation */}
        {messages.length >= 2 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            <button
              onClick={() => { setMessages([]); setError(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.textMuted,
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Clear conversation
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: `1px solid ${theme.border}`,
        backgroundColor: theme.bg,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your vault…"
          rows={1}
          style={{
            flex: 1,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            padding: '10px 14px',
            color: theme.textPrimary,
            fontSize: 14,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            maxHeight: 120,
            overflowY: 'auto',
          }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: !input.trim() || loading ? theme.surface : theme.accent,
            border: `1px solid ${!input.trim() || loading ? theme.border : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
        >
          <IconSend color={!input.trim() || loading ? theme.textMuted : '#07071a'} />
        </button>
      </div>

    </div>
  );
}
