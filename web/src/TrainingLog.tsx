import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useResponsive } from './useResponsive';

interface Drill {
  id: string;
  name: string;
  description: string;
  category: 'fundamentals' | 'speed' | 'accuracy' | 'transitions' | 'movement';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rounds: number;
  par: string; // Par time or score goal
  instructions: string[];
  scoring: 'time' | 'accuracy' | 'points';
}

interface DrillSession {
  id: string;
  drillId: string;
  date: string;
  timestamp: number;
  firearm?: string;
  ammunition?: string;
  score: number;
  time?: number; // seconds
  accuracy?: number; // percentage
  notes?: string;
  conditions?: string; // weather, lighting, etc.
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'effort' | 'achievement' | 'milestone';
  requirement: string;
  earned: boolean;
  earnedDate?: string;
}

// Pre-defined training drills
const DRILLS: Drill[] = [
  {
    id: 'bill-drill',
    name: 'Bill Drill',
    description: 'Draw and fire 6 rounds on single target',
    category: 'speed',
    difficulty: 'intermediate',
    rounds: 6,
    par: '2.5s',
    instructions: [
      'Start at 7 yards from single IPSC target',
      'Start with hands at sides or surrender position',
      'On signal, draw and fire 6 rounds as fast as possible',
      'All rounds must be in A-zone',
      'Goal: Sub-2.5 seconds with all As'
    ],
    scoring: 'time'
  },
  {
    id: 'el-presidente',
    name: 'El Presidente',
    description: 'Classic 12-round speed drill on 3 targets',
    category: 'speed',
    difficulty: 'advanced',
    rounds: 12,
    par: '10s',
    instructions: [
      'Place 3 targets 1 yard apart, 10 yards away',
      'Start facing away from targets',
      'On signal, turn and engage each target with 2 rounds',
      'Reload and repeat (2 more rounds per target)',
      'Goal: Under 10 seconds with all A-zone hits'
    ],
    scoring: 'time'
  },
  {
    id: 'box-drill',
    name: 'Box Drill',
    description: 'Fundamentals drill focusing on trigger control',
    category: 'fundamentals',
    difficulty: 'beginner',
    rounds: 10,
    par: '90% in box',
    instructions: [
      'Draw 4-inch square on target at 10 yards',
      'Fire 10 rounds slowly from the ready position',
      'Focus on sight alignment and smooth trigger press',
      'Goal: 9/10 rounds in box'
    ],
    scoring: 'accuracy'
  },
  {
    id: 'dot-torture',
    name: 'Dot Torture',
    description: 'Precision drill with 50 rounds on 10 dots',
    category: 'accuracy',
    difficulty: 'advanced',
    rounds: 50,
    par: '50/50',
    instructions: [
      'Print dot torture target (10 dots, 2-inch circles)',
      'Shoot at 3 yards',
      'Follow specific course of fire for each dot',
      'Includes draws, reloads, strong/weak hand',
      'Goal: 50/50 clean run'
    ],
    scoring: 'accuracy'
  },
  {
    id: 'mozambique',
    name: 'Mozambique Drill (Failure Drill)',
    description: 'Two to body, one to head',
    category: 'fundamentals',
    difficulty: 'intermediate',
    rounds: 3,
    par: '2.5s',
    instructions: [
      'Start at 7 yards',
      'On signal, fire 2 rounds center mass',
      'Immediately fire 1 round to head',
      'All rounds must be in scoring zones',
      'Goal: Under 2.5 seconds'
    ],
    scoring: 'time'
  },
  {
    id: '5x5',
    name: '5x5 Drill',
    description: 'Versatile accuracy/speed drill',
    category: 'fundamentals',
    difficulty: 'beginner',
    rounds: 25,
    par: '25s / 25 hits',
    instructions: [
      'Place target at 5 yards',
      'Fire 5 rounds in 5 seconds, repeat 5 times',
      'All rounds must be in 5-inch circle',
      'Focus on balance of speed and accuracy',
      'Goal: 25/25 in under 25 seconds total'
    ],
    scoring: 'points'
  },
  {
    id: '1-reload-1',
    name: '1-Reload-1',
    description: 'Reload fundamentals drill',
    category: 'fundamentals',
    difficulty: 'beginner',
    rounds: 2,
    par: '3.5s',
    instructions: [
      'Load 1 round in gun, spare mag in pouch',
      'Fire 1 round, reload, fire 1 round',
      'Focus on clean reload technique',
      'Both rounds in A-zone',
      'Goal: Under 3.5 seconds'
    ],
    scoring: 'time'
  },
  {
    id: 'casino-drill',
    name: 'Casino Drill (21)',
    description: 'Score exactly 21 points in minimum time',
    category: 'accuracy',
    difficulty: 'intermediate',
    rounds: 6,
    par: '21 points',
    instructions: [
      'USPSA target at 10 yards',
      'Fire up to 6 rounds',
      'A=5, C=4, D=2 points',
      'Must score exactly 21 points',
      'Fastest time wins'
    ],
    scoring: 'points'
  },
  {
    id: 'strong-weak',
    name: 'Strong/Weak Hand',
    description: 'One-handed shooting drill',
    category: 'fundamentals',
    difficulty: 'intermediate',
    rounds: 20,
    par: '16/20',
    instructions: [
      'Target at 7 yards',
      '10 rounds strong hand only',
      '10 rounds weak hand only',
      'Goal: 80% accuracy both hands',
      'Focus on proper one-handed grip'
    ],
    scoring: 'accuracy'
  },
  {
    id: 'speed-reload',
    name: 'Speed Reload Series',
    description: 'Reload under pressure',
    category: 'speed',
    difficulty: 'intermediate',
    rounds: 10,
    par: '1.5s avg',
    instructions: [
      'Load 2 rounds, repeat 5 times',
      'Fire 2, reload, fire 2',
      'Measure each reload time',
      'All rounds in A-zone',
      'Goal: Average reload under 1.5s'
    ],
    scoring: 'time'
  }
];

