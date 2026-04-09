import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { theme } from './theme';
import { getTargetAnalyses, saveTargetAnalysis, deleteTargetAnalysis, getAllGuns, getActiveAssignmentForGun, getOpticById, getAnalysesForGun } from './storage';
import { callTargetCoach, hasClaudeApiKey } from './claudeApi';
import type { TargetAnalysisRecord } from './types';
import { haptic } from './haptic';
import { getSettings } from './SettingsPanel';

type Step = 1 | 2 | 3 | 4;
type MarkMode = 'calib' | 'poa' | 'shots';

interface Pt { x: number; y: number; }

interface Stats {
  shotCount: number;
  windageIn: number; elevationIn: number;
  windageMoa: number; elevationMoa: number;
  cepIn: number; cepMoa: number;
  radialSdIn: number; radialSdMoa: number;
  verticalSdIn: number; verticalSdMoa: number;
  horizontalSdIn: number; horizontalSdMoa: number;
  extremeSpreadIn: number; extremeSpreadMoa: number;
  meanRadiusIn: number; meanRadiusMoa: number;
  overallWidthIn: number; overallWidthMoa: number;
  overallHeightIn: number; overallHeightMoa: number;
}

const BULLET_PRESETS: { label: string; sub: string; inVal: number }[] = [
  { label: '.17 / 4.4mm',   sub: '17 HMR, 17 WSM',                  inVal: 0.172 },
  { label: '.20 / 5.0mm',   sub: '204 Ruger',                        inVal: 0.204 },
  { label: '.22 / 5.56mm',  sub: '.22 LR, .223, 5.56 NATO',          inVal: 0.224 },
  { label: '.243 / 6mm',    sub: '6mm Creedmoor, 6mm GT, 243 Win',   inVal: 0.243 },
  { label: '.257 / 6.5mm',  sub: '6.5 Creedmoor, 6.5 PRC, 260 Rem', inVal: 0.264 },
  { label: '.277 / 7mm',    sub: '.270 Win, .277 Fury',               inVal: 0.277 },
  { label: '.284 / 7.2mm',  sub: '7mm Rem Mag, 7mm PRC',             inVal: 0.284 },
  { label: '.308 / 7.62mm', sub: '.308 Win, .30-06, 7.62x39',        inVal: 0.308 },
  { label: '.338 / 8.6mm',  sub: '.338 Lapua, .338 Win Mag',         inVal: 0.338 },
  { label: '.355 / 9mm',    sub: '9mm, .357 Mag, .357 SIG',          inVal: 0.355 },
  { label: '.375 / 9.5mm',  sub: '.375 H&H, .375 Ruger',             inVal: 0.375 },
  { label: '.400 / 10mm',   sub: '.40 S&W, 10mm Auto',               inVal: 0.400 },
  { label: '.452 / 11.5mm', sub: '.45 ACP, .45 Colt',                inVal: 0.452 },
  { label: '.50 / 12.7mm',  sub: '.50 BMG, .500 S&W',                inVal: 0.500 },
  { label: '.410 / 10.4mm', sub: '.410 Bore',                        inVal: 0.410 },
  { label: '20 Ga / 15.6mm',sub: '20 Gauge',                         inVal: 0.615 },
  { label: '12 Ga / 18.5mm',sub: '12 Gauge',                         inVal: 0.729 },
];

const DIST_PRESETS = [25, 50, 100, 200, 300];
const REF_PRESETS_IN = [0.5, 1, 2, 4, 6];

const TOOLTIPS: Record<string, string> = {
  'Windage':        'Average horizontal offset from your Point of Aim. R = right, L = left. Dial in your windage zero by this amount.',
  'Elevation':      'Average vertical offset from your Point of Aim. U = high, D = low. Adjust your elevation zero accordingly.',
  'CEP':            'Circular Error Probable — radius of the circle containing 50% of shots. Smaller = tighter, more predictable group.',
  'Radial SD':      'Standard Deviation of radial distances from POA. High values mean shots are scattered at varying distances from center.',
  'Vertical SD':    'Vertical consistency. High values often indicate inconsistent breathing, trigger control, or ammo velocity variation.',
  'Horizontal SD':  'Horizontal consistency. High values may indicate grip variation, trigger pull, or crosswind influence.',
  'Extreme Spread': 'Distance between the two farthest shots — worst-case group size.',
  'Mean Radius':    'Average distance of all shots from POA. Like CEP but uses mean instead of median — more sensitive to flyers.',
  'MOA':            'Minute of Angle — 1 MOA ≈ 1.047" at 100yd, ≈ 0.524" at 50yd, ≈ 2.094" at 200yd. Most scopes adjust in ¼ MOA clicks.',
};

function ptDist(a: Pt, b: Pt) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
}
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function toMoa(inches: number, yards: number) { return yards > 0 ? (inches / yards) * 95.5 : 0; }
function inToMm(inches: number) { return (inches * 25.4).toFixed(1); }
function mmToIn(mm: number) { return mm / 25.4; }
function caliberToBulletDia(caliber: string): number | null {
  const c = caliber.toLowerCase();
  if (c.includes('9mm') || c.includes('9x19') || c.includes('9 mm') || c.includes('.357') || c.includes('357 sig')) return 0.355;
  if (c.includes('.22') || c.includes('22 lr') || c.includes('22lr') || c.includes('5.56') || c.includes('223') || c.includes('.223')) return 0.224;
  if (c.includes('6.5') || c.includes('260 rem')) return 0.264;
  if (c.includes('6mm') || c.includes('.243') || c.includes('243')) return 0.243;
  if (c.includes('.308') || c.includes('308') || c.includes('7.62') || c.includes('30-06') || c.includes('.30-06') || c.includes('300 win') || c.includes('.300')) return 0.308;
  if (c.includes('.338') || c.includes('338')) return 0.338;
  if (c.includes('.45') || c.includes('45 acp') || c.includes('45acp') || c.includes('45 colt')) return 0.452;
  if (c.includes('.40') || c.includes('40 s&w') || c.includes('10mm')) return 0.400;
  if (c.includes('12 ga') || c.includes('12ga') || c.includes('12 gauge')) return 0.729;
  if (c.includes('20 ga') || c.includes('20ga') || c.includes('20 gauge')) return 0.615;
  if (c.includes('.50') || c.includes('50 bmg') || c.includes('.500')) return 0.500;
  if (c.includes('.375') || c.includes('375')) return 0.375;
  if (c.includes('.277') || c.includes('277') || c.includes('.270') || c.includes('270')) return 0.277;
  if (c.includes('7mm') || c.includes('.284') || c.includes('284')) return 0.284;
  if (c.includes('.17') || c.includes('17 hmr')) return 0.172;
  if (c.includes('.204') || c.includes('204 ruger')) return 0.204;
  if (c.includes('.410') || c.includes('410 bore')) return 0.410;
  return null;
}

