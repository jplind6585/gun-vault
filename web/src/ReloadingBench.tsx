import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useResponsive } from './useResponsive';
import { searchPowders } from './lib/referenceData';
import type { PowderResult } from './lib/referenceData';

interface LoadRecipe {
  id: string;
  name: string;
  caliber: string;
  bulletWeight: number; // grains
  bulletType: string; // manufacturer and model
  powderType: string;
  powderCharge: number; // grains
  primerType: string;
  brassType: string;
  OAL: number; // overall length in inches
  notes?: string;
  velocity?: number; // fps
  accuracy?: number; // MOA or group size
  pressure?: 'safe' | 'max' | 'compressed';
  created: string;
  tested: boolean;
  favorite: boolean;
}

interface Component {
  id: string;
  type: 'bullet' | 'powder' | 'primer' | 'brass';
  name: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  notes?: string;
}

interface LoadDevelopment {
  id: string;
  recipeId: string;
  date: string;
  powderCharge: number;
  velocity: number;
  accuracy: number;
  pressure: string;
  notes: string;
}

const SAAMI_DATA: Record<string, { maxPressure: number; unit: string }> = {
  '9mm': { maxPressure: 35000, unit: 'PSI' },
  '.45 ACP': { maxPressure: 21000, unit: 'PSI' },
  '.223 Remington': { maxPressure: 55000, unit: 'PSI' },
  '5.56x45mm': { maxPressure: 62000, unit: 'PSI' },
  '.308 Winchester': { maxPressure: 62000, unit: 'PSI' },
  '6.5 Creedmoor': { maxPressure: 62000, unit: 'PSI' },
  '.300 Win Mag': { maxPressure: 64000, unit: 'PSI' },
  '.338 Lapua': { maxPressure: 61500, unit: 'PSI' }
};

