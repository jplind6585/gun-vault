import { useState, useEffect, useMemo } from 'react';
import { theme } from './theme';
import { getAllCartridges } from './storage';
import type { Cartridge } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface BallisticInputs {
  // Gun specifications
  barrelLength: number; // inches
  twistRate: string; // e.g., "1:8"
  scopeHeight: number; // inches
  zeroDistance: number; // yards

  // Environmental conditions
  altitude: number; // feet
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  windSpeed: number; // mph
  windDirection: number; // degrees (0=headwind, 90=right, 180=tailwind, 270=left)

  // Ammunition
  selectedCartridge: string | null;
  bulletWeight: number; // grains
  ballisticCoefficient: number;
  bcType: 'G1' | 'G7';
  muzzleVelocity: number; // fps
}

interface TrajectoryPoint {
  distance: number; // yards
  dropInches: number;
  dropMOA: number;
  dropMRAD: number;
  windageInches: number;
  windageMOA: number;
  windageMRAD: number;
  velocity: number; // fps
  energy: number; // ft-lbs
  time: number; // seconds
}

type DistanceUnit = 'yards' | 'meters';
type DropUnit = 'inches' | 'cm' | 'moa' | 'mrad';

// ============================================================================
// BALLISTIC CALCULATIONS
// ============================================================================

const GRAVITY = 32.174; // ft/s²
const STANDARD_PRESSURE = 29.92; // inches Hg
const STANDARD_TEMP = 59; // °F
const STANDARD_DENSITY = 0.076474; // lb/ft³

/**
 * Calculate air density based on altitude, temperature, and humidity
 */
function calculateAirDensity(altitude: number, tempF: number, humidity: number): number {
  // Barometric pressure at altitude (simplified model)
  const pressure = STANDARD_PRESSURE * Math.pow(1 - (0.0000068756 * altitude), 5.2559);

  // Convert temperature to Rankine
  const tempR = tempF + 459.67;
  const standardTempR = STANDARD_TEMP + 459.67;

  // Calculate relative humidity effect (simplified)
  const humidityFactor = 1 - (0.00001 * humidity);

  // Air density calculation
  const density = STANDARD_DENSITY * (pressure / STANDARD_PRESSURE) * (standardTempR / tempR) * humidityFactor;

  return density;
}

/**
 * Calculate drag coefficient for G1 or G7 ballistic coefficient
 */
function calculateDragCoefficient(velocity: number, bc: number, bcType: 'G1' | 'G7'): number {
  // Simplified drag model - in production would use full drag tables
  const mach = velocity / 1116.4; // speed of sound at sea level

  let dragFunction: number;

  if (bcType === 'G1') {
    // G1 drag model (flat base bullets)
    if (mach < 0.8) {
      dragFunction = 0.5191 - 0.05816 * mach;
    } else if (mach < 1.2) {
      dragFunction = 0.3 + 0.3 * Math.pow((mach - 0.8) / 0.4, 2);
    } else {
      dragFunction = 0.6 - 0.1 * (mach - 1.2);
    }
  } else {
    // G7 drag model (boat tail bullets)
    if (mach < 0.8) {
      dragFunction = 0.4 - 0.04 * mach;
    } else if (mach < 1.2) {
      dragFunction = 0.25 + 0.2 * Math.pow((mach - 0.8) / 0.4, 2);
    } else {
      dragFunction = 0.45 - 0.05 * (mach - 1.2);
    }
  }

  return dragFunction / bc;
}

/**
 * Calculate trajectory using numerical integration (Runge-Kutta method)
 */