// ── Stats panel drawn on canvas (overlay + export) ────────────────────────
function drawStatsPanel(ctx: CanvasRenderingContext2D, W: number, H: number, stats: Stats, distYds: number) {
  const panelW = Math.round(W * 0.33);
  const lineH = Math.round(panelW * 0.068);
  const fontSize = Math.round(lineH * 0.66);
  const smallFont = Math.round(fontSize * 0.78);
  const titleFont = Math.round(lineH * 0.72);

  const rows: [string, string, string][] = [
    ['CEP',       `${stats.cepIn.toFixed(2)}"`,                                                  `${stats.cepMoa.toFixed(2)} MOA`],
    ['ES',        `${stats.extremeSpreadIn.toFixed(2)}"`,                                        `${stats.extremeSpreadMoa.toFixed(2)} MOA`],
    ['Windage',   `${stats.windageIn >= 0 ? 'R' : 'L'} ${Math.abs(stats.windageIn).toFixed(2)}"`,  `${stats.windageMoa.toFixed(2)} MOA`],
    ['Elevation', `${stats.elevationIn >= 0 ? 'U' : 'D'} ${Math.abs(stats.elevationIn).toFixed(2)}"`, `${stats.elevationMoa.toFixed(2)} MOA`],
    ['Radial SD', `${stats.radialSdIn.toFixed(2)}"`,                                             `${stats.radialSdMoa.toFixed(2)} MOA`],
  ];

  // 3 header lines (title, separator, "Xyd • N shots") + rows + bottom padding
  const panelH = lineH * (3.2 + rows.length + 0.8);
  const margin = Math.round(W * 0.022);
  const px = W - panelW - margin;
  const py = margin;

  // Panel background
  ctx.fillStyle = 'rgba(0,0,0,0.84)';
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, Math.round(panelW * 0.04));
  ctx.fill();

  const padX = Math.round(panelW * 0.07);

  // "LINDCOTT ARMORY" in accent yellow
  ctx.fillStyle = '#ffd43b';
  ctx.font = `bold ${titleFont}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('LINDCOTT ARMORY', px + padX, py + lineH * 1.0);

  // Separator
  ctx.strokeStyle = 'rgba(255,212,59,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + padX, py + lineH * 1.38);
  ctx.lineTo(px + panelW - padX, py + lineH * 1.38);
  ctx.stroke();

  // Distance + shot count
  ctx.fillStyle = 'rgba(200,200,220,0.85)';
  ctx.font = `${smallFont}px sans-serif`;
  ctx.fillText(`${distYds}yd  •  ${stats.shotCount} shots`, px + padX, py + lineH * 2.15);

  // Stat rows
  rows.forEach(([label, val, moa], i) => {
    const rowY = py + lineH * (3.1 + i);
    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillStyle = 'rgba(155,155,175,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(label, px + padX, rowY);

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(val, px + Math.round(panelW * 0.66), rowY);

    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillStyle = 'rgba(155,155,175,0.85)';
    ctx.fillText(moa, px + panelW - padX, rowY);
  });
}

// ── Drum picker — slot-machine style bullet diameter selector ─────────────────
const ITEM_H = 52;
const VISIBLE_ROWS = 5;

function DrumPicker({ items, value, onChange }: {
  items: { label: string; sub: string; inVal: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isUserScrolling = useRef(false);

  const selectedIdx = useMemo(() => {
    const i = items.findIndex(b => Math.abs(b.inVal - value) < 0.002);
    return i < 0 ? 0 : i;
  }, [value, items]);

  // Scroll the selected item into center on external value change
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isUserScrolling.current) return;
    el.scrollTop = selectedIdx * ITEM_H;
  }, [selectedIdx]);

  const handleScroll = () => {
    isUserScrolling.current = true;
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      onChange(items[idx].inVal);
      el.scrollTop = idx * ITEM_H; // snap to exact position
      isUserScrolling.current = false;
    }, 120);
  };

  const containerH = ITEM_H * VISIBLE_ROWS;

  return (
    <div style={{ position: 'relative', height: containerH, borderRadius: 12, border: '1px solid ' + theme.border, overflow: 'hidden' }}>
      {/* Center selection highlight */}
      <div style={{ position: 'absolute', top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H, background: 'rgba(255,212,59,0.08)', borderTop: '1px solid rgba(255,212,59,0.3)', borderBottom: '1px solid rgba(255,212,59,0.3)', pointerEvents: 'none', zIndex: 2 }} />
      {/* Top/bottom fade masks */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(' + theme.surface + ', transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, ' + theme.surface + ')', pointerEvents: 'none', zIndex: 2 }} />
      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: containerH,
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          paddingTop: ITEM_H * 2,
          paddingBottom: ITEM_H * 2,
          boxSizing: 'content-box',
        } as React.CSSProperties}
      >
        {items.map((b) => {
          const isSelected = Math.abs(b.inVal - value) < 0.002;
          return (
            <div
              key={b.inVal}
              onClick={() => onChange(b.inVal)}
              style={{ height: ITEM_H, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', cursor: 'pointer' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? theme.accent : theme.textPrimary }}>{b.label}</div>
                {isSelected && <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Crop step — shown after photo selection, before Step 1 ───────────────────
function CropStep({ imageUrl, onCrop, onSkip }: {
  imageUrl: string;
  onCrop: (url: string) => void;
  onSkip: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState({ x1: 0.05, y1: 0.05, x2: 0.95, y2: 0.95 });
  const [imgBounds, setImgBounds] = useState<{ x: number; y: number; w: number; h: number; cW: number; cH: number } | null>(null);
  const dragRef = useRef<{ corner: string; startNx: number; startNy: number; startRect: typeof rect } | null>(null);

  // Compute and update image display bounds (accounts for objectFit: contain letterboxing)
  useEffect(() => {
    function update() {
      const img = imgRef.current;
      const el = containerRef.current;
      if (!img || !el || !img.naturalWidth) return;
      const cW = el.clientWidth, cH = el.clientHeight;
      const iW = img.naturalWidth, iH = img.naturalHeight;
      const scale = Math.min(cW / iW, cH / iH);
      const w = iW * scale, h = iH * scale;
      setImgBounds({ x: (cW - w) / 2, y: (cH - h) / 2, w, h, cW, cH });
    }
    const img = imgRef.current;
    if (img?.complete) { update(); } else { img?.addEventListener('load', update); }
    const ro = containerRef.current ? new ResizeObserver(update) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    return () => { img?.removeEventListener('load', update); ro?.disconnect(); };
  }, []);

  function toNorm(clientX: number, clientY: number) {
    const el = containerRef.current;
    const b = imgBounds;
    if (!el || !b) return null;
    const r = el.getBoundingClientRect();
    return {
      nx: Math.max(0, Math.min(1, (clientX - r.left - b.x) / b.w)),
      ny: Math.max(0, Math.min(1, (clientY - r.top - b.y) / b.h)),
    };
  }

  function startDrag(corner: string, e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const n = toNorm(e.clientX, e.clientY);
    if (!n) return;
    dragRef.current = { corner, startNx: n.nx, startNy: n.ny, startRect: { ...rect } };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const n = toNorm(e.clientX, e.clientY);
    if (!n) return;
    const dx = n.nx - d.startNx, dy = n.ny - d.startNy;
    const MIN = 0.08;
    setRect(() => {
      let { x1, y1, x2, y2 } = d.startRect;
      switch (d.corner) {
        case 'tl': x1 = Math.min(x2 - MIN, Math.max(0, x1 + dx)); y1 = Math.min(y2 - MIN, Math.max(0, y1 + dy)); break;
        case 'tr': x2 = Math.max(x1 + MIN, Math.min(1, x2 + dx)); y1 = Math.min(y2 - MIN, Math.max(0, y1 + dy)); break;
        case 'bl': x1 = Math.min(x2 - MIN, Math.max(0, x1 + dx)); y2 = Math.max(y1 + MIN, Math.min(1, y2 + dy)); break;
        case 'br': x2 = Math.max(x1 + MIN, Math.min(1, x2 + dx)); y2 = Math.max(y1 + MIN, Math.min(1, y2 + dy)); break;
        case 'move': {
          const w = x2 - x1, h = y2 - y1;
          x1 = Math.max(0, Math.min(1 - w, x1 + dx));
          y1 = Math.max(0, Math.min(1 - h, y1 + dy));
          x2 = x1 + w; y2 = y1 + h;
          break;
        }
      }
      return { x1, y1, x2, y2 };
    });
  }

  function applyCrop() {
    const img = imgRef.current;
    if (!img) return;
    const sx = Math.round(rect.x1 * img.naturalWidth);
    const sy = Math.round(rect.y1 * img.naturalHeight);
    const sw = Math.round((rect.x2 - rect.x1) * img.naturalWidth);
    const sh = Math.round((rect.y2 - rect.y1) * img.naturalHeight);
    if (sw < 10 || sh < 10) { onSkip(); return; }
    const canvas = document.createElement('canvas');
    canvas.width = sw; canvas.height = sh;
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    onCrop(canvas.toDataURL('image/jpeg', 0.93));
  }

  // Compute SVG overlay coords from image-normalized rect + imgBounds
  const b = imgBounds;
  const ov = b ? {
    px1: (b.x + rect.x1 * b.w) / b.cW,
    py1: (b.y + rect.y1 * b.h) / b.cH,
    px2: (b.x + rect.x2 * b.w) / b.cW,
    py2: (b.y + rect.y2 * b.h) / b.cH,
  } : null;
  const p = (v: number) => (v * 100).toFixed(2) + '%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: theme.surfaceAlt, borderBottom: '1px solid ' + theme.border, flexShrink: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.8px', color: theme.textMuted }}>CROP PHOTO</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onSkip} style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', color: theme.textSecondary, border: '1px solid ' + theme.border, fontFamily: 'monospace', fontSize: 11, cursor: 'pointer' }}>SKIP</button>
          <button onClick={applyCrop} style={{ padding: '7px 14px', borderRadius: 8, background: theme.accent, color: '#000', border: 'none', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>CROP</button>
        </div>
      </div>
      <div style={{ padding: '6px 16px', background: theme.surface, borderBottom: '1px solid ' + theme.border, fontFamily: 'monospace', fontSize: 10, color: theme.textMuted, letterSpacing: '0.4px', flexShrink: 0 }}>
        Drag corners to resize · drag inside to move · SKIP uses full photo
      </div>
      <div
        ref={containerRef}
        style={{ flex: 1, background: '#000', position: 'relative', overflow: 'hidden', touchAction: 'none' }}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerLeave={() => { dragRef.current = null; }}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Crop"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none', pointerEvents: 'none', draggable: false } as React.CSSProperties}
        />
        {ov && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <mask id="lcrop">
                <rect width="100%" height="100%" fill="white" />
                <rect x={p(ov.px1)} y={p(ov.py1)} width={p(ov.px2 - ov.px1)} height={p(ov.py2 - ov.py1)} fill="black" />
              </mask>
            </defs>
            {/* Dim outside */}
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#lcrop)" />
            {/* Selection border */}
            <rect x={p(ov.px1)} y={p(ov.py1)} width={p(ov.px2 - ov.px1)} height={p(ov.py2 - ov.py1)} fill="none" stroke="white" strokeWidth="1.5" />
            {/* Rule-of-thirds grid */}
            {[1/3, 2/3].map(t => {
              const lx = ov.px1 + (ov.px2 - ov.px1) * t;
              const ly = ov.py1 + (ov.py2 - ov.py1) * t;
              return (
                <g key={t} stroke="rgba(255,255,255,0.22)" strokeWidth="0.75">
                  <line x1={p(lx)} y1={p(ov.py1)} x2={p(lx)} y2={p(ov.py2)} />
                  <line x1={p(ov.px1)} y1={p(ly)} x2={p(ov.px2)} y2={p(ly)} />
                </g>
              );
            })}
            {/* Drag-to-move interior hit target */}
            <rect
              x={p(ov.px1)} y={p(ov.py1)} width={p(ov.px2 - ov.px1)} height={p(ov.py2 - ov.py1)}
              fill="transparent" style={{ cursor: 'move', touchAction: 'none' } as React.CSSProperties}
              onPointerDown={e => startDrag('move', e)}
            />
            {/* Corner handles */}
            {([
              { corner: 'tl', cx: ov.px1, cy: ov.py1 },
              { corner: 'tr', cx: ov.px2, cy: ov.py1 },
              { corner: 'bl', cx: ov.px1, cy: ov.py2 },
              { corner: 'br', cx: ov.px2, cy: ov.py2 },
            ] as const).map(({ corner, cx, cy }) => (
              <circle
                key={corner}
                cx={p(cx)} cy={p(cy)} r={16}
                fill={theme.accent} fillOpacity={0.92} stroke="white" strokeWidth={2.5}
                style={{ touchAction: 'none' } as React.CSSProperties}
                onPointerDown={e => startDrag(corner, e)}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

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
  const [marks, setMarks] = useState<Pt[]>([]);  // [0]=POA, [1..n]=shots
  const [markMode, setMarkMode] = useState<MarkMode>('calib');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customDist, setCustomDist] = useState('');
  const [customBullet, setCustomBullet] = useState('');
  const [customRef, setCustomRef] = useState('');

  // Crop state — shown once after photo selection, before step 1
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [calibBannerMsg, setCalibBannerMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const savedRef = useRef(false);

  // Long-press loupe refs (TA4)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isLongPressLoupeRef = useRef(false);

  const [history, setHistory] = useState<TargetAnalysisRecord[]>([]);
  const [guns, setGuns] = useState<ReturnType<typeof getAllGuns>>([]);

  const [resultTab, setResultTab] = useState<'stats' | 'overlay'>('stats');
  // Overlay snapshot with stats panel baked in — captured at "Results →" time
  const [overlayDataUrl, setOverlayDataUrl] = useState<string | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const [selectedGunId, setSelectedGunId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdjustZero, setShowAdjustZero] = useState(false);
  const [adjustZeroClickValue, setAdjustZeroClickValue] = useState('');
  const [showCoach, setShowCoach] = useState(false);
  const [coachTier, setCoachTier] = useState<1 | 2 | 3>(1);
  const [coachMessages, setCoachMessages] = useState<{ role: string; content: string }[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  // Loupe magnifier shown during drag
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupeScreenPos, setLoupeScreenPos] = useState<{ x: number; y: number } | null>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);
  // Ref so drawCanvas can read without being a dep — avoids infinite re-render
  const loupeCenterRef = useRef<Pt | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const touchStartRef = useRef<{ touches: { id: number; x: number; y: number }[]; scale: number; offset: { x: number; y: number }; canvasRectLeft?: number; canvasRectTop?: number } | null>(null);
  const touchMovedRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  type DragTarget = { type: 'calib' | 'poa' | 'shot'; index: number };
  const draggingRef = useRef<DragTarget | null>(null);
  const mouseDownPtRef = useRef<Pt | null>(null);
  const mouseMovedRef = useRef(false);

  // ── Coordinate mapping ────────────────────────────────────────────────────
  const toCanvas = (clientX: number, clientY: number): Pt => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // ── Find draggable item near a canvas point ───────────────────────────────
  const findDraggable = useCallback((pt: Pt): DragTarget | null => {
    const ppi = pixelsPerInch ?? 100;
    const dotR = Math.max(40, (bulletDiaIn / 2) * ppi);
    for (let i = 0; i < calibPts.length; i++) {
      if (ptDist(pt, calibPts[i]) < 40) return { type: 'calib', index: i };
    }
    if (marks.length > 0 && ptDist(pt, marks[0]) < dotR) return { type: 'poa', index: 0 };
    for (let i = 1; i < marks.length; i++) {
      if (ptDist(pt, marks[i]) < dotR) return { type: 'shot', index: i };
    }
    return null;
  }, [calibPts, marks, bulletDiaIn, pixelsPerInch]);

  const updateDragged = useCallback((pt: Pt) => {
    const d = draggingRef.current;
    if (!d) return;
    loupeCenterRef.current = pt; // keep loupe centered on dragged point
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
      setMarks(prev => { const next = [...prev]; next[d.index] = pt; return next; });
    }
  }, [refIn]);

  const clearLoupe = () => {
    loupeCenterRef.current = null;
    setShowLoupe(false);
    setLoupeScreenPos(null);
    const loupe = loupeRef.current;
    if (loupe) loupe.getContext('2d')!.clearRect(0, 0, loupe.width, loupe.height);
  };

  // Draw loupe content directly (called from touch-move without waiting for React re-render)
  const drawLoupeAt = useCallback((canvasPt: Pt) => {
    const canvas = canvasRef.current;
    const loupe = loupeRef.current;
    if (!canvas || !loupe) return;
    const lctx = loupe.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const displayRatio = rect.width > 0 ? canvas.width / rect.width : 1;
    const LOUPE_CSS = 150, LOUPE_ZOOM = 3;
    const srcPx = (LOUPE_CSS / LOUPE_ZOOM) * displayRatio;
    const srcX = Math.max(0, Math.min(canvas.width - srcPx, canvasPt.x - srcPx / 2));
    const srcY = Math.max(0, Math.min(canvas.height - srcPx, canvasPt.y - srcPx / 2));
    const LW = loupe.width, LH = loupe.height;
    lctx.clearRect(0, 0, LW, LH);
    lctx.drawImage(canvas, srcX, srcY, srcPx, srcPx, 0, 0, LW, LH);
    const cx = LW / 2, cy = LH / 2;
    lctx.strokeStyle = 'rgba(255,60,60,0.95)'; lctx.lineWidth = 1.5;
    lctx.beginPath();
    lctx.moveTo(cx, cy - 16); lctx.lineTo(cx, cy + 16);
    lctx.moveTo(cx - 16, cy); lctx.lineTo(cx + 16, cy);
    lctx.stroke();
    lctx.strokeStyle = 'rgba(255,60,60,0.6)';
    lctx.beginPath(); lctx.arc(cx, cy, 5, 0, Math.PI * 2); lctx.stroke();
  }, []);

  // ── Draw canvas (main + loupe) ────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Screen-pixel-aware sizing
    const rect = canvas.getBoundingClientRect();
    const displayRatio = rect.width > 0 ? canvas.width / rect.width : 1;
    const ppi = pixelsPerInch ?? 50;
    const bulletRadiusCanvas = (bulletDiaIn / 2) * ppi;
    const dotRadius = Math.max(10 * displayRatio, bulletRadiusCanvas);
    const calibR = Math.max(16, dotRadius * 0.75); // calib dots slightly smaller
    const lw = Math.max(2, displayRatio * 1.5);

    // ── Calibration endpoints + connecting line ───────────────────────────
    calibPts.forEach((pt, _i) => {
      // Circle — no border so it blends with the target
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, calibR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,50,50,0.82)';
      ctx.fill();

      // Semi-transparent red crosshair — visible but not distracting
      const arm = Math.max(6, calibR * 0.42);
      ctx.strokeStyle = 'rgba(255,50,50,0.35)';
      ctx.lineWidth = Math.max(1.5, displayRatio * 1.2);
      ctx.beginPath();
      ctx.moveTo(pt.x - arm, pt.y); ctx.lineTo(pt.x + arm, pt.y);
      ctx.moveTo(pt.x, pt.y - arm); ctx.lineTo(pt.x, pt.y + arm);
      ctx.stroke();
    });

    if (calibPts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(calibPts[0].x, calibPts[0].y);
      ctx.lineTo(calibPts[1].x, calibPts[1].y);
      ctx.strokeStyle = 'rgba(255,80,80,0.55)';
      ctx.lineWidth = lw;
      ctx.setLineDash([8 * displayRatio, 5 * displayRatio]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── POA — bullet-diameter circle + outer tick marks ───────────────────
    if (marks.length > 0) {
      const poa = marks[0];
      const r = dotRadius;
      ctx.beginPath();
      ctx.arc(poa.x, poa.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(3, displayRatio * 2);
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6 * displayRatio;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Center dot
      ctx.beginPath();
      ctx.arc(poa.x, poa.y, Math.max(4, r * 0.12), 0, Math.PI * 2);
      ctx.fillStyle = 'white'; ctx.fill();
      // Inner tick marks (stay within circle)
      const tick = r * 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(2, displayRatio * 1.5);
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(poa.x + dx * r, poa.y + dy * r);
        ctx.lineTo(poa.x + dx * (r - tick), poa.y + dy * (r - tick));
        ctx.stroke();
      });
    }

    // ── CEP ring (centered on shot group mean) ────────────────────────────
    if (marks.length >= 2 && pixelsPerInch) {
      const poa = marks[0];
      const shots = marks.slice(1);
      const meanX = shots.reduce((a, s) => a + s.x, 0) / shots.length;
      const meanY = shots.reduce((a, s) => a + s.y, 0) / shots.length;
      const radials = shots.map(s => Math.sqrt(((s.x - poa.x) / pixelsPerInch) ** 2 + ((s.y - poa.y) / pixelsPerInch) ** 2));
      const cepPx = median(radials) * pixelsPerInch;
      ctx.beginPath();
      ctx.arc(meanX, meanY, cepPx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,212,59,0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,212,59,0.4)';
      ctx.lineWidth = Math.max(1, displayRatio);
      ctx.stroke();
    }

    // ── Center crosshair (geometric center of canvas / target) ────────────
    {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const armLen = canvas.width * 0.09;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = Math.max(1.5, displayRatio);
      ctx.beginPath();
      ctx.moveTo(cx - armLen, cy); ctx.lineTo(cx + armLen, cy);
      ctx.moveTo(cx, cy - armLen); ctx.lineTo(cx, cy + armLen);
      ctx.stroke();
    }

    // ── Shot dots ─────────────────────────────────────────────────────────
    for (let i = 1; i < marks.length; i++) {
      const shot = marks[i];
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,212,59,0.88)'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = lw; ctx.stroke();
      const fontSize = Math.max(12, dotRadius * 0.8);
      ctx.fillStyle = '#000';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i), shot.x, shot.y);
    }

    // ── Loupe magnifier (drawn from main canvas after it's fully rendered) ──
    const loupePt = loupeCenterRef.current;
    const loupe = loupeRef.current;
    if (loupePt && loupe) {
      const lctx = loupe.getContext('2d')!;
      const LW = loupe.width; const LH = loupe.height;
      // Sample a region that represents LOUPE_CSS screen-pixels at 3× magnification
      const LOUPE_CSS = 150; const LOUPE_ZOOM = 3;
      const srcPx = (LOUPE_CSS / LOUPE_ZOOM) * displayRatio; // canvas pixels to sample
      const srcX = Math.max(0, Math.min(canvas.width  - srcPx, loupePt.x - srcPx / 2));
      const srcY = Math.max(0, Math.min(canvas.height - srcPx, loupePt.y - srcPx / 2));

      lctx.clearRect(0, 0, LW, LH);
      lctx.drawImage(canvas, srcX, srcY, srcPx, srcPx, 0, 0, LW, LH);

      // Red center crosshair
      const cx = LW / 2; const cy = LH / 2;
      lctx.strokeStyle = 'rgba(255,60,60,0.95)';
      lctx.lineWidth = 1.5;
      lctx.beginPath();
      lctx.moveTo(cx, cy - 16); lctx.lineTo(cx, cy + 16);
      lctx.moveTo(cx - 16, cy); lctx.lineTo(cx + 16, cy);
      lctx.stroke();
      // Small center circle
      lctx.strokeStyle = 'rgba(255,60,60,0.6)';
      lctx.beginPath(); lctx.arc(cx, cy, 5, 0, Math.PI * 2); lctx.stroke();
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

  // ── Upload — routes through crop step first ───────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRawImageUrl(url);
    setShowCrop(true);
  };

  // ── Canvas tap ────────────────────────────────────────────────────────────
  const handleCanvasTap = useCallback((x: number, y: number) => {
    haptic();
    if (markMode === 'calib') {
      const newPts = [...calibPts, { x, y }];
      setCalibPts(newPts);
      if (newPts.length === 2) {
        const dx = newPts[1].x - newPts[0].x; const dy = newPts[1].y - newPts[0].y;
        const ppi = Math.sqrt(dx * dx + dy * dy) / refIn;
        setPixelsPerInch(ppi);
        setMarkMode('poa');
        setCalibBannerMsg(`✓ Scale set — ${ppi.toFixed(0)} px/in`);
        setTimeout(() => setCalibBannerMsg(null), 2000);
      }
    } else if (markMode === 'poa') {
      setMarks([{ x, y }]); setMarkMode('shots');
    } else {
      setMarks(prev => [...prev, { x, y }]);
    }
  }, [markMode, calibPts, refIn]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    lastTouchTimeRef.current = Date.now();
    clearTimeout(longPressTimerRef.current);
    isLongPressLoupeRef.current = false;
    if (e.touches.length === 2) {
      e.preventDefault();
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const cRect = canvasRef.current?.getBoundingClientRect();
      touchStartRef.current = {
        touches: [{ id: t0.identifier, x: t0.clientX, y: t0.clientY }, { id: t1.identifier, x: t1.clientX, y: t1.clientY }],
        scale, offset,
        canvasRectLeft: cRect?.left ?? 0,
        canvasRectTop: cRect?.top ?? 0,
      };
      touchMovedRef.current = false;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { touches: [{ id: t.identifier, x: t.clientX, y: t.clientY }], scale, offset };
      touchMovedRef.current = false;
      draggingRef.current = null; // drag only activates via long-press
      const pt = toCanvas(t.clientX, t.clientY);
      const potentialDraggable = findDraggable(pt);
      const clientX = t.clientX, clientY = t.clientY;
      // Long-press: drag existing mark OR precision placement loupe
      longPressTimerRef.current = setTimeout(() => {
        if (touchMovedRef.current) return;
        const canvasPt = toCanvas(clientX, clientY);
        loupeCenterRef.current = canvasPt;
        setLoupeScreenPos({ x: clientX, y: clientY });
        setShowLoupe(true);
        drawLoupeAt(canvasPt);
        haptic();
        if (potentialDraggable) {
          draggingRef.current = potentialDraggable; // drag mode
        } else {
          isLongPressLoupeRef.current = true; // precision placement mode
        }
      }, 420);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current?.touches.length === 2) {
      e.preventDefault();
      const start = touchStartRef.current;
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const startDist = Math.hypot(start.touches[1].x - start.touches[0].x, start.touches[1].y - start.touches[0].y);
      const curDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const newScale = Math.min(5, Math.max(1, start.scale * (startDist > 0 ? curDist / startDist : 1)));
      const sMidX = (start.touches[0].x + start.touches[1].x) / 2;
      const sMidY = (start.touches[0].y + start.touches[1].y) / 2;
      const cMidX = (t0.clientX + t1.clientX) / 2;
      const cMidY = (t0.clientY + t1.clientY) / 2;
      // Zoom anchored to the finger midpoint: the canvas pixel under the midpoint stays fixed
      const scaleRatio = newScale / start.scale;
      const anchorX = sMidX - (start.canvasRectLeft ?? 0);
      const anchorY = sMidY - (start.canvasRectTop ?? 0);
      setScale(newScale);
      setOffset({
        x: start.offset.x + (cMidX - sMidX) - anchorX * (scaleRatio - 1),
        y: start.offset.y + (cMidY - sMidY) - anchorY * (scaleRatio - 1),
      });
      touchMovedRef.current = true;
    } else if (e.touches.length === 1 && touchStartRef.current?.touches.length === 1) {
      const t = e.touches[0];
      if (draggingRef.current) {
        updateDragged(toCanvas(t.clientX, t.clientY));
        setLoupeScreenPos({ x: t.clientX, y: t.clientY });
        touchMovedRef.current = true;
      } else if (isLongPressLoupeRef.current) {
        // Slide finger to fine-tune placement — loupe follows without dropping yet
        const pt = toCanvas(t.clientX, t.clientY);
        loupeCenterRef.current = pt;
        setLoupeScreenPos({ x: t.clientX, y: t.clientY });
        drawLoupeAt(pt);
      } else {
        const start = touchStartRef.current.touches[0];
        const moved = Math.abs(t.clientX - start.x) > 8 || Math.abs(t.clientY - start.y) > 8;
        if (moved) {
          clearTimeout(longPressTimerRef.current); // cancel long-press if panning
          touchMovedRef.current = true;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    clearTimeout(longPressTimerRef.current);
    if (draggingRef.current) {
      // Drag released — mark is already at new position
      draggingRef.current = null;
      touchStartRef.current = null;
      touchMovedRef.current = false;
      clearLoupe();
      return;
    }
    const touch = e.changedTouches[0];
    if (isLongPressLoupeRef.current) {
      // Precision loupe placement — mark goes exactly at finger position
      const pt = toCanvas(touch.clientX, touch.clientY);
      handleCanvasTap(pt.x, pt.y);
      isLongPressLoupeRef.current = false;
      clearLoupe();
      touchStartRef.current = null;
      touchMovedRef.current = false;
      return;
    }
    if (e.changedTouches.length === 1 && touchStartRef.current?.touches.length === 1 && !touchMovedRef.current) {
      // Quick tap — place mark at exact touch position (no upward offset)
      const pt = toCanvas(touch.clientX, touch.clientY);
      handleCanvasTap(pt.x, pt.y);
    }
    touchStartRef.current = null;
    touchMovedRef.current = false;
  };

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    const pt = toCanvas(e.clientX, e.clientY);
    mouseDownPtRef.current = pt;
    mouseMovedRef.current = false;
    const draggable = findDraggable(pt);
    draggingRef.current = draggable;
    if (draggable) { loupeCenterRef.current = pt; setShowLoupe(true); }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDownPtRef.current) return;
    const pt = toCanvas(e.clientX, e.clientY);
    const start = mouseDownPtRef.current;
    if (Math.abs(pt.x - start.x) > 4 || Math.abs(pt.y - start.y) > 4) mouseMovedRef.current = true;
    if (draggingRef.current && mouseMovedRef.current) {
      updateDragged(pt);
      setLoupeScreenPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    const wasDraggingAndMoved = draggingRef.current && mouseMovedRef.current;
    draggingRef.current = null;
    mouseDownPtRef.current = null;
    clearLoupe();
    if (!wasDraggingAndMoved) handleCanvasTap(toCanvas(e.clientX, e.clientY).x, toCanvas(e.clientX, e.clientY).y);
    mouseMovedRef.current = false;
  };

  // ── Undo / reset ──────────────────────────────────────────────────────────
  const undoLast = () => {
    if (markMode === 'shots' && marks.length > 1) setMarks(prev => prev.slice(0, -1));
    else if (markMode === 'shots' && marks.length === 1) { setMarks([]); setMarkMode('poa'); }
    else if (markMode === 'poa') { setCalibPts([]); setPixelsPerInch(null); setMarkMode('calib'); }
    else if (markMode === 'calib' && calibPts.length > 0) setCalibPts(prev => prev.slice(0, -1));
  };
  const resetCalibration = () => { setCalibPts([]); setPixelsPerInch(null); setMarks([]); setMarkMode('calib'); };

  // ── Compute stats ─────────────────────────────────────────────────────────
  const computeStats = (): Stats | null => {
    const ppi = pixelsPerInch;
    if (!ppi || marks.length < 2) return null;
    const poa = marks[0]; const shots = marks.slice(1);
    const windages = shots.map(s => (s.x - poa.x) / ppi);
    const elevations = shots.map(s => -(s.y - poa.y) / ppi);
    const radials = shots.map((_, i) => Math.sqrt(windages[i] ** 2 + elevations[i] ** 2));
    const windageIn = windages.reduce((a, b) => a + b, 0) / shots.length;
    const elevationIn = elevations.reduce((a, b) => a + b, 0) / shots.length;
    const cepIn = median(radials);
    const meanRadiusIn = radials.reduce((a, b) => a + b, 0) / radials.length;
    let extremeSpreadIn = 0;
    for (let i = 0; i < shots.length; i++)
      for (let j = i + 1; j < shots.length; j++) {
        const dx = (shots[i].x - shots[j].x) / ppi; const dy = (shots[i].y - shots[j].y) / ppi;
        extremeSpreadIn = Math.max(extremeSpreadIn, Math.sqrt(dx * dx + dy * dy));
      }
    const overallWidthIn = shots.length > 1 ? (Math.max(...windages) - Math.min(...windages)) : 0;
    const overallHeightIn = shots.length > 1 ? (Math.max(...elevations) - Math.min(...elevations)) : 0;
    return {
      shotCount: shots.length, windageIn, elevationIn,
      windageMoa: toMoa(Math.abs(windageIn), distanceYds), elevationMoa: toMoa(Math.abs(elevationIn), distanceYds),
      cepIn, cepMoa: toMoa(cepIn, distanceYds),
      radialSdIn: stddev(radials), radialSdMoa: toMoa(stddev(radials), distanceYds),
      verticalSdIn: stddev(elevations), verticalSdMoa: toMoa(stddev(elevations), distanceYds),
      horizontalSdIn: stddev(windages), horizontalSdMoa: toMoa(stddev(windages), distanceYds),
      extremeSpreadIn, extremeSpreadMoa: toMoa(extremeSpreadIn, distanceYds),
      meanRadiusIn, meanRadiusMoa: toMoa(meanRadiusIn, distanceYds),
      overallWidthIn, overallWidthMoa: toMoa(overallWidthIn, distanceYds),
      overallHeightIn, overallHeightMoa: toMoa(overallHeightIn, distanceYds),
    };
  };

  // ── Go to results — captures overlay with stats panel baked in ────────────
  const goToResults = () => {
    haptic();
    const s = computeStats();
    setStats(s);

    const canvas = canvasRef.current;
    if (canvas && s) {
      const off = document.createElement('canvas');
      off.width = canvas.width; off.height = canvas.height;
      const ctx = off.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);
      drawStatsPanel(ctx, off.width, off.height, s, distanceYds);
      setOverlayDataUrl(off.toDataURL('image/png'));
    }

    setStep(4); setResultTab('stats');
  };

  useEffect(() => {
    if (step === 4 && stats && !savedRef.current) {
      savedRef.current = true;
      saveTargetAnalysis({ distanceYds, bulletDiaIn, stats, sessionId: undefined, gunId: selectedGunId ?? undefined, ammoLotId: undefined });
      setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500);
      setHistory(getTargetAnalyses()); setGuns(getAllGuns());
    }
  }, [step, stats, distanceYds, bulletDiaIn]);
  useEffect(() => { if (step === 4) { setHistory(getTargetAnalyses()); setGuns(getAllGuns()); } }, [step]);

  // ── Export — share / download the pre-rendered overlay ───────────────────
  const exportOverlay = async () => {
    haptic();
    if (!overlayDataUrl || !stats) return;
    const filename = `lindcott-${distanceYds}yd-${stats.shotCount}shots.png`;
    const res = await fetch(overlayDataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: 'image/png' });
    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Lindcott Armory — Target Analysis' }); return; } catch { /* fall through */ }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename; link.href = url;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    savedRef.current = false;
    setStep(1); setImageUrl(null); setRawImageUrl(null); setShowCrop(false);
    setCalibPts([]); setPixelsPerInch(null);
    setMarks([]); setMarkMode('calib'); setStats(null); setScale(1);
    setOffset({ x: 0, y: 0 }); setCalibBannerMsg(null); setSavedMsg(false);
    setOverlayDataUrl(null); setCoachMessages([]); setShowCoach(false);
    clearLoupe();
  };
  const deleteHistoryEntry = (id: string) => { deleteTargetAnalysis(id); setHistory(getTargetAnalyses()); };

  // ── AI Coach ──────────────────────────────────────────────────────────────
  const statsContext = stats ? [
    `Distance: ${distanceYds} yards | Shots: ${stats.shotCount}`,
    `Windage: ${stats.windageIn >= 0 ? 'Right' : 'Left'} ${Math.abs(stats.windageIn).toFixed(2)}" (${stats.windageMoa.toFixed(2)} MOA)`,
    `Elevation: ${stats.elevationIn >= 0 ? 'Up' : 'Down'} ${Math.abs(stats.elevationIn).toFixed(2)}" (${stats.elevationMoa.toFixed(2)} MOA)`,
    `CEP: ${stats.cepIn.toFixed(2)}" (${stats.cepMoa.toFixed(2)} MOA) | ES: ${stats.extremeSpreadIn.toFixed(2)}" (${stats.extremeSpreadMoa.toFixed(2)} MOA)`,
    `Radial SD: ${stats.radialSdIn.toFixed(2)}" | Vert SD: ${stats.verticalSdIn.toFixed(2)}" | Horiz SD: ${stats.horizontalSdIn.toFixed(2)}"`,
  ].join('\n') : '';

  const callCoach = async (userMsg: string) => {
    if (!hasClaudeApiKey()) {
      setCoachMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '⚠️ No API key set. Open Dev Tools (tap version 7×) and paste your Anthropic API key.' }]);
      return;
    }
    const newMessages = [...coachMessages, { role: 'user', content: userMsg }];
    setCoachMessages(newMessages); setCoachInput(''); setCoachLoading(true);
    try {
      const reply = await callTargetCoach(statsContext, newMessages);
      setCoachMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setCoachMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally { setCoachLoading(false); }
  };
  const openCoachTier = (tier: 1 | 2 | 3) => {
    setCoachTier(tier);
    setShowCoach(true);
    setCoachMessages([]);
    let prompt = '';
    if (tier === 1) {
      prompt = 'Analyze my shot group and give me 2-3 specific, actionable coaching tips.';
    } else if (tier === 2) {
      const todayStr = new Date().toDateString();
      const todayRecords = history.filter(r => new Date(r.createdAt).toDateString() === todayStr);
      if (todayRecords.length <= 1) {
        prompt = 'I only have one target from this session. Analyze my shot group and give me 2-3 specific coaching tips.';
      } else {
        const sessionCtx = todayRecords.map(r =>
          r.distanceYds + 'yd: ' + r.stats.shotCount + ' shots, CEP ' + r.stats.cepIn.toFixed(2) + '", ES ' + r.stats.extremeSpreadIn.toFixed(2) + '"'
        ).join('\n');
        prompt = 'Compare these targets from my current session and identify patterns:\n' + sessionCtx + '\n\nHow am I improving or degrading through the session? What should I focus on?';
      }
    } else {
      const allCtx = history.slice(0, 20).map(r => {
        const d = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return d + ' @ ' + r.distanceYds + 'yd: ' + r.stats.shotCount + ' shots, CEP ' + r.stats.cepIn.toFixed(2) + '", ES ' + r.stats.extremeSpreadIn.toFixed(2) + '"';
      }).join('\n');
      prompt = 'Looking at my shooting history across multiple sessions:\n' + allCtx + '\n\nWhat trends do you see? Am I improving overall? What long-term patterns should I address?';
    }
    callCoach(prompt);
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const chip = (label: string, selected: boolean, onSelect: () => void) => (
    <button key={label} onClick={onSelect} style={{
      padding: '7px 13px', borderRadius: 20,
      border: selected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
      background: selected ? theme.accentDim : theme.surface,
      color: selected ? theme.accent : theme.textSecondary,
      fontWeight: selected ? 700 : 400, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
  const unitToggle = (unit: 'in' | 'mm', setUnit: (u: 'in' | 'mm') => void) => (
    <div style={{ display: 'flex', border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
      {(['in', 'mm'] as const).map(u => (
        <button key={u} onClick={() => setUnit(u)} style={{ padding: '5px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px', background: unit === u ? theme.accent : 'transparent', color: unit === u ? '#000' : theme.textMuted }}>{u.toUpperCase()}</button>
      ))}
    </div>
  );
  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{text}</div>
  );

  // ── STEP 1: Upload + Distance + Bullet ────────────────────────────────────
  const renderStep1 = () => {
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {!imageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Target Analysis</div>
              <div style={{ fontSize: 13, color: theme.textSecondary }}>Upload a target photo to analyze your shot placement</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 20px', borderRadius: 14, background: theme.accent, color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              📷 Take Photo <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 20px', borderRadius: 14, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              🖼 Choose from Library <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.border}`, background: '#000', maxHeight: 200 }}>
                <img src={imageUrl} alt="Target" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
              </div>
              <button onClick={() => setImageUrl(null)} style={{ position: 'absolute', top: 6, right: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', fontSize: 11, cursor: 'pointer' }}>Change</button>
            </div>

            <div>
              {sectionLabel('Gun (optional)')}
              <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 4, scrollbarWidth: 'none' }}>
                {guns.filter(g => g.status === 'Active').map(g => {
                  const isSelected = selectedGunId === g.id;
                  return (
                    <button key={g.id} onClick={() => {
                      if (isSelected) { setSelectedGunId(null); }
                      else {
                        setSelectedGunId(g.id);
                        const dia = caliberToBulletDia(g.caliber);
                        if (dia) { setBulletDiaIn(dia); setCustomBullet(''); }
                      }
                    }} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: `1px solid ${isSelected ? theme.accent : theme.border}`, background: isSelected ? theme.accent : theme.surface, color: isSelected ? '#000' : theme.textPrimary, fontSize: 13, fontWeight: isSelected ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {g.displayName || `${g.make} ${g.model}`}
                    </button>
                  );
                })}
                {guns.filter(g => g.status === 'Active').length === 0 && (
                  <span style={{ fontSize: 12, color: theme.textMuted }}>No active guns in vault</span>
                )}
              </div>
            </div>

            <div>
              {sectionLabel('Distance')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {DIST_PRESETS.map(d => chip(`${d}yd`, distanceYds === d && !customDist, () => { setDistanceYds(d); setCustomDist(''); }))}
                <input type="number" placeholder="Other yd" value={customDist} onChange={e => { setCustomDist(e.target.value); if (e.target.value) setDistanceYds(Number(e.target.value)); }} style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13, width: 88 }} />
              </div>
            </div>

            <div>
              {sectionLabel('Bullet Diameter')}
              <DrumPicker
                items={BULLET_PRESETS}
                value={bulletDiaIn}
                onChange={(v) => { setBulletDiaIn(v); setCustomBullet(''); }}
              />
            </div>
            <button onClick={() => setStep(2)} style={{ padding: 14, borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Continue →</button>
          </>
        )}
      </div>
    );
  };

  // ── STEP 2: Reference Scale ───────────────────────────────────────────────
  const renderStep2 = () => {
    const isMetric = getSettings().units === 'metric';
    const displayRefIn = isMetric ? `${Math.round(refIn * 25.4)}mm` : `${refIn}"`;
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {imageUrl && (
          <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.border}`, background: '#000', maxHeight: 160 }}>
            <img src={imageUrl} alt="Target" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }} />
          </div>
        )}
        <div style={{ background: theme.surfaceAlt, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
          Next, tap two points on the photo that are exactly <strong style={{ color: theme.textPrimary }}>{displayRefIn}</strong> apart, then drag to fine-tune. Use a ruler, target grid line, or any known distance.
        </div>
        <div>
          {sectionLabel('Reference Distance')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {REF_PRESETS_IN.map(r => {
              const label = isMetric ? `${Math.round(r * 25.4)}mm` : `${r}"`;
              return chip(label, Math.abs(refIn - r) < 0.01 && !customRef, () => { setRefIn(r); setCustomRef(''); });
            })}
            <input type="number" step={isMetric ? '1' : '0.25'} placeholder={isMetric ? 'mm' : 'inches'} value={customRef} onChange={e => { setCustomRef(e.target.value); if (e.target.value) setRefIn(isMetric ? Number(e.target.value) / 25.4 : Number(e.target.value)); }} style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13, width: 90 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
          <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer' }}>← Back</button>
          <button onClick={() => { setCalibPts([]); setPixelsPerInch(null); setMarks([]); setMarkMode('calib'); setScale(1); setOffset({ x: 0, y: 0 }); setStep(3); }} style={{ flex: 2, padding: 14, borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Mark Target →</button>
        </div>
      </div>
    );
  };

  // ── STEP 3: Canvas mark ───────────────────────────────────────────────────
  const renderStep3 = () => {
    let instruction = '';
    if (calibBannerMsg) instruction = calibBannerMsg;
    else if (markMode === 'calib') instruction = calibPts.length === 0 ? `Tap point A on your ${refIn}" reference` : 'Tap point B — drag A or B to fine-tune';
    else if (markMode === 'poa') instruction = 'Tap your Point of Aim (center of target)';
    else { const n = marks.length - 1; instruction = `Tap each shot hole  •  ${n} shot${n !== 1 ? 's' : ''}  •  drag to reposition`; }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ padding: '8px 12px', background: calibBannerMsg ? 'rgba(60,180,60,0.15)' : theme.surfaceAlt, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: calibBannerMsg ? '#4caf50' : theme.textPrimary, fontWeight: calibBannerMsg ? 700 : 500, flex: 1 }}>{instruction}</span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {scale > 1 && <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} style={{ padding: '5px 9px', borderRadius: 7, background: theme.surface, color: theme.accent, border: `1px solid ${theme.accent}`, fontSize: 11, cursor: 'pointer' }}>Reset Zoom</button>}
            {(markMode === 'poa' || markMode === 'shots') && <button onClick={resetCalibration} style={{ padding: '5px 9px', borderRadius: 7, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 11, cursor: 'pointer' }}>Recal.</button>}
            <button onClick={undoLast} style={{ padding: '5px 10px', borderRadius: 7, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 12, cursor: 'pointer' }}>Undo</button>
            {markMode === 'shots' && marks.length >= 2 && <button onClick={goToResults} style={{ padding: '5px 12px', borderRadius: 7, background: theme.accent, color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Results →</button>}
          </div>
        </div>

        {/* Canvas wrapper — position:relative so loupe can be absolutely positioned */}
        <div
          style={{ flex: 1, overflow: 'hidden', background: '#0a0a0a', minHeight: 0, touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block', touchAction: 'none', transformOrigin: '0 0', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, willChange: 'transform', cursor: 'crosshair' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
          {/* Loupe magnifier — follows finger, offset 90px above touch point */}
          {showLoupe && (
            <canvas
              ref={loupeRef}
              width={300}
              height={300}
              style={{
                position: 'fixed',
                left: loupeScreenPos ? Math.max(4, Math.min(window.innerWidth - 154, loupeScreenPos.x - 75)) : 'auto',
                top: loupeScreenPos ? Math.max(4, loupeScreenPos.y - 90 - 150) : 12,
                right: loupeScreenPos ? 'auto' : 12,
                width: 150, height: 150, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.65)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.75)',
                pointerEvents: 'none', background: '#000',
                zIndex: 9999,
              }}
            />
          )}
        </div>

        {/* Shot sequence timeline strip */}
        {markMode === 'shots' && marks.length >= 3 && (() => {
          const shots = marks.slice(1);
          const meanX = shots.reduce((a, s) => a + s.x, 0) / shots.length;
          const meanY = shots.reduce((a, s) => a + s.y, 0) / shots.length;
          const radials = shots.map(s => Math.sqrt((s.x - meanX) ** 2 + (s.y - meanY) ** 2));
          const meanR = radials.reduce((a, b) => a + b, 0) / radials.length;
          const sdR = Math.sqrt(radials.map(r => (r - meanR) ** 2).reduce((a, b) => a + b, 0) / radials.length);
          return (
            <div style={{ flexShrink: 0, borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
              <div style={{ padding: '4px 12px 2px', fontSize: 9, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Shot Sequence</div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '4px 12px 8px', scrollbarWidth: 'none' }}>
                {shots.map((_, i) => {
                  const r = radials[i];
                  const color = r <= sdR ? '#4caf50' : r <= 2 * sdR ? '#ffd43b' : '#ff5252';
                  return (
                    <div key={i} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: r <= sdR ? '#fff' : '#000' }}>
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <button onClick={() => setStep(2)} style={{ margin: 10, padding: 11, borderRadius: 10, flexShrink: 0, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>
          ← Back to Scale
        </button>
      </div>
    );
  };

  // ── STEP 4: Results ───────────────────────────────────────────────────────
  const StatRow = ({ label, val, moa, primary }: { label: string; val: string; moa: string; primary?: boolean }) => {
    const hasTooltip = label in TOOLTIPS;
    const isOpen = openTooltip === label;
    return (
      <div style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div onClick={() => hasTooltip ? setOpenTooltip(isOpen ? null : label) : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', cursor: hasTooltip ? 'pointer' : 'default' }}>
          <span style={{ fontSize: 14, color: theme.textSecondary, userSelect: 'none', flexShrink: 1 }}>{label}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: primary ? '#ffd43b' : theme.textPrimary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{val}</span>
            <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'monospace', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={e => { e.stopPropagation(); setOpenTooltip(openTooltip === 'MOA' ? null : 'MOA'); }}>{moa}</span>
          </div>
        </div>
        {isOpen && <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5, paddingBottom: 10 }}>{TOOLTIPS[label]}</div>}
      </div>
    );
  };

  const renderStep4 = () => {
    if (!stats) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {(['stats', 'overlay'] as const).map(tab => (
            <button key={tab} onClick={() => setResultTab(tab)} style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent', color: resultTab === tab ? theme.accent : theme.textMuted, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: resultTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent' }}>
              {tab === 'stats' ? 'Stats' : 'Overlay'}
            </button>
          ))}
        </div>

        {resultTab === 'overlay' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'hidden', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {overlayDataUrl
                ? <img src={overlayDataUrl} alt="Annotated target" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                : <span style={{ color: theme.textMuted, fontSize: 13 }}>No overlay captured</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: 12, flexShrink: 0 }}>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>← Edit</button>
              <button onClick={exportOverlay} style={{ flex: 2, padding: 12, borderRadius: 10, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⬇ Export</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>Results</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>{stats.shotCount} shots • {distanceYds}yd</div>
            </div>
            {savedMsg && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(60,180,60,0.12)', border: '1px solid rgba(60,180,60,0.3)', color: '#4caf50', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Saved to history ✓</div>}

            {/* PRIMARY — Group Size + CEP */}
            <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
              <div style={{ padding: '10px 0 2px', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Group Size</div>
              <StatRow label="Extreme Spread" val={`${stats.extremeSpreadIn.toFixed(3)}"`} moa={`${stats.extremeSpreadMoa.toFixed(2)} MOA`} primary />
              <StatRow label="CEP"            val={`${stats.cepIn.toFixed(3)}"`}            moa={`${stats.cepMoa.toFixed(2)} MOA`} primary />
              <StatRow label="Mean Radius"    val={`${stats.meanRadiusIn.toFixed(3)}"`}     moa={`${stats.meanRadiusMoa.toFixed(2)} MOA`} primary />
            </div>
            {/* SECONDARY — POA Offset */}
            <div style={{ background: theme.surface, borderRadius: 12, padding: '0 16px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>POA Offset</span>
                <button onClick={() => setShowAdjustZero(v => !v)} style={{ padding: '3px 10px', borderRadius: 12, background: showAdjustZero ? theme.accent : 'transparent', color: showAdjustZero ? '#000' : theme.accent, border: `1px solid ${theme.accent}`, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Adjust Zero</button>
              </div>
              <StatRow label="Elevation" val={`${stats.elevationIn >= 0 ? 'UP' : 'DOWN'} ${Math.abs(stats.elevationIn).toFixed(3)}"`} moa={`${stats.elevationMoa.toFixed(2)} MOA`} />
              <StatRow label="Windage"   val={`${stats.windageIn >= 0 ? 'RIGHT' : 'LEFT'} ${Math.abs(stats.windageIn).toFixed(3)}"`}  moa={`${stats.windageMoa.toFixed(2)} MOA`} />
              {showAdjustZero && (() => {
                const assignment = selectedGunId ? getActiveAssignmentForGun(selectedGunId) : null;
                const optic = assignment ? getOpticById(assignment.opticId) : null;
                const clickMoa = optic?.clickValueMOA ?? (optic?.clickValueMRAD ? optic.clickValueMRAD * 3.438 : null);
                const manualVal = parseFloat(adjustZeroClickValue);
                const effectiveClick = clickMoa ?? (adjustZeroClickValue && !isNaN(manualVal) && manualVal > 0 ? manualVal : null);

                const elevClicks = effectiveClick ? Math.round(stats.elevationMoa / effectiveClick) : null;
                const windClicks = effectiveClick ? Math.round(stats.windageMoa / effectiveClick) : null;
                const elevDir = stats.elevationIn >= 0 ? 'UP' : 'DOWN';
                const windDir = stats.windageIn >= 0 ? 'RIGHT' : 'LEFT';

                return (
                  <div style={{ borderTop: `1px solid ${theme.border}`, padding: '12px 0' }}>
                    {optic && clickMoa ? (
                      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                        {optic.make} {optic.model} · {clickMoa === optic.clickValueMOA ? `${clickMoa} MOA/click` : `${optic.clickValueMRAD} MRAD/click`}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: theme.textSecondary, flexShrink: 0 }}>Click value (MOA/click):</span>
                        <input type="number" step="0.025" placeholder="e.g. 0.25" value={adjustZeroClickValue} onChange={e => setAdjustZeroClickValue(e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.background, color: theme.textPrimary, fontSize: 13, fontFamily: 'monospace' }} />
                      </div>
                    )}
                    {effectiveClick ? (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: 13, fontFamily: 'monospace', color: theme.textPrimary, lineHeight: 1.7 }}>
                          <div>Elevation: <strong style={{ color: theme.accent }}>{Math.abs(elevClicks!)} click{Math.abs(elevClicks!) !== 1 ? 's' : ''} {elevClicks === 0 ? '— on zero' : elevDir}</strong></div>
                          <div>Windage: <strong style={{ color: theme.accent }}>{Math.abs(windClicks!)} click{Math.abs(windClicks!) !== 1 ? 's' : ''} {windClicks === 0 ? '— on zero' : windDir}</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: theme.textMuted }}>Enter your turret click value to calculate adjustments.</div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* ADVANCED — collapsed by default */}
            <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <button onClick={() => setShowAdvanced(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Advanced</span>
                <span style={{ fontSize: 13, color: theme.textMuted }}>{showAdvanced ? '▲' : '▼'}</span>
              </button>
              {showAdvanced && (
                <div style={{ padding: '0 16px' }}>
                  <StatRow label="Radial SD"     val={`${stats.radialSdIn.toFixed(3)}"`}     moa={`${stats.radialSdMoa.toFixed(2)} MOA`} />
                  <StatRow label="Vertical SD"   val={`${stats.verticalSdIn.toFixed(3)}"`}   moa={`${stats.verticalSdMoa.toFixed(2)} MOA`} />
                  <StatRow label="Horizontal SD" val={`${stats.horizontalSdIn.toFixed(3)}"`} moa={`${stats.horizontalSdMoa.toFixed(2)} MOA`} />
                  <StatRow label="Overall Width"  val={`${stats.overallWidthIn.toFixed(3)}"`}  moa={`${stats.overallWidthMoa.toFixed(2)} MOA`} />
                  <StatRow label="Overall Height" val={`${stats.overallHeightIn.toFixed(3)}"`} moa={`${stats.overallHeightMoa.toFixed(2)} MOA`} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, borderRadius: 12, background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>← Edit</button>
              <button onClick={exportOverlay} style={{ flex: 2, padding: 13, borderRadius: 12, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⬇ Export</button>
            </div>

            {/* GROUP TREND SPARKLINE */}
            {(() => {
              if (!selectedGunId) return null;
              const gun = guns.find(g => g.id === selectedGunId);
              const prior = getAnalysesForGun(selectedGunId).sort((a, b) => a.date.localeCompare(b.date));
              // Include current session as the latest point
              const allPoints = [...prior.map(a => ({ moa: a.stats.extremeSpreadMoa, current: false })), { moa: stats.extremeSpreadMoa, current: true }];
              if (allPoints.length < 3) return null;

              const W = 280, H = 60, padX = 12, padY = 8;
              const moas = allPoints.map(p => p.moa);
              const minM = Math.min(...moas), maxM = Math.max(...moas);
              const range = maxM - minM || 1;
              const xStep = (W - padX * 2) / (allPoints.length - 1);
              const toX = (i: number) => padX + i * xStep;
              // Invert Y: lower MOA = higher on chart (better)
              const toY = (m: number) => padY + ((maxM - m) / range) * (H - padY * 2);
              const points = allPoints.map((p, i) => `${toX(i)},${toY(p.moa)}`).join(' ');

              return (
                <div style={{ background: theme.surface, borderRadius: 12, padding: '12px 16px', border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                    Group Trend — {gun ? `${gun.make} ${gun.model}` : 'This Gun'}
                  </div>
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
                    <polyline points={points} fill="none" stroke="rgba(255,212,59,0.4)" strokeWidth="1.5" strokeLinejoin="round" />
                    {allPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={toX(i)} cy={toY(p.moa)} r={p.current ? 5 : 3.5}
                          fill={p.current ? '#ffd43b' : 'rgba(255,212,59,0.5)'}
                          stroke={p.current ? '#000' : 'none'} strokeWidth="1" />
                        <text x={toX(i)} y={toY(p.moa) - 8} textAnchor="middle"
                          style={{ fontSize: 8, fill: p.current ? '#ffd43b' : 'rgba(255,212,59,0.6)', fontFamily: 'monospace' }}>
                          {p.moa.toFixed(1)}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 9, color: theme.textMuted, fontFamily: 'monospace' }}>OLDEST</span>
                    <span style={{ fontSize: 9, color: theme.accent, fontFamily: 'monospace' }}>THIS SESSION ●</span>
                  </div>
                </div>
              );
            })()}

            {!showCoach ? (
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: theme.surfaceAlt, borderBottom: `1px solid ${theme.border}` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: '0.8px' }}>GET COACHING</span>
                </div>
                {([
                  { tier: 1 as const, label: 'THIS TARGET', desc: 'Analyze this shot group' },
                  { tier: 2 as const, label: 'THIS SESSION', desc: 'Compare targets from today' },
                  { tier: 3 as const, label: 'TRENDS', desc: 'Cross-session pattern analysis' },
                ] as const).map(({ tier, label, desc }) => (
                  <button key={tier} onClick={() => openCoachTier(tier)} style={{
                    display: 'flex', alignItems: 'center', width: '100%', padding: '12px 14px',
                    background: 'transparent', border: 'none', borderBottom: tier < 3 ? `1px solid ${theme.border}` : 'none',
                    cursor: 'pointer', gap: 10, textAlign: 'left',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surface, border: `1px solid ${theme.border}`, fontSize: 10, fontWeight: 700, color: theme.accent, fontFamily: 'monospace' }}>{tier}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: theme.textPrimary, fontWeight: 700, letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{desc}</div>
                    </div>
                    <span style={{ color: theme.textMuted, fontSize: 16, lineHeight: 1 }}>›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: theme.surfaceAlt, borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent, fontFamily: 'monospace', letterSpacing: '0.6px' }}>AI COACH</span>
                    <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: 'monospace', marginLeft: 8 }}>TIER {coachTier}</span>
                  </div>
                  <button onClick={() => setShowCoach(false)} style={{ padding: '3px 8px', borderRadius: 6, background: 'transparent', color: theme.textMuted, border: 'none', fontSize: 12, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {coachMessages.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'user' ? theme.accent : theme.surface, color: msg.role === 'user' ? '#000' : theme.textPrimary, fontSize: 13, lineHeight: 1.5, border: msg.role === 'assistant' ? `1px solid ${theme.border}` : 'none' }}>
                      {msg.content}
                    </div>
                  ))}
                  {coachLoading && <div style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: 13 }}>...</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 10px', borderTop: `1px solid ${theme.border}` }}>
                  <input type="text" placeholder="Ask a follow-up..." value={coachInput} onChange={e => setCoachInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && coachInput.trim() && !coachLoading) callCoach(coachInput.trim()); }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textPrimary, fontSize: 13 }} />
                  <button onClick={() => coachInput.trim() && !coachLoading && callCoach(coachInput.trim())} style={{ padding: '8px 14px', borderRadius: 8, background: theme.accent, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: coachLoading ? 0.5 : 1 }}>Send</button>
                </div>
              </div>
            )}

            <button onClick={resetAll} style={{ padding: 11, borderRadius: 12, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, fontSize: 13, cursor: 'pointer' }}>+ NEW TARGET</button>

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
                        <button onClick={() => deleteHistoryEntry(record.id)} style={{ padding: '5px 8px', borderRadius: 7, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, fontSize: 14, cursor: 'pointer', flexShrink: 0 }} title="Delete">🗑</button>
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

  // ── Step indicator ────────────────────────────────────────────────────────
  const stepLabels = ['Setup', 'Scale', 'Mark', 'Results'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Crop step — shown immediately after photo selection */}
      {showCrop && rawImageUrl && (
        <CropStep
          imageUrl={rawImageUrl}
          onCrop={url => { setImageUrl(url); setShowCrop(false); }}
          onSkip={() => { setImageUrl(rawImageUrl!); setShowCrop(false); }}
        />
      )}
      {!showCrop && step !== 3 && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 4, flexShrink: 0 }}>
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step; const active = s === step; const done = s < step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? theme.accent : active ? theme.accentDim : theme.surface, border: active ? `2px solid ${theme.accent}` : done ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, fontSize: 10, fontWeight: 700, color: done ? '#000' : active ? theme.accent : theme.textMuted }}>
                  {done ? '✓' : s}
                </div>
                <span style={{ fontSize: 10, color: active ? theme.textPrimary : theme.textMuted, fontWeight: active ? 600 : 400 }}>{label}</span>
                {i < stepLabels.length - 1 && <div style={{ flex: 1, height: 1, background: done ? theme.accent : theme.border, opacity: done ? 0.6 : 1 }} />}
              </div>
            );
          })}
        </div>
      )}
      {!showCrop && <div style={{ flex: 1, overflowY: step === 3 || (step === 4 && resultTab === 'overlay') ? 'hidden' : 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>}
    </div>
  );
}
