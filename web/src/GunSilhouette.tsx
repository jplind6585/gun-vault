// Clean, recognizable gun silhouettes using geometric shapes
import type { Gun } from './types';

interface GunSilhouetteProps {
  gun: Gun;
  color?: string;
  size?: number;
}

export function GunSilhouette({ gun, color = 'rgba(255,255,255,0.9)', size = 140 }: GunSilhouetteProps) {
  const model = gun.model.toLowerCase();
  const type = gun.type.toLowerCase();

  // AR-15 / Modern Rifle
  if (model.includes('ar-15') || model.includes('ar15') || model.includes('m4') || model.includes('m16')) {
    return (
      <svg width={size} height={size * 0.4} viewBox="0 0 200 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Stock */}
        <rect x="5" y="35" width="25" height="12" fill={color} />
        {/* Receiver */}
        <rect x="30" y="32" width="35" height="18" fill={color} />
        {/* Magazine */}
        <rect x="50" y="50" width="12" height="20" fill={color} />
        {/* Pistol grip */}
        <path d="M45,50 L52,50 L52,68 L48,72 L42,72 L40,68 L40,58 Z" fill={color} />
        {/* Handguard */}
        <rect x="65" y="34" width="60" height="14" fill={color} />
        {/* Barrel */}
        <rect x="125" y="37" width="65" height="8" fill={color} />
        {/* Front sight */}
        <rect x="120" y="32" width="3" height="6" fill={color} />
        {/* Rear sight */}
        <rect x="85" y="28" width="3" height="6" fill={color} />
      </svg>
    );
  }

  // AK-47 / AK Style
  if (model.includes('ak')) {
    return (
      <svg width={size} height={size * 0.4} viewBox="0 0 200 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Stock */}
        <path d="M5,38 L28,38 L28,48 L5,48 Z" fill={color} />
        {/* Receiver */}
        <rect x="28" y="34" width="40" height="18" fill={color} />
        {/* Magazine */}
        <path d="M55,52 L65,52 L68,70 L52,70 Z" fill={color} />
        {/* Pistol grip */}
        <path d="M48,52 L55,52 L55,68 L50,72 L44,72 L42,68 Z" fill={color} />
        {/* Handguard/Gas tube */}
        <rect x="68" y="36" width="55" height="12" fill={color} />
        {/* Barrel */}
        <rect x="123" y="38" width="65" height="8" fill={color} />
        {/* Front sight */}
        <rect x="118" y="32" width="4" height="8" fill={color} />
      </svg>
    );
  }

  // Pistol (Glock/Modern Semi-Auto style)
  if (type.includes('pistol') || model.includes('glock') || model.includes('m&p') || model.includes('p320')) {
    return (
      <svg width={size * 0.7} height={size * 0.5} viewBox="0 0 120 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Grip */}
        <rect x="15" y="48" width="18" height="28" rx="2" fill={color} />
        {/* Trigger guard */}
        <path d="M28,48 L35,48 L35,54 L30,58 L28,58 Z" fill={color} />
        {/* Slide */}
        <rect x="20" y="32" width="75" height="16" rx="1" fill={color} />
        {/* Barrel */}
        <rect x="95" y="36" width="20" height="8" fill={color} />
        {/* Magazine */}
        <rect x="18" y="76" width="14" height="20" fill={color} opacity="0.8" />
        {/* Sights */}
        <rect x="88" y="28" width="3" height="6" fill={color} />
        <rect x="35" y="28" width="3" height="6" fill={color} />
      </svg>
    );
  }

  // Revolver
  if (model.includes('revolver') || model.includes('python') || model.includes('586') || model.includes('686')) {
    return (
      <svg width={size * 0.7} height={size * 0.5} viewBox="0 0 120 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Grip */}
        <path d="M20,48 L35,48 L35,72 L30,76 L25,76 L20,72 Z" fill={color} />
        {/* Frame */}
        <rect x="35" y="36" width="25" height="16" fill={color} />
        {/* Cylinder */}
        <circle cx="52" cy="44" r="10" fill={color} />
        {/* Barrel */}
        <rect x="60" y="40" width="50" height="8" fill={color} />
        {/* Front sight */}
        <rect x="105" y="36" width="3" height="6" fill={color} />
        {/* Hammer */}
        <rect x="38" y="30" width="6" height="8" fill={color} />
      </svg>
    );
  }

  // Shotgun (Pump/Semi-Auto)
  if (type.includes('shotgun')) {
    return (
      <svg width={size} height={size * 0.4} viewBox="0 0 200 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Stock */}
        <rect x="5" y="36" width="30" height="12" rx="2" fill={color} />
        {/* Receiver */}
        <rect x="35" y="34" width="35" height="16" fill={color} />
        {/* Trigger/Grip area */}
        <path d="M50,50 L58,50 L58,64 L54,68 L48,68 L46,64 Z" fill={color} />
        {/* Forend */}
        <rect x="70" y="36" width="35" height="12" fill={color} />
        {/* Magazine tube */}
        <rect x="105" y="40" width="75" height="6" fill={color} />
        {/* Barrel */}
        <rect x="105" y="38" width="85" height="8" fill={color} opacity="0.9" />
        {/* Front bead */}
        <circle cx="188" cy="42" r="2" fill={color} />
      </svg>
    );
  }

  // Bolt Action Rifle
  if (model.includes('700') || model.includes('howa') || model.includes('tikka') || model.includes('bergara')) {
    return (
      <svg width={size} height={size * 0.35} viewBox="0 0 200 70" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Stock */}
        <path d="M5,36 L35,36 L35,32 L45,32 L45,48 L35,48 L35,44 L5,44 Z" fill={color} />
        {/* Receiver */}
        <rect x="45" y="34" width="30" height="12" fill={color} />
        {/* Bolt handle */}
        <rect x="60" y="30" width="4" height="8" fill={color} />
        {/* Scope mount */}
        <rect x="50" y="28" width="40" height="4" fill={color} opacity="0.6" />
        {/* Barrel */}
        <rect x="75" y="37" width="110" height="6" fill={color} />
        {/* Muzzle */}
        <rect x="183" y="36" width="12" height="8" fill={color} />
      </svg>
    );
  }

  // Generic rifle fallback
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 200 80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
      {/* Stock */}
      <rect x="5" y="36" width="28" height="12" rx="2" fill={color} />
      {/* Receiver */}
      <rect x="33" y="34" width="35" height="16" fill={color} />
      {/* Trigger */}
      <path d="M48,50 L54,50 L54,60 L50,64 L46,64 Z" fill={color} />
      {/* Barrel */}
      <rect x="68" y="38" width="115" height="8" fill={color} />
      {/* Front sight */}
      <rect x="175" y="34" width="3" height="6" fill={color} />
    </svg>
  );
}