export function TrainingLog() {
  const [sessions, setSessions] = useState<DrillSession[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const { isMobile } = useResponsive();

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gunvault_training_sessions');
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load training sessions:', e);
    }
  }, []);

  // Initialize and update badges based on sessions
  useEffect(() => {
    const allBadges: Badge[] = [
      // Effort badges
      {
        id: 'first-drill',
        name: 'First Steps',
        description: 'Complete your first training drill',
        icon: '■',
        type: 'effort',
        requirement: '1 drill',
        earned: sessions.length >= 1,
        earnedDate: sessions.length >= 1 ? sessions[sessions.length - 1].date : undefined
      },
      {
        id: 'ten-drills',
        name: 'Committed',
        description: 'Complete 10 training drills',
        icon: '■',
        type: 'effort',
        requirement: '10 drills',
        earned: sessions.length >= 10,
        earnedDate: sessions.length >= 10 ? sessions[9].date : undefined
      },
      {
        id: 'fifty-drills',
        name: 'Dedicated',
        description: 'Complete 50 training drills',
        icon: '■',
        type: 'effort',
        requirement: '50 drills',
        earned: sessions.length >= 50,
        earnedDate: sessions.length >= 50 ? sessions[49].date : undefined
      },
      {
        id: 'weekly-streak',
        name: 'Weekly Warrior',
        description: 'Train every week for a month',
        icon: '■',
        type: 'effort',
        requirement: '4 consecutive weeks',
        earned: false, // TODO: Calculate streak
        earnedDate: undefined
      },
      // Achievement badges
      {
        id: 'bill-drill-master',
        name: 'Bill Drill Master',
        description: 'Complete Bill Drill under 2.5s',
        icon: '■',
        type: 'achievement',
        requirement: 'Bill Drill < 2.5s',
        earned: sessions.some(s => s.drillId === 'bill-drill' && s.time && s.time < 2.5),
        earnedDate: sessions.find(s => s.drillId === 'bill-drill' && s.time && s.time < 2.5)?.date
      },
      {
        id: 'accuracy-ace',
        name: 'Accuracy Ace',
        description: 'Score 100% on any accuracy drill',
        icon: '■',
        type: 'achievement',
        requirement: '100% accuracy',
        earned: sessions.some(s => s.accuracy && s.accuracy === 100),
        earnedDate: sessions.find(s => s.accuracy === 100)?.date
      },
      {
        id: 'dot-torture-clean',
        name: 'Dot Torturer',
        description: 'Clean 50/50 on Dot Torture',
        icon: '■',
        type: 'achievement',
        requirement: 'Dot Torture 50/50',
        earned: sessions.some(s => s.drillId === 'dot-torture' && s.score >= 50),
        earnedDate: sessions.find(s => s.drillId === 'dot-torture' && s.score >= 50)?.date
      },
      // Milestone badges
      {
        id: 'hundred-rounds',
        name: 'Century',
        description: 'Fire 100+ rounds in training drills',
        icon: '■',
        type: 'milestone',
        requirement: '100 rounds',
        earned: sessions.reduce((sum, s) => {
          const drill = DRILLS.find(d => d.id === s.drillId);
          return sum + (drill?.rounds || 0);
        }, 0) >= 100,
        earnedDate: undefined
      },
      {
        id: 'all-categories',
        name: 'Well Rounded',
        description: 'Complete drills in all categories',
        icon: '■',
        type: 'milestone',
        requirement: 'All categories',
        earned: false, // TODO: Check all categories
        earnedDate: undefined
      }
    ];

    setBadges(allBadges);
  }, [sessions]);

  // Save session
  const saveSession = (sessionData: Omit<DrillSession, 'id' | 'timestamp'>) => {
    const newSession: DrillSession = {
      ...sessionData,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);

    try {
      localStorage.setItem('gunvault_training_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save session:', e);
    }

    setShowSessionForm(false);
    setSelectedDrill(null);
  };

  // Delete session
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    try {
      localStorage.setItem('gunvault_training_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  // Filter drills
  const filteredDrills = DRILLS.filter(drill => {
    if (filterCategory !== 'all' && drill.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && drill.difficulty !== filterDifficulty) return false;
    return true;
  });

  // Calculate stats
  const totalDrills = sessions.length;
  const totalRounds = sessions.reduce((sum, s) => {
    const drill = DRILLS.find(d => d.id === s.drillId);
    return sum + (drill?.rounds || 0);
  }, 0);
  const earnedBadges = badges.filter(b => b.earned).length;

  const cardStyle = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    padding: isMobile ? '16px' : '20px'
  };

  const sectionTitleStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '1px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    fontWeight: 600
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      padding: isMobile ? '16px' : '24px',
      paddingBottom: isMobile ? '80px' : '24px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `0.5px solid ${theme.border}`,
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontFamily: 'monospace',
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          margin: '0 0 8px 0'
        }}>
          TRAINING LOG
        </h1>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: theme.textSecondary,
          margin: 0
        }}>
          Track drills, earn badges, and measure progress
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: '24px'
      }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            DRILLS COMPLETED
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.accent }}>
            {totalDrills}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            ROUNDS FIRED
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.textPrimary }}>
            {totalRounds}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
            BADGES EARNED
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: theme.green }}>
            {earnedBadges}/{badges.length}
          </div>
        </div>
        {!isMobile && (
          <div style={cardStyle}>
            <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
              AVG SCORE
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: theme.blue }}>
              {sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length).toFixed(1) : '--'}
            </div>
          </div>
        )}
      </div>

      {/* Badges Section */}
      {badges.some(b => b.earned) && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={sectionTitleStyle}>Earned Badges</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {badges.filter(b => b.earned).map(badge => (
              <div
                key={badge.id}
                style={{
                  padding: '12px',
                  backgroundColor: theme.bg,
                  borderRadius: '4px',
                  border: `1px solid ${theme.accent}`,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{badge.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: theme.accent }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: '9px', color: theme.textMuted }}>
                  {badge.description}
                </div>
                {badge.earnedDate && (
                  <div style={{ fontSize: '8px', color: theme.textSecondary, marginTop: '4px' }}>
                    {new Date(badge.earnedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill Library */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={{ ...sectionTitleStyle, marginBottom: '16px' }}>Available Drills</div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.bg,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value="fundamentals">Fundamentals</option>
            <option value="speed">Speed</option>
            <option value="accuracy">Accuracy</option>
            <option value="transitions">Transitions</option>
            <option value="movement">Movement</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.bg,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Drill Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px'
        }}>
          {filteredDrills.map(drill => {
            const drillSessions = sessions.filter(s => s.drillId === drill.id);
            const bestScore = drillSessions.length > 0
              ? Math.max(...drillSessions.map(s => s.score))
              : 0;

            return (
              <div
                key={drill.id}
                onClick={() => {
                  setSelectedDrill(drill);
                  setShowSessionForm(true);
                }}
                style={{
                  padding: '14px',
                  backgroundColor: theme.bg,
                  borderRadius: '4px',
                  border: `0.5px solid ${theme.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{drill.name}</div>
                  <div style={{
                    padding: '2px 6px',
                    backgroundColor: theme.surface,
                    borderRadius: '3px',
                    fontSize: '8px',
                    letterSpacing: '0.5px',
                    color: theme.textMuted,
                    textTransform: 'uppercase'
                  }}>
                    {drill.difficulty}
                  </div>
                </div>

                <div style={{
                  fontSize: '10px',
                  color: theme.textSecondary,
                  marginBottom: '10px',
                  lineHeight: '1.4'
                }}>
                  {drill.description}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '9px',
                  color: theme.textMuted,
                  marginBottom: '10px'
                }}>
                  <div>📦 {drill.rounds} rds</div>
                  <div>Par: {drill.par}</div>
                  <div style={{ textTransform: 'capitalize' }}>{drill.category}</div>
                </div>

                {drillSessions.length > 0 && (
                  <div style={{
                    padding: '6px 8px',
                    backgroundColor: theme.surface,
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    <span style={{ color: theme.textMuted }}>Best:</span>{' '}
                    <span style={{ color: theme.green, fontWeight: 600 }}>{bestScore}</span>
                    {' '}
                    <span style={{ color: theme.textMuted }}>({drillSessions.length}x)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Recent Training Sessions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.slice(0, 10).map(session => {
              const drill = DRILLS.find(d => d.id === session.drillId);
              if (!drill) return null;

              return (
                <div
                  key={session.id}
                  style={{
                    padding: '12px',
                    backgroundColor: theme.bg,
                    borderRadius: '4px',
                    border: `0.5px solid ${theme.border}`,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr auto' : '2fr 1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                      {drill.name}
                    </div>
                    <div style={{ fontSize: '9px', color: theme.textMuted }}>
                      {new Date(session.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      <div>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                          SCORE
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: theme.accent }}>
                          {session.score}
                        </div>
                      </div>

                      {session.time && (
                        <div>
                          <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                            TIME
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>
                            {session.time.toFixed(2)}s
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.red}`,
                      borderRadius: '3px',
                      color: theme.red,
                      fontSize: '9px',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    DEL
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Form Modal */}
      {showSessionForm && selectedDrill && (
        <SessionForm
          drill={selectedDrill}
          onSave={saveSession}
          onCancel={() => {
            setShowSessionForm(false);
            setSelectedDrill(null);
          }}
        />
      )}
    </div>
  );
}

// Session Form Component
function SessionForm({
  drill,
  onSave,
  onCancel
}: {
  drill: Drill;
  onSave: (session: Omit<DrillSession, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    score: 0,
    time: undefined as number | undefined,
    accuracy: undefined as number | undefined,
    firearm: '',
    ammunition: '',
    notes: '',
    conditions: ''
  });

  const { isMobile } = useResponsive();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      drillId: drill.id,
      date: new Date().toISOString(),
      ...formData
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px'
  };

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'monospace',
    fontSize: '10px',
    letterSpacing: '0.8px',
    color: theme.textSecondary,
    marginBottom: '6px',
    textTransform: 'uppercase' as const
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '24px'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          padding: isMobile ? '20px' : '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'monospace',
          fontSize: '16px',
          letterSpacing: '1px',
          margin: '0 0 8px 0'
        }}>
          LOG TRAINING SESSION
        </h2>

        <div style={{
          fontSize: '13px',
          color: theme.accent,
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          {drill.name}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Score {drill.scoring === 'accuracy' ? '(% or count)' : drill.scoring === 'time' ? '(points)' : '(total)'}*
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.score || ''}
              onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
              style={inputStyle}
              required
            />
          </div>

          {drill.scoring === 'time' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Time (seconds)</label>
              <input
                type="number"
                step="0.01"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>
          )}

          {(drill.scoring === 'accuracy' || drill.scoring === 'points') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Accuracy (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.accuracy || ''}
                onChange={(e) => setFormData({ ...formData, accuracy: parseFloat(e.target.value) || undefined })}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Firearm</label>
            <input
              type="text"
              value={formData.firearm}
              onChange={(e) => setFormData({ ...formData, firearm: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Glock 19 Gen 5"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Ammunition</label>
            <input
              type="text"
              value={formData.ammunition}
              onChange={(e) => setFormData({ ...formData, ammunition: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Federal 124gr HST"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Conditions</label>
            <input
              type="text"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Indoor, good lighting"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              placeholder="How did it feel? What to improve?"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: theme.textPrimary,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                backgroundColor: theme.accent,
                color: theme.bg,
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              SAVE SESSION
            </button>
          </div>
        </form>

        {/* Drill Instructions */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: theme.bg,
          borderRadius: '4px',
          borderLeft: `3px solid ${theme.accent}`
        }}>
          <div style={{
            fontSize: '10px',
            letterSpacing: '1px',
            color: theme.textMuted,
            marginBottom: '12px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            Drill Instructions
          </div>
          <ol style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '11px',
            color: theme.textSecondary,
            lineHeight: '1.6'
          }}>
            {drill.instructions.map((instruction, index) => (
              <li key={index} style={{ marginBottom: '6px' }}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
