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

// Presets: inVal is the canonical inches value
const BULLET_PRESETS: { label: string; inVal: number }[] = [
  { label: '.17 / 4.3mm',  inVal: 0.172 },
  { label: '.20 / 5.0mm',  inVal: 0.204 },
  { label: '.22 / 5.6mm',  inVal: 0.224 },
  { label: '.243 / 6.2mm', inVal: 0.243 },
  { label: '.264 / 6.7mm', inVal: 0.264 }, // 6.5mm bore
  { label: '.277 / 7.0mm', inVal: 0.277 },
  { label: '.284 / 7.2mm', inVal: 0.284 },
  { label: '.308 / 7.8mm', inVal: 0.308 },
  { label: '.338 / 8.6mm', inVal: 0.338 },
  { label: '.355 / 9.0mm', inVal: 0.355 }, // 9mm
  { label: '.357 / 9.1mm', inVal: 0.357 },
  { label: '.40 / 10.2mm', inVal: 0.400 },
  { label: '.44 / 11.2mm', inVal: 0.429 },
  { label: '.45 / 11.5mm', inVal: 0.452 },
  { label: '.50 / 12.7mm', inVal: 0.500 },
];

const DIST_PRESETS = [25, 50, 100, 200, 300];
const REF_PRESETS_IN = [0.5, 1, 2, 4, 6];

// Metric explanations — click to reveal
const TOOLTIPS: Record<string, string> = {
  'Windage':        'Average horizontal offset from your Point of Aim. R = right, L = left. Dial in your windage zero by this amount.',
  'Elevation':      'Average vertical offset from your Point of Aim. U = high, D = low. Adjust your elevation zero accordingly.',
  'CEP':            'Circular Error Probable — radius of the circle containing 50% of shots. A smaller CEP = a tighter, more predictable group.',
  'Radial SD':      'Standard Deviation of shot distances from POA — overall consistency. High values mean shots are scattered at varying distances.',
  'Vertical SD':    'Vertical consistency. High values often indicate inconsistent breathing, trigger control, or ammunition velocity variation.',
  'Horizontal SD':  'Horizontal consistency. High values may indicate grip variation, trigger pull, or crosswind influence.',
  'Extreme Spread': 'Distance between the two farthest shots — your worst-case group size. Useful for dialing in max-range holds.',
  'Mean Radius':    'Average distance of all shots from POA — similar to CEP but uses mean instead of median, making it more sensitive to flyers.',
  'MOA':            'Minute of Angle — 1 MOA ≈ 1.047" at 100yd, ≈ 0.524" at 50yd, ≈ 2.094" at 200yd. Most scopes adjust in ¼ MOA clicks.',
};

function ptDist(a: Pt, b: Pt) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

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

function inToMm(inches: number) { return (inches * 25.4).toFixed(1); }
function mmToIn(mm: number) { return mm / 25.4; }

// ─────────────────────────────────────────────────────────────────────────────