export function ReloadingBench() {
  const [recipes, setRecipes] = useState<LoadRecipe[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [developments, setDevelopments] = useState<LoadDevelopment[]>([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<LoadRecipe | null>(null);
  const [filterCaliber, setFilterCaliber] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'beginner' | 'advanced'>('beginner');
  const { isMobile } = useResponsive();

  // Load data
  useEffect(() => {
    try {
      const savedRecipes = localStorage.getItem('gunvault_load_recipes');
      const savedComponents = localStorage.getItem('gunvault_reloading_components');
      const savedDevelopments = localStorage.getItem('gunvault_load_development');

      if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
      if (savedComponents) setComponents(JSON.parse(savedComponents));
      if (savedDevelopments) setDevelopments(JSON.parse(savedDevelopments));
    } catch (e) {
      console.error('Failed to load reloading data:', e);
    }
  }, []);

  // Save recipe
  const saveRecipe = (recipe: Omit<LoadRecipe, 'id' | 'created'>) => {
    const newRecipe: LoadRecipe = {
      ...recipe,
      id: Date.now().toString(),
      created: new Date().toISOString()
    };

    const updated = [newRecipe, ...recipes];
    setRecipes(updated);
    localStorage.setItem('gunvault_load_recipes', JSON.stringify(updated));
    setShowRecipeForm(false);
  };

  // Delete recipe
  const deleteRecipe = (id: string) => {
    const updated = recipes.filter(r => r.id !== id);
    setRecipes(updated);
    localStorage.setItem('gunvault_load_recipes', JSON.stringify(updated));
  };

  // Save component
  const saveComponent = (component: Omit<Component, 'id'>) => {
    const newComponent: Component = {
      ...component,
      id: Date.now().toString()
    };

    const updated = [newComponent, ...components];
    setComponents(updated);
    localStorage.setItem('gunvault_reloading_components', JSON.stringify(updated));
    setShowComponentForm(false);
  };

  // Calculate cost per round
  const calculateCostPerRound = (recipe: LoadRecipe): number => {
    const bullet = components.find(c => c.type === 'bullet' && c.name.includes(recipe.bulletType));
    const powder = components.find(c => c.type === 'powder' && c.name.includes(recipe.powderType));
    const primer = components.find(c => c.type === 'primer' && c.name.includes(recipe.primerType));
    const brass = components.find(c => c.type === 'brass' && c.name.includes(recipe.brassType));

    let cost = 0;
    if (bullet) cost += bullet.costPerUnit;
    if (powder) cost += (powder.costPerUnit / 7000) * recipe.powderCharge; // Convert per pound to per grain
    if (primer) cost += primer.costPerUnit;
    if (brass) cost += brass.costPerUnit / 5; // Assume 5 reloads per brass

    return cost;
  };

  // Filter recipes
  const filteredRecipes = filterCaliber === 'all'
    ? recipes
    : recipes.filter(r => r.caliber === filterCaliber);

  const calibers = ['all', ...Array.from(new Set(recipes.map(r => r.caliber)))];

  // Stats
  const totalRecipes = recipes.length;
  const favoriteRecipes = recipes.filter(r => r.favorite).length;
  const testedRecipes = recipes.filter(r => r.tested).length;

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
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', color: theme.textPrimary, marginBottom: '2px' }}>
          RELOADING BENCH
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
          Load recipes · component inventory · load development
        </div>
      </div>

      {/* Safety Warning */}
      <div style={{
        marginBottom: '16px',
        padding: '12px 14px',
        backgroundColor: 'rgba(255,107,107,0.08)',
        border: `0.5px solid ${theme.red}`,
        borderLeft: `3px solid ${theme.red}`,
        borderRadius: '6px',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.red, marginBottom: '4px', letterSpacing: '0.5px' }}>
          SAFETY
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', color: theme.textSecondary }}>
          Always start at minimum load and work up. Never exceed published maximums. Consult multiple manuals. This app is for record-keeping only.
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => setViewMode('beginner')}
          style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'beginner' ? theme.accent : 'transparent',
            color: viewMode === 'beginner' ? theme.bg : theme.textPrimary,
            border: `0.5px solid ${viewMode === 'beginner' ? theme.accent : theme.border}`,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          BEGINNER
        </button>
        <button
          onClick={() => setViewMode('advanced')}
          style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'advanced' ? theme.accent : 'transparent',
            color: viewMode === 'advanced' ? theme.bg : theme.textPrimary,
            border: `0.5px solid ${viewMode === 'advanced' ? theme.accent : theme.border}`,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ADVANCED
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px'
      }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            RECIPES
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.accent }}>
            {totalRecipes}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            TESTED
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.green }}>
            {testedRecipes}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            FAVORITES
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.blue }}>
            {favoriteRecipes}
          </div>
        </div>
        {!isMobile && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                COMPONENTS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: theme.textPrimary }}>
                {components.length}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                CALIBERS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: theme.textPrimary }}>
                {calibers.length - 1}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setShowRecipeForm(true)}
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
          + NEW LOAD RECIPE
        </button>
        <button
          onClick={() => setShowComponentForm(true)}
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
          + ADD COMPONENT
        </button>
      </div>

      {/* Component Inventory */}
      {components.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>Component Inventory</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            {['bullet', 'powder', 'primer', 'brass'].map(type => {
              const typeComponents = components.filter(c => c.type === type);
              const totalValue = typeComponents.reduce((sum, c) => sum + (c.quantity * c.costPerUnit), 0);

              return (
                <div
                  key={type}
                  style={{
                    padding: '12px',
                    backgroundColor: theme.bg,
                    borderRadius: '4px',
                    border: `0.5px solid ${theme.border}`
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}>
                    {type}s
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '4px'
                  }}>
                    {typeComponents.length}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: theme.textSecondary
                  }}>
                    ${totalValue.toFixed(2)} value
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Load Recipes */}
      <div style={cardStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={sectionTitleStyle}>Load Recipes</div>
          <select
            value={filterCaliber}
            onChange={(e) => setFilterCaliber(e.target.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: theme.bg,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {calibers.map(cal => (
              <option key={cal} value={cal}>
                {cal === 'all' ? 'All Calibers' : cal}
              </option>
            ))}
          </select>
        </div>

        {filteredRecipes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: theme.textMuted,
            fontSize: '12px'
          }}>
            No load recipes yet. Click "NEW LOAD RECIPE" to get started.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px'
          }}>
            {filteredRecipes.map(recipe => {
              const costPerRound = calculateCostPerRound(recipe);
              const saami = SAAMI_DATA[recipe.caliber];

              return (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{
                    padding: '14px',
                    backgroundColor: theme.bg,
                    borderRadius: '4px',
                    border: `0.5px solid ${recipe.favorite ? theme.accent : theme.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = recipe.favorite ? theme.accent : theme.border)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        {recipe.name}
                      </div>
                      <div style={{ fontSize: '11px', color: theme.caliberRed }}>
                        {recipe.caliber}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {recipe.favorite && <span style={{ fontSize: '16px' }}>⭐</span>}
                      {recipe.tested && <span style={{ fontSize: '16px' }}>✓</span>}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '10px',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <span style={{ color: theme.textMuted }}>Bullet:</span>{' '}
                      <span style={{ color: theme.textPrimary }}>{recipe.bulletWeight}gr</span>
                    </div>
                    <div>
                      <span style={{ color: theme.textMuted }}>Powder:</span>{' '}
                      <span style={{ color: theme.textPrimary }}>{recipe.powderCharge}gr</span>
                    </div>
                    <div>
                      <span style={{ color: theme.textMuted }}>OAL:</span>{' '}
                      <span style={{ color: theme.textPrimary }}>{recipe.OAL}"</span>
                    </div>
                    {recipe.velocity && (
                      <div>
                        <span style={{ color: theme.textMuted }}>Velocity:</span>{' '}
                        <span style={{ color: theme.textPrimary }}>{recipe.velocity} fps</span>
                      </div>
                    )}
                  </div>

                  {viewMode === 'advanced' && (
                    <div style={{
                      padding: '8px',
                      backgroundColor: theme.surface,
                      borderRadius: '3px',
                      fontSize: '9px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ color: theme.textMuted, marginBottom: '4px' }}>
                        {recipe.bulletType} • {recipe.powderType} • {recipe.primerType}
                      </div>
                      {saami && (
                        <div style={{ color: theme.textSecondary }}>
                          SAAMI Max: {saami.maxPressure.toLocaleString()} {saami.unit}
                        </div>
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
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>
                      Cost: ${costPerRound.toFixed(3)}/rd
                    </div>
                    {recipe.pressure && (
                      <div style={{
                        padding: '3px 8px',
                        backgroundColor: recipe.pressure === 'safe' ? theme.green : recipe.pressure === 'max' ? theme.orange : theme.red,
                        borderRadius: '3px',
                        fontSize: '8px',
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {recipe.pressure}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Form Modal */}
      {showRecipeForm && (
        <RecipeForm
          onSave={saveRecipe}
          onCancel={() => setShowRecipeForm(false)}
        />
      )}

      {/* Component Form Modal */}
      {showComponentForm && (
        <ComponentForm
          onSave={saveComponent}
          onCancel={() => setShowComponentForm(false)}
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDelete={() => {
            deleteRecipe(selectedRecipe.id);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
}

// Recipe Form Component
function RecipeForm({
  onSave,
  onCancel
}: {
  onSave: (recipe: Omit<LoadRecipe, 'id' | 'created'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    bulletWeight: 0,
    bulletType: '',
    powderType: '',
    powderCharge: 0,
    primerType: '',
    brassType: '',
    OAL: 0,
    velocity: undefined as number | undefined,
    accuracy: undefined as number | undefined,
    pressure: 'safe' as 'safe' | 'max' | 'compressed',
    notes: '',
    tested: false,
    favorite: false
  });

  const { isMobile } = useResponsive();
  const [powderSuggestions, setPowderSuggestions] = useState<PowderResult[]>([]);
  const [showPowderSuggestions, setShowPowderSuggestions] = useState(false);

  async function handlePowderInput(value: string) {
    setFormData(prev => ({ ...prev, powderType: value }));
    if (value.length >= 2) {
      const results = await searchPowders(value);
      setPowderSuggestions(results);
      setShowPowderSuggestions(results.length > 0);
    } else {
      setShowPowderSuggestions(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
          NEW LOAD RECIPE
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Recipe Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                placeholder="e.g., 9mm 115gr Target Load"
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
              <label style={labelStyle}>Bullet Weight (grains) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.bulletWeight || ''}
                onChange={(e) => setFormData({ ...formData, bulletWeight: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Bullet Type *</label>
              <input
                type="text"
                value={formData.bulletType}
                onChange={(e) => setFormData({ ...formData, bulletType: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Hornady XTP"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Powder Type *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.powderType}
                  onChange={(e) => handlePowderInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPowderSuggestions(false), 150)}
                  style={inputStyle}
                  placeholder="e.g., Titegroup, Varget"
                  required
                />
                {showPowderSuggestions && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    backgroundColor: theme.surface, border: '0.5px solid ' + theme.border,
                    borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                  }}>
                    {powderSuggestions.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          setFormData(prev => ({ ...prev, powderType: p.productName }));
                          setShowPowderSuggestions(false);
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', width: '100%',
                          padding: '10px 14px', background: 'none', border: 'none',
                          borderBottom: i < powderSuggestions.length - 1 ? '0.5px solid ' + theme.border : 'none',
                          textAlign: 'left', cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary }}>{p.productName}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                          {p.brand}{p.burnRateRank ? ` · Burn rate ${p.burnRateRank}` : ''}{p.powderType ? ` · ${p.powderType}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Powder Charge (grains) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.powderCharge || ''}
                onChange={(e) => setFormData({ ...formData, powderCharge: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Primer Type *</label>
              <input
                type="text"
                value={formData.primerType}
                onChange={(e) => setFormData({ ...formData, primerType: e.target.value })}
                style={inputStyle}
                placeholder="e.g., CCI 500, Federal 210M"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Brass Type *</label>
              <input
                type="text"
                value={formData.brassType}
                onChange={(e) => setFormData({ ...formData, brassType: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Once-fired military, Lapua"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>OAL (inches) *</label>
              <input
                type="number"
                step="0.001"
                value={formData.OAL || ''}
                onChange={(e) => setFormData({ ...formData, OAL: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Pressure Level</label>
              <select
                value={formData.pressure}
                onChange={(e) => setFormData({ ...formData, pressure: e.target.value as any })}
                style={inputStyle}
              >
                <option value="safe">Safe / Starting Load</option>
                <option value="max">Max / Book Max</option>
                <option value="compressed">Compressed</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Velocity (fps)</label>
              <input
                type="number"
                value={formData.velocity || ''}
                onChange={(e) => setFormData({ ...formData, velocity: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
                placeholder="Optional"
              />
            </div>

            <div>
              <label style={labelStyle}>Accuracy (MOA or inches)</label>
              <input
                type="number"
                step="0.01"
                value={formData.accuracy || ''}
                onChange={(e) => setFormData({ ...formData, accuracy: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              placeholder="Load development notes, pressure signs, etc."
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.tested}
                onChange={(e) => setFormData({ ...formData, tested: e.target.checked })}
              />
              <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>Tested & Verified</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.favorite}
                onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              />
              <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>Favorite Load</span>
            </label>
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
              SAVE RECIPE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Component Form Component
function ComponentForm({
  onSave,
  onCancel
}: {
  onSave: (component: Omit<Component, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'bullet' as 'bullet' | 'powder' | 'primer' | 'brass',
    name: '',
    manufacturer: '',
    quantity: 0,
    unit: 'ea',
    costPerUnit: 0,
    notes: ''
  });

  const { isMobile } = useResponsive();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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

  // Auto-set unit based on type
  useEffect(() => {
    if (formData.type === 'powder') {
      setFormData(prev => ({ ...prev, unit: 'lb' }));
    } else {
      setFormData(prev => ({ ...prev, unit: 'ea' }));
    }
  }, [formData.type]);

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
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          padding: isMobile ? '20px' : '24px',
          maxWidth: '500px',
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
          ADD COMPONENT
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Component Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={inputStyle}
            >
              <option value="bullet">Bullet</option>
              <option value="powder">Powder</option>
              <option value="primer">Primer</option>
              <option value="brass">Brass</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Manufacturer *</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Hornady, Hodgdon, CCI"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Name/Model *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="e.g., XTP 115gr, Titegroup, 500 SPP"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={inputStyle}
                readOnly
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Cost Per {formData.unit} *</label>
            <input
              type="number"
              step="0.01"
              value={formData.costPerUnit || ''}
              onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              placeholder="Lot number, purchase date, etc."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
              ADD COMPONENT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Recipe Detail Modal
function RecipeDetailModal({
  recipe,
  onClose,
  onDelete
}: {
  recipe: LoadRecipe;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { isMobile } = useResponsive();
  const saami = SAAMI_DATA[recipe.caliber];

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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              letterSpacing: '1px',
              margin: '0 0 4px 0'
            }}>
              {recipe.name}
            </h2>
            <div style={{ fontSize: '13px', color: theme.caliberRed }}>
              {recipe.caliber}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {recipe.favorite && <span style={{ fontSize: '20px' }}>⭐</span>}
            {recipe.tested && <span style={{ fontSize: '20px', color: theme.green }}>✓</span>}
          </div>
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
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>BULLET</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.bulletWeight}gr {recipe.bulletType}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>POWDER</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.powderCharge}gr {recipe.powderType}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>PRIMER</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.primerType}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>BRASS</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.brassType}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>OAL</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.OAL}"</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>PRESSURE</div>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: recipe.pressure === 'safe' ? theme.green : theme.orange }}>
              {recipe.pressure}
            </div>
          </div>
          {recipe.velocity && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>VELOCITY</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.velocity} fps</div>
            </div>
          )}
          {recipe.accuracy && (
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>ACCURACY</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{recipe.accuracy}</div>
            </div>
          )}
        </div>

        {saami && (
          <div style={{
            padding: '12px',
            backgroundColor: theme.bg,
            borderRadius: '4px',
            marginBottom: '16px',
            borderLeft: `3px solid ${theme.blue}`
          }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
              SAAMI SPECIFICATIONS
            </div>
            <div style={{ fontSize: '11px', color: theme.textPrimary }}>
              Maximum Average Pressure: {saami.maxPressure.toLocaleString()} {saami.unit}
            </div>
          </div>
        )}

        {recipe.notes && (
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
              {recipe.notes}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '9px',
          color: theme.textMuted,
          marginBottom: '20px'
        }}>
          Created: {new Date(recipe.created).toLocaleDateString()}
        </div>

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
