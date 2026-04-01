import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom's localStorage stub may lack full API — replace with a simple in-memory implementation.
function makeLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key:        (i: number) => Object.keys(store)[i] ?? null,
  };
}

vi.stubGlobal('localStorage', makeLocalStorage());
