// Onboarding progress — tracks explicit user actions for the get-started checklist.
// Separate from core data storage (storage.ts covers Gun/Session/Ammo data).
// All flags are boolean presence keys — set once, never cleared.

const OB_GUN     = 'lindcott_ob_gun';
const OB_SESSION = 'lindcott_ob_session';
const OB_AMMO    = 'lindcott_ob_ammo';
const OB_AI      = 'lindcott_ob_ai';
const OB_DISMISS = 'lindcott_ob_dismiss';

export interface ObProgress {
  gunAdded: boolean;
  sessionLogged: boolean;
  ammoAdded: boolean;
  aiUsed: boolean;
  dismissed: boolean;
}

export function getObProgress(): ObProgress {
  return {
    gunAdded:      !!localStorage.getItem(OB_GUN),
    sessionLogged: !!localStorage.getItem(OB_SESSION),
    ammoAdded:     !!localStorage.getItem(OB_AMMO),
    aiUsed:        !!localStorage.getItem(OB_AI),
    dismissed:     !!localStorage.getItem(OB_DISMISS),
  };
}

export function markObAction(action: 'gun' | 'session' | 'ammo' | 'ai'): void {
  const key = { gun: OB_GUN, session: OB_SESSION, ammo: OB_AMMO, ai: OB_AI }[action];
  if (localStorage.getItem(key)) return; // already set — no-op
  localStorage.setItem(key, '1');
  window.dispatchEvent(new Event('ob-progress'));
}

export function dismissObChecklist(): void {
  localStorage.setItem(OB_DISMISS, '1');
}

export function isChecklistVisible(): boolean {
  const p = getObProgress();
  if (p.dismissed) return false;
  // All four done → auto-hide (component handles the "all set" animation)
  return true;
}
