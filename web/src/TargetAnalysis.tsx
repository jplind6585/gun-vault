import { useState, useRef, useEffect, useCallback } from 'react';
import { theme } from './theme';
import { getTargetAnalyses, saveTargetAnalysis, deleteTargetAnalysis, getAllGuns } from './storage';
import type { TargetAnalysisRecord } from './types';
import { haptic } from './haptic';

type Step = 1 | 2 | 3 | 4;
type MarkMode = 'calib' | 'poa' | 'shots';

interface Pt { x: number; y: number; }

interface Stats {
  shotCount: number;
  windageIn: number;
  elevationIn: number;
  windageMoa: number;
  elevationMoa: number;
  cepIn: number;
  cepMoa: number;
  radialSdIn: number;
  radialSdMoa: number;
  verticalSdIn: number;
  verticalSdMoa: number;
  horizontalSdIn: number;
  horizontalSdMoa: number;
  extremeSpreadIn: number;
  extremeSpreadMoa: number;
  meanRadiusIn: number;
  meanRadiusMoa: number;
}

const DIST_PRESETS = [25, 50, 100, 200, 300];
const BULLET_PRESETS = [
  { label: '.22', value: 0.222 },
  { label: '.224', value: 0.224 },
  { label: '.243', value: 0.243 },
  { label: '.308', value: 0.308 },
  { label: '.355', value: 0.355 },
  { label: '.357', value: 0.357 },
  { label: '.40', value: 0.400 },
  { label: '.45', value: 0.452 },
];
const REF_PRESETS = [0.5, 1, 2, 4];

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function toMoa(inches: number, yards: number): number {
  return yards > 0 ? (inches / yards) * 95.5 : 0;
}