export function TargetAnalysis() {
  const [step, setStep] = useState<Step>(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [distanceYds, setDistanceYds] = useState(100);
  const [bulletDiaIn, setBulletDiaIn] = useState(0.308);
  const [bulletUnit, setBulletUnit] = useState<'in' | 'mm'>('in');
  const [refIn, setRefIn] = useState(1);
  const [refUnit, setRefUnit] = useState<'in' | 'mm'>('in');
  const [calibPts, setCalibPts] = useState<Pt[]>([]);
  const [pixelsPerInch, setPixelsPerInch] = useState<number | null>(null);
  const [marks, setMarks] = useState<Pt[]>([]); // [0]=POA, [1..n]=shots
  const [markMode, setMarkMode] = useState<MarkMode>('calib');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customDist, setCustomDist] = useState('');
  const [customBullet, setCustomBullet] = useState('');
  const [customRef, setCustomRef] = useState('');

  // Pinch-to-zoom
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [calibBannerMsg, setCalibBannerMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const savedRef = useRef(false);

  const [history, setHistory] = useState<TargetAnalysisRecord[]>([]);
  const [guns, setGuns] = useState<ReturnType<typeof getAllGuns>>([]);

  // Overlay / tooltip
  const [resultTab, setResultTab] = useState<'stats' | 'overlay'>('stats');
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // AI Coach
  const [showCoach, setShowCoach] = useState(false);
  const [coachMessages, setCoachMessages] = useState<{ role: string; content: string }[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Touch tracking for pinch/pan
  const touchStartRef = useRef<{ touches: { id: number; x: number; y: number }[]; scale: number; offset: { x: number; y: number } } | null>(null);
  const touchMovedRef = useRef(false);

  // Drag tracking
  type DragTarget = { type: 'calib' | 'poa' | 'shot'; index: number };
  const draggingRef = useRef<DragTarget | null>(null);
  // For mouse events
  const mouseDownPtRef = useRef<Pt | null>(null);
  const mouseMovedRef = useRef(false);

  const toCanvas = (clientX: number, clientY: number): Pt => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // ── Find draggable item near a canvas point ──────────────────────────────
  const findDraggable = useCallback((pt: Pt): DragTarget | null => {
    const HIT = 40; // canvas px hit radius
    for (let i = 0; i < calibPts.length; i++) {
      if (ptDist(pt, calibPts[i]) < HIT) return { type: 'calib', index: i };
    }
    if (marks.length > 0 && ptDist(pt, marks[0]) < HIT) return { type: 'poa', index: 0 };
    const ppi = pixelsPerInch ?? 100;
    for (let i = 1; i < marks.length; i++) {
      const r = Math.max(HIT, (bulletDiaIn / 2) * ppi);
      if (ptDist(pt, marks[i]) < r) return { type: 'shot', index: i };
    }
    return null;
  }, [calibPts, marks, bulletDiaIn, pixelsPerInch]);

  const updateDragged = useCallback((pt: Pt) => {
    const d = draggingRef.current;
    if (!d) return;
    if (d.type === 'calib') {
      setCalibPts(prev => {
        const next = [...prev];
        next[d.index] = pt;
        if (next.length === 2) {
          const dx = next[1].x - next[0].x;
          const dy = next[1].y - next[0].y;
          setPixelsPerInch(Math.sqrt(dx * dx + dy * dy) / refIn);
        }
        return next;
      });
    } else {
      // poa (index 0) or shot (index 1+)
      setMarks(prev => {
        const next = [...prev];
        next[d.index] = pt;
        return next;
      });
    }
  }, [refIn]);

  // ── Draw canvas ──────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Calibration points + line
    calibPts.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,60,60,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Label A / B
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i === 0 ? 'A' : 'B', pt.x, pt.y);
    });
    if (calibPts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(calibPts[0].x, calibPts[0].y);
      ctx.lineTo(calibPts[1].x, calibPts[1].y);
      ctx.strokeStyle = 'rgba(255,80,80,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // POA crosshair
    if (marks.length > 0) {
      const poa = marks[0];
      const r = 22;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.moveTo(poa.x - r, poa.y); ctx.lineTo(poa.x + r, poa.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(poa.x, poa.y - r); ctx.lineTo(poa.x, poa.y + r); ctx.stroke();
      ctx.beginPath(); ctx.arc(poa.x, poa.y, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Live CEP circle
    if (marks.length >= 2 && pixelsPerInch) {
      const poa = marks[0];
      const shots = marks.slice(1);
      const ppi = pixelsPerInch;
      const windages = shots.map(s => (s.x - poa.x) / ppi);
      const elevations = shots.map(s => -(s.y - poa.y) / ppi);
      const radials = shots.map((_, i) => Math.sqrt(windages[i] ** 2 + elevations[i] ** 2));
      const cepPx = median(radials) * ppi;
      ctx.beginPath();
      ctx.arc(poa.x, poa.y, cepPx, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,212,59,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Shot dots
    const ppi = pixelsPerInch ?? 100;
    const dotRadius = Math.max(10, (bulletDiaIn / 2) * ppi);
    for (let i = 1; i < marks.length; i++) {
      const shot = marks[i];
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,212,59,0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      const fontSize = Math.max(11, Math.round(dotRadius * 0.9));
      ctx.fillStyle = '#000';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), shot.x, shot.y);
    }
  }, [calibPts, marks, bulletDiaIn, pixelsPerInch]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

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

  useEffect(() => { if (imageUrl) loadImage(imageUrl); }, [imageUrl, loadImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  };

  // ── Canvas tap logic ─────────────────────────────────────────────────────
  const handleCanvasTap = (x: number, y: number) => {
    haptic();
    if (markMode === 'calib') {
      const newPts = [...calibPts, { x, y }];
      setCalibPts(newPts);
      if (newPts.length === 2) {
        const dx = newPts[1].x - newPts[0].x;
        const dy = newPts[1].y - newPts[0].y;
        const ppi = Math.sqrt(dx * dx + dy * dy) / refIn;
        setPixelsPerInch(ppi);
        setMarkMode('poa');
        setCalibBannerMsg(`✓ Scale set — ${ppi.toFixed(0)} px/in`);
        setTimeout(() => setCalibBannerMsg(null), 2000);
      }
    } else if (markMode === 'poa') {
      setMarks([{ x, y }]);
      setMarkMode('shots');
    } else {
      setMarks(prev => [...prev, { x, y }]);
    }
  };

  // ── Touch handlers ───────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0]; const t1 = e.touches[1];
      touchStartRef.current = {
        touches: [{ id: t0.identifier, x: t0.clientX, y: t0.clientY }, { id: t1.identifier, x: t1.clientX, y: t1.clientY }],
        scale, offset,
      };
      touchMovedRef.current = false;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { touches: [{ id: t.identifier, x: t.clientX, y: t.clientY }], scale, offset };
      touchMovedRef.current = false;
      // Check for draggable under finger
      const pt = toCanvas(t.clientX, t.clientY);
      draggingRef.current = findDraggable(pt);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current?.touches.length === 2) {
      e.preventDefault();
      const start = touchStartRef.current;
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const startDist = Math.hypot(start.touches[1].x - start.touches[0].x, start.touches[1].y - start.touches[0].y);
      const curDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const pinchRatio = startDist > 0 ? curDist / startDist : 1;
      const newScale = Math.min(5, Math.max(1, start.scale * pinchRatio));
      const startMidX = (start.touches[0].x + start.touches[1].x) / 2;
      const startMidY = (start.touches[0].y + start.touches[1].y) / 2;
      const curMidX = (t0.clientX + t1.clientX) / 2;
      const curMidY = (t0.clientY + t1.clientY) / 2;
      setScale(newScale);
      setOffset({ x: start.offset.x + (curMidX - startMidX), y: start.offset.y + (curMidY - startMidY) });
      touchMovedRef.current = true;
    } else if (e.touches.length === 1 && touchStartRef.current?.touches.length === 1) {
      const t = e.touches[0];
      const start = touchStartRef.current.touches[0];
      if (draggingRef.current) {
        // Drag existing item
        const pt = toCanvas(t.clientX, t.clientY);
        updateDragged(pt);
        touchMovedRef.current = true;
      } else {
        const dx = Math.abs(t.clientX - start.x);
        const dy = Math.abs(t.clientY - start.y);
        if (dx > 10 || dy > 10) touchMovedRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = null;
      touchStartRef.current = null;
      touchMovedRef.current = false;
      return;
    }
    if (e.changedTouches.length === 1 && touchStartRef.current?.touches.length === 1 && !touchMovedRef.current) {
      const touch = e.changedTouches[0];
      const pt = toCanvas(touch.clientX, touch.clientY);
      handleCanvasTap(pt.x, pt.y);
    }
    touchStartRef.current = null;
    touchMovedRef.current = false;
  };

  // ── Mouse handlers (desktop) ─────────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toCanvas(e.clientX, e.clientY);
    mouseDownPtRef.current = pt;
    mouseMovedRef.current = false;
    draggingRef.current = findDraggable(pt);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDownPtRef.current) return;
    const pt = toCanvas(e.clientX, e.clientY);
    const start = mouseDownPtRef.current;
    if (Math.abs(pt.x - start.x) > 4 || Math.abs(pt.y - start.y) > 4) {
      mouseMovedRef.current = true;
    }
    if (draggingRef.current && mouseMovedRef.current) updateDragged(pt);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasDraggingAndMoved = draggingRef.current && mouseMovedRef.current;
    draggingRef.current = null;
    mouseDownPtRef.current = null;
    if (!wasDraggingAndMoved) {
      const pt = toCanvas(e.clientX, e.clientY);
      handleCanvasTap(pt.x, pt.y);
    }
    mouseMovedRef.current = false;
  };

  // ── Undo / reset ─────────────────────────────────────────────────────────
  const undoLast = () => {
    if (markMode === 'shots' && marks.length > 1) {
      setMarks(prev => prev.slice(0, -1));
    } else if (markMode === 'shots' && marks.length === 1) {
      setMarks([]); setMarkMode('poa');
    } else if (markMode === 'poa') {
      setCalibPts([]); setPixelsPerInch(null); setMarkMode('calib');
    } else if (markMode === 'calib' && calibPts.length > 0) {
      setCalibPts(prev => prev.slice(0, -1));
    }
  };

  const resetCalibration = () => {
    setCalibPts([]); setPixelsPerInch(null); setMarks([]); setMarkMode('calib');
  };

  // ── Compute stats ─────────────────────────────────────────────────────────
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
      shotCount: shots.length, windageIn, elevationIn,
      windageMoa: toMoa(Math.abs(windageIn), distanceYds), elevationMoa: toMoa(Math.abs(elevationIn), distanceYds),
      cepIn, cepMoa: toMoa(cepIn, distanceYds),
      radialSdIn, radialSdMoa: toMoa(radialSdIn, distanceYds),
      verticalSdIn, verticalSdMoa: toMoa(verticalSdIn, distanceYds),
      horizontalSdIn, horizontalSdMoa: toMoa(horizontalSdIn, distanceYds),
      extremeSpreadIn, extremeSpreadMoa: toMoa(extremeSpreadIn, distanceYds),
      meanRadiusIn, meanRadiusMoa: toMoa(meanRadiusIn, distanceYds),
    };
  };

  const goToResults = () => {
    haptic();
    const s = computeStats();
    setStats(s);
    setStep(4);
    setResultTab('stats');
  };

  // Auto-save when step 4 reached
  useEffect(() => {
    if (step === 4 && stats && !savedRef.current) {
      savedRef.current = true;
      saveTargetAnalysis({ distanceYds, bulletDiaIn, stats, sessionId: undefined, gunId: undefined, ammoLotId: undefined });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
      setHistory(getTargetAnalyses());
      setGuns(getAllGuns());
    }
  }, [step, stats, distanceYds, bulletDiaIn]);

  useEffect(() => { if (step === 4) { setHistory(getTargetAnalyses()); setGuns(getAllGuns()); } }, [step]);

  // ── Export (with navigator.share fallback) ───────────────────────────────
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
      ['Windage',    `${stats.windageIn >= 0 ? 'R' : 'L'} ${Math.abs(stats.windageIn).toFixed(2)}"`,   `${stats.windageMoa.toFixed(2)} MOA`],
      ['Elevation',  `${stats.elevationIn >= 0 ? 'U' : 'D'} ${Math.abs(stats.elevationIn).toFixed(2)}"`, `${stats.elevationMoa.toFixed(2)} MOA`],
      ['CEP',        `${stats.cepIn.toFixed(2)}"`,              `${stats.cepMoa.toFixed(2)} MOA`],
      ['Radial SD',  `${stats.radialSdIn.toFixed(2)}"`,         `${stats.radialSdMoa.toFixed(2)} MOA`],
      ['Vert SD',    `${stats.verticalSdIn.toFixed(2)}"`,       `${stats.verticalSdMoa.toFixed(2)} MOA`],
      ['Horiz SD',   `${stats.horizontalSdIn.toFixed(2)}"`,     `${stats.horizontalSdMoa.toFixed(2)} MOA`],
      ['ES',         `${stats.extremeSpreadIn.toFixed(2)}"`,    `${stats.extremeSpreadMoa.toFixed(2)} MOA`],
      ['Mean R',     `${stats.meanRadiusIn.toFixed(2)}"`,       `${stats.meanRadiusMoa.toFixed(2)} MOA`],
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
      ctx.font = `${smallFont}px sans-serif`; ctx.fillStyle = 'rgba(180,180,200,0.9)';
      ctx.textAlign = 'left'; ctx.fillText(label, px + Math.round(panelW * 0.05), rowY);
      ctx.font = `bold ${fontSize}px sans-serif`; ctx.fillStyle = 'white';
      ctx.textAlign = 'right'; ctx.fillText(val, px + Math.round(panelW * 0.62), rowY);
      ctx.font = `${smallFont}px sans-serif`; ctx.fillStyle = 'rgba(180,180,200,0.8)';
      ctx.fillText(moa, px + panelW - Math.round(panelW * 0.04), rowY);
    });

    const filename = `target-${distanceYds}yd-${stats.shotCount}shots.png`;
    offscreen.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], filename, { type: 'image/png' });
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Target Analysis' }); return; } catch { /* fall through */ }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename; link.href = url;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // ── Reset all ─────────────────────────────────────────────────────────────
  const resetAll = () => {
    savedRef.current = false;
    setStep(1); setImageUrl(null); setCalibPts([]); setPixelsPerInch(null);
    setMarks([]); setMarkMode('calib'); setStats(null); setScale(1);
    setOffset({ x: 0, y: 0 }); setCalibBannerMsg(null); setSavedMsg(false);
    setCoachMessages([]); setShowCoach(false);
  };

  const deleteHistoryEntry = (id: string) => {
    deleteTargetAnalysis(id); setHistory(getTargetAnalyses());
  };

  // ── AI Coach ──────────────────────────────────────────────────────────────
  const statsContext = stats ? [
    `Distance: ${distanceYds} yards | Shots: ${stats.shotCount}`,
    `Windage: ${stats.windageIn >= 0 ? 'Right' : 'Left'} ${Math.abs(stats.windageIn).toFixed(2)}" (${stats.windageMoa.toFixed(2)} MOA)`,
    `Elevation: ${stats.elevationIn >= 0 ? 'Up' : 'Down'} ${Math.abs(stats.elevationIn).toFixed(2)}" (${stats.elevationMoa.toFixed(2)} MOA)`,
    `CEP: ${stats.cepIn.toFixed(2)}" (${stats.cepMoa.toFixed(2)} MOA)`,
    `ES: ${stats.extremeSpreadIn.toFixed(2)}" (${stats.extremeSpreadMoa.toFixed(2)} MOA)`,
    `Radial SD: ${stats.radialSdIn.toFixed(2)}" (${stats.radialSdMoa.toFixed(2)} MOA)`,
    `Vert SD: ${stats.verticalSdIn.toFixed(2)}" (${stats.verticalSdMoa.toFixed(2)} MOA)`,
    `Horiz SD: ${stats.horizontalSdIn.toFixed(2)}" (${stats.horizontalSdMoa.toFixed(2)} MOA)`,
    `Mean Radius: ${stats.meanRadiusIn.toFixed(2)}" (${stats.meanRadiusMoa.toFixed(2)} MOA)`,
  ].join('\n') : '';

  const callCoach = async (userMsg: string) => {
    const newMessages = [...coachMessages, { role: 'user', content: userMsg }];
    setCoachMessages(newMessages);
    setCoachInput('');
    setCoachLoading(true);
    try {
      const res = await fetch('/.netlify/functions/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statsContext,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok) {
        if (res.status === 503) {
          setCoachMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Coach is not configured. Ask your Netlify admin to add ANTHROPIC_API_KEY as an environment variable.' }]);
        } else {
          throw new Error(data.error ?? 'Unknown error');
        }
      } else {
        setCoachMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? '' }]);
      }
    } catch {
      setCoachMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not reach coaching service. Check your internet connection.' }]);
    } finally {
      setCoachLoading(false);
    }
  };

  const openCoach = () => {
    setShowCoach(true);
    if (coachMessages.length === 0) {
      callCoach('Analyze my shot group and give me 2–3 specific, actionable coaching tips to improve.');
    }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const chip = (label: string, selected: boolean, onSelect: () => void) => (
    <button
      key={label}
      onClick={onSelect}
      style={{
        padding: '7px 13px', borderRadius: 20,
        border: selected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
        background: selected ? theme.accentDim : theme.surface,
        color: selected ? theme.accent : theme.textSecondary,
        fontWeight: selected ? 700 : 400, fontSize: 13,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  const unitToggle = (unit: 'in' | 'mm', setUnit: (u: 'in' | 'mm') => void) => (
    <div style={{ display: 'flex', border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
      {(['in', 'mm'] as const).map(u => (
        <button key={u} onClick={() => setUnit(u)} style={{
          padding: '5px 10px', border: 'none', cursor: 'pointer', fontSize: 11,
          fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px',
          background: unit === u ? theme.accent : 'transparent',
          color: unit === u ? '#000' : theme.textMuted,
        }}>
          {u.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
      {text}
    </div>
  );

  // ─── STEP 1: Upload + Distance + Bullet ───────────────────────────────────
  const renderStep1 = () => {
    const selectedBullet = BULLET_PRESETS.find(b => Math.abs(b.inVal - bulletDiaIn) < 0.001);

    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Upload buttons */}
        {!imageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Target Analysis</div>
              <div style={{ fontSize: 13, color: theme.textSecondary }}>Upload a target photo to analyze your shot placement</div>
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 20px', borderRadius: 14,
              background: theme.accent, color: '#000',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              📷 Take Photo
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 20px', borderRadius: 14,
              background: theme.surface, color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              🖼 Choose from Library
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <>
            {/* Image preview */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                <img src={imageUrl} alt="Target" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button onClick={() => setImageUrl(null)} style={{
                position: 'absolute', top: 6, right: 6, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', fontSize: 11, cursor: 'pointer',
              }}>Change</button>
            </div>

            {/* Distance */}
            <div>
              {sectionLabel('Distance')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {DIST_PRESETS.map(d => chip(`${d}yd`, distanceYds === d && !customDist, () => { setDistanceYds(d); setCustomDist(''); }))}
                <input
                  type="number" placeholder="Other yd" value={customDist}
                  onChange={e => { setCustomDist(e.target.value); if (e.target.value) setDistanceYds(Number(e.target.value)); }}
                  style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13, width: 88 }}
                />
              </div>
            </div>

            {/* Bullet diameter */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                {sectionLabel('Bullet Diameter')}
                {unitToggle(bulletUnit, setBulletUnit)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', marginBottom: 8 }}>
                {BULLET_PRESETS.map(b => {
                  const isSelected = Math.abs(b.inVal - bulletDiaIn) < 0.001 && !customBullet;
                  const displayLabel = bulletUnit === 'mm'
                    ? `${inToMm(b.inVal)}mm`
                    : b.label.split(' / ')[0];
                  return chip(displayLabel, isSelected, () => { setBulletDiaIn(b.inVal); setCustomBullet(''); });
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" step={bulletUnit === 'mm' ? '0.1' : '0.001'}
                  placeholder={bulletUnit === 'mm' ? 'mm' : 'inches'}
                  value={customBullet}
                  onChange={e => {
                    setCustomBullet(e.target.value);
                    if (e.target.value) setBulletDiaIn(bulletUnit === 'mm' ? mmToIn(Number(e.target.value)) : Number(e.target.value));
                  }}
                  style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13, width: 100 }}
                />
                {selectedBullet && !customBullet && (
                  <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'monospace' }}>
                    {bulletUnit === 'mm' ? `= ${selectedBullet.label.split(' / ')[0]}` : `= ${inToMm(bulletDiaIn)}mm`}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{ padding: '14px', borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    );
  };

  // ─── STEP 2: Reference Scale ──────────────────────────────────────────────
  const renderStep2 = () => {
    const refPresets = REF_PRESETS_IN.map(r => refUnit === 'mm' ? Math.round(r * 25.4) : r);

    const displayRefIn = refUnit === 'mm' ? `${Math.round(refIn * 25.4)}mm` : `${refIn}"`;

    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {imageUrl && (
          <div style={{ width: '100%', height: 90, borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <img src={imageUrl} alt="Target" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ background: theme.surfaceAlt, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
          In the next step, you'll tap two points on the photo that are exactly <strong style={{ color: theme.textPrimary }}>{displayRefIn}</strong> apart. Use a ruler edge, target grid line, or any known distance.
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            {sectionLabel('Reference Distance')}
            {unitToggle(refUnit, (u) => {
              setRefUnit(u);
              setCustomRef('');
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {REF_PRESETS_IN.map(r => {
              const displayVal = refUnit === 'mm' ? `${Math.round(r * 25.4)}mm` : `${r}"`;
              const isSelected = Math.abs(refIn - r) < 0.01 && !customRef;
              return chip(displayVal, isSelected, () => { setRefIn(r); setCustomRef(''); });
            })}
            <input
              type="number" step={refUnit === 'mm' ? '1' : '0.25'}
              placeholder={refUnit === 'mm' ? 'mm' : 'inches'}
              value={customRef}
              onChange={e => {
                setCustomRef(e.target.value);
                if (e.target.value) setRefIn(refUnit === 'mm' ? mmToIn(Number(e.target.value)) : Number(e.target.value));
              }}
              style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13, width: 90 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
          <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer' }}>
            ← Back
          </button>
          <button
            onClick={() => { setCalibPts([]); setPixelsPerInch(null); setMarks([]); setMarkMode('calib'); setScale(1); setOffset({ x: 0, y: 0 }); setStep(3); }}
            style={{ flex: 2, padding: 14, borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Mark Target →
          </button>
        </div>
      </div>
    );
  };

  // ─── STEP 3: Canvas Mark ──────────────────────────────────────────────────
  const renderStep3 = () => {
    let instruction = '';
    if (calibBannerMsg) {
      instruction = calibBannerMsg;
    } else if (markMode === 'calib') {
      instruction = calibPts.length === 0
        ? `Tap point A of the ${refIn}"  reference`
        : 'Tap point B — then drag either endpoint to fine-tune';
    } else if (markMode === 'poa') {
      instruction = 'Tap your Point of Aim (target center)';
    } else {
      const shotCount = marks.length - 1;
      instruction = `Tap each shot hole  •  ${shotCount} shot${shotCount !== 1 ? 's' : ''} marked  •  drag to reposition`;
    }

    const isCalibConfirm = !!calibBannerMsg;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{
          padding: '8px 12px',
          background: isCalibConfirm ? 'rgba(60,180,60,0.15)' : theme.surfaceAlt,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: isCalibConfirm ? '#4caf50' : theme.textPrimary, fontWeight: isCalibConfirm ? 700 : 500, flex: 1 }}>
            {instruction}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {scale > 1 && (
              <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} style={{ padding: '5px 9px', borderRadius: 7, background: theme.surface, color: theme.accent, border: `1px solid ${theme.accent}`, fontSize: 11, cursor: 'pointer' }}>
                Reset Zoom
              </button>
            )}
            {(markMode === 'poa' || markMode === 'shots') && (
              <button onClick={resetCalibration} style={{ padding: '5px 9px', borderRadius: 7, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 11, cursor: 'pointer' }}>
                Recal.
              </button>
            )}
            <button onClick={undoLast} style={{ padding: '5px 10px', borderRadius: 7, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 12, cursor: 'pointer' }}>
              Undo
            </button>
            {markMode === 'shots' && marks.length >= 2 && (
              <button onClick={goToResults} style={{ padding: '5px 12px', borderRadius: 7, background: theme.accent, color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Results →
              </button>
            )}
          </div>
        </div>

        {/* Canvas wrapper — touch-action:none isolates zoom to this element only */}
        <div
          style={{ flex: 1, overflow: 'hidden', background: '#0a0a0a', minHeight: 0, touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%', display: 'block', touchAction: 'none',
              transformOrigin: '0 0',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              willChange: 'transform',
              cursor: 'crosshair',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
        </div>

        <button onClick={() => setStep(2)} style={{ margin: 10, padding: 11, borderRadius: 10, flexShrink: 0, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>
          ← Back to Scale
        </button>
      </div>
    );
  };

  // ─── STEP 4: Results ──────────────────────────────────────────────────────
  const StatRow = ({ label, val, moa }: { label: string; val: string; moa: string }) => {
    const hasTooltip = label in TOOLTIPS || label === 'MOA';
    const isOpen = openTooltip === label;
    return (
      <div style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div
          onClick={() => hasTooltip ? setOpenTooltip(isOpen ? null : label) : undefined}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', cursor: hasTooltip ? 'pointer' : 'default' }}
        >
          <span style={{ fontSize: 14, color: hasTooltip ? theme.textPrimary : theme.textSecondary, userSelect: 'none' }}>
            {label}{hasTooltip && <span style={{ fontSize: 10, color: theme.accent, marginLeft: 4, opacity: 0.7 }}>?</span>}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{val}</span>
            <span
              style={{ fontSize: 12, color: theme.textMuted, fontFamily: 'monospace', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); setOpenTooltip(openTooltip === 'MOA' ? null : 'MOA'); }}
            >
              {moa}
            </span>
          </div>
        </div>
        {isOpen && (
          <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5, padding: '0 0 10px 0' }}>
            {TOOLTIPS[label]}
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (!stats) return null;
    const wDir = stats.windageIn >= 0 ? 'R ' : 'L ';
    const eDir = stats.elevationIn >= 0 ? 'U ' : 'D ';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {(['stats', 'overlay'] as const).map(tab => (
            <button key={tab} onClick={() => setResultTab(tab)} style={{
              flex: 1, padding: '10px', border: 'none', background: 'transparent',
              color: resultTab === tab ? theme.accent : theme.textMuted,
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
              textTransform: 'uppercase', cursor: 'pointer',
              borderBottom: resultTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}>
              {tab === 'stats' ? 'Stats' : 'Overlay'}
            </button>
          ))}
        </div>

        {resultTab === 'overlay' ? (
          // ── OVERLAY TAB ──
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'hidden', background: '#0a0a0a', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, padding: 12, flexShrink: 0 }}>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>
                ← Edit
              </button>
              <button onClick={exportOverlay} style={{ flex: 2, padding: 12, borderRadius: 10, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ⬇ Export
              </button>
            </div>
          </div>
        ) : (
          // ── STATS TAB ──
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>Results</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>{stats.shotCount} shots • {distanceYds}yd</div>
            </div>

            {savedMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(60,180,60,0.12)', border: '1px solid rgba(60,180,60,0.3)', color: '#4caf50', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                Saved to history ✓
              </div>
            )}

            {/* Offset */}
            <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
              <div style={{ padding: '10px 0 2px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Group Offset from POA
              </div>
              <StatRow label="Windage"   val={`${wDir}${Math.abs(stats.windageIn).toFixed(2)}"`}   moa={`${stats.windageMoa.toFixed(2)} MOA`} />
              <StatRow label="Elevation" val={`${eDir}${Math.abs(stats.elevationIn).toFixed(2)}"`} moa={`${stats.elevationMoa.toFixed(2)} MOA`} />
            </div>

            {/* Precision */}
            <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
              <div style={{ padding: '10px 0 2px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Precision
              </div>
              <StatRow label="CEP"            val={`${stats.cepIn.toFixed(2)}"`}            moa={`${stats.cepMoa.toFixed(2)} MOA`} />
              <StatRow label="Radial SD"      val={`${stats.radialSdIn.toFixed(2)}"`}       moa={`${stats.radialSdMoa.toFixed(2)} MOA`} />
              <StatRow label="Vertical SD"    val={`${stats.verticalSdIn.toFixed(2)}"`}     moa={`${stats.verticalSdMoa.toFixed(2)} MOA`} />
              <StatRow label="Horizontal SD"  val={`${stats.horizontalSdIn.toFixed(2)}"`}   moa={`${stats.horizontalSdMoa.toFixed(2)} MOA`} />
              <StatRow label="Extreme Spread" val={`${stats.extremeSpreadIn.toFixed(2)}"`}  moa={`${stats.extremeSpreadMoa.toFixed(2)} MOA`} />
              <StatRow label="Mean Radius"    val={`${stats.meanRadiusIn.toFixed(2)}"`}     moa={`${stats.meanRadiusMoa.toFixed(2)} MOA`} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 12, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>
                ← Edit
              </button>
              <button onClick={exportOverlay} style={{ flex: 2, padding: 13, borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ⬇ Export
              </button>
            </div>

            {/* AI Coach */}
            {!showCoach ? (
              <button onClick={openCoach} style={{
                padding: '13px', borderRadius: 12, border: `1px solid ${theme.accent}`,
                background: theme.accentDim, color: theme.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                🎯 Get Coaching
              </button>
            ) : (
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: theme.surfaceAlt, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>🎯 AI Coach</span>
                  <button onClick={() => setShowCoach(false)} style={{ padding: '3px 8px', borderRadius: 6, background: 'transparent', color: theme.textMuted, border: 'none', fontSize: 12, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {coachMessages.map((msg, i) => (
                    <div key={i} style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: msg.role === 'user' ? theme.accent : theme.surface,
                      color: msg.role === 'user' ? '#000' : theme.textPrimary,
                      fontSize: 13, lineHeight: 1.5,
                      border: msg.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
                    }}>
                      {msg.content}
                    </div>
                  ))}
                  {coachLoading && (
                    <div style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: 13 }}>
                      ...
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 10px', borderTop: `1px solid ${theme.border}` }}>
                  <input
                    type="text" placeholder="Ask a follow-up..."
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && coachInput.trim() && !coachLoading) callCoach(coachInput.trim()); }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13 }}
                  />
                  <button
                    onClick={() => coachInput.trim() && !coachLoading && callCoach(coachInput.trim())}
                    style={{ padding: '8px 14px', borderRadius: 8, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: coachLoading ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            <button onClick={resetAll} style={{ padding: 11, borderRadius: 12, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>
              + New Analysis
            </button>

            {/* History */}
            {history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map(record => {
                    const gun = record.gunId ? guns.find(g => g.id === record.gunId) : null;
                    const dateStr = new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <div key={record.id} style={{ background: theme.surface, borderRadius: 10, padding: '10px 12px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{record.distanceYds}yd</span>
                            <span style={{ fontSize: 12, color: theme.textMuted }}>•</span>
                            <span style={{ fontSize: 12, color: theme.textSecondary }}>{record.stats.shotCount} shots</span>
                            <span style={{ fontSize: 12, color: theme.textMuted }}>•</span>
                            <span style={{ fontSize: 12, color: theme.textSecondary, fontFamily: 'monospace' }}>CEP {record.stats.cepIn.toFixed(2)}"</span>
                            {gun && <><span style={{ fontSize: 12, color: theme.textMuted }}>•</span><span style={{ fontSize: 12, color: theme.accent }}>{gun.make} {gun.model}</span></>}
                          </div>
                          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>{dateStr}</div>
                        </div>
                        <button onClick={() => deleteHistoryEntry(record.id)} style={{ padding: '5px 8px', borderRadius: 7, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer', flexShrink: 0 }} title="Delete">
                          🗑
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Step progress indicator ──────────────────────────────────────────────
  const stepLabels = ['Setup', 'Scale', 'Mark', 'Results'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {step !== 3 && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 4, flexShrink: 0 }}>
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step;
            const active = s === step;
            const done = s < step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? theme.accent : active ? theme.accentDim : theme.surface,
                  border: active ? `2px solid ${theme.accent}` : done ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  fontSize: 10, fontWeight: 700,
                  color: done ? '#000' : active ? theme.accent : theme.textMuted,
                }}>
                  {done ? '✓' : s}
                </div>
                <span style={{ fontSize: 10, color: active ? theme.textPrimary : theme.textMuted, fontWeight: active ? 600 : 400 }}>
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
      <div style={{ flex: 1, overflowY: step === 3 || (step === 4 && resultTab === 'overlay') ? 'hidden' : 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
}
