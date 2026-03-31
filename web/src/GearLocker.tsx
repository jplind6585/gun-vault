import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useResponsive } from './useResponsive';

type GearCategory = 'optic' | 'holster' | 'magazine' | 'suppressor' | 'cleaning' | 'accessory' | 'nfa';

interface GearItem {
  id: string;
  category: GearCategory;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  compatibility?: string[]; // Compatible firearm calibers/models
  mountingSystem?: string; // e.g., Picatinny, M-LOK, KeyMod
  notes?: string;
  rating?: number; // 1-5 stars
  lastCleaned?: string;
  cleaningIntervalDays?: number;
  location?: string; // Storage location
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  images?: string[];
  nfaStamp?: string; // Tax stamp number for NFA items
  nfaApprovalDate?: string;
}

interface MaintenanceSchedule {
  itemId: string;
  lastService: string;
  nextService: string;
  intervalDays: number;
  type: string; // e.g., "cleaning", "inspection", "lubrication"
}

export function GearLocker() {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [showGearForm, setShowGearForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCompatibility, setFilterCompatibility] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'date' | 'price'>('category');
  const { isMobile } = useResponsive();

  // Load gear from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gunvault_gear_locker');
      if (saved) {
        setGearItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load gear:', e);
    }
  }, []);

  // Save gear item
  const saveGear = (item: Omit<GearItem, 'id'>) => {
    const newItem: GearItem = {
      ...item,
      id: Date.now().toString()
    };

    const updated = [newItem, ...gearItems];
    setGearItems(updated);
    localStorage.setItem('gunvault_gear_locker', JSON.stringify(updated));
    setShowGearForm(false);
  };

  // Delete gear item
  const deleteGear = (id: string) => {
    const updated = gearItems.filter(g => g.id !== id);
    setGearItems(updated);
    localStorage.setItem('gunvault_gear_locker', JSON.stringify(updated));
    setSelectedItem(null);
  };

  // Check maintenance due
  const isMaintenanceDue = (item: GearItem): boolean => {
    if (!item.lastCleaned || !item.cleaningIntervalDays) return false;
    const daysSince = Math.floor(
      (Date.now() - new Date(item.lastCleaned).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= item.cleaningIntervalDays;
  };

  // Filter and sort
  const filteredGear = gearItems
    .filter(item => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterCompatibility !== 'all' && !item.compatibility?.includes(filterCompatibility)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
          return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
        case 'price':
          return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        default:
          return 0;
      }
    });

  // Stats
  const totalValue = gearItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
  const maintenanceDue = gearItems.filter(isMaintenanceDue).length;
  const nfaItems = gearItems.filter(item => item.category === 'nfa' || item.category === 'suppressor').length;

  const compatibilities = ['all', ...Array.from(
    new Set(gearItems.flatMap(item => item.compatibility || []))
  )].sort();

  const cardStyle = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    padding: isMobile ? '16px' : '20px'
  };

  const sectionTitleStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '1px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    fontWeight: 600
  };

  const categoryIcons: Record<GearCategory, string> = {
    optic: '🔭',
    holster: '🔫',
    magazine: '📦',
    suppressor: '🔇',
    cleaning: '🧹',
    accessory: '🔧',
    nfa: '⚠️'
  };

  const categoryLabels: Record<GearCategory, string> = {
    optic: 'Optics',
    holster: 'Holsters',
    magazine: 'Magazines',
    suppressor: 'Suppressors',
    cleaning: 'Cleaning',
    accessory: 'Accessories',
    nfa: 'NFA Items'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      padding: isMobile ? '16px' : '24px',
      paddingBottom: isMobile ? '80px' : '24px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `0.5px solid ${theme.border}`,
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontFamily: 'monospace',
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          margin: '0 0 8px 0'
        }}>
          GEAR LOCKER
        </h1>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: theme.textSecondary,
          margin: 0
        }}>
          Track optics, accessories, suppressors, and gear
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px'
      }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            TOTAL ITEMS
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.accent }}>
            {gearItems.length}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            TOTAL VALUE
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.green }}>
            ${totalValue.toLocaleString()}
          </div>
        </div>
        {!isMobile && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                MAINT. DUE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: maintenanceDue > 0 ? theme.orange : theme.textPrimary }}>
                {maintenanceDue}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                NFA ITEMS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: theme.blue }}>
                {nfaItems}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Maintenance Alerts */}
      {maintenanceDue > 0 && (
        <div style={{
          ...cardStyle,
          backgroundColor: theme.orange,
          borderColor: theme.orange,
          marginBottom: '24px',
          padding: '14px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#fff'
          }}>
            ⚠️ MAINTENANCE REQUIRED
          </div>
          <div style={{
            fontSize: '10px',
            lineHeight: '1.5',
            color: '#fff'
          }}>
            {maintenanceDue} item{maintenanceDue !== 1 ? 's' : ''} need{maintenanceDue === 1 ? 's' : ''} cleaning or maintenance.
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setShowGearForm(true)}
            style={{
              padding: '14px',
              backgroundColor: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '1px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + ADD GEAR
          </button>
          <button
            onClick={() => {
              const report = generateCompatibilityReport(gearItems);
              alert(report);
            }}
            style={{
              padding: '14px',
              backgroundColor: 'transparent',
              color: theme.textPrimary,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '1px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📊 COMPATIBILITY REPORT
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.surface,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterCompatibility}
            onChange={(e) => setFilterCompatibility(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.surface,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {compatibilities.map(comp => (
              <option key={comp} value={comp}>
                {comp === 'all' ? 'All Compatible' : comp}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.surface,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="category">Sort: Category</option>
            <option value="name">Sort: Name</option>
            <option value="date">Sort: Date</option>
            <option value="price">Sort: Price</option>
          </select>
        </div>
      </div>

      {/* Gear Grid */}
      {filteredGear.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: 'center',
          padding: '40px',
          color: theme.textMuted,
          fontSize: '12px'
        }}>
          No gear items yet. Click "ADD GEAR" to get started.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px'
        }}>
          {filteredGear.map(item => {
            const needsMaintenance = isMaintenanceDue(item);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: '14px',
                  backgroundColor: theme.surface,
                  borderRadius: '6px',
                  border: `0.5px solid ${needsMaintenance ? theme.orange : theme.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = needsMaintenance ? theme.orange : theme.border)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>{categoryIcons[item.category]}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: theme.textMuted }}>
                        {categoryLabels[item.category]}
                      </div>
                    </div>
                  </div>
                  {needsMaintenance && (
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                  )}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  marginBottom: '8px'
                }}>
                  {item.manufacturer} {item.model}
                </div>

                {item.compatibility && item.compatibility.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    {item.compatibility.slice(0, 3).map((comp, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: theme.bg,
                          borderRadius: '3px',
                          fontSize: '9px',
                          color: theme.textMuted
                        }}
                      >
                        {comp}
                      </span>
                    ))}
                    {item.compatibility.length > 3 && (
                      <span style={{
                        fontSize: '9px',
                        color: theme.textMuted
                      }}>
                        +{item.compatibility.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: `0.5px solid ${theme.border}`
                }}>
                  {item.purchasePrice && (
                    <div style={{ fontSize: '11px', color: theme.green, fontWeight: 600 }}>
                      ${item.purchasePrice.toLocaleString()}
                    </div>
                  )}
                  {item.rating && (
                    <div style={{ fontSize: '12px' }}>
                      {'⭐'.repeat(item.rating)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gear Form Modal */}
      {showGearForm && (
        <GearForm
          onSave={saveGear}
          onCancel={() => setShowGearForm(false)}
        />
      )}

      {/* Gear Detail Modal */}
      {selectedItem && (
        <GearDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={() => deleteGear(selectedItem.id)}
          onUpdate={(updated) => {
            const items = gearItems.map(g => g.id === updated.id ? updated : g);
            setGearItems(items);
            localStorage.setItem('gunvault_gear_locker', JSON.stringify(items));
            setSelectedItem(updated);
          }}
        />
      )}
    </div>
  );
}

// Generate compatibility report
function generateCompatibilityReport(items: GearItem[]): string {
  const compatibilityMap = new Map<string, string[]>();

  items.forEach(item => {
    item.compatibility?.forEach(comp => {
      if (!compatibilityMap.has(comp)) {
        compatibilityMap.set(comp, []);
      }
      compatibilityMap.get(comp)!.push(`${item.category}: ${item.name}`);
    });
  });

  let report = 'COMPATIBILITY REPORT\n\n';
  compatibilityMap.forEach((gear, caliber) => {
    report += `${caliber}:\n`;
    gear.forEach(item => {
      report += `  - ${item}\n`;
    });
    report += '\n';
  });

  return report || 'No compatibility data available.';
}

// Gear Form Component
function GearForm({
  onSave,
  onCancel
}: {
  onSave: (item: Omit<GearItem, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    category: 'optic' as GearCategory,
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: undefined as number | undefined,
    compatibility: [] as string[],
    mountingSystem: '',
    notes: '',
    rating: undefined as number | undefined,
    cleaningIntervalDays: undefined as number | undefined,
    location: '',
    condition: 'excellent' as 'excellent' | 'good' | 'fair' | 'poor',
    nfaStamp: '',
    nfaApprovalDate: ''
  });

  const { isMobile } = useResponsive();
  const [compatInput, setCompatInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addCompatibility = () => {
    if (compatInput && !formData.compatibility.includes(compatInput)) {
      setFormData({
        ...formData,
        compatibility: [...formData.compatibility, compatInput]
      });
      setCompatInput('');
    }
  };

  const removeCompatibility = (comp: string) => {
    setFormData({
      ...formData,
      compatibility: formData.compatibility.filter(c => c !== comp)
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px'
  };

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'monospace',
    fontSize: '10px',
    letterSpacing: '0.8px',
    color: theme.textSecondary,
    marginBottom: '6px',
    textTransform: 'uppercase' as const
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '24px',
        overflowY: 'auto'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          padding: isMobile ? '20px' : '24px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'monospace',
          fontSize: '16px',
          letterSpacing: '1px',
          margin: '0 0 20px 0'
        }}>
          ADD GEAR
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as GearCategory })}
                style={inputStyle}
              >
                <option value="optic">Optic/Sight</option>
                <option value="holster">Holster</option>
                <option value="magazine">Magazine</option>
                <option value="suppressor">Suppressor</option>
                <option value="cleaning">Cleaning Supplies</option>
                <option value="accessory">Accessory</option>
                <option value="nfa">NFA Item</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Red Dot Sight"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Manufacturer *</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Trijicon, Aimpoint"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                style={inputStyle}
                placeholder="e.g., MRO, T2"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Purchase Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice || ''}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                style={inputStyle}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Mounting System</label>
              <input
                type="text"
                value={formData.mountingSystem}
                onChange={(e) => setFormData({ ...formData, mountingSystem: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Picatinny, M-LOK"
              />
            </div>

            <div>
              <label style={labelStyle}>Storage Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Safe, Range Bag"
              />
            </div>

            <div>
              <label style={labelStyle}>Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.rating || ''}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cleaning Interval (days)</label>
              <input
                type="number"
                value={formData.cleaningIntervalDays || ''}
                onChange={(e) => setFormData({ ...formData, cleaningIntervalDays: parseInt(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>

            {(formData.category === 'nfa' || formData.category === 'suppressor') && (
              <>
                <div>
                  <label style={labelStyle}>NFA Tax Stamp #</label>
                  <input
                    type="text"
                    value={formData.nfaStamp}
                    onChange={(e) => setFormData({ ...formData, nfaStamp: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>NFA Approval Date</label>
                  <input
                    type="date"
                    value={formData.nfaApprovalDate}
                    onChange={(e) => setFormData({ ...formData, nfaApprovalDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Compatibility</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={compatInput}
                onChange={(e) => setCompatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompatibility())}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g., 9mm, AR-15, G19"
              />
              <button
                type="button"
                onClick={addCompatibility}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme.accent,
                  color: theme.bg,
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ADD
              </button>
            </div>
            {formData.compatibility.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.compatibility.map((comp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: theme.bg,
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {comp}
                    <button
                      type="button"
                      onClick={() => removeCompatibility(comp)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.red,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              placeholder="Additional notes..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: theme.textPrimary,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                backgroundColor: theme.accent,
                color: theme.bg,
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              SAVE GEAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Gear Detail Modal
function GearDetailModal({
  item,
  onClose,
  onDelete,
  onUpdate
}: {
  item: GearItem;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (item: GearItem) => void;
}) {
  const { isMobile } = useResponsive();

  const markCleaned = () => {
    onUpdate({
      ...item,
      lastCleaned: new Date().toISOString()
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          padding: isMobile ? '20px' : '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'monospace',
          fontSize: '18px',
          letterSpacing: '1px',
          margin: '0 0 4px 0'
        }}>
          {item.name}
        </h2>
        <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px' }}>
          {item.manufacturer} {item.model}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '16px',
          backgroundColor: theme.bg,
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {item.serialNumber && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>SERIAL NUMBER</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.serialNumber}</div>
            </div>
          )}
          {item.purchaseDate && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>PURCHASED</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                {new Date(item.purchaseDate).toLocaleDateString()}
              </div>
            </div>
          )}
          {item.purchasePrice && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>PRICE</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.green }}>
                ${item.purchasePrice.toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>CONDITION</div>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
              {item.condition}
            </div>
          </div>
          {item.mountingSystem && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>MOUNTING</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.mountingSystem}</div>
            </div>
          )}
          {item.location && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>LOCATION</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.location}</div>
            </div>
          )}
        </div>

        {item.compatibility && item.compatibility.length > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '16px',
            borderLeft: `3px solid ${theme.blue}`
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>
              COMPATIBLE WITH
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {item.compatibility.map((comp, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '3px 8px',
                    backgroundColor: theme.surface,
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {(item.category === 'nfa' || item.category === 'suppressor') && item.nfaStamp && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '16px',
            borderLeft: `3px solid ${theme.orange}`
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>
              NFA INFORMATION
            </div>
            <div style={{ fontSize: '11px' }}>
              Tax Stamp: {item.nfaStamp}
            </div>
            {item.nfaApprovalDate && (
              <div style={{ fontSize: '11px', color: theme.textSecondary }}>
                Approved: {new Date(item.nfaApprovalDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {item.lastCleaned && item.cleaningIntervalDays && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>
              MAINTENANCE
            </div>
            <div style={{ fontSize: '11px', marginBottom: '8px' }}>
              Last Cleaned: {new Date(item.lastCleaned).toLocaleDateString()}
            </div>
            <button
              onClick={markCleaned}
              style={{
                padding: '8px 12px',
                backgroundColor: theme.green,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '10px',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              MARK AS CLEANED
            </button>
          </div>
        )}

        {item.notes && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>
              NOTES
            </div>
            <div style={{ fontSize: '11px', color: theme.textSecondary, lineHeight: '1.5' }}>
              {item.notes}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onDelete}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: theme.red,
              border: `0.5px solid ${theme.red}`,
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.8px',
              cursor: 'pointer'
            }}
          >
            DELETE
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
