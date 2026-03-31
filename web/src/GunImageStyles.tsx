// 5 different visual styles for gun image placeholders
import type { Gun } from './types';
import { getGunSilhouette } from './gunSilhouettes';

interface GunImageStyleProps {
  gun: Gun;
  large?: boolean;
}

const getGunColor = (type: Gun['type']) => {
  const colors: Record<Gun['type'], string> = {
    'Pistol': '#4A5568',
    'Rifle': '#2D3748',
    'Shotgun': '#1A202C',
    'Suppressor': '#2C5282',
    'NFA': '#2F855A'
  };
  return colors[type] || '#4A5568';
};

// STYLE 1: Minimalist - Clean silhouette on gradient with subtle details
export function GunImageStyle1({ gun, large = true }: GunImageStyleProps) {
  const silhouette = getGunSilhouette(gun);
  const bgColor = getGunColor(gun.type);
  const size = large ? 100 : 50;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Gun silhouette */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: large ? '60%' : '70%',
          height: 'auto',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}
      >
        <path d={silhouette} fill="rgba(255,255,255,0.9)" />
      </svg>

      {/* Info below */}
      {large && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            {gun.caliber}
          </div>
        </div>
      )}
    </div>
  );
}

// STYLE 2: Bold - Large silhouette with type badge and caliber
export function GunImageStyle2({ gun, large = true }: GunImageStyleProps) {
  const silhouette = getGunSilhouette(gun);
  const bgColor = getGunColor(gun.type);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Type badge */}
      {large && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {gun.type}
        </div>
      )}

      {/* Gun silhouette */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: large ? '70%' : '80%',
          height: 'auto',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))'
        }}
      >
        <path d={silhouette} fill="rgba(255,255,255,0.95)" />
      </svg>

      {/* Caliber badge */}
      {large && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(4px)'
        }}>
          {gun.caliber}
        </div>
      )}
    </div>
  );
}

// STYLE 3: Technical - Silhouette with crosshair and grid overlay
export function GunImageStyle3({ gun, large = true }: GunImageStyleProps) {
  const silhouette = getGunSilhouette(gun);
  const bgColor = getGunColor(gun.type);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${bgColor}ee 0%, ${bgColor}aa 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Grid overlay */}
      {large && (
        <svg style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.1
        }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Crosshair */}
      {large && (
        <>
          <div style={{
            position: 'absolute',
            width: '1px',
            height: '100%',
            background: 'rgba(255,255,255,0.15)',
            left: '50%'
          }} />
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '1px',
            background: 'rgba(255,255,255,0.15)',
            top: '50%'
          }} />
        </>
      )}

      {/* Gun silhouette */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: large ? '65%' : '75%',
          height: 'auto',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          zIndex: 1
        }}
      >
        <path d={silhouette} fill="rgba(255,255,255,0.92)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      </svg>

      {/* Corner brackets */}
      {large && (
        <>
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '20px',
            height: '20px',
            borderTop: '2px solid rgba(255,255,255,0.3)',
            borderLeft: '2px solid rgba(255,255,255,0.3)'
          }} />
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            borderTop: '2px solid rgba(255,255,255,0.3)',
            borderRight: '2px solid rgba(255,255,255,0.3)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            width: '20px',
            height: '20px',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            borderLeft: '2px solid rgba(255,255,255,0.3)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            borderRight: '2px solid rgba(255,255,255,0.3)'
          }} />
        </>
      )}

      {/* Info */}
      {large && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '1px',
          fontFamily: 'monospace'
        }}>
          {gun.caliber}
        </div>
      )}
    </div>
  );
}

// STYLE 4: Modern Card - Silhouette with info overlay and modern design
export function GunImageStyle4({ gun, large = true }: GunImageStyleProps) {
  const silhouette = getGunSilhouette(gun);
  const bgColor = getGunColor(gun.type);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(160deg, ${bgColor} 0%, ${bgColor}dd 50%, ${bgColor}bb 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Geometric accent */}
      {large && (
        <>
          <div style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            top: '-50px',
            right: '-50px'
          }} />
          <div style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.1)',
            bottom: '-30px',
            left: '-30px'
          }} />
        </>
      )}

      {/* Gun silhouette */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: large ? '68%' : '78%',
          height: 'auto',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          zIndex: 1
        }}
      >
        <path d={silhouette} fill="rgba(255,255,255,0.93)" />
      </svg>

      {/* Info panel */}
      {large && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 12px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {gun.type}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)'
          }}>
            {gun.caliber}
          </div>
        </div>
      )}
    </div>
  );
}

// STYLE 5: Classic - Centered silhouette with elegant frame and details
export function GunImageStyle5({ gun, large = true }: GunImageStyleProps) {
  const silhouette = getGunSilhouette(gun);
  const bgColor = getGunColor(gun.type);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `radial-gradient(circle at center, ${bgColor}ee 0%, ${bgColor}cc 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: large ? '16px' : '8px'
    }}>
      {/* Decorative frame */}
      {large && (
        <div style={{
          position: 'absolute',
          inset: '12px',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          pointerEvents: 'none'
        }} />
      )}

      {/* Top label */}
      {large && (
        <div style={{
          position: 'absolute',
          top: '16px',
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          {gun.type}
        </div>
      )}

      {/* Gun silhouette */}
      <svg
        viewBox="0 0 100 100"
        style={{
          width: large ? '62%' : '72%',
          height: 'auto',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
        }}
      >
        <path d={silhouette} fill="rgba(255,255,255,0.9)" />
      </svg>

      {/* Bottom divider and caliber */}
      {large && (
        <>
          <div style={{
            width: '40%',
            height: '1px',
            background: 'rgba(255,255,255,0.25)',
            margin: '12px 0 8px'
          }} />
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.5px'
          }}>
            {gun.caliber}
          </div>
        </>
      )}
    </div>
  );
}
