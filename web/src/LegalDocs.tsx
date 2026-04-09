// Legal Docs — Terms of Service & Privacy Policy
// Accessible from MoreMenu and Settings footer
import { useState } from 'react';
import { theme } from './theme';

const EFFECTIVE_DATE = 'April 2026';
const CONTACT_EMAIL = 'support@lindcottarmory.com';
const APP_NAME = 'Lindcott Armory';
const COMPANY = 'Lindcott Armory LLC';

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

const body: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: theme.textSecondary,
  lineHeight: 1.7,
  marginBottom: '4px',
};

const muted: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '10px',
  color: theme.textMuted,
  lineHeight: 1.6,
};

// ── Terms of Service ──────────────────────────────────────────────────────────

function TermsContent() {
  return (
    <div>
      <p style={muted}>Effective: {EFFECTIVE_DATE}</p>

      <p style={body}>
        These Terms of Service ("Terms") govern your use of {APP_NAME}, a firearm
        management application operated by {COMPANY} ("we," "us," or "our").
        By using the app you agree to these Terms.
      </p>

      <h2 style={heading2}>1. Eligibility</h2>
      <p style={body}>
        You must be at least 18 years old and legally permitted to own or possess
        firearms under all applicable federal, state, and local laws in your jurisdiction.
        {APP_NAME} is intended solely for lawful firearm owners and collectors.
        By using this app you represent that your use is lawful.
      </p>

      <h2 style={heading2}>2. Lawful Use Only</h2>
      <p style={body}>
        This app is a record-keeping and reference tool. It does not facilitate
        the purchase, sale, or transfer of firearms. You agree not to use the app
        to track firearms you do not lawfully own or possess, to facilitate illegal
        activity, or to circumvent any legal safeguard related to firearm acquisition
        or ownership.
      </p>

      <h2 style={heading2}>3. Your Data</h2>
      <p style={body}>
        You own your data. All information you enter — including firearm descriptions,
        serial numbers, and acquisition details — is stored locally on your device.
        Optional cloud sync stores an encrypted copy on our servers solely to enable
        cross-device access. We do not sell, share, or monetize your data.
      </p>
      <p style={body}>
        You acknowledge that storing sensitive information such as serial numbers
        in any software carries inherent risk. We cannot guarantee that your data
        will never be compromised, and you should maintain your own offline records
        for any legally critical information.
      </p>

      <h2 style={heading2}>4. Legal Proceedings</h2>
      <p style={body}>
        {COMPANY} may be compelled to disclose user data in response to a valid
        court order, subpoena, or other lawful legal process. We will make
        reasonable efforts to notify you prior to such disclosure unless prohibited
        by law. By using this app you acknowledge this possibility.
      </p>

      <h2 style={heading2}>5. AI Features</h2>
      <p style={body}>
        {APP_NAME} may include AI-powered features ("AI Assistant") to help with
        firearm maintenance, historical reference, and collection management.
        AI responses are informational only and do not constitute legal, gunsmithing,
        or safety advice. Always consult a licensed professional for matters of
        safety, legal compliance, or mechanical work.
      </p>
      <p style={body}>
        The AI Assistant is configured to refuse requests related to illegal
        firearm modifications, circumventing legal safeguards, or any activity
        that would violate applicable law. Attempts to misuse the AI Assistant
        may result in account termination.
      </p>

      <h2 style={heading2}>6. Disclaimer of Warranties</h2>
      <p style={body}>
        {APP_NAME} is provided "as is" without warranties of any kind, express or
        implied. We do not warrant that the app will be error-free, uninterrupted,
        or secure. Firearm safety is your responsibility. The app does not replace
        safe storage practices, training, or compliance with applicable law.
      </p>

      <h2 style={heading2}>7. Limitation of Liability</h2>
      <p style={body}>
        To the maximum extent permitted by law, {COMPANY} shall not be liable for
        any indirect, incidental, special, or consequential damages arising from
        your use of the app, including but not limited to data loss, legal consequences
        related to firearm ownership, or reliance on information displayed in the app.
      </p>

      <h2 style={heading2}>8. Account Termination</h2>
      <p style={body}>
        You may delete your account at any time from Settings. We may suspend or
        terminate accounts that violate these Terms. Upon deletion, your data is
        removed from our servers within 30 days.
      </p>

      <h2 style={heading2}>9. Changes to These Terms</h2>
      <p style={body}>
        We may update these Terms from time to time. Continued use of the app after
        changes are posted constitutes your acceptance. Material changes will be
        communicated via in-app notice.
      </p>

      <h2 style={heading2}>10. Contact</h2>
      <p style={body}>
        Questions about these Terms: {CONTACT_EMAIL}
      </p>
    </div>
  );
}

