import { theme } from './theme';
import type { Session, Gun } from './types';

interface SessionSummaryProps {
  sessions: Session[];
  guns: Gun[];
}

export function SessionSummary({ sessions, guns }: SessionSummaryProps) {
  if (sessions.length === 0) return null;

  // AI-powered analysis of recent sessions
  const recentSessions = sessions
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  // Training frequency analysis
  const daysActive = new Set(recentSessions.map(s => s.date.split('T')[0])).size;
  const avgRoundsPerDay = daysActive > 0
    ? recentSessions.reduce((sum, s) => sum + s.roundsExpended, 0) / daysActive
    : 0;

  // Gun usage patterns
  const gunUsage = recentSessions.reduce((acc, s) => {
    acc[s.gunId] = (acc[s.gunId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedGun = Object.entries(gunUsage).sort(([, a], [, b]) => b - a)[0];
  const mostUsedGunData = mostUsedGun ? guns.find(g => g.id === mostUsedGun[0]) : null;

  // Issue tracking
  const sessionsWithIssues = recentSessions.filter(s => s.issues).length;
  const issueRate = (sessionsWithIssues / recentSessions.length) * 100;

  // Location preferences
  const locations = recentSessions.reduce((acc, s) => {
    if (s.indoorOutdoor) {
      acc[s.indoorOutdoor] = (acc[s.indoorOutdoor] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Generate AI insights
  const insights: string[] = [];

  if (avgRoundsPerDay > 100) {
    insights.push('High training volume detected. Ensure adequate firearm maintenance.');
  } else if (avgRoundsPerDay < 30) {
    insights.push('Consider increasing training frequency for skill development.');
  }

  if (issueRate > 20) {
    insights.push(`${issueRate.toFixed(0)}% of sessions reported issues. Review equipment and technique.`);
  } else if (issueRate === 0) {
    insights.push('No equipment issues reported. Excellent maintenance practices.');
  }

  if (mostUsedGunData) {
    insights.push(`Primary training platform: ${mostUsedGunData.make} ${mostUsedGunData.model}.`);
  }

  if (locations['Indoor'] && locations['Outdoor']) {
    insights.push('Balanced indoor/outdoor training. Good environmental variety.');
  }

  // Training quality score
  const detailedSessions = recentSessions.filter(s => s.notes || s.location || s.ammoLotId).length;
  const qualityScore = (detailedSessions / recentSessions.length) * 100;

  return (
    <div style={{
      backgroundColor: theme.surface,
      border: `0.5px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '1px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        marginBottom: '16px'
      }}>
        AI Session Summary (Last 30 Days)
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
            Total Sessions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: theme.accent, fontFamily: 'monospace' }}>
            {recentSessions.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
            Avg Rounds/Day
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>
            {avgRoundsPerDay.toFixed(0)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
            Quality Score
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: qualityScore >= 70 ? theme.green : theme.accent, fontFamily: 'monospace' }}>
            {qualityScore.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div style={{
          backgroundColor: theme.bg,
          borderRadius: '6px',
          padding: '12px',
          borderLeft: `3px solid ${theme.blue}`
        }}>
          <div style={{
            fontSize: '11px',
            color: theme.blue,
            fontWeight: 600,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            AI Insights
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {insights.map((insight, i) => (
              <div key={i} style={{
                fontSize: '12px',
                color: theme.textSecondary,
                lineHeight: 1.5
              }}>
                ▸ {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
