// Three clean inline SVG gun silhouettes — no PNG dependencies
import type { Gun } from './types';

interface SilhouetteProps {
  gun: Gun;
  color?: string;
  size?: number;
}

type GunIconType = 'pistol' | 'rifle' | 'shotgun';

function getIconType(gun: Gun): GunIconType {
  const type   = gun.type.toLowerCase();
  const action = gun.action.toLowerCase();
  if (type === 'shotgun') return 'shotgun';
  if (type === 'pistol' || action === 'revolver') return 'pistol';
  return 'rifle'; // rifle, NFA, suppressor, etc.
}

export function GunSilhouetteImage({ gun, color = 'rgba(255,255,255,0.85)', size = 180 }: SilhouetteProps) {
  const iconType = getIconType(gun);
  const w = size;
  const h = Math.round(size * 0.55);

  if (iconType === 'pistol') {
    return (
      <svg viewBox="0 0 80 55" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
        {/* Slide */}
        <rect x="10" y="3" width="50" height="18" rx="3"/>
        {/* Barrel extension */}
        <rect x="58" y="7" width="18" height="10" rx="2"/>
        {/* Lower frame */}
        <rect x="10" y="21" width="34" height="9" rx="2"/>
        {/* Grip */}
        <rect x="10" y="28" width="15" height="24" rx="3"/>
        {/* Trigger guard */}
        <path d="M 18 30 Q 27 42 36 30 L 34 28 Q 27 38 20 28 Z"/>
      </svg>
    );
  }

  if (iconType === 'shotgun') {
    return (
      <svg viewBox="0 0 120 40" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
        {/* Stock */}
        <path d="M 0 11 L 22 11 L 22 29 L 8 29 L 0 22 Z"/>
        {/* Receiver */}
        <rect x="20" y="7" width="26" height="22" rx="2"/>
        {/* Barrel */}
        <rect x="44" y="8" width="72" height="11" rx="5.5"/>
        {/* Magazine tube */}
        <rect x="44" y="21" width="64" height="8" rx="4"/>
        {/* Trigger area */}
        <rect x="32" y="29" width="11" height="9" rx="2"/>
      </svg>
    );
  }

  // Rifle
  return (
    <svg viewBox="0 0 120 40" width={w} height={h} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Stock */}
      <path d="M 0 13 L 20 13 L 20 27 L 7 27 L 0 20 Z"/>
      {/* Receiver / upper */}
      <rect x="18" y="7" width="34" height="18" rx="2"/>
      {/* Handguard + barrel */}
      <rect x="50" y="9" width="66" height="14" rx="2"/>
      {/* Pistol grip */}
      <path d="M 40 25 L 47 25 L 51 39 L 38 39 Z"/>
      {/* Magazine */}
      <rect x="26" y="25" width="13" height="13" rx="2"/>
    </svg>
  );
}
