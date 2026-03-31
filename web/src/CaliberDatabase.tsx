import { useState, useMemo } from 'react';
import { theme } from './theme';
import type { Cartridge } from './types';
import { getAllCartridges, updateCartridge } from './storage';

type FilterType = 'all' | 'rifle' | 'pistol' | 'revolver' | 'shotgun';
type FilterAvailability = 'all' | 'abundant' | 'common' | 'limited' | 'scarce';
type FilterEnergy = 'all' | 'light' | 'medium' | 'heavy' | 'magnum';
type FilterOwnership = 'all' | 'ownGun' | 'ownAmmo' | 'wishlist';
type SortField = 'name' | 'year' | 'type' | 'bulletDia' | 'velocity' | 'energy' | 'psi' | 'status' | 'availability';
type SortDirection = 'asc' | 'desc';

export function CaliberDatabase() {
  const [allCartridges] = useState<Cartridge[]>(getAllCartridges());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterAvailability, setFilterAvailability] = useState<FilterAvailability>('all');
  const [filterEnergy, setFilterEnergy] = useState<FilterEnergy>('all');
  const [filterOwnership, setFilterOwnership] = useState<FilterOwnership>('all');
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterUseCases, setFilterUseCases] = useState<Set<string>>(new Set());
  const [filterWildcats, setFilterWildcats] = useState(false);
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null);
  const [showImageRecognition, setShowImageRecognition] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [longRangeMode, setLongRangeMode] = useState(false);
  const [selectedForLongRange, setSelectedForLongRange] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filter and sort cartridges
  const filteredCartridges = useMemo(() => {
    let filtered = allCartridges.filter(cart => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = cart.name.toLowerCase().includes(search);
        const matchesAlt = cart.alternateNames?.some(n => n.toLowerCase().includes(search));
        const matchesCountry = cart.countryOfOrigin.toLowerCase().includes(search);
        if (!matchesName && !matchesAlt && !matchesCountry) return false;
      }

      // Type filter
      if (filterType !== 'all' && cart.type.toLowerCase() !== filterType) return false;

      // Availability filter
      if (filterAvailability !== 'all' && cart.availability.toLowerCase() !== filterAvailability) return false;

      // Energy filter
      if (filterEnergy !== 'all') {
        const maxEnergy = cart.energyRangeFTLBS.max;
        if (filterEnergy === 'light' && maxEnergy > 500) return false;
        if (filterEnergy === 'medium' && (maxEnergy <= 500 || maxEnergy > 1500)) return false;
        if (filterEnergy === 'heavy' && (maxEnergy <= 1500 || maxEnergy > 3000)) return false;
        if (filterEnergy === 'magnum' && maxEnergy <= 3000) return false;
      }

      // Ownership filter
      if (filterOwnership === 'ownGun' && !cart.ownGunForThis) return false;
      if (filterOwnership === 'ownAmmo' && !cart.ownAmmoForThis) return false;
      if (filterOwnership === 'wishlist' && !cart.onWishlist) return false;

      // Category filter (multi-select)
      if (filterCategories.size > 0) {
        const cartType = cart.type.toLowerCase();
        if (!filterCategories.has(cartType)) return false;
      }

      // Use case filter (multi-select)
      if (filterUseCases.size > 0) {
        const hasMatchingUseCase = cart.primaryUse.some(use =>
          filterUseCases.has(use.toLowerCase())
        );
        if (!hasMatchingUseCase) return false;
      }

      // Wildcat filter
      if (filterWildcats && cart.standardization !== 'Wildcat') return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'year':
          aVal = a.yearIntroduced;
          bVal = b.yearIntroduced;
          break;
        case 'type':
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        case 'bulletDia':
          aVal = a.bulletDiameterInch;
          bVal = b.bulletDiameterInch;
          break;
        case 'velocity':
          aVal = (a.velocityRangeFPS.min + a.velocityRangeFPS.max) / 2;
          bVal = (b.velocityRangeFPS.min + b.velocityRangeFPS.max) / 2;
          break;
        case 'energy':
          aVal = (a.energyRangeFTLBS.min + a.energyRangeFTLBS.max) / 2;
          bVal = (b.energyRangeFTLBS.min + b.energyRangeFTLBS.max) / 2;
          break;
        case 'psi':
          aVal = a.maxPressurePSI || 0;
          bVal = b.maxPressurePSI || 0;
          break;
        case 'status':
          aVal = a.productionStatus.toLowerCase();
          bVal = b.productionStatus.toLowerCase();
          break;
        case 'availability':
          aVal = a.availability.toLowerCase();
          bVal = b.availability.toLowerCase();
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allCartridges, searchTerm, filterType, filterAvailability, filterEnergy, filterOwnership, sortField, sortDirection]);

  const stats = useMemo(() => ({
    total: allCartridges.length,
    filtered: filteredCartridges.length,
    ownGuns: allCartridges.filter(c => c.ownGunForThis).length,
    ownAmmo: allCartridges.filter(c => c.ownAmmoForThis).length,
    wishlist: allCartridges.filter(c => c.onWishlist).length,
  }), [allCartridges, filteredCartridges]);

  const toggleComparison = (cartId: string) => {
    const newSet = new Set(selectedForComparison);
    if (newSet.has(cartId)) {
      newSet.delete(cartId);
    } else {
      if (newSet.size >= 5) {
        alert('Maximum 5 cartridges can be compared at once');
        return;
      }
      newSet.add(cartId);
    }
    setSelectedForComparison(newSet);
  };

  const clearComparison = () => {
    setSelectedForComparison(new Set());
    setComparisonMode(false);
  };

  const comparedCartridges = useMemo(() => {
    return Array.from(selectedForComparison)
      .map(id => allCartridges.find(c => c.id === id))
      .filter(Boolean) as Cartridge[];
  }, [selectedForComparison, allCartridges]);

  const toggleWishlist = (cartId: string) => {
    const cart = allCartridges.find(c => c.id === cartId);
    if (cart) {
      updateCartridge(cartId, { onWishlist: !cart.onWishlist });
      window.location.reload();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTop3Weights = (weights: number[]): string => {
    const top3 = weights.slice(0, 3);
    return top3.join(', ') + ' gr';
  };

  return (
    <div style={{ padding: '8px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            letterSpacing: '1px',
            margin: '0 0 2px 0',
            color: theme.caliberRed
          }}>
            CALIBER ENCYCLOPEDIA
          </h1>
          <p style={{
            fontSize: '10px',
            color: theme.textSecondary,
            margin: 0
          }}>
            Comprehensive cartridge database • History • Ballistics • Technical specs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            style={{
              padding: '6px 10px',
              backgroundColor: comparisonMode ? theme.caliberRed : theme.surface,
              border: `1px solid ${comparisonMode ? theme.caliberRed : theme.border}`,
              borderRadius: '3px',
              color: comparisonMode ? theme.bg : theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {comparisonMode ? '✓ COMPARE MODE' : 'COMPARE'}
          </button>
          <button
            onClick={() => {
              setLongRangeMode(!longRangeMode);
              if (!longRangeMode) {
                setComparisonMode(false);
              }
            }}
            style={{
              padding: '6px 10px',
              backgroundColor: longRangeMode ? theme.blue : theme.surface,
              border: `1px solid ${longRangeMode ? theme.blue : theme.border}`,
              borderRadius: '3px',
              color: longRangeMode ? theme.bg : theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {longRangeMode ? '✓ LONG RANGE' : 'LONG RANGE ANALYSIS'}
          </button>
          <button
            onClick={() => setShowImageRecognition(true)}
            style={{
              padding: '6px 10px',
              backgroundColor: theme.caliberRed,
              border: 'none',
              borderRadius: '3px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            IDENTIFY CARTRIDGE
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '6px 8px',
        backgroundColor: theme.surface,
        borderRadius: '4px',
        marginBottom: '8px',
        alignItems: 'center',
        fontSize: '9px'
      }}>
        <div>
          <span style={{ color: theme.textMuted }}>TOTAL</span>
          <span style={{ marginLeft: '6px', fontSize: '14px', fontWeight: 600 }}>{stats.total}</span>
        </div>
        <div style={{ height: '16px', width: '1px', backgroundColor: theme.border }} />
        <div>
          <span style={{ color: theme.textMuted }}>SHOWING</span>
          <span style={{ marginLeft: '6px', fontSize: '14px', fontWeight: 600, color: theme.caliberRed }}>{stats.filtered}</span>
        </div>
        <div style={{ height: '16px', width: '1px', backgroundColor: theme.border }} />
        <div>
          <span style={{ color: theme.textMuted }}>OWN GUNS</span>
          <span style={{ marginLeft: '6px', fontSize: '11px', color: theme.green }}>{stats.ownGuns}</span>
        </div>
        <div>
          <span style={{ color: theme.textMuted }}>OWN AMMO</span>
          <span style={{ marginLeft: '6px', fontSize: '11px', color: theme.green }}>{stats.ownAmmo}</span>
        </div>
        <div>
          <span style={{ color: theme.textMuted }}>WISHLIST</span>
          <span style={{ marginLeft: '6px', fontSize: '11px', color: theme.accent }}>{stats.wishlist}</span>
        </div>
        {comparisonMode && (
          <>
            <div style={{ height: '16px', width: '1px', backgroundColor: theme.border }} />
            <div>
              <span style={{ color: theme.textMuted }}>SELECTED</span>
              <span style={{ marginLeft: '6px', fontSize: '11px', color: theme.blue }}>{selectedForComparison.size}/5</span>
            </div>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto auto',
        gap: '6px',
        marginBottom: '8px'
      }}>
        <input
          type="text"
          placeholder="Search cartridges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '6px 8px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '10px',
            fontFamily: 'monospace'
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          style={{
            padding: '6px 8px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <option value="all">ALL TYPES</option>
          <option value="rifle">RIFLE</option>
          <option value="pistol">PISTOL</option>
          <option value="revolver">REVOLVER</option>
          <option value="shotgun">SHOTGUN</option>
        </select>

        <select
          value={filterEnergy}
          onChange={(e) => setFilterEnergy(e.target.value as FilterEnergy)}
          style={{
            padding: '6px 8px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <option value="all">ALL POWER</option>
          <option value="light">0-500 ft-lbs</option>
          <option value="medium">501-1500 ft-lbs</option>
          <option value="heavy">1501-3000 ft-lbs</option>
          <option value="magnum">3000+ ft-lbs</option>
        </select>

        <select
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value as FilterAvailability)}
          style={{
            padding: '6px 8px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <option value="all">ALL AVAILABILITY</option>
          <option value="abundant">ABUNDANT</option>
          <option value="common">COMMON</option>
          <option value="limited">LIMITED</option>
          <option value="scarce">SCARCE</option>
        </select>

        <select
          value={filterOwnership}
          onChange={(e) => setFilterOwnership(e.target.value as FilterOwnership)}
          style={{
            padding: '6px 8px',
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '3px',
            color: theme.textPrimary,
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <option value="all">ALL CARTRIDGES</option>
          <option value="ownGun">I OWN GUN</option>
          <option value="ownAmmo">I OWN AMMO</option>
          <option value="wishlist">WISHLIST</option>
        </select>
      </div>

      {/* Advanced Filters - Categories and Use Cases */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '8px',
        backgroundColor: theme.surface,
        borderRadius: '4px',
        marginBottom: '8px',
        fontSize: '9px',
        flexWrap: 'wrap'
      }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: theme.textMuted, fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>CATEGORY</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['rifle', 'pistol', 'revolver', 'shotgun'].map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterCategories.has(cat)}
                  onChange={(e) => {
                    const newSet = new Set(filterCategories);
                    if (e.target.checked) {
                      newSet.add(cat);
                    } else {
                      newSet.delete(cat);
                    }
                    setFilterCategories(newSet);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: theme.textPrimary, textTransform: 'capitalize' }}>
                  {cat === 'rifle' ? 'Rifle Cartridge' :
                   cat === 'pistol' ? 'Pistol Cartridge' :
                   cat === 'revolver' ? 'Revolver Cartridge' :
                   'Shotgun Shell'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ width: '1px', backgroundColor: theme.border }} />

        {/* Use Case Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: theme.textMuted, fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>USE CASE</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['military', 'hunting', 'self defense', 'target', 'competition'].map(useCase => (
              <label key={useCase} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterUseCases.has(useCase)}
                  onChange={(e) => {
                    const newSet = new Set(filterUseCases);
                    if (e.target.checked) {
                      newSet.add(useCase);
                    } else {
                      newSet.delete(useCase);
                    }
                    setFilterUseCases(newSet);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: theme.textPrimary, textTransform: 'capitalize' }}>{useCase}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ width: '1px', backgroundColor: theme.border }} />

        {/* Wildcat Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: theme.textMuted, fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>SPECIAL</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterWildcats}
              onChange={(e) => setFilterWildcats(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: theme.textPrimary }}>Wildcats Only</span>
          </label>
        </div>
      </div>

      {/* Comparison View */}
      {comparisonMode && comparedCartridges.length >= 2 && (
        <ComparisonTable
          cartridges={comparedCartridges}
          onClose={clearComparison}
        />
      )}

      {/* Long Range Analysis View */}
      {longRangeMode && selectedForLongRange.size >= 2 && (
        <LongRangeAnalysis
          cartridges={allCartridges.filter(c => selectedForLongRange.has(c.id))}
          onClose={() => {
            setSelectedForLongRange(new Set());
          }}
        />
      )}

      {/* Cartridge Table */}
      {filteredCartridges.length > 0 ? (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '4px',
          border: `1px solid ${theme.border}`,
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9px',
            fontFamily: 'monospace',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{
                backgroundColor: theme.surfaceAlt,
                borderBottom: `2px solid ${theme.border}`
              }}>
                {(comparisonMode || longRangeMode) && (
                  <th style={{
                    padding: '6px',
                    textAlign: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: theme.surfaceAlt,
                    zIndex: 1,
                    width: '30px'
                  }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} disabled />
                  </th>
                )}
                <SortableHeader
                  field="name"
                  label="NAME"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  sticky
                  width="180px"
                />
                <th style={{
                  padding: '6px',
                  textAlign: 'left',
                  color: theme.textMuted,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  fontSize: '8px',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: theme.surfaceAlt,
                  zIndex: 1,
                  width: '120px'
                }}>
                  ALT NAMES
                </th>
                <SortableHeader
                  field="year"
                  label="YEAR"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="70px"
                />
                <SortableHeader
                  field="type"
                  label="TYPE"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="80px"
                />
                <SortableHeader
                  field="bulletDia"
                  label="BULLET DIA"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="90px"
                />
                <SortableHeader
                  field="velocity"
                  label="VELOCITY"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="120px"
                />
                <SortableHeader
                  field="energy"
                  label="ENERGY"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="110px"
                />
                <SortableHeader
                  field="psi"
                  label="MAX PSI"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="100px"
                />
                <th style={{
                  padding: '6px',
                  textAlign: 'left',
                  color: theme.textMuted,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  fontSize: '8px',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: theme.surfaceAlt,
                  zIndex: 1,
                  width: '100px'
                }}>
                  WEIGHTS
                </th>
                <SortableHeader
                  field="status"
                  label="STATUS"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="90px"
                />
                <SortableHeader
                  field="availability"
                  label="AVAIL"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  width="80px"
                />
                <th style={{
                  padding: '6px',
                  textAlign: 'center',
                  color: theme.textMuted,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  fontSize: '8px',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: theme.surfaceAlt,
                  zIndex: 1,
                  width: '80px'
                }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCartridges.map(cart => (
                <CartridgeTableRow
                  key={cart.id}
                  cartridge={cart}
                  comparisonMode={comparisonMode}
                  longRangeMode={longRangeMode}
                  isSelected={selectedForComparison.has(cart.id)}
                  isSelectedLongRange={selectedForLongRange.has(cart.id)}
                  isExpanded={expandedRow === cart.id}
                  onToggleComparison={toggleComparison}
                  onToggleLongRange={(id: string) => {
                    const newSet = new Set(selectedForLongRange);
                    if (newSet.has(id)) {
                      newSet.delete(id);
                    } else {
                      if (newSet.size < 5) {
                        newSet.add(id);
                      }
                    }
                    setSelectedForLongRange(newSet);
                  }}
                  onToggleWishlist={toggleWishlist}
                  onToggleExpand={() => setExpandedRow(expandedRow === cart.id ? null : cart.id)}
                  onViewDetails={() => setSelectedCartridge(cart)}
                  getTop3Weights={getTop3Weights}
                  allCartridges={allCartridges}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: theme.textMuted,
          backgroundColor: theme.surface,
          borderRadius: '4px',
          border: `1px solid ${theme.border}`
        }}>
          <p style={{ fontSize: '11px', marginBottom: '4px' }}>No cartridges found</p>
          <p style={{ fontSize: '10px', color: theme.textSecondary }}>
            Try adjusting your filters or search term
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCartridge && (
        <CartridgeDetailModal
          cartridge={selectedCartridge}
          onClose={() => setSelectedCartridge(null)}
          allCartridges={allCartridges}
        />
      )}

      {/* Image Recognition Modal */}
      {showImageRecognition && (
        <ImageRecognitionModal
          onClose={() => setShowImageRecognition(false)}
          onIdentify={(cart) => {
            setShowImageRecognition(false);
            setSelectedCartridge(cart);
          }}
        />
      )}
    </div>
  );
}

// Sortable Header Component
function SortableHeader({
  field,
  label,
  currentField,
  direction,
  onSort,
  sticky,
  width
}: {
  field: SortField;
  label: string;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  sticky?: boolean;
  width?: string;
}) {
  const isActive = currentField === field;

  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '6px',
        textAlign: 'left',
        color: isActive ? theme.caliberRed : theme.textMuted,
        fontWeight: 600,
        letterSpacing: '0.5px',
        fontSize: '8px',
        cursor: 'pointer',
        userSelect: 'none',
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        backgroundColor: theme.surfaceAlt,
        zIndex: sticky ? 1 : 'auto',
        transition: 'color 0.15s',
        width: width || 'auto'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = theme.textPrimary;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = theme.textMuted;
      }}
    >
      {label} {isActive && (direction === 'asc' ? '▲' : '▼')}
    </th>
  );
}

// Cartridge Table Row Component
function CartridgeTableRow({
  cartridge,
  comparisonMode,
  longRangeMode,
  isSelected,
  isSelectedLongRange,
  isExpanded,
  onToggleComparison,
  onToggleLongRange,
  onToggleWishlist,
  onToggleExpand,
  onViewDetails,
  getTop3Weights,
  allCartridges
}: {
  cartridge: Cartridge;
  comparisonMode: boolean;
  longRangeMode?: boolean;
  isSelected: boolean;
  isSelectedLongRange?: boolean;
  isExpanded: boolean;
  onToggleComparison: (id: string) => void;
  onToggleLongRange?: (id: string) => void;
  onToggleWishlist: (id: string) => void;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  getTop3Weights: (weights: number[]) => string;
  allCartridges: Cartridge[];
}) {
  return (
    <>
      <tr
        style={{
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: isExpanded ? theme.surfaceAlt : 'transparent',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = theme.surface + '80';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={onToggleExpand}
      >
        {(comparisonMode || longRangeMode) && (
          <td
            style={{ padding: '6px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={comparisonMode ? isSelected : (isSelectedLongRange || false)}
              onChange={() => {
                if (comparisonMode) {
                  onToggleComparison(cartridge.id);
                } else if (longRangeMode && onToggleLongRange) {
                  onToggleLongRange(cartridge.id);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
          </td>
        )}
        <td style={{
          padding: '6px',
          fontWeight: 600,
          color: theme.caliberRed,
          fontSize: '9px',
          position: 'sticky',
          left: 0,
          backgroundColor: isExpanded ? theme.surfaceAlt : theme.surface
        }}>
          {isExpanded ? '▼' : '▶'} {cartridge.name}
        </td>
        <td style={{ padding: '6px', color: theme.textSecondary, fontSize: '8px' }}>
          {cartridge.alternateNames && cartridge.alternateNames.length > 0
            ? cartridge.alternateNames[0]
            : '-'}
        </td>
        <td style={{ padding: '6px' }}>{cartridge.yearIntroduced}</td>
        <td style={{ padding: '6px', textTransform: 'uppercase', fontSize: '8px' }}>
          {cartridge.type}
        </td>
        <td style={{ padding: '6px' }}>{cartridge.bulletDiameterInch}"</td>
        <td style={{ padding: '6px', fontSize: '8px' }}>
          {cartridge.velocityRangeFPS.min}-{cartridge.velocityRangeFPS.max}
        </td>
        <td style={{ padding: '6px', color: theme.caliberRed, fontWeight: 600, fontSize: '8px' }}>
          {cartridge.energyRangeFTLBS.min}-{cartridge.energyRangeFTLBS.max}
        </td>
        <td style={{ padding: '6px', fontSize: '8px' }}>
          {cartridge.maxPressurePSI ? cartridge.maxPressurePSI.toLocaleString() : 'N/A'}
        </td>
        <td style={{ padding: '6px', fontSize: '8px' }}>
          {getTop3Weights(cartridge.commonBulletWeights)}
        </td>
        <td style={{ padding: '6px', fontSize: '8px', textTransform: 'uppercase' }}>
          {cartridge.productionStatus}
        </td>
        <td style={{ padding: '6px', fontSize: '8px', textTransform: 'uppercase' }}>
          {cartridge.availability}
        </td>
        <td
          style={{ padding: '6px', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
            {cartridge.ownGunForThis && (
              <span style={{
                fontSize: '7px',
                padding: '2px 3px',
                backgroundColor: theme.green + '30',
                color: theme.green,
                borderRadius: '2px'
              }}>
                G
              </span>
            )}
            {cartridge.ownAmmoForThis && (
              <span style={{
                fontSize: '7px',
                padding: '2px 3px',
                backgroundColor: theme.green + '30',
                color: theme.green,
                borderRadius: '2px'
              }}>
                A
              </span>
            )}
            {cartridge.onWishlist && (
              <span style={{
                fontSize: '7px',
                padding: '2px 3px',
                backgroundColor: theme.accent + '30',
                color: theme.accent,
                borderRadius: '2px'
              }}>
                W
              </span>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td
            colSpan={(comparisonMode || longRangeMode) ? 13 : 12}
            style={{
              padding: '0',
              backgroundColor: theme.bg,
              borderBottom: `2px solid ${theme.border}`
            }}
          >
            <ExpandedRowDetails
              cartridge={cartridge}
              onViewDetails={onViewDetails}
              onToggleWishlist={onToggleWishlist}
              allCartridges={allCartridges}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// Expanded Row Details Component
function ExpandedRowDetails({
  cartridge,
  onViewDetails,
  onToggleWishlist,
  allCartridges
}: {
  cartridge: Cartridge;
  onViewDetails: () => void;
  onToggleWishlist: (id: string) => void;
  allCartridges: Cartridge[];
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'history' | 'military' | 'ballistics' | 'family'>('overview');

  return (
    <div style={{ padding: '10px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {(['overview', 'specs', 'history', 'military', 'ballistics', 'family'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 8px',
              backgroundColor: activeTab === tab ? theme.caliberRed : theme.surface,
              border: 'none',
              borderRadius: '2px',
              color: activeTab === tab ? theme.bg : theme.textPrimary,
              fontSize: '7px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600
            }}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={() => onToggleWishlist(cartridge.id)}
          style={{
            padding: '4px 8px',
            backgroundColor: cartridge.onWishlist ? theme.accent : theme.surface,
            border: `1px solid ${cartridge.onWishlist ? theme.accent : theme.border}`,
            borderRadius: '2px',
            color: cartridge.onWishlist ? theme.bg : theme.textPrimary,
            fontSize: '7px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          {cartridge.onWishlist ? '★' : '☆'} WISHLIST
        </button>
        <button
          onClick={onViewDetails}
          style={{
            padding: '4px 8px',
            backgroundColor: theme.caliberRed,
            border: 'none',
            borderRadius: '2px',
            color: theme.bg,
            fontSize: '7px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          FULL DETAILS
        </button>
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: theme.surface,
        padding: '8px',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        {activeTab === 'overview' && <OverviewTab cartridge={cartridge} />}
        {activeTab === 'specs' && <SpecsTab cartridge={cartridge} />}
        {activeTab === 'history' && <HistoryTab cartridge={cartridge} />}
        {activeTab === 'military' && <MilitaryTab cartridge={cartridge} />}
        {activeTab === 'ballistics' && <BallisticsTab cartridge={cartridge} />}
        {activeTab === 'family' && <FamilyTreeTab cartridge={cartridge} allCartridges={allCartridges} />}
      </div>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '10px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bg,
          borderRadius: '6px',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
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

// Image Recognition Modal (placeholder)
function ImageRecognitionModal({ onClose }: { onClose: () => void; onIdentify?: (cart: Cartridge) => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '10px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bg,
          borderRadius: '6px',
          padding: '16px',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.caliberRed }}>
          Cartridge Identification
        </h3>
        <p style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '16px' }}>
          AI-powered cartridge recognition coming soon!
        </p>
        <div style={{
          padding: '40px',
          backgroundColor: theme.surface,
          borderRadius: '6px',
          border: `2px dashed ${theme.border}`,
          marginBottom: '12px'
        }}>
          <p style={{ fontSize: '10px', color: theme.textMuted }}>
            Take a photo of a live round, case, or headstamp
          </p>
          <p style={{ fontSize: '9px', color: theme.textSecondary, marginTop: '6px' }}>
            Feature in development - will use AI vision to identify cartridges
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
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
    </div>
  );
}

// Long Range Analysis Component
function LongRangeAnalysis({ cartridges, onClose }: { cartridges: Cartridge[]; onClose: () => void }) {
  const distances = [100, 200, 300, 500, 800, 1000];
  const [selectedDistance, setSelectedDistance] = useState(1000);

  // Calculate drop at distance (simplified ballistic calculation)
  const calculateDrop = (cart: Cartridge, distance: number) => {
    const avgVelocity = (cart.velocityRangeFPS.min + cart.velocityRangeFPS.max) / 2;
    const avgWeight = cart.commonBulletWeights[Math.floor(cart.commonBulletWeights.length / 2)];

    // Time of flight (rough approximation)
    const timeOfFlight = (distance * 3) / avgVelocity;

    // Drop in inches (gravity * time^2)
    const dropInches = 193 * timeOfFlight * timeOfFlight;

    return dropInches;
  };

  // Calculate energy retention at distance
  const calculateEnergyAtDistance = (cart: Cartridge, distance: number) => {
    const avgEnergy = (cart.energyRangeFTLBS.min + cart.energyRangeFTLBS.max) / 2;

    // Simplified energy retention (assumes ~10% loss per 100 yards for typical bullets)
    const retentionFactor = Math.pow(0.92, distance / 100);

    return Math.round(avgEnergy * retentionFactor);
  };

  // Get performance data for all cartridges at all distances
  const performanceData = cartridges.map(cart => ({
    cartridge: cart,
    data: distances.map(dist => ({
      distance: dist,
      drop: calculateDrop(cart, dist),
      energy: calculateEnergyAtDistance(cart, dist)
    }))
  }));

  // Find best performers at selected distance
  const performanceAtSelectedDistance = performanceData.map(p => ({
    cartridge: p.cartridge,
    drop: p.data.find(d => d.distance === selectedDistance)?.drop || 0,
    energy: p.data.find(d => d.distance === selectedDistance)?.energy || 0
  }));

  const sortedByDrop = [...performanceAtSelectedDistance].sort((a, b) => a.drop - b.drop);
  const sortedByEnergy = [...performanceAtSelectedDistance].sort((a, b) => b.energy - a.energy);

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '12px',
      border: `2px solid ${theme.blue}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '12px',
          fontFamily: 'monospace',
          color: theme.blue,
          letterSpacing: '0.5px'
        }}>
          LONG RANGE ANALYSIS ({cartridges.length} cartridges)
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

      {/* Distance Selector */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '9px', color: theme.textMuted, marginRight: '8px' }}>ANALYZE AT:</span>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
          {distances.map(dist => (
            <button
              key={dist}
              onClick={() => setSelectedDistance(dist)}
              style={{
                padding: '4px 8px',
                backgroundColor: selectedDistance === dist ? theme.blue : theme.surfaceAlt,
                border: `1px solid ${selectedDistance === dist ? theme.blue : theme.border}`,
                borderRadius: '3px',
                color: selectedDistance === dist ? theme.bg : theme.textPrimary,
                fontSize: '8px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {dist} YD
            </button>
          ))}
        </div>
      </div>

      {/* Performance Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Best for Flat Shooting (Least Drop) */}
        <div style={{ backgroundColor: theme.surfaceAlt, padding: '8px', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '9px', color: theme.green, letterSpacing: '0.5px' }}>
            FLATTEST SHOOTING @ {selectedDistance}yd
          </h4>
          {sortedByDrop.slice(0, 3).map((item, idx) => (
            <div key={item.cartridge.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px',
              backgroundColor: idx === 0 ? theme.green + '20' : 'transparent',
              borderRadius: '2px',
              marginBottom: '2px'
            }}>
              <span style={{ fontSize: '8px', color: theme.textPrimary, fontWeight: idx === 0 ? 600 : 400 }}>
                #{idx + 1} {item.cartridge.name}
              </span>
              <span style={{ fontSize: '8px', color: theme.green, fontWeight: 600 }}>
                {item.drop.toFixed(1)}" drop
              </span>
            </div>
          ))}
        </div>

        {/* Best for Energy Retention */}
        <div style={{ backgroundColor: theme.surfaceAlt, padding: '8px', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '9px', color: theme.caliberRed, letterSpacing: '0.5px' }}>
            MOST ENERGY @ {selectedDistance}yd
          </h4>
          {sortedByEnergy.slice(0, 3).map((item, idx) => (
            <div key={item.cartridge.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px',
              backgroundColor: idx === 0 ? theme.caliberRed + '20' : 'transparent',
              borderRadius: '2px',
              marginBottom: '2px'
            }}>
              <span style={{ fontSize: '8px', color: theme.textPrimary, fontWeight: idx === 0 ? 600 : 400 }}>
                #{idx + 1} {item.cartridge.name}
              </span>
              <span style={{ fontSize: '8px', color: theme.caliberRed, fontWeight: 600 }}>
                {item.energy} ft-lbs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Comparison Table */}
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
                padding: '6px',
                backgroundColor: theme.surfaceAlt,
                color: theme.textMuted,
                position: 'sticky',
                left: 0,
                zIndex: 1,
                borderRight: `1px solid ${theme.border}`
              }}>CARTRIDGE</th>
              {distances.map(dist => (
                <th key={dist} colSpan={2} style={{
                  textAlign: 'center',
                  padding: '6px',
                  backgroundColor: theme.surfaceAlt,
                  color: dist === selectedDistance ? theme.blue : theme.textMuted,
                  borderLeft: `1px solid ${theme.border}`,
                  fontWeight: dist === selectedDistance ? 600 : 400
                }}>
                  {dist} YD
                </th>
              ))}
            </tr>
            <tr>
              <th style={{
                padding: '4px 6px',
                backgroundColor: theme.surface,
                color: theme.textMuted,
                fontSize: '7px',
                position: 'sticky',
                left: 0,
                zIndex: 1,
                borderRight: `1px solid ${theme.border}`
              }}></th>
              {distances.map(dist => (
                <>
                  <th key={`${dist}-drop`} style={{
                    padding: '4px',
                    backgroundColor: theme.surface,
                    color: theme.green,
                    fontSize: '7px',
                    textAlign: 'center',
                    borderLeft: `1px solid ${theme.border}`
                  }}>
                    DROP"
                  </th>
                  <th key={`${dist}-energy`} style={{
                    padding: '4px',
                    backgroundColor: theme.surface,
                    color: theme.caliberRed,
                    fontSize: '7px',
                    textAlign: 'center'
                  }}>
                    ENERGY
                  </th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {performanceData.map(p => (
              <tr key={p.cartridge.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{
                  padding: '6px',
                  fontWeight: 600,
                  color: theme.caliberRed,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: theme.surface,
                  borderRight: `1px solid ${theme.border}`
                }}>
                  {p.cartridge.name}
                </td>
                {p.data.map(d => (
                  <>
                    <td key={`${d.distance}-drop`} style={{
                      padding: '6px',
                      textAlign: 'center',
                      color: theme.green,
                      backgroundColor: d.distance === selectedDistance ? theme.blue + '10' : 'transparent',
                      borderLeft: `1px solid ${theme.border}`
                    }}>
                      {d.drop.toFixed(1)}
                    </td>
                    <td key={`${d.distance}-energy`} style={{
                      padding: '6px',
                      textAlign: 'center',
                      color: theme.caliberRed,
                      fontWeight: 600,
                      backgroundColor: d.distance === selectedDistance ? theme.blue + '10' : 'transparent'
                    }}>
                      {d.energy}
                    </td>
                  </>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: theme.surfaceAlt,
        borderRadius: '4px',
        border: `1px solid ${theme.blue}`
      }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', color: theme.blue, letterSpacing: '0.5px' }}>
          RECOMMENDATIONS
        </h4>
        <div style={{ fontSize: '8px', color: theme.textSecondary, lineHeight: '1.5' }}>
          <p style={{ margin: '0 0 4px 0' }}>
            <strong style={{ color: theme.textPrimary }}>Long-Range Target Shooting:</strong> Choose cartridges with flattest trajectory (least drop) and sufficient energy retention. Top pick: {sortedByDrop[0].cartridge.name}
          </p>
          <p style={{ margin: '0' }}>
            <strong style={{ color: theme.textPrimary }}>Extreme-Range Hunting:</strong> Prioritize energy retention for ethical kills. Minimum 1000 ft-lbs recommended for large game. Top pick: {sortedByEnergy[0].cartridge.name}
          </p>
        </div>
      </div>
    </div>
  );
}
