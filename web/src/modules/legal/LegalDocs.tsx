// Legal Docs — Terms of Service & Privacy Policy
// Content lives in legalContent.json — single source of truth shared with the website.
// To update policy text: edit legalContent.json, then run `npm run sync-legal` to
// regenerate the website's privacy.html and terms.html.
import { useState } from 'react';
import { theme } from './theme';
import legalData from './legalContent.json';

// ── Types ─────────────────────────────────────────────────────────────────────

type Block =
  | { type: 'p'; text: string; strong?: string }
  | { type: 'ul'; items: string[] };

interface Section {
  heading: string;
  blocks: Block[];
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const heading2: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.8px',
  color: theme.textPrimary,
  marginTop: '22px',
  marginBottom: '6px',
  textTransform: 'uppercase',
};

const bodyStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: theme.textSecondary,
  lineHeight: 1.7,
  marginBottom: '4px',
};

const mutedStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '10px',
  color: theme.textMuted,
  lineHeight: 1.6,
};

// ── Block renderer ─────────────────────────────────────────────────────────────

function renderBlock(block: Block, i: number) {
  if (block.type === 'ul') {
    return (
      <ul key={i} style={{ ...bodyStyle, paddingLeft: '18px', marginTop: '4px' }}>
        {block.items.map((item, j) => <li key={j}>{item}</li>)}
      </ul>
    );
  }
  return (
    <p key={i} style={bodyStyle}>
      {block.strong && <strong>{block.strong} </strong>}
      {block.text}
    </p>
  );
}

function renderSections(sections: Section[]) {
  return sections.map((section, i) => (
    <div key={i}>
      <h2 style={heading2}>{section.heading}</h2>
      {(section.blocks as Block[]).map(renderBlock)}
    </div>
  ));
}

// ── Doc components ─────────────────────────────────────────────────────────────

function PrivacyContent() {
  const { privacy, meta } = legalData;
  return (
    <div>
      <p style={mutedStyle}>Effective: {meta.effectiveDate}</p>
      <p style={bodyStyle}>{privacy.intro}</p>
      {renderSections(privacy.sections as Section[])}
    </div>
  );
}

function TermsContent() {
  const { terms, meta } = legalData;
  return (
    <div>
      <p style={mutedStyle}>Effective: {meta.effectiveDate}</p>
      <p style={bodyStyle}>{terms.intro}</p>
      {renderSections(terms.sections as Section[])}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface LegalDocsProps {
  initialTab?: 'terms' | 'privacy';
}

export function LegalDocs({ initialTab = 'terms' }: LegalDocsProps) {
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);
  const { meta } = legalData;

  return (
    <div style={{ minHeight: '100%', backgroundColor: theme.bg, paddingBottom: '100px' }}>
      {/* Tab selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: theme.bg,
        borderBottom: '0.5px solid ' + theme.border,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {(['terms', 'privacy'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '9px',
              backgroundColor: tab === t ? theme.accent : 'transparent',
              border: '0.5px solid ' + (tab === t ? theme.accent : theme.border),
              borderRadius: '6px',
              color: tab === t ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
            }}
          >
            {t === 'terms' ? 'TERMS' : 'PRIVACY'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: theme.textPrimary,
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}>
          {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '20px', letterSpacing: '0.5px' }}>
          {meta.appName} · {meta.company}
        </div>

        {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '0.5px solid ' + theme.border }}>
          <p style={mutedStyle}>
            Questions? Contact us at {meta.contactEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
