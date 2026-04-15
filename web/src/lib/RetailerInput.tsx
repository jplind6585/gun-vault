import { useState, useEffect, useRef } from 'react';
import { theme } from '../theme';
import { searchRetailers } from './referenceData';

interface RetailerInputProps {
  category: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

/**
 * Purchased From autocomplete backed by the Supabase `retailers` table.
 * Featured retailers appear first, separated by a subtle divider.
 * Free text entry is always allowed — unrecognized values save as-is.
 */
export function RetailerInput({ category, value, onChange, placeholder, style }: RetailerInputProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ name: string; featured: boolean }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRetailers(category, value).then(setOptions);
  }, [category, value]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const featured = options.filter(o => o.featured);
  const rest = options.filter(o => !o.featured);
  const hasDivider = featured.length > 0 && rest.length > 0;

  const rowStyle = (name: string): React.CSSProperties => ({
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: name.toLowerCase() === value.toLowerCase() ? theme.accent : theme.textSecondary,
    cursor: 'pointer',
    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
    backgroundColor: name.toLowerCase() === value.toLowerCase() ? 'rgba(255,212,59,0.08)' : 'transparent',
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={style}
      />
      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#1a1a1a', border: '0.5px solid ' + theme.border,
          borderRadius: '6px', overflow: 'hidden', maxHeight: '180px', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {featured.map(opt => (
            <div
              key={opt.name}
              onMouseDown={e => { e.preventDefault(); onChange(opt.name); setOpen(false); }}
              style={rowStyle(opt.name)}
            >
              {opt.name}
            </div>
          ))}
          {hasDivider && (
            <div style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          )}
          {rest.map(opt => (
            <div
              key={opt.name}
              onMouseDown={e => { e.preventDefault(); onChange(opt.name); setOpen(false); }}
              style={rowStyle(opt.name)}
            >
              {opt.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