function calculateTrajectory(inputs: BallisticInputs): TrajectoryPoint[] {
  const {
    scopeHeight,
    zeroDistance,
    altitude,
    temperature,
    humidity,
    windSpeed,
    windDirection,
    bulletWeight,
    ballisticCoefficient,
    bcType,
    muzzleVelocity
  } = inputs;

  // Calculate air density
  const airDensity = calculateAirDensity(altitude, temperature, humidity);
  const densityRatio = airDensity / STANDARD_DENSITY;

  // Convert units
  const scopeHeightFt = scopeHeight / 12;
  const bulletWeightLbs = bulletWeight / 7000; // grains to pounds

  // Calculate wind components
  const windDirectionRad = (windDirection * Math.PI) / 180;
  const crosswind = windSpeed * Math.sin(windDirectionRad); // mph
  const crosswindFps = crosswind * 1.467; // convert to fps

  // Time step for integration (0.001 seconds)
  const dt = 0.001;

  // Initial conditions
  let x = 0; // horizontal distance (feet)
  let y = -scopeHeightFt; // vertical position (negative because scope is above bore)
  let vx = muzzleVelocity; // horizontal velocity (fps)
  let vy = 0; // vertical velocity (fps)
  let t = 0; // time (seconds)

  const trajectory: TrajectoryPoint[] = [];
  const distances = [0, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
  let nextDistanceIndex = 0;

  // Calculate angle needed to zero at specified distance
  let zeroAngleRad = 0;

  // Iterate to find zero angle (simple bisection method)
  let minAngle = -0.1;
  let maxAngle = 0.1;
  for (let iter = 0; iter < 20; iter++) {
    const testAngle = (minAngle + maxAngle) / 2;
    const testY = simulateToDistance(inputs, zeroDistance * 3, testAngle, densityRatio, dt);

    if (Math.abs(testY) < 0.01) {
      zeroAngleRad = testAngle;
      break;
    }

    if (testY < 0) {
      minAngle = testAngle;
    } else {
      maxAngle = testAngle;
    }
  }

  // Reset for actual trajectory calculation with zero angle
  x = 0;
  y = -scopeHeightFt;
  vx = muzzleVelocity * Math.cos(zeroAngleRad);
  vy = muzzleVelocity * Math.sin(zeroAngleRad);
  t = 0;

  let windDrift = 0;

  // Simulate trajectory
  while (x < 3000 && nextDistanceIndex < distances.length) {
    // Calculate velocity magnitude
    const v = Math.sqrt(vx * vx + vy * vy);

    // Calculate drag
    const dragCoeff = calculateDragCoefficient(v, ballisticCoefficient, bcType);
    const dragForce = 0.5 * dragCoeff * densityRatio * v;

    // Accelerations
    const ax = -(dragForce * vx / v);
    const ay = -GRAVITY - (dragForce * vy / v);

    // Wind drift (simplified - assumes constant crosswind effect)
    const windDriftAccel = crosswindFps * dragCoeff * densityRatio * 0.1;

    // Update velocities (Euler method for simplicity)
    vx += ax * dt;
    vy += ay * dt;

    // Update positions
    x += vx * dt;
    y += vy * dt;
    windDrift += windDriftAccel * dt * dt;

    t += dt;

    // Record points at specified distances
    const currentYards = x / 3;
    if (nextDistanceIndex < distances.length && currentYards >= distances[nextDistanceIndex]) {
      const distance = distances[nextDistanceIndex];
      const distanceFeet = distance * 3;

      // Convert y from feet to inches (and flip sign for conventional drop notation)
      const dropInches = -y * 12;
      const dropMOA = (dropInches / distanceFeet) * 95.5; // 1 MOA = 1.047 inches at 100 yards
      const dropMRAD = (dropInches / distanceFeet) * 32.8; // 1 MRAD = 3.6 inches at 100 yards

      // Wind drift in inches
      const windageInches = windDrift * 12;
      const windageMOA = (windageInches / distanceFeet) * 95.5;
      const windageMRAD = (windageInches / distanceFeet) * 32.8;

      // Energy calculation
      const velocity = Math.sqrt(vx * vx + vy * vy);
      const energy = 0.5 * bulletWeightLbs * velocity * velocity;

      trajectory.push({
        distance,
        dropInches,
        dropMOA,
        dropMRAD,
        windageInches,
        windageMOA,
        windageMRAD,
        velocity,
        energy,
        time: t
      });

      nextDistanceIndex++;
    }
  }

  return trajectory;
}

/**
 * Helper function to simulate to a specific distance (for zeroing calculation)
 */
function simulateToDistance(
  inputs: BallisticInputs,
  targetDistanceFeet: number,
  angleRad: number,
  densityRatio: number,
  dt: number
): number {
  const { muzzleVelocity, ballisticCoefficient, bcType, scopeHeight } = inputs;

  let x = 0;
  let y = -(scopeHeight / 12);
  let vx = muzzleVelocity * Math.cos(angleRad);
  let vy = muzzleVelocity * Math.sin(angleRad);

  while (x < targetDistanceFeet) {
    const v = Math.sqrt(vx * vx + vy * vy);
    const dragCoeff = calculateDragCoefficient(v, ballisticCoefficient, bcType);
    const dragForce = 0.5 * dragCoeff * densityRatio * v;

    const ax = -(dragForce * vx / v);
    const ay = -GRAVITY - (dragForce * vy / v);

    vx += ax * dt;
    vy += ay * dt;

    x += vx * dt;
    y += vy * dt;
  }

  return y * 12; // return in inches
}


// ============================================================================
// COMPONENT
// ============================================================================

export function BallisticCalculator() {
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [inputs, setInputs] = useState<BallisticInputs>({
    barrelLength: 16,
    twistRate: '1:8',
    scopeHeight: 1.5,
    zeroDistance: 100,
    altitude: 0,
    temperature: 59,
    humidity: 50,
    windSpeed: 0,
    windDirection: 90,
    selectedCartridge: null,
    bulletWeight: 150,
    ballisticCoefficient: 0.45,
    bcType: 'G1',
    muzzleVelocity: 2800
  });

  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('yards');
  const [dropUnit, setDropUnit] = useState<DropUnit>('inches');
  const [collapsed, setCollapsed] = useState({
    gun: false,
    environment: false,
    ammo: false,
    settings: false
  });

  // Load cartridges
  useEffect(() => {
    const allCartridges = getAllCartridges();
    setCartridges(allCartridges.filter(c => c.type === 'Rifle' || c.type === 'Pistol'));
  }, []);

  // Calculate trajectory (memoized for performance)
  const trajectory = useMemo(() => {
    return calculateTrajectory(inputs);
  }, [inputs]);

  // Handle cartridge selection
  const handleCartridgeSelect = (cartridgeId: string) => {
    const cartridge = cartridges.find(c => c.id === cartridgeId);
    if (!cartridge) return;

    // Set reasonable defaults based on cartridge
    const avgWeight = cartridge.commonBulletWeights[Math.floor(cartridge.commonBulletWeights.length / 2)];
    const avgVelocity = (cartridge.velocityRangeFPS.min + cartridge.velocityRangeFPS.max) / 2;

    setInputs(prev => ({
      ...prev,
      selectedCartridge: cartridgeId,
      bulletWeight: avgWeight,
      muzzleVelocity: Math.round(avgVelocity),
      ballisticCoefficient: cartridge.type === 'Rifle' ? 0.45 : 0.15
    }));
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Distance (yd)', 'Drop (in)', 'Drop (MOA)', 'Drop (MRAD)', 'Windage (in)', 'Windage (MOA)', 'Velocity (fps)', 'Energy (ft-lbs)', 'Time (s)'];
    const rows = trajectory.map(p => [
      p.distance,
      p.dropInches.toFixed(2),
      p.dropMOA.toFixed(2),
      p.dropMRAD.toFixed(2),
      p.windageInches.toFixed(2),
      p.windageMOA.toFixed(2),
      Math.round(p.velocity),
      Math.round(p.energy),
      p.time.toFixed(3)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballistic-table-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export DOPE card
  const exportDOPECard = () => {
    let dope = 'DOPE CARD\n';
    dope += '='.repeat(60) + '\n\n';
    dope += `Cartridge: ${inputs.selectedCartridge ? cartridges.find(c => c.id === inputs.selectedCartridge)?.name : 'Custom'}\n`;
    dope += `Bullet: ${inputs.bulletWeight}gr, BC ${inputs.ballisticCoefficient} (${inputs.bcType})\n`;
    dope += `Muzzle Velocity: ${inputs.muzzleVelocity} fps\n`;
    dope += `Zero: ${inputs.zeroDistance} yards\n`;
    dope += `Conditions: ${inputs.temperature}°F, ${inputs.altitude}ft elevation\n\n`;
    dope += '='.repeat(60) + '\n\n';
    dope += 'DIST    DROP       WIND       VELOCITY    ENERGY\n';
    dope += '(yd)    (MOA)      (MOA)      (fps)       (ft-lbs)\n';
    dope += '-'.repeat(60) + '\n';

    trajectory.forEach(p => {
      dope += `${String(p.distance).padEnd(7)} ${p.dropMOA.toFixed(1).padEnd(10)} ${p.windageMOA.toFixed(1).padEnd(10)} ${Math.round(p.velocity).toString().padEnd(11)} ${Math.round(p.energy)}\n`;
    });

    const blob = new Blob([dope], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dope-card-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Styles
  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: '8px',
    padding: '20px',
    border: `0.5px solid ${theme.border}`,
    marginBottom: '16px'
  };

  const sectionTitleStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '1px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px'
  };

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'monospace',
    fontSize: '10px',
    letterSpacing: '0.5px',
    color: theme.textSecondary,
    marginBottom: '4px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      padding: '16px',
      paddingBottom: '80px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `0.5px solid ${theme.border}`,
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: theme.textPrimary,
          marginBottom: '2px',
        }}>
          BALLISTIC CALCULATOR
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          color: theme.textMuted,
        }}>
          External ballistics · trajectory table · DOPE card export
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Left Column - Inputs */}
        <div>
          {/* Gun Specifications */}
          <div style={cardStyle}>
            <div
              style={sectionTitleStyle}
              onClick={() => setCollapsed(prev => ({ ...prev, gun: !prev.gun }))}
            >
              <span>Gun Specifications</span>
              <span>{collapsed.gun ? '▼' : '▲'}</span>
            </div>
            {!collapsed.gun && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Barrel Length (inches)</label>
                  <input
                    type="number"
                    value={inputs.barrelLength}
                    onChange={(e) => setInputs({ ...inputs, barrelLength: parseFloat(e.target.value) })}
                    style={inputStyle}
                    step="0.1"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Twist Rate</label>
                  <input
                    type="text"
                    value={inputs.twistRate}
                    onChange={(e) => setInputs({ ...inputs, twistRate: e.target.value })}
                    style={inputStyle}
                    placeholder="1:8"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Scope Height (inches)</label>
                  <input
                    type="number"
                    value={inputs.scopeHeight}
                    onChange={(e) => setInputs({ ...inputs, scopeHeight: parseFloat(e.target.value) })}
                    style={inputStyle}
                    step="0.1"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Zero Distance (yards)</label>
                  <input
                    type="number"
                    value={inputs.zeroDistance}
                    onChange={(e) => setInputs({ ...inputs, zeroDistance: parseFloat(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Environmental Conditions */}
          <div style={cardStyle}>
            <div
              style={sectionTitleStyle}
              onClick={() => setCollapsed(prev => ({ ...prev, environment: !prev.environment }))}
            >
              <span>Environmental Conditions</span>
              <span>{collapsed.environment ? '▼' : '▲'}</span>
            </div>
            {!collapsed.environment && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Altitude (feet ASL)</label>
                  <input
                    type="number"
                    value={inputs.altitude}
                    onChange={(e) => setInputs({ ...inputs, altitude: parseFloat(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Temperature (°F)</label>
                  <input
                    type="number"
                    value={inputs.temperature}
                    onChange={(e) => setInputs({ ...inputs, temperature: parseFloat(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Humidity (%)</label>
                  <input
                    type="number"
                    value={inputs.humidity}
                    onChange={(e) => setInputs({ ...inputs, humidity: parseFloat(e.target.value) })}
                    style={inputStyle}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Wind Speed (mph)</label>
                  <input
                    type="number"
                    value={inputs.windSpeed}
                    onChange={(e) => setInputs({ ...inputs, windSpeed: parseFloat(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Wind Direction (degrees: 0=headwind, 90=right, 180=tail, 270=left)</label>
                  <input
                    type="number"
                    value={inputs.windDirection}
                    onChange={(e) => setInputs({ ...inputs, windDirection: parseFloat(e.target.value) })}
                    style={inputStyle}
                    min="0"
                    max="360"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ammunition Selection */}
          <div style={cardStyle}>
            <div
              style={sectionTitleStyle}
              onClick={() => setCollapsed(prev => ({ ...prev, ammo: !prev.ammo }))}
            >
              <span>Ammunition</span>
              <span>{collapsed.ammo ? '▼' : '▲'}</span>
            </div>
            {!collapsed.ammo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Select Cartridge</label>
                  <select
                    value={inputs.selectedCartridge || ''}
                    onChange={(e) => handleCartridgeSelect(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Custom Input</option>
                    {cartridges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Bullet Weight (grains)</label>
                    <input
                      type="number"
                      value={inputs.bulletWeight}
                      onChange={(e) => setInputs({ ...inputs, bulletWeight: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Muzzle Velocity (fps)</label>
                    <input
                      type="number"
                      value={inputs.muzzleVelocity}
                      onChange={(e) => setInputs({ ...inputs, muzzleVelocity: parseFloat(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ballistic Coefficient</label>
                    <input
                      type="number"
                      value={inputs.ballisticCoefficient}
                      onChange={(e) => setInputs({ ...inputs, ballisticCoefficient: parseFloat(e.target.value) })}
                      style={inputStyle}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>BC Type</label>
                    <select
                      value={inputs.bcType}
                      onChange={(e) => setInputs({ ...inputs, bcType: e.target.value as 'G1' | 'G7' })}
                      style={inputStyle}
                    >
                      <option value="G1">G1 (Flat Base)</option>
                      <option value="G7">G7 (Boat Tail)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={cardStyle}>
            <div
              style={sectionTitleStyle}
              onClick={() => setCollapsed(prev => ({ ...prev, settings: !prev.settings }))}
            >
              <span>Display Settings</span>
              <span>{collapsed.settings ? '▼' : '▲'}</span>
            </div>
            {!collapsed.settings && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Distance Units</label>
                  <select
                    value={distanceUnit}
                    onChange={(e) => setDistanceUnit(e.target.value as DistanceUnit)}
                    style={inputStyle}
                  >
                    <option value="yards">Yards</option>
                    <option value="meters">Meters</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Drop Units</label>
                  <select
                    value={dropUnit}
                    onChange={(e) => setDropUnit(e.target.value as DropUnit)}
                    style={inputStyle}
                  >
                    <option value="inches">Inches</option>
                    <option value="cm">Centimeters</option>
                    <option value="moa">MOA</option>
                    <option value="mrad">MRAD</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {/* Trajectory Chart */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <span>Trajectory Chart</span>
            </div>
            <TrajectoryChart trajectory={trajectory} zeroDistance={inputs.zeroDistance} />
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={exportToCSV}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: theme.accent,
                color: theme.bg,
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              EXPORT CSV
            </button>
            <button
              onClick={exportDOPECard}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'transparent',
                color: theme.accent,
                border: `0.5px solid ${theme.accent}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              EXPORT DOPE CARD
            </button>
          </div>

          {/* Trajectory Table */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <span>Trajectory Table</span>
            </div>
            <TrajectoryTable trajectory={trajectory} dropUnit={dropUnit} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TrajectoryChart({ trajectory, zeroDistance }: { trajectory: TrajectoryPoint[]; zeroDistance: number }) {
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  // Find min/max for scaling
  const maxDistance = Math.max(...trajectory.map(p => p.distance));
  const minDrop = Math.min(...trajectory.map(p => p.dropInches));
  const maxDrop = Math.max(...trajectory.map(p => p.dropInches));

  // Add some padding to the drop range
  const dropRange = maxDrop - minDrop;
  const dropMin = minDrop - dropRange * 0.1;
  const dropMax = maxDrop + dropRange * 0.1;

  // Scaling functions
  const xScale = (distance: number) => {
    return padding.left + ((distance / maxDistance) * (width - padding.left - padding.right));
  };

  const yScale = (drop: number) => {
    return padding.top + ((dropMax - drop) / (dropMax - dropMin)) * (height - padding.top - padding.bottom);
  };

  // Generate path
  const pathData = trajectory.map((p, i) => {
    const x = xScale(p.distance);
    const y = yScale(p.dropInches);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Zero line (y = 0)
  const zeroY = yScale(0);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ backgroundColor: theme.bg, borderRadius: '4px' }}>
      {/* Grid lines */}
      {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(dist => (
        <line
          key={dist}
          x1={xScale(dist)}
          y1={padding.top}
          x2={xScale(dist)}
          y2={height - padding.bottom}
          stroke={theme.border}
          strokeWidth="0.5"
        />
      ))}

      {/* Zero line */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={width - padding.right}
        y2={zeroY}
        stroke={theme.textMuted}
        strokeWidth="1"
        strokeDasharray="4 2"
      />

      {/* Trajectory path */}
      <path
        d={pathData}
        fill="none"
        stroke={theme.accent}
        strokeWidth="2"
      />

      {/* Zero distance marker */}
      <circle
        cx={xScale(zeroDistance)}
        cy={zeroY}
        r="4"
        fill={theme.green}
      />

      {/* Axes */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke={theme.textSecondary}
        strokeWidth="1"
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        stroke={theme.textSecondary}
        strokeWidth="1"
      />

      {/* X-axis labels */}
      {[0, 200, 400, 600, 800, 1000].map(dist => (
        <text
          key={dist}
          x={xScale(dist)}
          y={height - padding.bottom + 20}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fill={theme.textSecondary}
        >
          {dist}
        </text>
      ))}

      {/* Y-axis label */}
      <text
        x={padding.left - 40}
        y={height / 2}
        textAnchor="middle"
        fontSize="10"
        fontFamily="monospace"
        fill={theme.textSecondary}
        transform={`rotate(-90, ${padding.left - 40}, ${height / 2})`}
      >
        DROP (inches)
      </text>

      {/* X-axis label */}
      <text
        x={width / 2}
        y={height - 5}
        textAnchor="middle"
        fontSize="10"
        fontFamily="monospace"
        fill={theme.textSecondary}
      >
        DISTANCE (yards)
      </text>
    </svg>
  );
}

function TrajectoryTable({ trajectory, dropUnit }: { trajectory: TrajectoryPoint[]; dropUnit: DropUnit }) {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'monospace',
    fontSize: '11px'
  };

  const thStyle = {
    textAlign: 'left' as const,
    padding: '8px 6px',
    borderBottom: `0.5px solid ${theme.border}`,
    color: theme.textMuted,
    fontSize: '9px',
    letterSpacing: '0.5px'
  };

  const tdStyle = {
    padding: '6px 6px',
    borderBottom: `0.5px solid ${theme.border}`,
    color: theme.textPrimary
  };

  const getDropValue = (point: TrajectoryPoint) => {
    switch (dropUnit) {
      case 'inches':
        return point.dropInches.toFixed(2);
      case 'cm':
        return (point.dropInches * 2.54).toFixed(2);
      case 'moa':
        return point.dropMOA.toFixed(2);
      case 'mrad':
        return point.dropMRAD.toFixed(2);
    }
  };

  const getWindageValue = (point: TrajectoryPoint) => {
    switch (dropUnit) {
      case 'inches':
        return point.windageInches.toFixed(2);
      case 'cm':
        return (point.windageInches * 2.54).toFixed(2);
      case 'moa':
        return point.windageMOA.toFixed(2);
      case 'mrad':
        return point.windageMRAD.toFixed(2);
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>DIST</th>
            <th style={thStyle}>DROP ({dropUnit.toUpperCase()})</th>
            <th style={thStyle}>WIND ({dropUnit.toUpperCase()})</th>
            <th style={thStyle}>VEL (fps)</th>
            <th style={thStyle}>ENERGY (ft-lbs)</th>
            <th style={thStyle}>TIME (s)</th>
          </tr>
        </thead>
        <tbody>
          {trajectory.map(point => (
            <tr key={point.distance}>
              <td style={tdStyle}>{point.distance}</td>
              <td style={tdStyle}>{getDropValue(point)}</td>
              <td style={tdStyle}>{getWindageValue(point)}</td>
              <td style={tdStyle}>{Math.round(point.velocity)}</td>
              <td style={tdStyle}>{Math.round(point.energy)}</td>
              <td style={tdStyle}>{point.time.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
