import { useState } from 'react';
import { theme } from './theme';
import { allThemes, ThemeVariant, convertThemeVariantToTheme } from './themeVariants';

export function ThemeSwitcher({ onClose, onSelectTheme }: { onClose: () => void; onSelectTheme: (theme: any) => void }) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeVariant | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeVariant | null>(null);

  const activeTheme = previewTheme || selectedTheme;
  const themeColors = activeTheme ? convertThemeVariantToTheme(activeTheme).colors : theme;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '24px',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '12px',
          maxWidth: '1400px',
          width: '100%',
          padding: '32px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: 'monospace',
            fontSize: '28px',
            letterSpacing: '1.5px',
            color: theme.accent,
            margin: '0 0 8px 0'
          }}>
            THEME SELECTOR
          </h1>
          <p style={{
            fontSize: '14px',
            color: theme.textSecondary,
            margin: 0,
            fontFamily: 'monospace'
          }}>
            Choose a visual style for your Gun Vault • Click to preview • Select to apply
          </p>
        </div>

        {/* Theme Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {allThemes.map((themeVariant) => {
            const isSelected = selectedTheme?.name === themeVariant.name;
            const isPreview = previewTheme?.name === themeVariant.name;
            const variantColors = convertThemeVariantToTheme(themeVariant);

            return (
              <div
                key={themeVariant.name}
                style={{
                  backgroundColor: variantColors.surface,
                  border: `3px solid ${isSelected ? theme.accent : isPreview ? theme.blue : variantColors.border}`,
                  borderRadius: themeVariant.borderRadius.large,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={() => !selectedTheme && setPreviewTheme(themeVariant)}
                onMouseLeave={() => !selectedTheme && setPreviewTheme(null)}
                onClick={() => setSelectedTheme(isSelected ? null : themeVariant)}
              >
                {/* Theme Name */}
                <div style={{ marginBottom: '12px' }}>
                  <h2 style={{
                    fontFamily: variantColors.fonts.heading,
                    fontSize: '20px',
                    color: variantColors.accent,
                    margin: '0 0 4px 0',
                    letterSpacing: '0.5px'
                  }}>
                    {themeVariant.name}
                  </h2>
                  <p style={{
                    fontFamily: variantColors.fonts.primary,
                    fontSize: '12px',
                    color: variantColors.textSecondary,
                    margin: 0
                  }}>
                    {themeVariant.description}
                  </p>
                </div>

                {/* Color Palette Preview */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { color: variantColors.accent, label: 'Accent' },
                    { color: variantColors.caliberRed, label: 'Primary' },
                    { color: variantColors.green, label: 'Success' },
                    { color: variantColors.blue, label: 'Info' },
                    { color: variantColors.textPrimary, label: 'Text' }
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color,
                        borderRadius: themeVariant.borderRadius.small,
                        border: `1px solid ${variantColors.border}`
                      }} />
                      <span style={{
                        fontSize: '9px',
                        color: variantColors.textMuted,
                        fontFamily: variantColors.fonts.mono
                      }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mini UI Preview */}
                <div style={{
                  backgroundColor: variantColors.bg,
                  padding: '12px',
                  borderRadius: themeVariant.borderRadius.medium,
                  border: `1px solid ${variantColors.border}`
                }}>
                  {/* Header */}
                  <div style={{
                    fontFamily: variantColors.fonts.heading,
                    fontSize: '14px',
                    color: variantColors.accent,
                    marginBottom: '8px',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}>
                    SAMPLE HEADER
                  </div>

                  {/* Content */}
                  <div style={{
                    fontFamily: variantColors.fonts.primary,
                    fontSize: '11px',
                    color: variantColors.textPrimary,
                    marginBottom: '8px'
                  }}>
                    Primary text content displayed in the selected font family
                  </div>

                  <div style={{
                    fontFamily: variantColors.fonts.primary,
                    fontSize: '10px',
                    color: variantColors.textSecondary,
                    marginBottom: '10px'
                  }}>
                    Secondary text showing hierarchy and readability
                  </div>

                  {/* Button */}
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: variantColors.accent,
                    color: variantColors.bg,
                    border: 'none',
                    borderRadius: themeVariant.borderRadius.small,
                    fontFamily: variantColors.fonts.mono,
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}>
                    SAMPLE BUTTON
                  </button>

                  {/* Stats */}
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '10px',
                    fontFamily: variantColors.fonts.mono
                  }}>
                    <div>
                      <span style={{ color: variantColors.textMuted }}>STAT:</span>
                      <span style={{ color: variantColors.caliberRed, marginLeft: '4px', fontWeight: 600 }}>123</span>
                    </div>
                    <div>
                      <span style={{ color: variantColors.textMuted }}>VALUE:</span>
                      <span style={{ color: variantColors.green, marginLeft: '4px', fontWeight: 600 }}>+45%</span>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: theme.accent,
                    color: theme.bg,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                  }}>
                    ✓ SELECTED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              if (selectedTheme) {
                const newTheme = convertThemeVariantToTheme(selectedTheme);
                onSelectTheme(newTheme);
                onClose();
              }
            }}
            disabled={!selectedTheme}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTheme ? theme.accent : theme.surfaceAlt,
              color: selectedTheme ? theme.bg : theme.textMuted,
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '0.8px',
              cursor: selectedTheme ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              opacity: selectedTheme ? 1 : 0.5
            }}
          >
            {selectedTheme ? `APPLY ${selectedTheme.name.toUpperCase()}` : 'SELECT A THEME'}
          </button>
        </div>

        {/* Note */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: theme.surfaceAlt,
          borderRadius: '6px',
          border: `1px solid ${theme.border}`
        }}>
          <p style={{
            fontSize: '11px',
            color: theme.textSecondary,
            margin: 0,
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: theme.accent }}>NOTE:</strong> Theme changes apply to all pages (Homepage, Arsenal, Gun Vault, Caliber Database).
            Your selection is saved locally and will persist across sessions. Hover over themes to preview, click to select.
          </p>
        </div>
      </div>
    </div>
  );
}
