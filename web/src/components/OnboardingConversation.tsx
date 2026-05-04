// Onboarding Conversation — modal overlay, 4-5 turn AI setup wizard
// Triggers when totalSessions >= 3 and onboardingCompleted === false.
// Saves goals + marks profile complete on finish.

import { useState, useRef, useEffect, useCallback } from 'react';
import { theme } from './theme';
import { callOnboardingAssistant, extractOnboardingGoals, buildFullContext } from './claudeApi';
import { getAllGuns, getAllSessions, getAllAmmo } from './storage';
import { getStoredProfile, saveProfile, dismissOnboarding } from './profileStorage';
import type { ShooterGoal } from './shooterProfile';

interface Props {
  onComplete: () => void;
  onDismiss: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;       // display content (PROFILE_READY stripped)
  rawContent?: string;   // full AI response before stripping
}

function IconSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={theme.accent} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M19 16L19.75 19L22 19.75L19.75 20.5L19 23L18.25 20.5L16 19.75L18.25 19L19 16Z" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 0 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          backgroundColor: theme.accent, opacity: 0.6,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.3);opacity:1} }`}</style>
    </div>
  );
}

export function OnboardingConversation({ onComplete, onDismiss }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultContext, setVaultContext] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedRef = useRef(false);

  // Build context once
  useEffect(() => {
    const guns = getAllGuns();
    const sessions = getAllSessions();
    const ammo = getAllAmmo();
    const profile = getStoredProfile();
    setVaultContext(buildFullContext(guns, sessions, ammo, profile));
  }, []);

  // Kick off AI opening message once context is ready
  const startConversation = useCallback(async (ctx: string) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    try {
      const reply = await callOnboardingAssistant(ctx, [
        { role: 'user', content: '__start__' },
      ]);
      const { display, ready } = parseAiMessage(reply);
      setMessages([{ role: 'assistant', content: display, rawContent: reply }]);
      if (ready) setProfileReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (!msg.startsWith('FEATURE_LIMIT:') && !msg.startsWith('BUDGET_EXCEEDED')) {
        setError(msg || 'Failed to start — sign in to use AI features.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vaultContext) startConversation(vaultContext);
  }, [vaultContext, startConversation]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function parseAiMessage(raw: string): { display: string; ready: boolean } {
    const ready = raw.includes('PROFILE_READY');
    const display = raw.replace(/PROFILE_READY/g, '').trim();
    return { display, ready };
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || saving) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.rawContent ?? m.content }));
      const reply = await callOnboardingAssistant(vaultContext, apiMessages);
      const { display, ready } = parseAiMessage(reply);
      setMessages(prev => [...prev, { role: 'assistant', content: display, rawContent: reply }]);
      if (ready) setProfileReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (!msg.startsWith('FEATURE_LIMIT:') && !msg.startsWith('BUDGET_EXCEEDED')) {
        setError(msg || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    try {
      const apiMessages = messages.map(m => ({ role: m.role, content: m.rawContent ?? m.content }));
      const extracted = await extractOnboardingGoals(vaultContext, apiMessages);

      const existing = getStoredProfile();
      if (existing) {
        const goals: ShooterGoal[] = extracted.goals.map((text, i) => ({
          id: `onboarding-${Date.now()}-${i}`,
          text,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          sourceConversationId: 'onboarding',
        }));

        saveProfile({
          ...existing,
          goals: [...(existing.goals ?? []), ...goals],
          onboardingCompleted: true,
          onboardingConversationId: 'onboarding',
          updatedAt: new Date().toISOString(),
        });
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile.');
      setSaving(false);
    }
  }

  function handleDismiss() {
    dismissOnboarding();
    onDismiss();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  }

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  return (
    // Backdrop
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      backgroundColor: 'rgba(7,7,26,0.85)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Sheet */}
      <div style={{
        backgroundColor: theme.bg,
        borderRadius: '20px 20px 0 0',
        border: `1px solid ${theme.border}`,
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        maxHeight: '88dvh',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 12px',
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: theme.accentDim,
              border: `1px solid ${theme.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSparkle size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>Set Up Your Profile</div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>A few quick questions</div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none', color: theme.textMuted,
              fontSize: 13, cursor: 'pointer', padding: '4px 8px',
            }}
          >
            Later
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {loading && messages.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <AvatarDot />
              <Bubble side="assistant"><TypingDots /></Bubble>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
              {msg.role === 'assistant' && <AvatarDot />}
              <Bubble side={msg.role}>
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
              </Bubble>
            </div>
          ))}

          {loading && messages.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <AvatarDot />
              <Bubble side="assistant"><TypingDots /></Bubble>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              backgroundColor: `${theme.red}18`, border: `1px solid ${theme.red}44`,
              color: theme.red, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Profile ready — save button */}
          {profileReady && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  padding: '14px',
                  backgroundColor: saving ? theme.surface : theme.accent,
                  border: 'none', borderRadius: 12,
                  color: saving ? theme.textMuted : '#07071a',
                  fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace', letterSpacing: '0.5px',
                  transition: 'background-color 0.15s',
                }}
              >
                {saving ? 'Saving...' : 'Save My Profile'}
              </button>
              <div style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center' }}>
                Your goals and profile will be used to personalize AI responses.
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input — hidden once profile is ready */}
        {!profileReady && (
          <div style={{
            padding: '10px 12px 12px',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.bg,
            display: 'flex', gap: 8, alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? 'Waiting...' : 'Type your answer…'}
              rows={1}
              disabled={loading || messages.length === 0}
              style={{
                flex: 1, backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`, borderRadius: 18,
                padding: '10px 14px', color: theme.textPrimary,
                fontSize: 14, resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.45, maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                backgroundColor: !input.trim() || loading ? theme.surface : theme.accent,
                border: `1px solid ${!input.trim() || loading ? theme.border : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={!input.trim() || loading ? theme.textMuted : '#07071a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={!input.trim() || loading ? theme.textMuted : '#07071a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarDot() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      backgroundColor: theme.accentDim, border: `1px solid ${theme.accent}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconSparkle size={12} />
    </div>
  );
}

function Bubble({ side, children }: { side: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div style={{
      maxWidth: '80%',
      padding: '10px 14px',
      borderRadius: side === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      backgroundColor: side === 'user' ? theme.accent : theme.surface,
      color: side === 'user' ? '#07071a' : theme.textPrimary,
      fontSize: 14, lineHeight: 1.55,
      border: side === 'assistant' ? `1px solid ${theme.border}` : 'none',
    }}>
      {children}
    </div>
  );
}
