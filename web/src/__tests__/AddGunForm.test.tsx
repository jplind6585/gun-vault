/**
 * Component tests for AddGunForm.
 * Verifies validation gating and that onSave is called with correct data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddGunForm } from '../modules/vault/AddGunForm';

// Disable autocomplete and sense-check so tests aren't affected by gun database lookups
vi.mock('../gunDatabase', () => ({
  lookupGunSpec:  () => null,
  suggestMakes:   () => [],
  suggestModels:  () => [],
}));

// gunDatabase may call localStorage – that's fine, jsdom provides it
// but we don't need autocomplete to work for these tests

describe('AddGunForm', () => {
  const onSave   = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function renderForm() {
    return render(<AddGunForm onSave={onSave} onCancel={onCancel} />);
  }

  // ── Required field validation ─────────────────────────────────────────────

  it('submit button is disabled when form is empty', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /add to vault/i })).toBeDisabled();
  });

  it('submit button remains disabled if only make is filled', async () => {
    renderForm();
    await userEvent.type(screen.getByPlaceholderText(/e.g. Glock/i), 'Glock');
    expect(screen.getByRole('button', { name: /add to vault/i })).toBeDisabled();
  });

  it('submit button becomes enabled when all required fields are filled', async () => {
    renderForm();

    await userEvent.type(screen.getByPlaceholderText(/e.g. Glock/i), 'Sig Sauer');
    await userEvent.type(screen.getByPlaceholderText(/e.g. G19 Gen5/i), 'P320');
    await userEvent.type(screen.getByPlaceholderText(/e.g. 9mm/i), '9mm');

    // Select Type chip
    fireEvent.click(screen.getByRole('button', { name: 'Pistol' }));
    // Select Action chip
    fireEvent.click(screen.getByRole('button', { name: 'Semi-Auto' }));

    expect(screen.getByRole('button', { name: /add to vault/i })).not.toBeDisabled();
  });

  // ── onSave payload ────────────────────────────────────────────────────────

  it('calls onSave with trimmed make/model/caliber', async () => {
    renderForm();

    await userEvent.type(screen.getByPlaceholderText(/e.g. Glock/i), '  Glock  ');
    await userEvent.type(screen.getByPlaceholderText(/e.g. G19 Gen5/i), '  G19  ');
    await userEvent.type(screen.getByPlaceholderText(/e.g. 9mm/i), '  9mm  ');
    fireEvent.click(screen.getByRole('button', { name: 'Pistol' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semi-Auto' }));

    fireEvent.click(screen.getByRole('button', { name: /add to vault/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        make:    'Glock',
        model:   'G19',
        caliber: '9mm',
        type:    'Pistol',
        action:  'Semi-Auto',
      })
    );
  });

  it('defaults status to Active when not changed', async () => {
    renderForm();

    await userEvent.type(screen.getByPlaceholderText(/e.g. Glock/i), 'Ruger');
    await userEvent.type(screen.getByPlaceholderText(/e.g. G19 Gen5/i), 'GP100');
    await userEvent.type(screen.getByPlaceholderText(/e.g. 9mm/i), '.357 Mag');
    fireEvent.click(screen.getByRole('button', { name: 'Pistol' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revolver' }));
    fireEvent.click(screen.getByRole('button', { name: /add to vault/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Active' })
    );
  });

  // ── Cancel behavior ───────────────────────────────────────────────────────

  it('calls onCancel when Cancel button is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onCancel when ✕ close button is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onCancel).toHaveBeenCalled();
  });
});
