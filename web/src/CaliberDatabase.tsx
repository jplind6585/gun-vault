import React, { useState, useMemo } from 'react';
import { theme } from './theme';
import type { Cartridge } from './types';
import { getAllCartridges } from './storage';

type FilterType = 'all' | 'rifle' | 'pistol' | 'revolver' | 'shotgun' | 'rimfire';
type FilterAvailability = 'all' | 'abundant' | 'common' | 'limited' | 'scarce';
type FilterEnergy = 'all' | 'light' | 'medium' | 'heavy' | 'magnum';
type FilterOwnership = 'all' | 'ownGun' | 'ownAmmo' | 'wishlist';
type SortField = 'name' | 'year' | 'type' | 'bulletDia' | 'velocity' | 'energy' | 'psi' | 'status' | 'availability';
type SortDirection = 'asc' | 'desc';

export function CaliberDatabase() {
  const [allCartridges] = useState<Cartridge[]>(getAllCartridges());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterOwnership, setFilterOwnership] = useState<FilterOwnership>('all');
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredCartridges = useMemo(() => {
    let filtered = allCartridges.filter(cart => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!cart.name.toLowerCase().includes(search) &&
            !cart.alternateNames?.some(n => n.toLowerCase().includes(search)) &&
            !cart.countryOfOrigin.toLowerCase().includes(search)) return false;
      }
      if (filterType !== 'all' && cart.type.toLowerCase() !== filterType) return false;
      if (filterOwnership === 'ownGun' && !cart.ownGunForThis) return false;
      if (filterOwnership === 'ownAmmo' && !cart.ownAmmoForThis) return false;
      if (filterOwnership === 'wishlist' && !cart.onWishlist) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortField) {
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'year': aVal = a.yearIntroduced; bVal = b.yearIntroduced; break;
        case 'type': aVal = a.type.toLowerCase(); bVal = b.type.toLowerCase(); break;
        case 'bulletDia': aVal = a.bulletDiameterInch; bVal = b.bulletDiameterInch; break;
        case 'velocity': aVal = (a.velocityRangeFPS.min + a.velocityRangeFPS.max) / 2; bVal = (b.velocityRangeFPS.min + b.velocityRangeFPS.max) / 2; break;
        case 'energy': aVal = (a.energyRangeFTLBS.min + a.energyRangeFTLBS.max) / 2; bVal = (b.energyRangeFTLBS.min + b.energyRangeFTLBS.max) / 2; break;
        case 'psi': aVal = a.maxPressurePSI || 0; bVal = b.maxPressurePSI || 0; break;
        default: aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allCartridges, searchTerm, filterType, filterOwnership, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const comparedCartridges = useMemo(() => {
    return Array.from(selectedForComparison)
      .map(id => allCartridges.find(c => c.id === id))
      .filter(Boolean) as Cartridge[];
  }, [selectedForComparison, allCartridges]);

  const TYPE_CHIPS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'rifle', label: 'RIFLE' },
    { value: 'pistol', label: 'PISTOL' },
    { value: 'revolver', label: 'REVOLVER' },
    { value: 'shotgun', label: 'SHOTGUN' },
    { value: 'rimfire', label: 'RIMFIRE' },
  ];

  const OWN_CHIPS: { value: FilterOwnership; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'ownGun', label: 'MY GUNS' },
    { value: 'ownAmmo', label: 'MY AMMO' },
    { value: 'wishlist', label: 'WISHLIST' },
  ];

