// GitHub-style contribution heatmap — range activity
import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Session } from './types';

interface ActivityHeatmapProps {
  sessions: Session[];
  weekCount?: number; // 12 or 52
}

function getRoundColor(rounds: number): string {
  if (rounds === 0) return 'rgba(255,255,255,0.05)';
  if (rounds < 50)  return 'rgba(255, 212, 59, 0.25)';
  if (rounds < 150) return 'rgba(255, 212, 59, 0.5)';
  if (rounds < 300) return 'rgba(255, 212, 59, 0.75)';
  return theme.accent;
}

export function ActivityHeatmap({ sessions, weekCount = 52 }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; rounds: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(10);
  const GAP = 2;

  // Measure container width on mount and resize
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      if (weekCount <= 12) {
        // Fill available width for short modes
        const size = Math.floor((w - (weekCount - 1) * GAP) / weekCount);
        setCellSize(Math.max(8, Math.min(size, 18)));
      } else {
        // Fixed size for scrollable long mode
        setCellSize(10);
      }
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

  // Build exactly weekCount weeks ending today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weekCount * 7) + 1);
  // Align to Sunday of that week
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
  const totalWidth = weeks.length * stride - GAP;

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: weekCount > 12 ? 'auto' : 'hidden', position: 'relative' }}>
      {/* Month labels */}
      <div style={{ position: 'relative', height: '14px', marginBottom: '2px', minWidth: totalWidth }}>
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
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: GAP, minWidth: totalWidth }}>
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
        {/* Right fade hint for 12-week view */}
        {weekCount <= 12 && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: '24px', pointerEvents: 'none',
            background: 'linear-gradient(to right, transparent, rgba(7,7,26,0.9))',
          }} />
        )}
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