export function TargetAnalysis() {
  const [step, setStep] = useState<Step>(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [distanceYds, setDistanceYds] = useState(100);
  const [bulletDiaIn, setBulletDiaIn] = useState(0.308);
  const [refIn, setRefIn] = useState(1);
  const [calibPts, setCalibPts] = useState<Pt[]>([]);
  const [pixelsPerInch, setPixelsPerInch] = useState<number | null>(null);
  const [marks, setMarks] = useState<Pt[]>([]); // [0]=POA, [1..n]=shots
  const [markMode, setMarkMode] = useState<MarkMode>('calib');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customDist, setCustomDist] = useState('');
  const [customBullet, setCustomBullet] = useState('');
  const [customRef, setCustomRef] = useState('');

  // Pinch-to-zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calibration confirmation banner
  const [calibBannerMsg, setCalibBannerMsg] = useState<string | null>(null);

  // Auto-save confirmation
  const [savedMsg, setSavedMsg] = useState(false);
  const savedRef = useRef(false);

  // History
  const [history, setHistory] = useState<TargetAnalysisRecord[]>([]);
  const [guns, setGuns] = useState<ReturnType<typeof getAllGuns>>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Touch tracking refs for pinch/pan
  const touchStartRef = useRef<{ touches: { id: number; x: number; y: number }[]; scale: number; offset: { x: number; y: number } } | null>(null);
  const touchMovedRef = useRef(false);

  const toCanvas = (clientX: number, clientY: number): Pt => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Calibration points + line
    calibPts.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,60,60,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    if (calibPts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(calibPts[0].x, calibPts[0].y);
      ctx.lineTo(calibPts[1].x, calibPts[1].y);
      ctx.strokeStyle = 'rgba(255,60,60,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // POA crosshair (marks[0])
    if (marks.length > 0) {
      const poa = marks[0];
      const r = 20;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(poa.x - r, poa.y);
      ctx.lineTo(poa.x + r, poa.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(poa.x, poa.y - r);
      ctx.lineTo(poa.x, poa.y + r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(poa.x, poa.y, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Live CEP circle — after POA is placed AND at least 1 shot
    if (marks.length >= 2 && pixelsPerInch) {
      const poa = marks[0];
      const shots = marks.slice(1);
      const ppi = pixelsPerInch;
      const windages = shots.map(s => (s.x - poa.x) / ppi);
      const elevations = shots.map(s => -(s.y - poa.y) / ppi);
      const radials = shots.map((_, i) => Math.sqrt(windages[i] ** 2 + elevations[i] ** 2));
      const cepIn = median(radials);
      const cepPx = cepIn * ppi;
      ctx.beginPath();
      ctx.arc(poa.x, poa.y, cepPx, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,212,59,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Shot dots (marks[1..n])
    const ppi = pixelsPerInch ?? 100;
    const dotRadius = Math.max(10, (bulletDiaIn / 2) * ppi);
    for (let i = 1; i < marks.length; i++) {
      const shot = marks[i];
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 212, 59, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Shot number label
      const fontSize = Math.max(11, Math.round(dotRadius * 0.9));
      ctx.fillStyle = '#000';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), shot.x, shot.y);
    }
  }, [calibPts, marks, bulletDiaIn, pixelsPerInch]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const loadImage = useCallback((url: string) => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawCanvas();
    };
    img.src = url;
  }, [drawCanvas]);

  useEffect(() => {
    if (imageUrl) loadImage(imageUrl);
  }, [imageUrl, loadImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleCanvasTap = (x: number, y: number) => {
    if (markMode === 'calib') {
      haptic();
      const newPts = [...calibPts, { x, y }];
      setCalibPts(newPts);
      if (newPts.length === 2) {
        const dx = newPts[1].x - newPts[0].x;
        const dy = newPts[1].y - newPts[0].y;
        const ppi = Math.sqrt(dx * dx + dy * dy) / refIn;
        setPixelsPerInch(ppi);
        setMarkMode('poa');
        // Show calibration banner for 2 seconds
        setCalibBannerMsg(`✓ Scale set — ${ppi.toFixed(0)} px/in`);
        setTimeout(() => setCalibBannerMsg(null), 2000);
      }
    } else if (markMode === 'poa') {
      haptic();
      setMarks([{ x, y }]);
      setMarkMode('shots');
    } else {
      haptic();
      setMarks(prev => [...prev, { x, y }]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toCanvas(e.clientX, e.clientY);
    handleCanvasTap(pt.x, pt.y);
  };

  // Touch handlers with pinch-to-zoom, two-finger pan, single-finger tap
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two fingers: start pinch/pan tracking
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      touchStartRef.current = {
        touches: [
          { id: t0.identifier, x: t0.clientX, y: t0.clientY },
          { id: t1.identifier, x: t1.clientX, y: t1.clientY },
        ],
        scale,
        offset,
      };
      touchMovedRef.current = false;
    } else if (e.touches.length === 1) {
      // Single finger: track for tap detection
      const t = e.touches[0];
      touchStartRef.current = {
        touches: [{ id: t.identifier, x: t.clientX, y: t.clientY }],
        scale,
        offset,
      };
      touchMovedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current?.touches.length === 2) {
      e.preventDefault();
      const start = touchStartRef.current;
      const t0 = e.touches[0];
      const t1 = e.touches[1];

      // Compute pinch scale
      const startDist = Math.hypot(
        start.touches[1].x - start.touches[0].x,
        start.touches[1].y - start.touches[0].y,
      );
      const curDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const pinchRatio = startDist > 0 ? curDist / startDist : 1;
      const newScale = Math.min(5, Math.max(1, start.scale * pinchRatio));

      // Compute two-finger pan: midpoint delta
      const startMidX = (start.touches[0].x + start.touches[1].x) / 2;
      const startMidY = (start.touches[0].y + start.touches[1].y) / 2;
      const curMidX = (t0.clientX + t1.clientX) / 2;
      const curMidY = (t0.clientY + t1.clientY) / 2;
      const newOffsetX = start.offset.x + (curMidX - startMidX);
      const newOffsetY = start.offset.y + (curMidY - startMidY);

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
      touchMovedRef.current = true;
    } else if (e.touches.length === 1 && touchStartRef.current?.touches.length === 1) {
      const start = touchStartRef.current.touches[0];
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - start.x);
      const dy = Math.abs(t.clientY - start.y);
      if (dx > 10 || dy > 10) {
        touchMovedRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only handle single-finger tap (no significant movement)
    if (
      e.changedTouches.length === 1 &&
      touchStartRef.current?.touches.length === 1 &&
      !touchMovedRef.current
    ) {
      const touch = e.changedTouches[0];
      const pt = toCanvas(touch.clientX, touch.clientY);
      handleCanvasTap(pt.x, pt.y);
    }
    touchStartRef.current = null;
    touchMovedRef.current = false;
  };

  const undoLast = () => {
    if (markMode === 'shots' && marks.length > 1) {
      setMarks(prev => prev.slice(0, -1));
    } else if (markMode === 'shots' && marks.length === 1) {
      setMarks([]);
      setMarkMode('poa');
    } else if (markMode === 'poa') {
      setCalibPts([]);
      setPixelsPerInch(null);
      setMarkMode('calib');
    } else if (markMode === 'calib' && calibPts.length > 0) {
      setCalibPts(prev => prev.slice(0, -1));
    }
  };

  const resetCalibration = () => {
    setCalibPts([]);
    setPixelsPerInch(null);
    setMarks([]);
    setMarkMode('calib');
  };

  const computeStats = (): Stats | null => {
    const ppi = pixelsPerInch;
    if (!ppi || marks.length < 2) return null;
    const poa = marks[0];
    const shots = marks.slice(1);

    const windages = shots.map(s => (s.x - poa.x) / ppi);
    const elevations = shots.map(s => -(s.y - poa.y) / ppi);
    const radials = shots.map((_, i) => Math.sqrt(windages[i] ** 2 + elevations[i] ** 2));

    const windageIn = windages.reduce((a, b) => a + b, 0) / shots.length;
    const elevationIn = elevations.reduce((a, b) => a + b, 0) / shots.length;
    const cepIn = median(radials);
    const radialSdIn = stddev(radials);
    const verticalSdIn = stddev(elevations);
    const horizontalSdIn = stddev(windages);
    const meanRadiusIn = radials.reduce((a, b) => a + b, 0) / radials.length;

    let extremeSpreadIn = 0;
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const dx = (shots[i].x - shots[j].x) / ppi;
        const dy = (shots[i].y - shots[j].y) / ppi;
        extremeSpreadIn = Math.max(extremeSpreadIn, Math.sqrt(dx * dx + dy * dy));
      }
    }

    return {
      shotCount: shots.length,
      windageIn,
      elevationIn,
      windageMoa: toMoa(Math.abs(windageIn), distanceYds),
      elevationMoa: toMoa(Math.abs(elevationIn), distanceYds),
      cepIn,
      cepMoa: toMoa(cepIn, distanceYds),
      radialSdIn,
      radialSdMoa: toMoa(radialSdIn, distanceYds),
      verticalSdIn,
      verticalSdMoa: toMoa(verticalSdIn, distanceYds),
      horizontalSdIn,
      horizontalSdMoa: toMoa(horizontalSdIn, distanceYds),
      extremeSpreadIn,
      extremeSpreadMoa: toMoa(extremeSpreadIn, distanceYds),
      meanRadiusIn,
      meanRadiusMoa: toMoa(meanRadiusIn, distanceYds),
    };
  };

  const goToResults = () => {
    haptic();
    const s = computeStats();
    setStats(s);
    setStep(4);
  };

  // Auto-save when reaching step 4
  useEffect(() => {
    if (step === 4 && stats && !savedRef.current) {
      savedRef.current = true;
      saveTargetAnalysis({
        distanceYds,
        bulletDiaIn,
        stats,
        sessionId: undefined,
        gunId: undefined,
        ammoLotId: undefined,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
      // Refresh history
      setHistory(getTargetAnalyses());
      setGuns(getAllGuns());
    }
  }, [step, stats, distanceYds, bulletDiaIn]);

  // Load history when step 4 is shown
  useEffect(() => {
    if (step === 4) {
      setHistory(getTargetAnalyses());
      setGuns(getAllGuns());
    }
  }, [step]);

  const exportOverlay = () => {
    haptic();
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);

    const panelW = Math.round(canvas.width * 0.38);
    const lineH = Math.round(panelW * 0.065);
    const fontSize = Math.round(lineH * 0.72);
    const smallFont = Math.round(fontSize * 0.8);
    const rows = [
      ['Windage', `${stats.windageIn >= 0 ? 'R' : 'L'} ${Math.abs(stats.windageIn).toFixed(2)}"`, `${stats.windageMoa.toFixed(2)} MOA`],
      ['Elevation', `${stats.elevationIn >= 0 ? 'U' : 'D'} ${Math.abs(stats.elevationIn).toFixed(2)}"`, `${stats.elevationMoa.toFixed(2)} MOA`],
      ['CEP', `${stats.cepIn.toFixed(2)}"`, `${stats.cepMoa.toFixed(2)} MOA`],
      ['Radial SD', `${stats.radialSdIn.toFixed(2)}"`, `${stats.radialSdMoa.toFixed(2)} MOA`],
      ['Vertical SD', `${stats.verticalSdIn.toFixed(2)}"`, `${stats.verticalSdMoa.toFixed(2)} MOA`],
      ['Horiz SD', `${stats.horizontalSdIn.toFixed(2)}"`, `${stats.horizontalSdMoa.toFixed(2)} MOA`],
      ['ES', `${stats.extremeSpreadIn.toFixed(2)}"`, `${stats.extremeSpreadMoa.toFixed(2)} MOA`],
      ['Mean R', `${stats.meanRadiusIn.toFixed(2)}"`, `${stats.meanRadiusMoa.toFixed(2)} MOA`],
    ];

    const panelH = lineH * (rows.length + 2.5);
    const margin = Math.round(canvas.width * 0.02);
    const px = canvas.width - panelW - margin;
    const py = margin;

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, Math.round(panelW * 0.04));
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${distanceYds}yd  •  ${stats.shotCount} shots`, px + Math.round(panelW * 0.05), py + lineH * 1.2);

    rows.forEach(([label, val, moa], i) => {
      const rowY = py + lineH * (2.4 + i);
      ctx.font = `${smallFont}px sans-serif`;
      ctx.fillStyle = 'rgba(180,180,200,0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + Math.round(panelW * 0.05), rowY);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'right';
      ctx.fillText(val, px + Math.round(panelW * 0.62), rowY);
      ctx.font = `${smallFont}px sans-serif`;
      ctx.fillStyle = 'rgba(180,180,200,0.8)';
      ctx.fillText(moa, px + panelW - Math.round(panelW * 0.04), rowY);
    });

    const link = document.createElement('a');
    link.download = `target-${distanceYds}yd-${stats.shotCount}shots.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  };

  const resetAll = () => {
    savedRef.current = false;
    setStep(1);
    setImageUrl(null);
    setCalibPts([]);
    setPixelsPerInch(null);
    setMarks([]);
    setMarkMode('calib');
    setStats(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setCalibBannerMsg(null);
    setSavedMsg(false);
  };

  const deleteHistoryEntry = (id: string) => {
    deleteTargetAnalysis(id);
    setHistory(getTargetAnalyses());
  };

  // ---- UI HELPERS ----

  const chip = (label: string, selected: boolean, onSelect: () => void) => (
    <button
      key={label}
      onClick={onSelect}
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        border: selected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
        background: selected ? theme.accentDim : theme.surface,
        color: selected ? theme.accent : theme.textSecondary,
        fontWeight: selected ? 700 : 400,
        fontSize: 14,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
      {text}
    </div>
  );

  // ---- STEP 1: Upload ----
  const renderStep1 = () => (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>🎯</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, marginBottom: 6 }}>Target Analysis</div>
        <div style={{ fontSize: 14, color: theme.textSecondary }}>Upload a photo of your target to analyze shot placement</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '18px 20px', borderRadius: 14,
          background: theme.accent, color: '#000',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>
          📷 Take Photo
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '18px 20px', borderRadius: 14,
          background: theme.surface, color: theme.textPrimary,
          border: `1px solid ${theme.border}`,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>
          🖼 Choose from Library
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {imageUrl && (
        <button
          onClick={() => setStep(2)}
          style={{
            padding: '14px 40px', borderRadius: 12,
            background: theme.accent, color: '#000',
            border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Continue →
        </button>
      )}
    </div>
  );

  // ---- STEP 2: Setup ----
  const renderStep2 = () => (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>Setup</div>

      {/* Image thumbnail preview */}
      {imageUrl && (
        <div style={{
          width: '100%', height: 100, borderRadius: 10, overflow: 'hidden',
          border: `1px solid ${theme.border}`, flexShrink: 0,
        }}>
          <img
            src={imageUrl}
            alt="Uploaded target"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div>
        {sectionLabel('Distance')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {DIST_PRESETS.map(d => chip(`${d}yd`, distanceYds === d && !customDist, () => { setDistanceYds(d); setCustomDist(''); }))}
          <input
            type="number"
            placeholder="Other yd"
            value={customDist}
            onChange={e => { setCustomDist(e.target.value); if (e.target.value) setDistanceYds(Number(e.target.value)); }}
            style={{
              padding: '8px 12px', borderRadius: 20,
              border: `1px solid ${theme.border}`, background: theme.surface,
              color: theme.textPrimary, fontSize: 14, width: 90,
            }}
          />
        </div>
      </div>

      <div>
        {sectionLabel('Bullet Diameter')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {BULLET_PRESETS.map(b => chip(b.label, Math.abs(bulletDiaIn - b.value) < 0.001 && !customBullet, () => { setBulletDiaIn(b.value); setCustomBullet(''); }))}
          <input
            type="number"
            step="0.001"
            placeholder='Other "'
            value={customBullet}
            onChange={e => { setCustomBullet(e.target.value); if (e.target.value) setBulletDiaIn(Number(e.target.value)); }}
            style={{
              padding: '8px 12px', borderRadius: 20,
              border: `1px solid ${theme.border}`, background: theme.surface,
              color: theme.textPrimary, fontSize: 14, width: 100,
            }}
          />
        </div>
      </div>

      <div>
        {sectionLabel('Reference Scale')}
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
          You'll tap two points on the photo that are this far apart. Use a ruler, target grid square, or known distance.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {REF_PRESETS.map(r => chip(`${r}"`, refIn === r && !customRef, () => { setRefIn(r); setCustomRef(''); }))}
          <input
            type="number"
            step="0.25"
            placeholder='Other "'
            value={customRef}
            onChange={e => { setCustomRef(e.target.value); if (e.target.value) setRefIn(Number(e.target.value)); }}
            style={{
              padding: '8px 12px', borderRadius: 20,
              border: `1px solid ${theme.border}`, background: theme.surface,
              color: theme.textPrimary, fontSize: 14, width: 100,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
        <button onClick={() => setStep(1)} style={{
          flex: 1, padding: 14, borderRadius: 12,
          background: theme.surface, color: theme.textPrimary,
          border: `1px solid ${theme.border}`, fontSize: 15, cursor: 'pointer',
        }}>
          ← Back
        </button>
        <button onClick={() => { setCalibPts([]); setPixelsPerInch(null); setMarks([]); setMarkMode('calib'); setScale(1); setOffset({ x: 0, y: 0 }); setStep(3); }} style={{
          flex: 2, padding: 14, borderRadius: 12,
          background: theme.accent, color: '#000',
          border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          Calibrate & Mark →
        </button>
      </div>
    </div>
  );

  // ---- STEP 3: Mark ----
  const renderStep3 = () => {
    let instruction = '';
    if (calibBannerMsg) {
      instruction = calibBannerMsg;
    } else if (markMode === 'calib') {
      instruction = calibPts.length === 0
        ? `Tap point 1 of reference scale (${refIn}")`
        : `Tap point 2 of reference scale`;
    } else if (markMode === 'poa') {
      instruction = 'Tap your point of aim (target center)';
    } else {
      const shotCount = marks.length - 1;
      instruction = `Tap each shot hole  •  ${shotCount} shot${shotCount !== 1 ? 's' : ''} marked`;
    }

    const isCalibConfirm = !!calibBannerMsg;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Instruction bar */}
        <div style={{
          padding: '10px 14px',
          background: isCalibConfirm ? 'rgba(60,180,60,0.15)' : theme.surfaceAlt,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <span style={{
            fontSize: 13,
            color: isCalibConfirm ? '#4caf50' : theme.textPrimary,
            fontWeight: isCalibConfirm ? 700 : 500,
            flex: 1,
          }}>
            {instruction}
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {scale > 1 && (
              <button
                onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: theme.surface, color: theme.accent,
                  border: `1px solid ${theme.accent}`, fontSize: 12, cursor: 'pointer',
                }}
              >
                Reset Zoom
              </button>
            )}
            {(markMode === 'poa' || markMode === 'shots') && (
              <button
                onClick={resetCalibration}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: theme.surface, color: theme.textSecondary,
                  border: `1px solid ${theme.border}`, fontSize: 12, cursor: 'pointer',
                }}
              >
                Recal.
              </button>
            )}
            <button onClick={undoLast} style={{
              padding: '6px 12px', borderRadius: 8,
              background: theme.surface, color: theme.textSecondary,
              border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer',
            }}>Undo</button>
            {markMode === 'shots' && marks.length >= 2 && (
              <button onClick={goToResults} style={{
                padding: '6px 14px', borderRadius: 8,
                background: theme.accent, color: '#000',
                border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>Results →</button>
            )}
          </div>
        </div>

        {/* Canvas wrapper with pinch-to-zoom */}
        <div
          style={{ flex: 1, overflow: 'hidden', background: '#0a0a0a', minHeight: 0, touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              display: 'block',
              touchAction: 'none',
              transformOrigin: '0 0',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              willChange: 'transform',
            }}
            onClick={handleCanvasClick}
          />
        </div>

        <button onClick={() => setStep(2)} style={{
          margin: 12, padding: 12, borderRadius: 12, flexShrink: 0,
          background: theme.surface, color: theme.textSecondary,
          border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer',
        }}>← Back to Setup</button>
      </div>
    );
  };

  // ---- STEP 4: Results ----
  const StatRow = ({ label, val, moa }: { label: string; val: string; moa: string }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0', borderBottom: `1px solid ${theme.border}`,
    }}>
      <span style={{ fontSize: 14, color: theme.textSecondary }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{val}</span>
        <span style={{ fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>{moa}</span>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (!stats) return null;
    const wDir = stats.windageIn >= 0 ? 'R ' : 'L ';
    const eDir = stats.elevationIn >= 0 ? 'U ' : 'D ';

    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>Results</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>{stats.shotCount} shots • {distanceYds}yd</div>
        </div>

        {/* Auto-save confirmation */}
        {savedMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(60,180,60,0.12)', border: '1px solid rgba(60,180,60,0.3)',
            color: '#4caf50', fontSize: 13, fontWeight: 600, textAlign: 'center',
          }}>
            Saved to history ✓
          </div>
        )}

        {/* Offsets */}
        <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
          <div style={{ padding: '12px 0 2px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Group Offset from POA
          </div>
          <StatRow label="Windage" val={`${wDir}${Math.abs(stats.windageIn).toFixed(2)}"`} moa={`${stats.windageMoa.toFixed(2)} MOA`} />
          <StatRow label="Elevation" val={`${eDir}${Math.abs(stats.elevationIn).toFixed(2)}"`} moa={`${stats.elevationMoa.toFixed(2)} MOA`} />
        </div>

        {/* Precision */}
        <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
          <div style={{ padding: '12px 0 2px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Precision
          </div>
          <StatRow label="CEP" val={`${stats.cepIn.toFixed(2)}"`} moa={`${stats.cepMoa.toFixed(2)} MOA`} />
          <StatRow label="Radial SD" val={`${stats.radialSdIn.toFixed(2)}"`} moa={`${stats.radialSdMoa.toFixed(2)} MOA`} />
          <StatRow label="Vertical SD" val={`${stats.verticalSdIn.toFixed(2)}"`} moa={`${stats.verticalSdMoa.toFixed(2)} MOA`} />
          <StatRow label="Horizontal SD" val={`${stats.horizontalSdIn.toFixed(2)}"`} moa={`${stats.horizontalSdMoa.toFixed(2)} MOA`} />
          <StatRow label="Extreme Spread" val={`${stats.extremeSpreadIn.toFixed(2)}"`} moa={`${stats.extremeSpreadMoa.toFixed(2)} MOA`} />
          <StatRow label="Mean Radius" val={`${stats.meanRadiusIn.toFixed(2)}"`} moa={`${stats.meanRadiusMoa.toFixed(2)} MOA`} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setStep(3)} style={{
            flex: 1, padding: 14, borderRadius: 12,
            background: theme.surface, color: theme.textPrimary,
            border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer',
          }}>← Edit</button>
          <button onClick={exportOverlay} style={{
            flex: 2, padding: 14, borderRadius: 12,
            background: theme.accent, color: '#000',
            border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>⬇ Export with Overlay</button>
        </div>

        <button onClick={resetAll} style={{
          padding: 12, borderRadius: 12,
          background: 'transparent', color: theme.textMuted,
          border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer',
        }}>
          + New Analysis
        </button>

        {/* Analysis History */}
        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Analysis History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {history.map(record => {
                const gun = record.gunId ? guns.find(g => g.id === record.gunId) : null;
                const date = new Date(record.createdAt);
                const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div
                    key={record.id}
                    style={{
                      background: theme.surface,
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                          {record.distanceYds}yd
                        </span>
                        <span style={{ fontSize: 12, color: theme.textMuted }}>•</span>
                        <span style={{ fontSize: 12, color: theme.textSecondary }}>
                          {record.stats.shotCount} shot{record.stats.shotCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 12, color: theme.textMuted }}>•</span>
                        <span style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'monospace' }}>
                          CEP {record.stats.cepIn.toFixed(2)}"
                        </span>
                        {gun && (
                          <>
                            <span style={{ fontSize: 12, color: theme.textMuted }}>•</span>
                            <span style={{ fontSize: 12, color: theme.accent }}>
                              {gun.make} {gun.model}
                            </span>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>{dateStr}</div>
                    </div>
                    <button
                      onClick={() => deleteHistoryEntry(record.id)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 7,
                        background: 'transparent',
                        color: theme.textMuted,
                        border: `1px solid ${theme.border}`,
                        fontSize: 14,
                        cursor: 'pointer',
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step progress indicator
  const stepLabels = ['Upload', 'Setup', 'Mark', 'Results'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {step !== 3 && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 4, flexShrink: 0 }}>
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step;
            const active = s === step;
            const done = s < step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? theme.accent : active ? theme.accentDim : theme.surface,
                  border: active ? `2px solid ${theme.accent}` : done ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  fontSize: 11, fontWeight: 700,
                  color: done ? '#000' : active ? theme.accent : theme.textMuted,
                }}>
                  {done ? '✓' : s}
                </div>
                <span style={{ fontSize: 11, color: active ? theme.textPrimary : theme.textMuted, fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: done ? theme.accent : theme.border, opacity: done ? 0.6 : 1 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ flex: 1, overflowY: step === 3 ? 'hidden' : 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
}
