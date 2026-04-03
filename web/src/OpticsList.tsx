import { useState, useEffect } from 'react';
import { theme } from './theme';
import type { Optic, OpticAssignment } from './types';
import {
  getAllOptics, getAllAssignments, getActiveAssignmentForOptic,
  addOptic, updateOptic, getMountsForOptic,
} from './storage';
import { getAllGuns } from './storage';

interface OpticsListProps {
  onSelectOptic: (optic: Optic) => void;
}

const OPTIC_TYPE_COLORS: Record<string, string> = {
  'Red Dot':    theme.red,
  'Holographic': theme.orange,
  'LPVO':       theme.accent,
  'Scope':      theme.blue,
  'Prism':      theme.green,
  'Night Vision': '#b197fc',
  'Thermal':    '#ff8787',
  'Magnifier':  theme.textSecondary,
  'Rangefinder': '#63e6be',
};

const OPTIC_TYPES = [
  'Red Dot', 'Holographic', 'LPVO', 'Scope', 'Prism',
  'Night Vision', 'Thermal', 'Magnifier', 'Rangefinder',
] as const;

const FOCAL_PLANES = ['FFP', 'SFP', 'N/A'] as const;
const TURRET_UNITS = ['MOA', 'MRAD'] as const;
const OPTIC_STATUSES = ['Active', 'Stored', 'Loaned Out', 'Sold'] as const;

