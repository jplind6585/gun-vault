import { useState } from 'react';
import { theme } from './theme';

const ACRONYMS: Record<string, string> = {
  // Bullet types
  'FMJ':   'Full Metal Jacket',
  'JHP':   'Jacketed Hollow Point',
  'JSP':   'Jacketed Soft Point',
  'HP':    'Hollow Point',
  'CPHP':  'Copper Plated Hollow Point',
  'SJHP':  'Semi-Jacketed Hollow Point',
  'BTHP':  'Boat Tail Hollow Point',
  'FMJBT': 'Full Metal Jacket Boat Tail',
  'TMJ':   'Total Metal Jacket',
  'LRN':   'Lead Round Nose',
  'WC':    'Wadcutter',
  'SWC':   'Semi-Wadcutter',
  'SP':    'Soft Point',
  'FP':    'Flat Point',
  'RN':    'Round Nose',
  'OTM':   'Open Tip Match',
  'HPBT':  'Hollow Point Boat Tail',
  // Pressure
  '+P':    'Overpressure (+P) — higher velocity, more recoil',
  '+P+':   'Higher Overpressure (+P+) — maximum pressure, not for all guns',
  // Ballistics
  'FPS':   'Feet Per Second (muzzle velocity)',
  'FT-LBS':'Foot-Pounds (muzzle energy)',
  'GR':    'Grain (bullet weight; 437.5gr = 1 oz)',
  'BC':    'Ballistic Coefficient (how well it retains velocity)',
  'SD':    'Sectional Density (penetration potential)',
  'MOA':   'Minute of Angle (~1 inch at 100 yards)',
  // Industry
  'SAAMI': 'Sporting Arms and Ammunition Manufacturers\' Institute',
  'NATO':  'North Atlantic Treaty Organization (mil-spec ammunition)',
  'OAL':   'Overall Length (cartridge)',
  // Products (common brand lines users may not know)
  'HST':   'Federal HST — Hydra-Shok T-series (self-defense hollow point)',
  'XTP':   'Hornady XTP — eXtreme Terminal Performance hollow point',
};

interface AmmoAcronymProps {
  term: string; // e.g. "FMJ"
}

export function AmmoAcronym({ term }: AmmoAcronymProps) {
  const [open, setOpen] = useState(false);
  const upper = term.toUpperCase();
  const definition = ACRONYMS[upper] || ACRONYMS[term];

  if (!definition) return <span>{term}</span>;

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          cursor: 'default',
          color: 'inherit',
        }}
      >
        {term}
      </span>
      {open && (
        <>
          {/* Backdrop to close */}
          <div
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 3000 }}
          />
          <div style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.accent}`,
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: theme.textPrimary,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            zIndex: 3001,
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            minWidth: '180px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '9px', color: theme.accent, letterSpacing: '0.8px', marginBottom: '2px' }}>{upper}</div>
            <div style={{ color: theme.textPrimary }}>{definition}</div>
          </div>
        </>
      )}
    </span>
  );
}

// Helper: wraps bullet type text and makes known acronyms tappable
export function BulletTypeDisplay({ value }: { value: string }) {
  if (!value) return <span>—</span>;
  const upper = value.toUpperCase().trim();
  const known = ['FMJ','JHP','JSP','HP','CPHP','SJHP','BTHP','FMJBT','TMJ','LRN','WC','SWC','SP','FP','RN','OTM','HPBT'];
  if (known.includes(upper)) return <AmmoAcronym term={upper} />;
  return <span>{value}</span>;
}
