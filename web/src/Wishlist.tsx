import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useResponsive } from './useResponsive';
import { getAllGuns } from './storage';
import type { Gun } from './types';

interface WishlistItem {
  id: string;
  make: string;
  model: string;
  caliber: string;
  type: 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA';
  priority: 'high' | 'medium' | 'low';
  estimatedPrice: number;
  currentPrice?: number;
  lowestPrice?: number;
  notes?: string;
  pros?: string[];
  cons?: string[];
  alternativeOptions?: string[];
  useCase?: string;
  addedDate: string;
  targetDate?: string;
  savedAmount?: number;
  priceAlertThreshold?: number;
  link?: string;
}

export function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [ownedGuns, setOwnedGuns] = useState<Gun[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'price' | 'date'>('priority');
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const { isMobile } = useResponsive();

  // Load data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gunvault_wishlist');
      if (saved) {
        setWishlistItems(JSON.parse(saved));
      }
      setOwnedGuns(getAllGuns());
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  }, []);

  // Save wishlist item
  const saveItem = (item: Omit<WishlistItem, 'id' | 'addedDate'>) => {
    const newItem: WishlistItem = {
      ...item,
      id: Date.now().toString(),
      addedDate: new Date().toISOString()
    };

    const updated = [newItem, ...wishlistItems];
    setWishlistItems(updated);
    localStorage.setItem('gunvault_wishlist', JSON.stringify(updated));
    setShowItemForm(false);
  };

  // Delete wishlist item
  const deleteItem = (id: string) => {
    const updated = wishlistItems.filter(item => item.id !== id);
    setWishlistItems(updated);
    localStorage.setItem('gunvault_wishlist', JSON.stringify(updated));
    setSelectedItem(null);
  };

  // Update item
  const updateItem = (updated: WishlistItem) => {
    const items = wishlistItems.map(item => item.id === updated.id ? updated : item);
    setWishlistItems(items);
    localStorage.setItem('gunvault_wishlist', JSON.stringify(items));
    setSelectedItem(updated);
  };

  // Filter and sort
  const filteredItems = wishlistItems
    .filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'price':
          return a.estimatedPrice - b.estimatedPrice;
        case 'date':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default:
          return 0;
      }
    });

  // Calculate stats
  const totalValue = wishlistItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const totalSaved = wishlistItems.reduce((sum, item) => sum + (item.savedAmount || 0), 0);
  const highPriorityCount = wishlistItems.filter(item => item.priority === 'high').length;

  // Caliber gap analysis
  const ownedCalibers = new Set(ownedGuns.map(g => g.caliber));
  const wishlistCalibers = new Set(wishlistItems.map(item => item.caliber));
  const newCalibers = Array.from(wishlistCalibers).filter(cal => !ownedCalibers.has(cal));

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

  const priorityColors = {
    high: theme.red,
    medium: theme.orange,
    low: theme.blue
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
          WISHLIST & COLLECTION PLANNING
        </h1>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: theme.textSecondary,
          margin: 0
        }}>
          Track desired firearms, budget, and analyze collection gaps
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
            ITEMS
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.accent }}>
            {wishlistItems.length}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            TOTAL VALUE
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.textPrimary }}>
            ${totalValue.toLocaleString()}
          </div>
        </div>
        {!isMobile && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                SAVED
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: theme.green }}>
                ${totalSaved.toLocaleString()}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                HIGH PRIORITY
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: theme.red }}>
                {highPriorityCount}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Budget Progress */}
      {totalValue > 0 && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>Budget Progress</div>
          <div style={{
            width: '100%',
            height: '32px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${Math.min((totalSaved / totalValue) * 100, 100)}%`,
              height: '100%',
              backgroundColor: theme.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'width 0.3s'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                {((totalSaved / totalValue) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: theme.textSecondary }}>
              Saved: ${totalSaved.toLocaleString()}
            </span>
            <span style={{ color: theme.textSecondary }}>
              Remaining: ${(totalValue - totalSaved).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Gap Analysis */}
      {newCalibers.length > 0 && (
        <div style={{
          ...cardStyle,
          backgroundColor: theme.blue,
          borderColor: theme.blue,
          marginBottom: '24px',
          padding: '14px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#fff'
          }}>
            📊 COLLECTION GAPS
          </div>
          <div style={{
            fontSize: '10px',
            lineHeight: '1.5',
            color: '#fff'
          }}>
            Your wishlist includes {newCalibers.length} new caliber{newCalibers.length !== 1 ? 's' : ''}: {newCalibers.join(', ')}
          </div>
          <button
            onClick={() => setShowGapAnalysis(true)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#fff',
              color: theme.blue,
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            VIEW ANALYSIS
          </button>
        </div>
      )}

      {/* Actions & Filters */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowItemForm(true)}
          style={{
            width: isMobile ? '100%' : 'auto',
            padding: '14px 24px',
            backgroundColor: theme.accent,
            color: theme.bg,
            border: 'none',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '1px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          + ADD TO WISHLIST
        </button>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
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
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
            <option value="all">All Types</option>
            <option value="Pistol">Pistol</option>
            <option value="Rifle">Rifle</option>
            <option value="Shotgun">Shotgun</option>
            <option value="Suppressor">Suppressor</option>
            <option value="NFA">NFA</option>
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
            <option value="priority">Sort: Priority</option>
            <option value="price">Sort: Price</option>
            <option value="date">Sort: Date Added</option>
          </select>
        </div>
      </div>

      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: 'center',
          padding: '40px',
          color: theme.textMuted,
          fontSize: '12px'
        }}>
          No wishlist items yet. Click "ADD TO WISHLIST" to start planning your collection.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '12px'
        }}>
          {filteredItems.map(item => {
            const savingsProgress = item.savedAmount ? (item.savedAmount / item.estimatedPrice) * 100 : 0;
            const priceChange = item.currentPrice && item.lowestPrice
              ? ((item.currentPrice - item.lowestPrice) / item.lowestPrice) * 100
              : 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: '14px',
                  backgroundColor: theme.surface,
                  borderRadius: '6px',
                  border: `0.5px solid ${theme.border}`,
                  borderLeft: `4px solid ${priorityColors[item.priority]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      {item.make} {item.model}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.caliberRed }}>
                      {item.caliber}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    backgroundColor: theme.bg,
                    borderRadius: '3px',
                    fontSize: '9px',
                    color: priorityColors[item.priority],
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {item.priority}
                  </div>
                </div>

                <div style={{
                  fontSize: '10px',
                  color: theme.textMuted,
                  marginBottom: '10px'
                }}>
                  {item.type} • Added {new Date(item.addedDate).toLocaleDateString()}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '9px', color: theme.textMuted }}>EST. PRICE</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.green }}>
                      ${item.estimatedPrice.toLocaleString()}
                    </div>
                  </div>
                  {item.currentPrice && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>CURRENT</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        ${item.currentPrice.toLocaleString()}
                      </div>
                      {priceChange !== 0 && (
                        <div style={{
                          fontSize: '9px',
                          color: priceChange < 0 ? theme.green : theme.red
                        }}>
                          {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {item.savedAmount && item.savedAmount > 0 && (
                  <div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: theme.bg,
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        width: `${Math.min(savingsProgress, 100)}%`,
                        height: '100%',
                        backgroundColor: theme.green,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '9px', color: theme.textSecondary }}>
                      Saved ${item.savedAmount.toLocaleString()} ({savingsProgress.toFixed(0)}%)
                    </div>
                  </div>
                )}

                {item.useCase && (
                  <div style={{
                    marginTop: '10px',
                    padding: '6px 8px',
                    backgroundColor: theme.bg,
                    borderRadius: '3px',
                    fontSize: '10px',
                    color: theme.textSecondary
                  }}>
                    Use: {item.useCase}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <WishlistItemForm
          onSave={saveItem}
          onCancel={() => setShowItemForm(false)}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={() => deleteItem(selectedItem.id)}
          onUpdate={updateItem}
        />
      )}

      {/* Gap Analysis Modal */}
      {showGapAnalysis && (
        <GapAnalysisModal
          ownedGuns={ownedGuns}
          wishlistItems={wishlistItems}
          onClose={() => setShowGapAnalysis(false)}
        />
      )}
    </div>
  );
}

// Wishlist Item Form Component
function WishlistItemForm({
  onSave,
  onCancel
}: {
  onSave: (item: Omit<WishlistItem, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    caliber: '',
    type: 'Pistol' as 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA',
    priority: 'medium' as 'high' | 'medium' | 'low',
    estimatedPrice: 0,
    currentPrice: undefined as number | undefined,
    notes: '',
    pros: [] as string[],
    cons: [] as string[],
    alternativeOptions: [] as string[],
    useCase: '',
    targetDate: '',
    savedAmount: 0,
    priceAlertThreshold: undefined as number | undefined,
    link: ''
  });

  const { isMobile } = useResponsive();
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [altInput, setAltInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addPro = () => {
    if (proInput) {
      setFormData({ ...formData, pros: [...formData.pros, proInput] });
      setProInput('');
    }
  };

  const addCon = () => {
    if (conInput) {
      setFormData({ ...formData, cons: [...formData.cons, conInput] });
      setConInput('');
    }
  };

  const addAlt = () => {
    if (altInput) {
      setFormData({ ...formData, alternativeOptions: [...formData.alternativeOptions, altInput] });
      setAltInput('');
    }
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
          ADD TO WISHLIST
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Make *</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Glock, Staccato"
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
                placeholder="e.g., 19, P"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Caliber *</label>
              <input
                type="text"
                value={formData.caliber}
                onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                style={inputStyle}
                placeholder="e.g., 9mm, .308 Win"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                style={inputStyle}
              >
                <option value="Pistol">Pistol</option>
                <option value="Rifle">Rifle</option>
                <option value="Shotgun">Shotgun</option>
                <option value="Suppressor">Suppressor</option>
                <option value="NFA">NFA</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                style={inputStyle}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Estimated Price *</label>
              <input
                type="number"
                value={formData.estimatedPrice || ''}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Current Market Price</label>
              <input
                type="number"
                value={formData.currentPrice || ''}
                onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Amount Saved</label>
              <input
                type="number"
                value={formData.savedAmount || ''}
                onChange={(e) => setFormData({ ...formData, savedAmount: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Target Purchase Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Price Alert Threshold</label>
              <input
                type="number"
                value={formData.priceAlertThreshold || ''}
                onChange={(e) => setFormData({ ...formData, priceAlertThreshold: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
                placeholder="Alert when price drops below..."
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Use Case</label>
            <input
              type="text"
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Competition, Home Defense, Hunting"
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Link / Reference</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              style={inputStyle}
              placeholder="https://..."
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Pros</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={proInput}
                onChange={(e) => setProInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Enter a pro..."
              />
              <button
                type="button"
                onClick={addPro}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme.green,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ADD
              </button>
            </div>
            {formData.pros.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {formData.pros.map((pro, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: theme.bg,
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>✓ {pro}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pros: formData.pros.filter((_, i) => i !== idx) })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.red,
                        cursor: 'pointer',
                        fontSize: '14px'
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
            <label style={labelStyle}>Cons</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={conInput}
                onChange={(e) => setConInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Enter a con..."
              />
              <button
                type="button"
                onClick={addCon}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme.red,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ADD
              </button>
            </div>
            {formData.cons.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {formData.cons.map((con, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: theme.bg,
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>✗ {con}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cons: formData.cons.filter((_, i) => i !== idx) })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.red,
                        cursor: 'pointer',
                        fontSize: '14px'
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
            <label style={labelStyle}>Alternative Options</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlt())}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g., Glock 17, CZ P-10"
              />
              <button
                type="button"
                onClick={addAlt}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme.accent,
                  color: theme.bg,
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ADD
              </button>
            </div>
            {formData.alternativeOptions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.alternativeOptions.map((alt, idx) => (
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
                    {alt}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, alternativeOptions: formData.alternativeOptions.filter((_, i) => i !== idx) })}
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
              ADD TO WISHLIST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Item Detail Modal (simplified for brevity)
function ItemDetailModal({
  item,
  onClose,
  onDelete,
  onUpdate
}: {
  item: WishlistItem;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (item: WishlistItem) => void;
}) {
  const { isMobile } = useResponsive();

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
          margin: '0 0 8px 0'
        }}>
          {item.make} {item.model}
        </h2>
        <div style={{ fontSize: '13px', color: theme.caliberRed, marginBottom: '20px' }}>
          {item.caliber} • {item.type}
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: theme.bg,
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>ESTIMATED PRICE</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: theme.green }}>
                ${item.estimatedPrice.toLocaleString()}
              </div>
            </div>
            {item.currentPrice && (
              <div>
                <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>CURRENT PRICE</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>
                  ${item.currentPrice.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {(item.pros && item.pros.length > 0) && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '12px',
            borderLeft: `3px solid ${theme.green}`
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '8px' }}>PROS</div>
            {item.pros.map((pro, idx) => (
              <div key={idx} style={{ fontSize: '11px', marginBottom: '4px' }}>✓ {pro}</div>
            ))}
          </div>
        )}

        {(item.cons && item.cons.length > 0) && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '12px',
            borderLeft: `3px solid ${theme.red}`
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '8px' }}>CONS</div>
            {item.cons.map((con, idx) => (
              <div key={idx} style={{ fontSize: '11px', marginBottom: '4px' }}>✗ {con}</div>
            ))}
          </div>
        )}

        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              marginBottom: '16px',
              fontSize: '11px',
              color: theme.accent,
              textDecoration: 'none'
            }}
          >
            View Link →
          </a>
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

// Gap Analysis Modal (simplified)
function GapAnalysisModal({
  ownedGuns,
  wishlistItems,
  onClose
}: {
  ownedGuns: Gun[];
  wishlistItems: WishlistItem[];
  onClose: () => void;
}) {
  const { isMobile } = useResponsive();

  const ownedCalibers = new Set(ownedGuns.map(g => g.caliber));
  const wishlistCalibers = new Set(wishlistItems.map(item => item.caliber));
  const newCalibers = Array.from(wishlistCalibers).filter(cal => !ownedCalibers.has(cal));
  const ownedTypes = new Set(ownedGuns.map(g => g.type));
  const wishlistTypes = new Set(wishlistItems.map(item => item.type));
  const newTypes = Array.from(wishlistTypes).filter(type => !ownedTypes.has(type));

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
          margin: '0 0 20px 0'
        }}>
          COLLECTION GAP ANALYSIS
        </h2>

        <div style={{
          padding: '16px',
          backgroundColor: theme.bg,
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>
            NEW CALIBERS ({newCalibers.length})
          </div>
          {newCalibers.map((cal, idx) => (
            <div key={idx} style={{ fontSize: '13px', marginBottom: '6px' }}>
              • {cal}
            </div>
          ))}
        </div>

        {newTypes.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: theme.bg,
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>
              NEW TYPES ({newTypes.length})
            </div>
            {newTypes.map((type, idx) => (
              <div key={idx} style={{ fontSize: '13px', marginBottom: '6px' }}>
                • {type}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
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
  );
}