export function OpticsList({ onSelectOptic }: OpticsListProps) {
  const [optics, setOptics]       = useState<Optic[]>([]);
  const [assignments, setAssignments] = useState<OpticAssignment[]>([]);
  const [guns, setGuns]           = useState<ReturnType<typeof getAllGuns>>([]);
  const [filter, setFilter]       = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  function reload() {
    setOptics(getAllOptics());
    setAssignments(getAllAssignments());
    setGuns(getAllGuns());
  }

  useEffect(() => { reload(); }, []);

  const gunMap = new Map(guns.map(g => [g.id, g]));

  const filtered = optics.filter(o => {
    if (filter === 'assigned') return assignments.some(a => a.opticId === o.id && !a.removedDate);
    if (filter === 'unassigned') return !assignments.some(a => a.opticId === o.id && !a.removedDate);
    return true;
  });

  const totalValue = optics.reduce((s, o) => s + (o.purchasePrice || 0), 0);
  const assignedCount = optics.filter(o => assignments.some(a => a.opticId === o.id && !a.removedDate)).length;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100%', paddingBottom: '32px' }}>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px 0' }}>
        {[
          { label: 'Optics', value: optics.length },
          { label: 'Mounted', value: assignedCount },
          { label: 'Value', value: totalValue > 0 ? '$' + totalValue.toLocaleString() : '—' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: '6px', padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.accent, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0', margin: '14px 16px 0', border: `0.5px solid ${theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {(['all', 'assigned', 'unassigned'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '8px',
              backgroundColor: filter === f ? theme.accent : 'transparent',
              border: 'none',
              color: filter === f ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.5px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {f === 'all' ? 'ALL' : f === 'assigned' ? 'MOUNTED' : 'UNMOUNTED'}
          </button>
        ))}
      </div>

      {/* Optics list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: '8px',
          }}>
            <div style={{ marginBottom: '12px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="9" width="16" height="7" rx="3.5" stroke={theme.textSecondary} strokeWidth="1.5"/>
                <ellipse cx="18" cy="12.5" rx="2" ry="4" stroke={theme.textSecondary} strokeWidth="1.2"/>
                <circle cx="22" cy="12.5" r="1.5" stroke={theme.textSecondary} strokeWidth="1"/>
                <line x1="6" y1="12.5" x2="14" y2="12.5" stroke={theme.textSecondary} strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
                <circle cx="10" cy="12.5" r="2" stroke={theme.textSecondary} strokeWidth="1.2"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, marginBottom: '6px' }}>
              {optics.length === 0 ? 'NO OPTICS YET' : 'NO RESULTS'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px' }}>
              {optics.length === 0 ? 'Track your glass collection. Log zeros, swaps, and torque specs.' : 'Adjust the filter above.'}
            </div>
            {optics.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '10px 20px', backgroundColor: theme.accent,
                  border: 'none', borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                ADD FIRST OPTIC
              </button>
            )}
          </div>
        ) : (
          filtered.map(optic => {
            const active = assignments.find(a => a.opticId === optic.id && !a.removedDate);
            const gun = active ? gunMap.get(active.gunId) : undefined;
            const mount = active?.mountId ? getMountsForOptic(optic.id).find(m => m.id === active.mountId) : undefined;
            const mag = optic.magnificationMax
              ? optic.magnificationMin === optic.magnificationMax
                ? `${optic.magnificationMax}x`
                : `${optic.magnificationMin ?? 1}-${optic.magnificationMax}x`
              : undefined;

            return (
              <button
                key={optic.id}
                onClick={() => onSelectOptic(optic)}
                style={{
                  backgroundColor: theme.surface,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary }}>
                      {optic.brand} {optic.model}
                    </div>
                    {mag && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                        {mag}{optic.objectiveMM ? `×${optic.objectiveMM}` : ''}
                        {optic.focalPlane && optic.focalPlane !== 'N/A' ? ` · ${optic.focalPlane}` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: OPTIC_TYPE_COLORS[optic.opticType] + '22',
                    border: `0.5px solid ${OPTIC_TYPE_COLORS[optic.opticType]}`,
                    borderRadius: '3px', padding: '2px 7px',
                    fontFamily: 'monospace', fontSize: '8px', fontWeight: 700,
                    color: OPTIC_TYPE_COLORS[optic.opticType], letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}>
                    {optic.opticType.toUpperCase()}
                  </div>
                </div>

                {/* Mounted on */}
                {gun ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.green, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                      {gun.make} {gun.model}
                    </span>
                    {mount && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                        · {mount.brand} {mount.model}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.border, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Unmounted</span>
                  </div>
                )}

                {/* Bottom row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {optic.turretUnit && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                      {optic.turretUnit}
                    </span>
                  )}
                  {optic.reticleName && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                      {optic.reticleName}
                    </span>
                  )}
                  {optic.status !== 'Active' && (
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff9999' }}>
                      {optic.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddForm(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: '20px',
          zIndex: 1000,
          width: '52px', height: '52px',
          borderRadius: '50%',
          backgroundColor: theme.accent,
          border: 'none', color: theme.bg, fontSize: '26px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,212,59,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          outline: 'none', WebkitTapHighlightColor: 'transparent',
        }}
      >
        +
      </button>

      {showAddForm && (
        <AddOpticForm
          onSave={(data) => {
            addOptic({ ...data, status: data.status || 'Active' } as Omit<Optic, 'id' | 'createdAt' | 'updatedAt'>);
            reload();
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

// ─── Add Optic Form ──────────────────────────────────────────────────────────

function AddOpticForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: Partial<Optic>) => void;
  onCancel: () => void;
  initial?: Partial<Optic>;
}) {
  const [brand, setBrand]             = useState(initial?.brand || '');
  const [model, setModel]             = useState(initial?.model || '');
  const [serial, setSerial]           = useState(initial?.serialNumber || '');
  const [opticType, setOpticType]     = useState<typeof OPTIC_TYPES[number]>(initial?.opticType || 'Red Dot');
  const [magMin, setMagMin]           = useState(initial?.magnificationMin?.toString() || '');
  const [magMax, setMagMax]           = useState(initial?.magnificationMax?.toString() || '');
  const [objective, setObjective]     = useState(initial?.objectiveMM?.toString() || '');
  const [focalPlane, setFocalPlane]   = useState<typeof FOCAL_PLANES[number]>(initial?.focalPlane || 'N/A');
  const [reticle, setReticle]         = useState(initial?.reticleName || '');
  const [illuminated, setIlluminated] = useState(initial?.illuminated ?? false);
  const [turretUnit, setTurretUnit]   = useState<typeof TURRET_UNITS[number]>(initial?.turretUnit || 'MOA');
  const [clickVal, setClickVal]       = useState(initial?.clickValueMOA?.toString() || '');
  const [batteryType, setBatteryType] = useState(initial?.batteryType || '');
  const [weightOz, setWeightOz]       = useState(initial?.weightOz?.toString() || '');
  const [price, setPrice]             = useState(initial?.purchasePrice?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate || '');
  const [purchasedFrom, setPurchasedFrom] = useState(initial?.purchasedFrom || '');
  const [notes, setNotes]             = useState(initial?.notes || '');

  const hasMag = ['LPVO', 'Scope', 'Prism', 'Magnifier'].includes(opticType);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontFamily: 'monospace', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px',
    color: theme.textMuted, textTransform: 'uppercase', marginBottom: '5px',
  };

  function handleSave() {
    if (!brand.trim() || !model.trim()) return;
    const cv = parseFloat(clickVal);
    onSave({
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serial.trim() || undefined,
      opticType,
      magnificationMin: magMin ? parseFloat(magMin) : undefined,
      magnificationMax: magMax ? parseFloat(magMax) : undefined,
      objectiveMM: objective ? parseFloat(objective) : undefined,
      focalPlane: hasMag ? focalPlane : 'N/A',
      reticleName: reticle.trim() || undefined,
      illuminated,
      turretUnit,
      clickValueMOA: turretUnit === 'MOA' && !isNaN(cv) ? cv : undefined,
      clickValueMRAD: turretUnit === 'MRAD' && !isNaN(cv) ? cv : undefined,
      batteryType: batteryType.trim() || undefined,
      weightOz: weightOz ? parseFloat(weightOz) : undefined,
      purchasePrice: price ? parseFloat(price) : undefined,
      purchaseDate: purchaseDate || undefined,
      purchasedFrom: purchasedFrom.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'Active',
    });
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        margin: '20px auto', maxWidth: '480px', width: '100%',
        backgroundColor: theme.surface, borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            ADD OPTIC
          </span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '18px', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type */}
          <div>
            <div style={labelStyle}>Optic Type *</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {OPTIC_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setOpticType(t)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: opticType === t ? theme.accent : 'transparent',
                    border: `0.5px solid ${opticType === t ? theme.accent : theme.border}`,
                    borderRadius: '4px',
                    color: opticType === t ? theme.bg : theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Brand + Model */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Brand *</div>
              <input style={inputStyle} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Trijicon" />
            </div>
            <div>
              <div style={labelStyle}>Model *</div>
              <input style={inputStyle} value={model} onChange={e => setModel(e.target.value)} placeholder="MRO" />
            </div>
          </div>

          {/* Serial */}
          <div>
            <div style={labelStyle}>Serial Number</div>
            <input style={inputStyle} value={serial} onChange={e => setSerial(e.target.value)} placeholder="Optional — stored locally" />
          </div>

          {/* Magnification — only for scopes */}
          {hasMag && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <div style={labelStyle}>Mag Min</div>
                <input type="number" style={inputStyle} value={magMin} onChange={e => setMagMin(e.target.value)} placeholder="1" />
              </div>
              <div>
                <div style={labelStyle}>Mag Max</div>
                <input type="number" style={inputStyle} value={magMax} onChange={e => setMagMax(e.target.value)} placeholder="6" />
              </div>
              <div>
                <div style={labelStyle}>Objective (mm)</div>
                <input type="number" style={inputStyle} value={objective} onChange={e => setObjective(e.target.value)} placeholder="24" />
              </div>
            </div>
          )}

          {/* Focal plane */}
          {hasMag && (
            <div>
              <div style={labelStyle}>Focal Plane</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {FOCAL_PLANES.map(fp => (
                  <button
                    key={fp}
                    onClick={() => setFocalPlane(fp)}
                    style={{
                      flex: 1, padding: '8px',
                      backgroundColor: focalPlane === fp ? theme.accent : 'transparent',
                      border: `0.5px solid ${focalPlane === fp ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: focalPlane === fp ? theme.bg : theme.textSecondary,
                      fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reticle + Illuminated */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <div style={labelStyle}>Reticle Name</div>
              <input style={inputStyle} value={reticle} onChange={e => setReticle(e.target.value)} placeholder="ACSS, BDC, MOA Grid..." />
            </div>
            <div style={{ paddingBottom: '1px' }}>
              <div style={labelStyle}>Illuminated</div>
              <button
                onClick={() => setIlluminated(v => !v)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: illuminated ? theme.accent : 'transparent',
                  border: `0.5px solid ${illuminated ? theme.accent : theme.border}`,
                  borderRadius: '6px',
                  color: illuminated ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {illuminated ? 'YES' : 'NO'}
              </button>
            </div>
          </div>

          {/* Turret unit + click value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Turret Unit</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TURRET_UNITS.map(u => (
                  <button
                    key={u}
                    onClick={() => setTurretUnit(u)}
                    style={{
                      flex: 1, padding: '10px',
                      backgroundColor: turretUnit === u ? theme.accent : 'transparent',
                      border: `0.5px solid ${turretUnit === u ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: turretUnit === u ? theme.bg : theme.textSecondary,
                      fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Click Value ({turretUnit})</div>
              <input type="number" step="0.01" style={inputStyle} value={clickVal} onChange={e => setClickVal(e.target.value)} placeholder={turretUnit === 'MOA' ? '0.25' : '0.1'} />
            </div>
          </div>

          {/* Battery + weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Battery Type</div>
              <input style={inputStyle} value={batteryType} onChange={e => setBatteryType(e.target.value)} placeholder="CR2032" />
            </div>
            <div>
              <div style={labelStyle}>Weight (oz)</div>
              <input type="number" step="0.1" style={inputStyle} value={weightOz} onChange={e => setWeightOz(e.target.value)} placeholder="3.5" />
            </div>
          </div>

          {/* Purchase info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Purchase Price ($)</div>
              <input type="number" style={inputStyle} value={price} onChange={e => setPrice(e.target.value)} placeholder="599" />
            </div>
            <div>
              <div style={labelStyle}>Purchase Date</div>
              <input type="date" style={inputStyle} value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Purchased From</div>
            <input style={inputStyle} value={purchasedFrom} onChange={e => setPurchasedFrom(e.target.value)} placeholder="Brownells, Local shop..." />
          </div>

          {/* Notes */}
          <div>
            <div style={labelStyle}>Notes</div>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button onClick={onCancel} style={{
              flex: 1, padding: '12px', backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`, borderRadius: '6px',
              color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer',
            }}>
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!brand.trim() || !model.trim()}
              style={{
                flex: 2, padding: '12px',
                backgroundColor: !brand.trim() || !model.trim() ? theme.border : theme.accent,
                border: 'none', borderRadius: '6px',
                color: !brand.trim() || !model.trim() ? theme.textMuted : theme.bg,
                fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              SAVE OPTIC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
