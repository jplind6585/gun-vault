// Haptic feedback utility — Android only, no-op on iOS/desktop
export function haptic(ms = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}
