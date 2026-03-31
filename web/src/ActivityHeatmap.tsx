// GitHub-style contribution heatmap — 52 weeks of range activity
import { useState } from 'react';
import { theme } from './theme';
import type { Session } from './types';

interface ActivityHeatmapProps {
  sessions: Session[];
}

function getRoundColor(rounds: number): string {
  if (rounds === 0) return 'rgba(255,255,255,0.05)';
  if (rounds < 50)  return 'rgba(255, 212, 59, 0.25)';
  if (rounds < 150) return 'rgba(255, 212, 59, 0.5)';
  if (rounds < 300) return 'rgba(255, 212, 59, 0.75)';
  return theme.accent;
}

export function ActivityHeatmap({ sessions }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; rounds: number; x: number; y: number } | null>(null);

  // Build a map of date → total rounds
  const roundsByDate = new Map<string, number>();
  sessions.forEach(s => {
    const prev = roundsByDate.get(s.date) || 0;
    roundsByDate.set(s.date, prev + s.roundsExpended);
  });

  // Build 52 weeks ending today
  const today = new Date();
  // Start from Sunday 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (52 * 7) + 1);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Array<Array<{ dateStr: string; rounds: number }>> = [];
  let current = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const week: Array<{ dateStr: string; rounds: number }> = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      week.push({ dateStr, rounds: roundsByDate.get(dateStr) || 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].dateStr + 'T12:00:00').getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: new Date(week[0].dateStr + 'T12:00:00').toLocaleString('en-US', { month: 'short' }), col: wi });
      lastMonth = m;
    }
  });

  const CELL = 10;
  const GAP = 2;
  const stride = CELL + GAP;

  return (
    <div style={{ position: 'relative' }}>
      {/* Month labels */}
      <div style={{ position: 'relative', height: '14px', marginBottom: '2px' }}>
        {monthLabels.map(({ label, col }) => (
          <span
            key={`${label}-${col}`}
            style={{
              position: 'absolute',
              left: `${col * stride}px`,
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
      <div style={{ display: 'flex', gap: `${GAP}px`, overflowX: 'auto', paddingBottom: '4px' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
            {week.map(({ dateStr, rounds }) => {
              const isFuture = dateStr > today.toISOString().split('T')[0];
              return (
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
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    borderRadius: '2px',
                    backgroundColor: isFuture ? 'transparent' : getRoundColor(rounds),
                    cursor: rounds > 0 ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted }}>LESS</span>
        {[0, 30, 100, 200, 400].map(r => (
          <div key={r} style={{ width: `${CELL}px`, height: `${CELL}px`, borderRadius: '2px', backgroundColor: getRoundColor(r) }} />
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
          border: `0.5px solid ${theme.border}`,
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
            ? `${tooltip.rounds} rounds · ${tooltip.date}`
            : `No range · ${tooltip.date}`}
        </div>
      )}
    </div>
  );
}
