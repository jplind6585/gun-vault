// GitHub-style contribution heatmap — range activity
// Modes: '12W' = last 12 weeks (wide cells), '12M' = last 12 months (fit all in same grid)
import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Session } from './types';

interface ActivityHeatmapProps {
  sessions: Session[];
  mode?: '12W' | '12M';
}

function getRoundColor(rounds: number): string {
  if (rounds === 0) return 'rgba(255,255,255,0.05)';
  if (rounds < 50)  return 'rgba(255, 212, 59, 0.25)';
  if (rounds < 150) return 'rgba(255, 212, 59, 0.5)';
  if (rounds < 300) return 'rgba(255, 212, 59, 0.75)';
  return theme.accent;
}

export function ActivityHeatmap({ sessions, mode = '12W' }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; rounds: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(10);
  const GAP = 2;

  const weekCount = mode === '12W' ? 12 : 52;

  // Always fit to container width — no horizontal scroll
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const size = Math.floor((w - (weekCount - 1) * GAP) / weekCount);
      setCellSize(Math.max(4, Math.min(size, 20)));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [weekCount]);

  // Build a map of date → total rounds
  const roundsByDate = new Map<string, number>();
  sessions.forEach(s => {
    const prev = roundsByDate.get(s.date) || 0;
    roundsByDate.set(s.date, prev + s.roundsExpended);
  });

  // Build exactly weekCount weeks ending today, aligned to Sunday
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weekCount * 7) + 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Array<Array<{ dateStr: string; rounds: number; isFuture: boolean }>> = [];
  let current = new Date(startDate);

  for (let w = 0; w < weekCount; w++) {
    const week: Array<{ dateStr: string; rounds: number; isFuture: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      const isFuture = dateStr > todayStr;
      week.push({ dateStr, rounds: roundsByDate.get(dateStr) || 0, isFuture });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels — one per month change
  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].dateStr + 'T12:00:00').getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: new Date(week[0].dateStr + 'T12:00:00').toLocaleString('en-US', { month: 'short' }),
        col: wi,
      });
      lastMonth = m;
    }
  });

  const stride = cellSize + GAP;

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Month labels */}
      <div style={{ position: 'relative', height: '14px', marginBottom: '2px' }}>
        {monthLabels.map(({ label, col }) => (
          <span
            key={label + '-' + col}
            style={{
              position: 'absolute',
              left: col * stride,
              fontFamily: 'monospace',
              fontSize: '8px',
              color: theme.textMuted,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', gap: GAP }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {week.map(({ dateStr, rounds, isFuture }) => (
              <div
                key={dateStr}
                onMouseEnter={(e) => {
                  if (!isFuture) {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({ date: dateStr, rounds, x: rect.left, y: rect.top });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
                  backgroundColor: isFuture ? 'transparent' : getRoundColor(rounds),
                  cursor: rounds > 0 && !isFuture ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted }}>LESS</span>
        {[0, 30, 100, 200, 400].map(r => (
          <div key={r} style={{ width: cellSize, height: cellSize, borderRadius: 2, backgroundColor: getRoundColor(r) }} />
        ))}
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted }}>MORE</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y - 40,
          left: tooltip.x,
          backgroundColor: theme.surface,
          border: '0.5px solid ' + theme.border,
          borderRadius: '4px',
          padding: '4px 8px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: theme.textPrimary,
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.rounds > 0
            ? tooltip.rounds + ' rounds · ' + tooltip.date
            : 'No range · ' + tooltip.date}
        </div>
      )}
    </div>
  );
}
