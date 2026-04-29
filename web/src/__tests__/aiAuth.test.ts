/**
 * Tests for AI auth + connectivity.
 *
 * Covers the most critical failure mode: the app's AI features silently
 * hang or fail because getAccessToken can't reach Supabase auth endpoints.
 *
 * Strategy:
 *  - Mock supabase.auth.refreshSession so tests don't hit the network
 *  - Set/clear the localStorage session key directly (same key Supabase JS uses)
 *  - Mock fetch for the edge function calls
 *  - Use fake timers to verify timeout behaviour without waiting 10s for real
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mock supabase before importing claudeApi ──────────────────────────────────
const { mockRefreshSession } = vi.hoisted(() => ({
  mockRefreshSession: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { refreshSession: mockRefreshSession },
  },
  SUPABASE_URL: 'https://joturvmcygdmpnhfsslu.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}));

import { testAiConnection } from '../claudeApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'sb-joturvmcygdmpnhfsslu-auth-token';
const VALID_TOKEN  = 'header.payload.sig';
const NOW_SECS     = () => Math.floor(Date.now() / 1000);
const FUTURE_EXP   = () => NOW_SECS() + 3600;  // 1 hour from now
const PAST_EXP     = () => NOW_SECS() - 3600;  // expired 1 hour ago

function setSession(token: string, expiresAt: number) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ access_token: token, expires_at: expiresAt }));
}

function mockFetchOk() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ text: 'PONG' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  ));
}

function mockFetchStatus(status: number, body: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  ));
}

function mockFetchHang() {
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => { /* never resolves */ })));
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AI connection — auth token', () => {
  it('reports authOk: false when localStorage is empty', async () => {
    mockFetchOk();
    const result = await testAiConnection();
    expect(result.authOk).toBe(false);
    expect(result.claudeOk).toBe(false);
  });

  it('reports authOk: false when token is expired', async () => {
    setSession(VALID_TOKEN, PAST_EXP());
    mockFetchOk();
    const result = await testAiConnection();
    expect(result.authOk).toBe(false);
  });

  it('uses localStorage token directly — does not call refreshSession when token is valid', async () => {
    setSession(VALID_TOKEN, FUTURE_EXP());
    mockFetchOk();

    const result = await testAiConnection();

    expect(result.authOk).toBe(true);
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it('sends the correct Authorization header to the edge function', async () => {
    setSession(VALID_TOKEN, FUTURE_EXP());
    mockFetchOk();

    await testAiConnection();

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/claude'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${VALID_TOKEN}`,
        }),
      }),
    );
  });

  it('falls back to refreshSession when token is expired and refresh succeeds', async () => {
    setSession(VALID_TOKEN, PAST_EXP());
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: { access_token: 'refreshed.token' } },
      error: null,
    });
    mockFetchOk();

    const result = await testAiConnection();

    expect(mockRefreshSession).toHaveBeenCalled();
    expect(result.authOk).toBe(true);
    expect(result.claudeOk).toBe(true);
  });
});

describe('AI connection — edge function responses', () => {
  beforeEach(() => {
    setSession(VALID_TOKEN, FUTURE_EXP());
  });

  it('reports all green on successful PONG response', async () => {
    mockFetchOk();
    const result = await testAiConnection();
    expect(result.authOk).toBe(true);
    expect(result.edgeFunctionOk).toBe(true);
    expect(result.claudeOk).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reports edgeFunctionOk: false on 500', async () => {
    mockFetchStatus(500, { error: 'Internal error' });
    const result = await testAiConnection();
    expect(result.authOk).toBe(true);
    expect(result.edgeFunctionOk).toBe(false);
    expect(result.claudeOk).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('reports correct status on 401 (bad token)', async () => {
    mockFetchStatus(401, { error: 'Unauthorized' });
    const result = await testAiConnection();
    expect(result.authOk).toBe(true);         // token was found in localStorage
    expect(result.claudeOk).toBe(false);       // but edge function rejected it
    expect(result.httpStatus).toBe(401);
  });

  it('reports correct status on 429 (budget exceeded)', async () => {
    mockFetchStatus(429, { error: 'budget_exceeded' });
    const result = await testAiConnection();
    expect(result.claudeOk).toBe(false);
    expect(result.httpStatus).toBe(429);
  });
});

describe('AI connection — timeout', () => {
  it('resolves within 10s when fetch hangs — does not hang the UI', async () => {
    vi.useFakeTimers();
    setSession(VALID_TOKEN, FUTURE_EXP());
    mockFetchHang();

    const resultPromise = testAiConnection();

    // Advance past both the inner AbortController (10s) and outer race (10s)
    await vi.advanceTimersByTimeAsync(11_000);

    const result = await resultPromise;

    expect(result.claudeOk).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  });

  it('resolves quickly when auth is missing — does not block on network', async () => {
    // No session, refreshSession hangs
    mockRefreshSession.mockReturnValue(new Promise(() => {}));
    mockFetchOk();

    vi.useFakeTimers();
    const resultPromise = testAiConnection();

    // Advance past refreshSession timeout (8s) + outer race (10s)
    await vi.advanceTimersByTimeAsync(11_000);

    const result = await resultPromise;

    expect(result.authOk).toBe(false);
  });
});