// ── Privacy Policy ────────────────────────────────────────────────────────────

function PrivacyContent() {
  return (
    <div>
      <p style={muted}>Effective: {EFFECTIVE_DATE}</p>

      <p style={body}>
        This Privacy Policy describes how {COMPANY} collects, uses, and protects
        information when you use {APP_NAME}.
      </p>

      <h2 style={heading2}>1. Data You Provide</h2>
      <p style={body}>
        When you use {APP_NAME} you may provide:
      </p>
      <ul style={{ ...body, paddingLeft: '18px', marginTop: '4px' }}>
        <li>Email address (for account creation and sign-in)</li>
        <li>Firearm details (make, model, caliber, serial number, acquisition information)</li>
        <li>Ammo inventory and range session logs</li>
        <li>Optics and accessory information</li>
        <li>Photos you choose to attach to records</li>
        <li>Target analysis data: photos you submit for analysis, shot coordinates, and computed ballistic statistics stored locally and optionally synced to our servers.</li>
        <li>Insurance export data: when you use the insurance claim export feature, gun details including serial numbers are included in the exported file. This file is saved locally to your device.</li>
      </ul>

      <h2 style={heading2}>2. How Data Is Stored</h2>
      <p style={body}>
        <strong>Local storage (default):</strong> All data is stored on your device
        using your browser's local storage. It never leaves your device unless you
        enable cloud sync.
      </p>
      <p style={body}>
        <strong>Cloud sync (optional):</strong> If you sign in, your data is
        synced to servers operated by Supabase, Inc. (supabase.com) in the United
        States. Data is encrypted in transit and at rest. You can disable sync by
        using the app without signing in, or by deleting your account.
      </p>

      <h2 style={heading2}>3. Data We Do Not Collect</h2>
      <ul style={{ ...body, paddingLeft: '18px', marginTop: '4px' }}>
        <li>We do not sell your data to third parties</li>
        <li>We do not serve ads or share data with advertising networks</li>
        <li>We do not collect location data</li>
        <li>We do not track your usage for marketing profiling</li>
      </ul>

      <h2 style={heading2}>4. AI Assistant</h2>
      <p style={body}>
        When you use the AI Assistant, your query is sent to Anthropic, Inc.
        (anthropic.com) for processing. Queries are not stored by us beyond the
        session. Anthropic's privacy policy applies to query processing.
        Do not include personally identifying information in AI queries.
      </p>

      <h2 style={heading2}>5. Sensitive Data</h2>
      <p style={body}>
        Firearm serial numbers and acquisition records are sensitive. We treat
        this data with care but cannot guarantee absolute security. You should
        maintain independent records for any legally critical information.
        Avoid storing information you would not want disclosed in response to
        a lawful legal process.
      </p>

      <h2 style={heading2}>6. Your Rights</h2>
      <p style={body}>
        You may at any time:
      </p>
      <ul style={{ ...body, paddingLeft: '18px', marginTop: '4px' }}>
        <li>Export a full copy of your data (Settings → Backup & Restore)</li>
        <li>Delete all data from your device (Settings → Delete Account)</li>
        <li>Request deletion of your cloud data by deleting your account</li>
        <li>Contact us to request manual data deletion: {CONTACT_EMAIL}</li>
      </ul>
      <p style={body}>
        Account deletion removes all your data from our servers within 30 days.
      </p>

      <h2 style={heading2}>7. Children</h2>
      <p style={body}>
        {APP_NAME} is not intended for users under 18. We do not knowingly collect
        information from minors. If you believe a minor has created an account,
        contact us at {CONTACT_EMAIL} and we will delete it.
      </p>

      <h2 style={heading2}>8. Changes to This Policy</h2>
      <p style={body}>
        We may update this policy periodically. Material changes will be communicated
        via in-app notice. Continued use constitutes acceptance.
      </p>

      <h2 style={heading2}>9. Contact</h2>
      <p style={body}>
        Privacy questions: {CONTACT_EMAIL}
        {'\n'}{COMPANY}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LegalDocsProps {
  initialTab?: 'terms' | 'privacy';
}

export function LegalDocs({ initialTab = 'terms' }: LegalDocsProps) {
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);

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
          {APP_NAME} · {COMPANY}
        </div>

        {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '0.5px solid ' + theme.border }}>
          <p style={muted}>
            Questions? Contact us at {CONTACT_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}
