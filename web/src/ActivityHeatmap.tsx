// GitHub-style range activity heatmap
// Mon (top) → Sun (bottom), columns = weeks oldest → newest
// Time window: 3M / 6M / 12M selector (top-right of card)
// Fixed card height — no layout shift between windows
import { useState } from 'react';
import { theme } from './theme';
import type { Session } from './types';

type TimeWindow = '3M' | '6M' | '12M';

interface ActivityHeatmapProps {
  sessions: Session[];
}

const CELL = 10;
const GAP  = 2;
const DAY_LABEL_W = 10;
const STRIDE = CELL + GAP;

const WINDOW_WEEKS: Record<TimeWindow, number> = {
  '3M':  13,
  '6M':  26,
  '12M': 52,
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getRoundColor(rounds: number): string {
  if (rounds === 0)   return 'rgba(255,255,255,0.05)';
  if (rounds <= 50)   return '#b5a015';
  if (rounds <= 150)  return '#c8b020';
  if (rounds <= 300)  return '#e0c42a';
  return '#ffd43b';
}

function fmtTooltipDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityHeatmap({ sessions }: ActivityHeatmapProps) {
  const [win, setWin]       = useState<TimeWindow>('3M');
  const [tooltip, setTooltip] = useState<{ date: string; rounds: number; location?: string } | null>(null);

  const weekCount = WINDOW_WEEKS[win];

  // Build date → { rounds, location } aggregation
  const dayData = new Map<string, { rounds: number; location?: string }>();
  sessions.forEach(s => {
    const prev = dayData.get(s.date);
    dayData.set(s.date, {
      rounds: (prev?.rounds || 0) + s.roundsExpended,
      location: prev?.location || s.location || undefined,
    });
  });

  // Anchor to most recent Monday on or before today
  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dow      = today.getDay();                      // 0 = Sun
  const toMon    = dow === 0 ? 6 : dow - 1;
  const anchor   = new Date(today);
  anchor.setDate(today.getDate() - toMon - (weekCount - 1) * 7);

  // Build grid: weeks[col][row 0=Mon..6=Sun]
  type Cell = { dateStr: string; rounds: number; location?: string; isFuture: boolean };
  const weeks: Cell[][] = [];
  const cur = new Date(anchor);

  for (let w = 0; w < weekCount; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0];
      const data    = dayData.get(dateStr);
      week.push({
        dateStr,
        rounds:   data?.rounds   || 0,
        location: data?.location || undefined,
        isFuture: dateStr > todayStr,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels — one per month change across week-start dates
  const monthLabels: { label: string; col: number }[] = [];
  let lastM = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].dateStr + 'T12:00:00').getMonth();
    if (m !== lastM) {
      monthLabels.push({
        label: new Date(week[0].dateStr + 'T12:00:00').toLocaleString('en-US', { month: 'short' }),
        col: wi,
      });
      lastM = m;
    }
  });

  const gridW = weekCount * STRIDE - GAP;
  const gridH = 7 * STRIDE - GAP;

  return (
    <div onClick={() => setTooltip(null)}>

      {/* Header: label + window selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Range Activity
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {(['3M', '6M', '12M'] as TimeWindow[]).map(w => (
            <button
              key={w}
              onClick={e => { e.stopPropagation(); setWin(w); setTooltip(null); }}
              style={{
                background:   win === w ? theme.textMuted : 'none',
                border:       `0.5px solid ${win === w ? theme.textMuted : theme.border}`,
                borderRadius: '3px',
                color:        win === w ? theme.bg : theme.textMuted,
                fontFamily:   'monospace',
                fontSize:     '8px',
                cursor:       'pointer',
                padding:      '2px 6px',
                letterSpacing: '0.5px',
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable grid area */}
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: DAY_LABEL_W + 4 + gridW }}>

          {/* Month labels row */}
          <div style={{ display: 'flex', marginLeft: DAY_LABEL_W + 4 }}>
            <div style={{ position: 'relative', height: '14px', marginBottom: '2px', width: gridW }}>
              {monthLabels.map(({ label, col }) => (
                <span
                  key={label + col}
                  style={{
                    position: 'absolute',
                    left: col * STRIDE,
                    fontFamily: 'monospace',
                    fontSize: '8px',
                    color: theme.textMuted,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Day labels + grid */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>

            {/* Day-of-week labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: '4px', width: DAY_LABEL_W, flexShrink: 0 }}>
              {DAY_LABELS.map((lbl, i) => (
                <div key={i} style={{ height: CELL, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '7px', color: theme.textMuted, lineHeight: 1 }}>
                    {lbl}
                  </span>
                </div>
              ))}
            </div>

            {/* Cell grid */}
            <div style={{ display: 'flex', gap: GAP, position: 'relative', height: gridH }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map(({ dateStr, rounds, location, isFuture }) => {
                    const isActive = tooltip?.date === dateStr;
                    return (
                      <div
                        key={dateStr}
                        onClick={e => {
                          if (isFuture) return;
                          e.stopPropagation();
                          setTooltip(isActive ? null : { date: dateStr, rounds, location });
                        }}
                        style={{
                          width:           CELL,
                          height:          CELL,
                          borderRadius:    2,
                          backgroundColor: isFuture ? 'transparent' : getRoundColor(rounds),
                          cursor:          isFuture ? 'default' : 'pointer',
                          flexShrink:      0,
                          position:        'relative',
                        }}
                      >
                        {isActive && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{
                              position:        'absolute',
                              bottom:          '100%',
                              left:            '50%',
                              transform:       'translateX(-50%)',
                              marginBottom:    '4px',
                              backgroundColor: theme.surface,
                              border:          `0.5px solid ${theme.border}`,
                              borderRadius:    '4px',
                              padding:         '4px 8px',
                              fontFamily:      'monospace',
                              fontSize:        '9px',
                              color:           theme.textPrimary,
                              whiteSpace:      'nowrap',
                              zIndex:          100,
                              pointerEvents:   'none',
                            }}
                          >
                            {rounds > 0
                              ? `${fmtTooltipDate(dateStr)} · ${rounds} rds${location ? ' · ' + location : ''}`
                              : `${fmtTooltipDate(dateStr)} · No session`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted }}>LESS</span>
        {[0, 25, 100, 200, 400].map(r => (
          <div key={r} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: getRoundColor(r), flexShrink: 0 }} />
        ))}
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted }}>MORE</span>
      </div>
    </div>
  );
}