const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    backgroundColor: active ? theme.accent : theme.surface,
    border: '0.5px solid ' + (active ? theme.accent : theme.border),
    borderRadius: '16px',
    color: active ? theme.bg : theme.textSecondary,
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  });

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100%', paddingBottom: '100px' }}>

      {/* ── FILTER BAR ── sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: theme.bg,
        borderBottom: '0.5px solid ' + theme.border,
        padding: '10px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>

        {/* Row 1: Search + Compare */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search cartridges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: theme.surface,
              border: '0.5px solid ' + theme.border,
              borderRadius: '8px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '8px 12px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => { setComparisonMode(c => !c); setSelectedForComparison(new Set()); setShowComparisonTable(false); }}
            style={{
              padding: '8px 12px',
              backgroundColor: comparisonMode ? theme.accent : theme.surface,
              border: '0.5px solid ' + (comparisonMode ? theme.accent : theme.border),
              borderRadius: '8px',
              color: comparisonMode ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '10px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {comparisonMode ? 'CANCEL' : 'COMPARE'}
          </button>
        </div>

        {/* Row 2: Type chips */}
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>Type</div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {TYPE_CHIPS.map(chip => (
              <button key={chip.value} onClick={() => setFilterType(chip.value)} style={chipStyle(filterType === chip.value)}>
                {chip.label}
              </button>
            ))}
            <div style={{ minWidth: '1px', flexShrink: 0 }} />
          </div>
        </div>

        {/* Row 3: Ownership chips + count */}
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>Filter by</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {OWN_CHIPS.map(chip => (
                <button key={chip.value} onClick={() => setFilterOwnership(chip.value)} style={chipStyle(filterOwnership === chip.value)}>
                  {chip.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', flexShrink: 0, marginLeft: '8px' }}>
              {filteredCartridges.length}/{allCartridges.length}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison banner */}
      {comparisonMode && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: theme.caliberRed + '15',
          borderBottom: '0.5px solid ' + theme.caliberRed + '40',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: theme.caliberRed, flex: 1 }}>
            {'Select up to 5 · ' + selectedForComparison.size + ' selected'}
          </span>
          {selectedForComparison.size >= 2 && (
            <button
              onClick={() => setShowComparisonTable(true)}
              style={{
                padding: '4px 10px',
                backgroundColor: theme.caliberRed,
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '9px',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              VIEW TABLE
            </button>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {showComparisonTable && comparedCartridges.length >= 2 && (
        <ComparisonTable
          cartridges={comparedCartridges}
          onClose={() => { setShowComparisonTable(false); setSelectedForComparison(new Set()); setComparisonMode(false); }}
        />
      )}

      {/* Table */}
      {filteredCartridges.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            fontFamily: 'monospace',
            minWidth: '480px',
          }}>
            <thead>
              <tr style={{ backgroundColor: theme.surface, borderBottom: '1px solid ' + theme.border }}>
                {comparisonMode && (
                  <th style={{ width: '32px', padding: '6px', backgroundColor: theme.surface }} />
                )}
                <th
                  onClick={() => handleSort('name')}
                  style={{
                    padding: '7px 8px',
                    textAlign: 'left',
                    color: sortField === 'name' ? theme.caliberRed : theme.textMuted,
                    fontSize: '9px',
                    letterSpacing: '0.8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: theme.surface,
                    zIndex: 2,
                    width: '140px',
                  }}
                >
                  NAME {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('type')} style={{ padding: '7px 8px', textAlign: 'left', color: sortField === 'type' ? theme.caliberRed : theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 700, width: '65px' }}>
                  TYPE {sortField === 'type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('year')} style={{ padding: '7px 8px', textAlign: 'left', color: sortField === 'year' ? theme.caliberRed : theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 700, width: '50px' }}>
                  YEAR {sortField === 'year' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('bulletDia')} style={{ padding: '7px 8px', textAlign: 'left', color: sortField === 'bulletDia' ? theme.caliberRed : theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 700, width: '55px' }}>
                  DIA {sortField === 'bulletDia' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('velocity')} style={{ padding: '7px 8px', textAlign: 'left', color: sortField === 'velocity' ? theme.caliberRed : theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 700, width: '95px' }}>
                  FPS {sortField === 'velocity' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('energy')} style={{ padding: '7px 8px', textAlign: 'left', color: sortField === 'energy' ? theme.caliberRed : theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 700, width: '95px' }}>
                  FT·LBS {sortField === 'energy' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '7px 8px', textAlign: 'left', color: theme.textMuted, fontSize: '9px', letterSpacing: '0.8px', fontWeight: 700, width: '70px' }}>
                  AVAIL
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCartridges.map((cart) => {
                const isSelected = selectedForComparison.has(cart.id);
                return (
                  <tr
                    key={cart.id}
                    onClick={() => {
                      if (comparisonMode) {
                        const newSet = new Set(selectedForComparison);
                        if (newSet.has(cart.id)) {
                          newSet.delete(cart.id);
                        } else if (newSet.size < 5) {
                          newSet.add(cart.id);
                        }
                        setSelectedForComparison(newSet);
                      } else {
                        setSelectedCartridge(cart);
                      }
                    }}
                    style={{
                      borderBottom: '0.5px solid ' + theme.border,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? theme.caliberRed + '12' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = theme.surface + '80'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? theme.caliberRed + '12' : 'transparent'; }}
                  >
                    {comparisonMode && (
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          border: '1.5px solid ' + (isSelected ? theme.caliberRed : theme.border),
                          backgroundColor: isSelected ? theme.caliberRed : 'transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isSelected && <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>✓</span>}
                        </div>
                      </td>
                    )}
                    <td style={{
                      padding: '8px 8px',
                      fontWeight: 600,
                      color: theme.caliberRed,
                      position: 'sticky',
                      left: 0,
                      backgroundColor: isSelected ? theme.caliberRed + '12' : theme.bg,
                      fontSize: '11px',
                    }}>
                      <div>{cart.name}</div>
                      {(cart.ownGunForThis || cart.ownAmmoForThis || cart.onWishlist) && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                          {cart.ownGunForThis && <span style={{ fontSize: '8px', padding: '1px 4px', backgroundColor: theme.green + '25', color: theme.green, borderRadius: '3px' }}>GUN</span>}
                          {cart.ownAmmoForThis && <span style={{ fontSize: '8px', padding: '1px 4px', backgroundColor: theme.green + '25', color: theme.green, borderRadius: '3px' }}>AMMO</span>}
                          {cart.onWishlist && <span style={{ fontSize: '8px', padding: '1px 4px', backgroundColor: theme.accent + '25', color: theme.accent, borderRadius: '3px' }}>★</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 5px',
                        backgroundColor: theme.surface,
                        border: '0.5px solid ' + theme.border,
                        borderRadius: '4px',
                        color: theme.textSecondary,
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}>
                        {cart.type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px', color: theme.textSecondary, fontSize: '10px' }}>
                      {cart.yearIntroduced}
                    </td>
                    <td style={{ padding: '8px 8px', color: theme.textSecondary, fontSize: '10px' }}>
                      {cart.bulletDiameterInch}"
                    </td>
                    <td style={{ padding: '8px 8px', color: theme.textPrimary, fontSize: '10px' }}>
                      {cart.velocityRangeFPS.min}–{cart.velocityRangeFPS.max}
                    </td>
                    <td style={{ padding: '8px 8px', color: theme.caliberRed, fontWeight: 600, fontSize: '10px' }}>
                      {cart.energyRangeFTLBS.min}–{cart.energyRangeFTLBS.max}
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '10px' }}>
                      <span style={{
                        color: cart.availability === 'Abundant' ? theme.green
                             : cart.availability === 'Common' ? theme.textPrimary
                             : cart.availability === 'Limited' ? theme.orange
                             : theme.red,
                      }}>
                        {cart.availability}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted, fontFamily: 'monospace' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>No cartridges found</div>
          <div style={{ fontSize: '10px', color: theme.textSecondary }}>Try adjusting your filters or search term</div>
        </div>
      )}

      {/* Detail bottom sheet */}
      {selectedCartridge && (
        <CartridgeDetailModal
          cartridge={selectedCartridge}
          onClose={() => setSelectedCartridge(null)}
          allCartridges={allCartridges}
        />
      )}
    </div>
  );
}

// Comparison Table Component
function ComparisonTable({ cartridges, onClose }: { cartridges: Cartridge[]; onClose: () => void }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '4px',
      padding: '8px',
      marginBottom: '8px',
      border: `1px solid ${theme.border}`,
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '11px',
          fontFamily: 'monospace',
          color: theme.blue,
          letterSpacing: '0.5px'
        }}>
          COMPARISON TABLE ({cartridges.length} cartridges)
        </h3>
        <button
          onClick={onClose}
          style={{
            padding: '4px 8px',
            backgroundColor: theme.surfaceAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '8px',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          CLEAR
        </button>
      </div>

      {/* Trajectory Comparison */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: theme.surfaceAlt, borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', color: theme.textMuted }}>TRAJECTORY COMPARISON (300 yards)</h4>
        <TrajectoryComparison cartridges={cartridges} />
      </div>

      {/* Specs Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          fontSize: '8px',
          fontFamily: 'monospace',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left',
                padding: '4px',
                backgroundColor: theme.surfaceAlt,
                color: theme.textMuted,
                position: 'sticky',
                left: 0,
                zIndex: 1
              }}>SPEC</th>
              {cartridges.map(cart => (
                <th key={cart.id} style={{
                  textAlign: 'left',
                  padding: '4px',
                  backgroundColor: theme.surfaceAlt,
                  color: theme.caliberRed,
                  fontSize: '9px',
                  minWidth: '100px'
                }}>
                  {cart.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ComparisonRow label="Year" values={cartridges.map(c => c.yearIntroduced.toString())} />
            <ComparisonRow label="Country" values={cartridges.map(c => c.countryOfOrigin)} />
            <ComparisonRow label="Bullet Dia." values={cartridges.map(c => `${c.bulletDiameterInch}"`)} />
            <ComparisonRow label="Case Length" values={cartridges.map(c => `${c.caseLengthInch}"`)} />
            <ComparisonRow label="Overall Length" values={cartridges.map(c => `${c.overallLengthInch}"`)} />
            <ComparisonRow label="Velocity" values={cartridges.map(c => `${c.velocityRangeFPS.min}-${c.velocityRangeFPS.max} fps`)} />
            <ComparisonRow label="Muzzle Energy" values={cartridges.map(c => `${c.energyRangeFTLBS.min}-${c.energyRangeFTLBS.max} ft-lbs`)} highlight />
            <ComparisonRow label="Max Pressure" values={cartridges.map(c => c.maxPressurePSI ? `${c.maxPressurePSI.toLocaleString()} PSI` : 'N/A')} />
            <ComparisonRow label="Common Weights" values={cartridges.map(c => {
              const top3 = c.commonBulletWeights.slice(0, 3);
              return `${top3.join(', ')} gr`;
            })} />
            <ComparisonRow label="Standardization" values={cartridges.map(c => c.standardization)} />
            <ComparisonRow label="Availability" values={cartridges.map(c => c.availability)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonRow({ label, values, highlight }: { label: string; values: string[]; highlight?: boolean }) {
  return (
    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
      <td style={{
        padding: '4px',
        color: theme.textMuted,
        backgroundColor: theme.surface,
        position: 'sticky',
        left: 0,
        fontWeight: 600
      }}>
        {label}
      </td>
      {values.map((value, idx) => (
        <td key={idx} style={{
          padding: '4px',
          color: highlight ? theme.caliberRed : theme.textPrimary
        }}>
          {value}
        </td>
      ))}
    </tr>
  );
}

// Trajectory Comparison SVG
function TrajectoryComparison({ cartridges }: { cartridges: Cartridge[] }) {
  const width = 600;
  const height = 150;
  const maxDistance = 300; // yards
  const colors = [theme.caliberRed, theme.blue, theme.green, theme.accent, '#ff88ff'];

  // Simple ballistic calculation (drop in inches)
  const calculateDrop = (cart: Cartridge, distance: number) => {
    const avgVelocity = (cart.velocityRangeFPS.min + cart.velocityRangeFPS.max) / 2;
    const timeOfFlight = (distance * 3) / avgVelocity; // rough approximation
    const drop = 16 * timeOfFlight * timeOfFlight * 12; // gravity drop in inches
    return drop;
  };

  const maxDrop = Math.max(...cartridges.map(c => calculateDrop(c, maxDistance)));

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height} style={{ backgroundColor: theme.surface }}>
        {/* Grid lines */}
        {[0, 100, 200, 300].map(d => (
          <line
            key={d}
            x1={(d / maxDistance) * (width - 60) + 50}
            y1={20}
            x2={(d / maxDistance) * (width - 60) + 50}
            y2={height - 20}
            stroke={theme.border}
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Trajectory lines */}
        {cartridges.map((cart, idx) => {
          const points: string[] = [];
          for (let d = 0; d <= maxDistance; d += 10) {
            const x = (d / maxDistance) * (width - 60) + 50;
            const drop = calculateDrop(cart, d);
            const y = height - 30 - ((height - 50) * (1 - drop / maxDrop));
            points.push(`${x},${y}`);
          }
          return (
            <polyline
              key={cart.id}
              points={points.join(' ')}
              fill="none"
              stroke={colors[idx]}
              strokeWidth="2"
            />
          );
        })}

        {/* Axis labels */}
        <text x={50} y={height - 5} fontSize="8" fill={theme.textMuted} fontFamily="monospace">0</text>
        <text x={width / 2 - 10} y={height - 5} fontSize="8" fill={theme.textMuted} fontFamily="monospace">150</text>
        <text x={width - 60} y={height - 5} fontSize="8" fill={theme.textMuted} fontFamily="monospace">300 yd</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
        {cartridges.map((cart, idx) => (
          <div key={cart.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: colors[idx] }} />
            <span style={{ fontSize: '7px', color: theme.textSecondary }}>{cart.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cartridge Detail Modal
function CartridgeDetailModal({
  cartridge,
  onClose,
  allCartridges
}: {
  cartridge: Cartridge;
  onClose: () => void;
  allCartridges: Cartridge[];
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'history' | 'military' | 'ballistics' | 'family'>('overview');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bg,
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '10px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky',
          top: 0,
          backgroundColor: theme.bg,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                margin: '0 0 3px 0',
                fontSize: '20px',
                fontFamily: 'monospace',
                color: theme.caliberRed,
                letterSpacing: '0.3px'
              }}>
                {cartridge.name}
              </h2>
              {cartridge.alternateNames && (
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '10px',
                  color: theme.textSecondary,
                  fontFamily: 'monospace'
                }}>
                  Also: {cartridge.alternateNames.join(', ')}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '10px',
                color: theme.textMuted,
                alignItems: 'center'
              }}>
                <span>{cartridge.yearIntroduced}</span>
                <span>•</span>
                <span>{cartridge.countryOfOrigin}</span>
                <span>•</span>
                <span style={{
                  padding: '2px 6px',
                  backgroundColor: theme.surface,
                  borderRadius: '2px',
                  fontSize: '9px'
                }}>
                  {cartridge.type}
                </span>
                <span>•</span>
                <span style={{
                  padding: '2px 6px',
                  backgroundColor: theme.surfaceAlt,
                  borderRadius: '2px',
                  fontSize: '9px',
                  color: cartridge.standardization === 'SAAMI' ? theme.green : theme.textSecondary
                }}>
                  {cartridge.standardization}
                </span>
                {cartridge.militaryAdoption && cartridge.militaryAdoption.length > 0 && (
                  <>
                    <span>•</span>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: theme.caliberRed + '20',
                      borderRadius: '2px',
                      fontSize: '9px',
                      color: theme.caliberRed
                    }}>
                      MILITARY
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '6px 10px',
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '3px',
                color: theme.textPrimary,
                fontSize: '9px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
            {(['overview', 'specs', 'history', 'military', 'ballistics', 'family'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: activeTab === tab ? theme.caliberRed : theme.surface,
                  border: 'none',
                  borderRadius: '3px',
                  color: activeTab === tab ? theme.bg : theme.textPrimary,
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  fontWeight: 600
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '10px' }}>
          {activeTab === 'overview' && (
            <OverviewTab cartridge={cartridge} />
          )}

          {activeTab === 'specs' && (
            <SpecsTab cartridge={cartridge} />
          )}

          {activeTab === 'history' && (
            <HistoryTab cartridge={cartridge} />
          )}

          {activeTab === 'military' && (
            <MilitaryTab cartridge={cartridge} />
          )}

          {activeTab === 'ballistics' && (
            <BallisticsTab cartridge={cartridge} />
          )}

          {activeTab === 'family' && (
            <FamilyTreeTab cartridge={cartridge} allCartridges={allCartridges} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ cartridge }: { cartridge: Cartridge }) {
  return (
    <div>
      {cartridge.description && (
        <p style={{ fontSize: '11px', lineHeight: '1.5', marginBottom: '10px', color: theme.textSecondary }}>
          {cartridge.description}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
        <StatBox label="Bullet Diameter" value={`${cartridge.bulletDiameterInch}" / ${cartridge.bulletDiameterMM}mm`} />
        <StatBox label="Case Length" value={`${cartridge.caseLengthInch}" / ${cartridge.caseLengthMM}mm`} />
        <StatBox label="Overall Length" value={`${cartridge.overallLengthInch}" / ${cartridge.overallLengthMM}mm`} />
        <StatBox label="Velocity Range" value={`${cartridge.velocityRangeFPS.min}-${cartridge.velocityRangeFPS.max} fps`} />
        <StatBox label="Muzzle Energy" value={`${cartridge.energyRangeFTLBS.min}-${cartridge.energyRangeFTLBS.max} ft-lbs`} highlight />
        <StatBox label="Common Weights" value={`${cartridge.commonBulletWeights.slice(0, 3).join(', ')} gr`} />
        <StatBox label="Availability" value={cartridge.availability} />
        <StatBox label="Production" value={cartridge.productionStatus} />
        {cartridge.maxPressurePSI && (
          <StatBox label="Max Pressure" value={`${cartridge.maxPressurePSI.toLocaleString()} PSI`} />
        )}
      </div>

      {cartridge.primaryUse && cartridge.primaryUse.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            Primary Uses
          </h4>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {cartridge.primaryUse.map(use => (
              <span
                key={use}
                style={{
                  padding: '3px 6px',
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontFamily: 'monospace'
                }}
              >
                {use}
              </span>
            ))}
          </div>
        </div>
      )}

      {cartridge.notableFirearms && cartridge.notableFirearms.length > 0 && (
        <div>
          <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            Notable Firearms
          </h4>
          <p style={{ fontSize: '10px', color: theme.textSecondary, lineHeight: '1.4' }}>
            {cartridge.notableFirearms.join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
}

// Specs Tab
function SpecsTab({ cartridge }: { cartridge: Cartridge }) {
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        marginBottom: '10px'
      }}>
        <StatBox label="Bullet Diameter" value={`${cartridge.bulletDiameterInch}" (${cartridge.bulletDiameterMM}mm)`} />
        <StatBox label="Case Length" value={`${cartridge.caseLengthInch}" (${cartridge.caseLengthMM}mm)`} />
        <StatBox label="Overall Length" value={`${cartridge.overallLengthInch}" (${cartridge.overallLengthMM}mm)`} />
        <StatBox label="Base Diameter" value={`${cartridge.baseDiameterInch}" (${cartridge.baseDiameterMM}mm)`} />
        <StatBox label="Rim Diameter" value={`${cartridge.rimDiameterInch}" (${cartridge.rimDiameterMM}mm)`} />
        {cartridge.neckDiameterInch && (
          <StatBox label="Neck Diameter" value={`${cartridge.neckDiameterInch}" (${cartridge.neckDiameterMM}mm)`} />
        )}
        {cartridge.caseCapacityGrains && (
          <StatBox label="Case Capacity" value={`${cartridge.caseCapacityGrains} grains H2O`} />
        )}
        {cartridge.maxPressurePSI && (
          <StatBox label="Max Pressure (PSI)" value={`${cartridge.maxPressurePSI.toLocaleString()} PSI`} />
        )}
        {cartridge.maxPressureCUP && (
          <StatBox label="Max Pressure (CUP)" value={`${cartridge.maxPressureCUP.toLocaleString()} CUP`} />
        )}
        <StatBox label="Standardization" value={cartridge.standardization} highlight />
        <StatBox label="Production Status" value={cartridge.productionStatus} />
        <StatBox label="Type" value={cartridge.type} />
      </div>

      <div style={{
        padding: '8px',
        backgroundColor: theme.surface,
        borderRadius: '4px',
        border: `1px solid ${theme.border}`
      }}>
        <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
          Performance Specifications
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '10px' }}>
          <div>
            <span style={{ color: theme.textMuted }}>Velocity Range:</span>
            <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>
              {cartridge.velocityRangeFPS.min} - {cartridge.velocityRangeFPS.max} fps
            </div>
          </div>
          <div>
            <span style={{ color: theme.textMuted }}>Muzzle Energy Range:</span>
            <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace', color: theme.caliberRed }}>
              {cartridge.energyRangeFTLBS.min} - {cartridge.energyRangeFTLBS.max} ft-lbs
            </div>
          </div>
          {cartridge.effectiveRangeYards && (
            <div>
              <span style={{ color: theme.textMuted }}>Effective Range:</span>
              <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>
                {cartridge.effectiveRangeYards} yards
              </div>
            </div>
          )}
          {cartridge.maxRangeYards && (
            <div>
              <span style={{ color: theme.textMuted }}>Maximum Range:</span>
              <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>
                {cartridge.maxRangeYards} yards
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// History Tab
function HistoryTab({ cartridge }: { cartridge: Cartridge }) {
  return (
    <div>
      {cartridge.history && (
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ fontSize: '11px', marginBottom: '4px', color: theme.caliberRed }}>Historical Background</h4>
          <p style={{ fontSize: '10px', lineHeight: '1.5', color: theme.textSecondary }}>
            {cartridge.history}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '10px' }}>
        <StatBox label="Year Introduced" value={cartridge.yearIntroduced.toString()} />
        <StatBox label="Country of Origin" value={cartridge.countryOfOrigin} />
        {cartridge.inventor && <StatBox label="Inventor/Developer" value={cartridge.inventor} />}
        {cartridge.manufacturer && <StatBox label="Original Manufacturer" value={cartridge.manufacturer} />}
      </div>

      {cartridge.parentCase && (
        <div style={{
          marginBottom: '10px',
          padding: '6px',
          backgroundColor: theme.surface,
          borderRadius: '4px',
          border: `1px solid ${theme.border}`
        }}>
          <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '3px' }}>
            Parent Case
          </h4>
          <p style={{ fontSize: '11px', color: theme.caliberRed, fontFamily: 'monospace', fontWeight: 600, margin: 0 }}>
            {cartridge.parentCase}
          </p>
          {cartridge.derivedFrom && (
            <p style={{ fontSize: '9px', color: theme.textSecondary, marginTop: '3px', margin: 0 }}>
              {cartridge.derivedFrom}
            </p>
          )}
        </div>
      )}

      {cartridge.trivia && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: theme.surface,
          borderRadius: '4px',
          borderLeft: `2px solid ${theme.caliberRed}`
        }}>
          <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
            DID YOU KNOW?
          </h4>
          <p style={{ fontSize: '10px', lineHeight: '1.5', margin: 0 }}>
            {cartridge.trivia}
          </p>
        </div>
      )}
    </div>
  );
}

// Military Tab
function MilitaryTab({ cartridge }: { cartridge: Cartridge }) {
  return (
    <div>
      {cartridge.militaryAdoption && cartridge.militaryAdoption.length > 0 ? (
        <>
          <h4 style={{ fontSize: '11px', marginBottom: '6px', color: theme.caliberRed }}>
            Military Adoption History
          </h4>
          <div style={{ display: 'grid', gap: '6px' }}>
            {cartridge.militaryAdoption.map((adoption, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  backgroundColor: theme.surface,
                  borderRadius: '4px',
                  border: `1px solid ${theme.border}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                  <h5 style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
                    {adoption.country}
                  </h5>
                  <span style={{
                    fontSize: '9px',
                    color: theme.textMuted,
                    padding: '2px 6px',
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: '2px'
                  }}>
                    {adoption.years}
                  </span>
                </div>
                {adoption.conflicts && adoption.conflicts.length > 0 && (
                  <div>
                    <p style={{ fontSize: '8px', color: theme.textMuted, margin: '4px 0 3px 0' }}>
                      CONFLICTS:
                    </p>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {adoption.conflicts.map(conflict => (
                        <span
                          key={conflict}
                          style={{
                            padding: '2px 5px',
                            backgroundColor: theme.surfaceAlt,
                            borderRadius: '2px',
                            fontSize: '8px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {conflict}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {cartridge.currentMilitaryUse && cartridge.currentMilitaryUse.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                Currently In Service
              </h4>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {cartridge.currentMilitaryUse.map(country => (
                  <span
                    key={country}
                    style={{
                      padding: '3px 6px',
                      backgroundColor: theme.green + '20',
                      color: theme.green,
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      border: `1px solid ${theme.green}40`
                    }}
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cartridge.lawEnforcementUse && (
            <div style={{
              marginTop: '10px',
              padding: '6px',
              backgroundColor: theme.blue + '20',
              border: `1px solid ${theme.blue}40`,
              borderRadius: '4px'
            }}>
              <span style={{ fontSize: '9px', color: theme.blue, fontFamily: 'monospace', fontWeight: 600 }}>
                ✓ WIDELY USED IN LAW ENFORCEMENT
              </span>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: '10px', color: theme.textMuted, textAlign: 'center', padding: '30px' }}>
          No significant military adoption history
        </p>
      )}
    </div>
  );
}

// Ballistics Tab
function BallisticsTab({ cartridge }: { cartridge: Cartridge }) {
  const width = 700;
  const height = 300;
  const maxDistance = cartridge.effectiveRangeYards || 600;

  // Calculate trajectory points
  const avgVelocity = (cartridge.velocityRangeFPS.min + cartridge.velocityRangeFPS.max) / 2;
  const avgWeight = cartridge.commonBulletWeights[Math.floor(cartridge.commonBulletWeights.length / 2)] || 150;

  const points: Array<{x: number; y: number; drop: number}> = [];
  for (let distance = 0; distance <= maxDistance; distance += 25) {
    const timeOfFlight = (distance * 3) / avgVelocity;
    const drop = 16 * timeOfFlight * timeOfFlight * 12; // inches
    points.push({ x: distance, y: drop, drop });
  }

  const maxDrop = Math.max(...points.map(p => p.drop));
  const scaleX = (width - 100) / maxDistance;
  const scaleY = (height - 60) / maxDrop;

  return (
    <div>
      <h4 style={{ fontSize: '11px', marginBottom: '8px', color: theme.caliberRed }}>
        Ballistic Trajectory Chart
      </h4>

      <div style={{
        backgroundColor: theme.surface,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '10px',
        border: `1px solid ${theme.border}`
      }}>
        <svg width={width} height={height}>
          {/* Grid */}
          {Array.from({ length: Math.floor(maxDistance / 100) + 1 }, (_, i) => i * 100).map(d => (
            <g key={d}>
              <line
                x1={50 + d * scaleX}
                y1={20}
                x2={50 + d * scaleX}
                y2={height - 30}
                stroke={theme.border}
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={50 + d * scaleX}
                y={height - 10}
                fontSize="9"
                fill={theme.textMuted}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {d}
              </text>
            </g>
          ))}

          {/* Y-axis labels (drop) */}
          {[0, Math.floor(maxDrop / 4), Math.floor(maxDrop / 2), Math.floor(maxDrop * 3 / 4), Math.floor(maxDrop)].map(drop => (
            <g key={drop}>
              <line
                x1={45}
                y1={height - 30 - drop * scaleY}
                x2={width - 20}
                y2={height - 30 - drop * scaleY}
                stroke={theme.border}
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={40}
                y={height - 30 - drop * scaleY + 3}
                fontSize="8"
                fill={theme.textMuted}
                textAnchor="end"
                fontFamily="monospace"
              >
                -{drop}"
              </text>
            </g>
          ))}

          {/* Trajectory curve */}
          <polyline
            points={points.map(p => `${50 + p.x * scaleX},${height - 30 - p.y * scaleY}`).join(' ')}
            fill="none"
            stroke={theme.caliberRed}
            strokeWidth="3"
          />

          {/* Points */}
          {points.filter((_, i) => i % 4 === 0).map((p, i) => (
            <circle
              key={i}
              cx={50 + p.x * scaleX}
              cy={height - 30 - p.y * scaleY}
              r="3"
              fill={theme.caliberRed}
            />
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 2}
            fontSize="10"
            fill={theme.textSecondary}
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="600"
          >
            Distance (yards)
          </text>
          <text
            x={15}
            y={height / 2}
            fontSize="10"
            fill={theme.textSecondary}
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="600"
            transform={`rotate(-90 15 ${height / 2})`}
          >
            Drop (inches)
          </text>
        </svg>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <StatBox label="Avg Velocity" value={`${avgVelocity.toFixed(0)} fps`} />
        <StatBox label="Typical Weight" value={`${avgWeight} gr`} />
        <StatBox label="Drop @ 300yd" value={`-${points.find(p => p.x === 300)?.drop.toFixed(1) || 'N/A'} in`} highlight />
        <StatBox label={`Drop @ ${maxDistance}yd`} value={`-${points[points.length - 1].drop.toFixed(1)} in`} />
      </div>

      <div style={{
        marginTop: '10px',
        padding: '6px',
        backgroundColor: theme.surfaceAlt,
        borderRadius: '4px',
        fontSize: '8px',
        color: theme.textMuted
      }}>
        Note: Trajectory calculated using average velocity and standard ballistic coefficient.
        Actual performance varies with ammunition, barrel length, altitude, and environmental conditions.
      </div>
    </div>
  );
}

// Family Tree Tab
function FamilyTreeTab({ cartridge, allCartridges }: { cartridge: Cartridge; allCartridges: Cartridge[] }) {
  // Find parent
  const parent = cartridge.parentCase
    ? allCartridges.find(c => c.name === cartridge.parentCase)
    : null;

  // Find children (cartridges that list this as parent)
  const children = allCartridges.filter(c => c.parentCase === cartridge.name);

  // Find similar cartridges
  const similar = cartridge.similarCartridges
    ? allCartridges.filter(c => cartridge.similarCartridges?.includes(c.id))
    : [];

  const hasFamily = parent || children.length > 0 || similar.length > 0;

  if (!hasFamily) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
        <p style={{ fontSize: '10px', marginBottom: '4px' }}>No family tree information available</p>
        <p style={{ fontSize: '9px', color: theme.textSecondary }}>
          This cartridge has no documented parent or derived cartridges
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ fontSize: '11px', marginBottom: '8px', color: theme.caliberRed }}>
        Cartridge Family Tree
      </h4>

      {/* Visual tree */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px',
        backgroundColor: theme.surface,
        borderRadius: '4px',
        border: `1px solid ${theme.border}`
      }}>
        {/* Parent */}
        {parent && (
          <div>
            <div style={{ fontSize: '8px', color: theme.textMuted, marginBottom: '4px' }}>PARENT CARTRIDGE:</div>
            <div style={{
              padding: '6px',
              backgroundColor: theme.surfaceAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: '3px',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: theme.blue, fontFamily: 'monospace' }}>
                {parent.name}
              </div>
              <div style={{ fontSize: '8px', color: theme.textSecondary, marginTop: '2px' }}>
                {parent.yearIntroduced} • {parent.countryOfOrigin}
              </div>
            </div>
            <div style={{
              marginLeft: '20px',
              height: '20px',
              borderLeft: `2px solid ${theme.border}`,
              width: '2px'
            }} />
          </div>
        )}

        {/* Current cartridge */}
        <div style={{ marginLeft: parent ? '20px' : '0' }}>
          <div style={{ fontSize: '8px', color: theme.textMuted, marginBottom: '4px' }}>CURRENT:</div>
          <div style={{
            padding: '8px',
            backgroundColor: theme.caliberRed + '20',
            border: `2px solid ${theme.caliberRed}`,
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.caliberRed, fontFamily: 'monospace' }}>
              {cartridge.name}
            </div>
            <div style={{ fontSize: '9px', color: theme.textSecondary, marginTop: '2px' }}>
              {cartridge.yearIntroduced} • {cartridge.countryOfOrigin}
            </div>
            {cartridge.derivedFrom && (
              <div style={{ fontSize: '8px', color: theme.textMuted, marginTop: '3px', fontStyle: 'italic' }}>
                {cartridge.derivedFrom}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {children.length > 0 && (
          <div style={{ marginLeft: '20px' }}>
            <div style={{
              marginLeft: '20px',
              height: '20px',
              borderLeft: `2px solid ${theme.border}`,
              width: '2px'
            }} />
            <div style={{ fontSize: '8px', color: theme.textMuted, marginBottom: '4px' }}>
              DERIVED CARTRIDGES ({children.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {children.map(child => (
                <div
                  key={child.id}
                  style={{
                    padding: '6px',
                    backgroundColor: theme.surfaceAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '3px',
                    display: 'inline-block'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 600, color: theme.green, fontFamily: 'monospace' }}>
                    {child.name}
                  </div>
                  <div style={{ fontSize: '8px', color: theme.textSecondary, marginTop: '2px' }}>
                    {child.yearIntroduced} • {child.countryOfOrigin}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar cartridges */}
      {similar.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
            Similar / Competing Cartridges
          </h4>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {similar.map(sim => (
              <div
                key={sim.id}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontFamily: 'monospace'
                }}
              >
                {sim.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for stat display
function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: '5px',
      backgroundColor: theme.surface,
      borderRadius: '3px',
      border: `1px solid ${highlight ? theme.caliberRed + '40' : theme.border}`
    }}>
      <div style={{
        fontSize: '7px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        marginBottom: '2px',
        letterSpacing: '0.3px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        fontFamily: 'monospace',
        color: highlight ? theme.caliberRed : theme.textPrimary
      }}>
        {value}
      </div>
    </div>
  );
}
