// Detailed inline SVG gun silhouettes — no PNG dependencies
import type { Gun } from './types';

interface SilhouetteProps {
  gun: Gun;
  color?: string;
  size?: number;
}

type GunIconType = 'pistol' | 'revolver' | 'rifle' | 'shotgun';

function getIconType(gun: Gun): GunIconType {
  const type   = gun.type.toLowerCase();
  const action = gun.action.toLowerCase();
  if (type === 'shotgun') return 'shotgun';
  if (action === 'revolver') return 'revolver';
  if (type === 'pistol') return 'pistol';
  return 'rifle';
}

export function GunSilhouetteImage({ gun, color = 'rgba(255,255,255,0.85)', size = 180 }: SilhouetteProps) {
  const iconType = getIconType(gun);
  const w = size;
  const h = Math.round(size * 0.55);

  if (iconType === 'pistol') {
    // Semi-auto pistol pointing right (Glock/M&P style)
    return (
      <svg viewBox="0 0 100 62" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
        {/* Slide */}
        <rect x="12" y="3" width="68" height="19" rx="3"/>
        {/* Barrel protrusion at muzzle */}
        <rect x="77" y="6" width="16" height="12" rx="6"/>
        {/* Frame / lower receiver */}
        <rect x="12" y="21" width="44" height="9" rx="2"/>
        {/* Trigger guard ring */}
        <path d="M 22 29 Q 20 45 38 45 Q 56 45 57 29 L 54 29 Q 53 42 38 42 Q 24 42 25 29 Z"/>
        {/* Grip (slightly angled) */}
        <path d="M 12 25 L 25 25 L 28 58 L 9 58 Z"/>
      </svg>
    );
  }

  if (iconType === 'revolver') {
    // Revolver pointing right (S&W / Colt style)
    return (
      <svg viewBox="0 0 100 62" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
        {/* Barrel */}
        <rect x="44" y="3" width="52" height="13" rx="4"/>
        {/* Top strap / frame above cylinder */}
        <rect x="32" y="3" width="14" height="26" rx="2"/>
        {/* Cylinder — distinctive revolver bulge */}
        <ellipse cx="44" cy="28" rx="17" ry="17"/>
        {/* Frame below cylinder */}
        <rect x="28" y="38" width="18" height="10" rx="2"/>
        {/* Grip */}
        <path d="M 26 36 L 42 36 L 44 60 L 22 60 Z"/>
        {/* Trigger guard */}
        <path d="M 32 46 Q 30 58 44 58 Q 58 58 58 46 L 55 46 Q 55 54 44 55 Q 33 54 35 46 Z"/>
        {/* Hammer spur */}
        <rect x="26" y="2" width="9" height="8" rx="2"/>
      </svg>
    );
  }

  if (iconType === 'shotgun') {
    // Pump-action shotgun pointing right
    return (
      <svg viewBox="0 0 132 44" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
        {/* Buttstock */}
        <path d="M 0 12 L 18 12 L 20 8 L 27 8 L 27 36 L 20 36 L 18 32 L 0 32 Z"/>
        {/* Wrist / action bar */}
        <rect x="23" y="8" width="10" height="28" rx="2"/>
        {/* Receiver */}
        <rect x="29" y="5" width="26" height="26" rx="2"/>
        {/* Trigger guard */}
        <path d="M 33 31 Q 31 43 43 43 Q 55 43 55 31 L 52 31 Q 52 40 43 40 Q 34 40 36 31 Z"/>
        {/* Barrel (top) */}
        <rect x="53" y="5" width="77" height="12" rx="4"/>
        {/* Magazine tube (bottom, pump shotgun) */}
        <rect x="53" y="19" width="65" height="8" rx="4"/>
        {/* Forend / pump handle */}
        <rect x="66" y="16" width="20" height="14" rx="3"/>
      </svg>
    );
  }

  // Rifle — AR-15 / modern sporting rifle pointing right
  return (
    <svg viewBox="0 0 142 46" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Buttstock (AR collapsible-style) */}
      <path d="M 0 17 L 14 17 L 16 13 L 21 13 L 21 31 L 16 31 L 14 27 L 0 27 Z"/>
      {/* Buffer tube */}
      <rect x="19" y="16" width="14" height="10" rx="5"/>
      {/* Lower receiver */}
      <rect x="30" y="16" width="22" height="18" rx="2"/>
      {/* Pistol grip */}
      <path d="M 43 34 L 52 34 L 54 45 L 41 45 Z"/>
      {/* Magazine (curved, STANAG style) */}
      <path d="M 33 34 L 43 34 L 45 45 L 31 45 Z"/>
      {/* Upper receiver */}
      <rect x="30" y="6" width="24" height="11" rx="2"/>
      {/* Charging handle */}
      <rect x="47" y="4" width="5" height="4" rx="1"/>
      {/* Handguard */}
      <rect x="52" y="7" width="50" height="12" rx="3"/>
      {/* Gas block bump */}
      <rect x="98" y="6" width="7" height="7" rx="1"/>
      {/* Barrel */}
      <rect x="99" y="9" width="42" height="6" rx="3"/>
      {/* Muzzle device */}
      <rect x="138" y="7" width="4" height="10" rx="1"/>
    </svg>
  );
}
