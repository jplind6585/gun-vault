import { useState, useEffect } from 'react';
import { theme } from './theme';
import { getAllGuns } from './storage';
import type { Gun } from './types';

interface SmartSearchProps {
  onClose: () => void;
  onNavigate: (view: string, data?: any) => void;
}

export function SmartSearch({ onClose, onNavigate }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0); // Reset selection when results change
  }, [results]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Smart search across multiple data types
    const guns = getAllGuns();
    const searchResults: any[] = [];

    const lowerQuery = query.toLowerCase();

    // Search guns
    guns.forEach(gun => {
      const score = calculateRelevance(lowerQuery, gun);
      if (score > 0) {
        searchResults.push({
          type: 'gun',
          title: `${gun.make} ${gun.model}`,
          subtitle: gun.caliber,
          data: gun,
          score
        });
      }
    });

    // Search calibers
    const caliberMatches = [
      '9mm', '.45 ACP', '.308 Winchester', '5.56 NATO', '.223 Remington',
      '6.5 Creedmoor', '.300 Win Mag', '12 Gauge', '.40 S&W', '10mm Auto'
    ].filter(cal => cal.toLowerCase().includes(lowerQuery));

    caliberMatches.forEach(cal => {
      searchResults.push({
        type: 'caliber',
        title: cal,
        subtitle: 'Caliber Database',
        score: 50
      });
    });

    // Sort by relevance
    searchResults.sort((a, b) => b.score - a.score);
    setResults(searchResults.slice(0, 8));
  }, [query]);

  function calculateRelevance(query: string, gun: Gun): number {
    let score = 0;
    const make = gun.make.toLowerCase();
    const model = gun.model.toLowerCase();
    const caliber = gun.caliber.toLowerCase();

    if (make === query) score += 100;
    else if (make.startsWith(query)) score += 80;
    else if (make.includes(query)) score += 50;

    if (model === query) score += 100;
    else if (model.startsWith(query)) score += 80;
    else if (model.includes(query)) score += 50;

    if (caliber.includes(query)) score += 60;

    return score;
  }

  function handleResultClick(result: any) {
    if (result.type === 'gun') {
      onNavigate('vault', result.data);
    } else if (result.type === 'caliber') {
      onNavigate('caliber');
    }
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: theme.surface,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ padding: '16px', borderBottom: `0.5px solid ${theme.border}` }}>
          <input
            type="text"
            placeholder="Search guns, calibers, modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: theme.bg,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.textPrimary,
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.length === 0 && query.length >= 2 && (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: theme.textMuted,
              fontSize: '14px'
            }}>
              No results found for "{query}"
            </div>
          )}

          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => handleResultClick(result)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: selectedIndex === i ? theme.bg : 'transparent',
                border: 'none',
                borderBottom: `0.5px solid ${theme.border}`,
                borderLeft: selectedIndex === i ? `3px solid ${theme.accent}` : '3px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.bg;
                setSelectedIndex(i);
              }}
              onMouseLeave={(e) => {
                if (selectedIndex !== i) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                color: theme.textPrimary,
                fontWeight: 600,
                marginBottom: '2px'
              }}>
                {result.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.textSecondary
              }}>
                {result.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: `0.5px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              color: theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            ✕ CLOSE
          </button>
          {query.length >= 2 && (
            <div style={{
              fontSize: '11px',
              color: theme.textMuted,
              fontFamily: 'monospace'
            }}>
              {results.length} results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
