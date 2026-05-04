// Demo page to compare all 5 gun image styles
import { theme } from './theme';
import { getAllGuns } from './storage';
import { GunImageStyle1, GunImageStyle2, GunImageStyle3, GunImageStyle4, GunImageStyle5 } from './GunImageStyles';
import type { Gun } from './types';

export function StyleDemo() {
  const guns = getAllGuns().slice(0, 8); // Show first 8 guns as examples

  const styles = [
    { name: 'Style 1: Minimalist', Component: GunImageStyle1, description: 'Clean silhouette on gradient with subtle caliber label' },
    { name: 'Style 2: Bold', Component: GunImageStyle2, description: 'Large silhouette with type and caliber badges' },
    { name: 'Style 3: Technical', Component: GunImageStyle3, description: 'Tactical grid overlay with crosshair and corner brackets' },
    { name: 'Style 4: Modern Card', Component: GunImageStyle4, description: 'Geometric accents with info panel at bottom' },
    { name: 'Style 5: Classic', Component: GunImageStyle5, description: 'Elegant frame with centered silhouette and divider' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      padding: '32px 24px',
      color: theme.textPrimary
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
          color: theme.accent
        }}>
          Gun Image Style Comparison
        </h1>
        <p style={{
          fontSize: '14px',
          color: theme.textSecondary,
          marginBottom: '32px'
        }}>
          Compare 5 different visual styles using your actual gun collection. Pick your favorite!
        </p>

        {styles.map((style, styleIndex) => (
          <div key={styleIndex} style={{
            marginBottom: '48px'
          }}>
            {/* Style header */}
            <div style={{
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${theme.border}`
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '4px',
                color: theme.accent
              }}>
                {style.name}
              </h2>
              <p style={{
                fontSize: '13px',
                color: theme.textSecondary
              }}>
                {style.description}
              </p>
            </div>

            {/* Gun cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {guns.map((gun) => (
                <div key={gun.id} style={{
                  backgroundColor: theme.surface,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${theme.border}`
                }}>
                  {/* Image using this style */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '2/1'
                  }}>
                    <style.Component gun={gun} large={true} />
                  </div>

                  {/* Gun info */}
                  <div style={{ padding: '10px' }}>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      margin: '0 0 2px 0',
                      color: theme.textPrimary
                    }}>
                      {gun.make} {gun.model}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: theme.caliberRed,
                      margin: '0 0 6px 0'
                    }}>
                      {gun.caliber}
                    </p>
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      border: `0.5px solid ${theme.border}`,
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      letterSpacing: '0.5px',
                      color: theme.textSecondary
                    }}>
                      {gun.type} • {(gun.roundCount || 0).toLocaleString()} RDS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Instructions */}
        <div style={{
          marginTop: '48px',
          padding: '24px',
          backgroundColor: theme.surface,
          borderRadius: '8px',
          border: `1px solid ${theme.accent}`
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '12px',
            color: theme.accent
          }}>
            How to Choose
          </h3>
          <ol style={{
            fontSize: '14px',
            color: theme.textSecondary,
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Review all 5 styles above with your actual guns</li>
            <li>Consider which style best matches your app's aesthetic</li>
            <li>Let me know which style number you prefer (1-5)</li>
            <li>I'll update the entire app to use that style</li>
          </ol>
          <p style={{
            marginTop: '16px',
            fontSize: '13px',
            color: theme.textMuted,
            fontStyle: 'italic'
          }}>
            All styles are fully responsive and work in both card and table views.
          </p>
        </div>
      </div>
    </div>
  );
}
