import { useState, useEffect } from 'react';
import { theme } from './theme';
import type { Optic, Mount, OpticAssignment, OpticZero, Gun } from './types';
import {
  getOpticById, updateOptic, deleteOptic,
  getMountsForOptic, addMount, updateMount, deleteMount,
  getAllAssignments, getActiveAssignmentForOptic,
  mountOpticOnGun, removeOpticFromGun,
  getAllZeros, getZerosForAssignment, getActiveZeroForAssignment, addZero, deleteZero,
  getAllGuns, getAllAmmo,
} from './storage';

interface OpticDetailProps {
  opticId: string;
  onBack: () => void;
  onDeleted: () => void;
}

type DetailTab = 'overview' | 'zeros' | 'mount';

export function OpticDetail({ opticId, onBack, onDeleted }: OpticDetailProps) {
  const [optic, setOptic]             = useState<Optic | null>(null);
  const [mounts, setMounts]           = useState<Mount[]>([]);
  const [assignments, setAssignments] = useState<OpticAssignment[]>([]);
  const [zeros, setZeros]             = useState<OpticZero[]>([]);
  const [guns, setGuns]               = useState<Gun[]>([]);
  const [tab, setTab]                 = useState<DetailTab>('overview');
  const [showReassign, setShowReassign] = useState(false);
  const [showZeroForm, setShowZeroForm] = useState(false);
  const [showAddMount, setShowAddMount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function reload() {
    const o = getOpticById(opticId);
    if (!o) return;
    setOptic(o);
    setMounts(getMountsForOptic(opticId));
    const allA = getAllAssignments().filter(a => a.opticId === opticId).sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
    setAssignments(allA);
    const allZ = getAllZeros().filter(z => z.opticId === opticId).sort((a, b) => b.date.localeCompare(a.date));
    setZeros(allZ);
    setGuns(getAllGuns());
  }

  useEffect(() => { reload(); }, [opticId]);

  if (!optic) return null;

  const gunMap = new Map(guns.map(g => [g.id, g]));
  const activeAssignment = assignments.find(a => !a.removedDate);
  const activeGun = activeAssignment ? gunMap.get(activeAssignment.gunId) : undefined;
  const activeMount = activeAssignment?.mountId ? mounts.find(m => m.id === activeAssignment.mountId) : undefined;
  const activeZero = activeAssignment ? zeros.find(z => z.assignmentId === activeAssignment.id && z.isActive) : undefined;

  // Zero status
  const zeroStatus: 'good' | 'unverified' | 'none' = activeZero
    ? 'good'
    : activeAssignment
    ? 'unverified'
    : 'none';

  const zeroStatusColor = zeroStatus === 'good' ? theme.green : zeroStatus === 'unverified' ? theme.accent : theme.textMuted;

  const mag = optic.magnificationMax
    ? optic.magnificationMin === optic.magnificationMax
      ? `${optic.magnificationMax}x`
      : `${optic.magnificationMin ?? 1}–${optic.magnificationMax}x`
    : undefined;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
    borderRadius: '6px', color: theme.textPrimary,
    fontFamily: 'monospace', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px',
    color: theme.textMuted, textTransform: 'uppercase', marginBottom: '5px',
  };

  function specRow(label: string, value: string | number | undefined | null) {
    if (value == null || value === '') return null;
    return (
      <div key={label} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 0', borderBottom: `0.5px solid ${theme.border}`,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{label}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, fontWeight: 600 }}>{value}</span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100%', paddingBottom: '32px' }}>

      {/* Hero / identity */}
      <div style={{ padding: '16px', borderBottom: `0.5px solid ${theme.border}` }}>
        <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary, marginBottom: '2px' }}>
          {optic.brand} {optic.model}
        </div>
        {mag && (
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>
            {mag}{optic.objectiveMM ? `×${optic.objectiveMM}` : ''}{optic.focalPlane && optic.focalPlane !== 'N/A' ? ` · ${optic.focalPlane}` : ''}
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: zeroStatusColor }} />
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: zeroStatusColor }}>
              {zeroStatus === 'good'
                ? `Zeroed ${activeZero!.zeroDistanceYards}yd`
                : zeroStatus === 'unverified'
                ? 'Zero unverified'
                : 'No zero'}
            </span>
          </div>
          {activeGun && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
              → {activeGun.make} {activeGun.model}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: `0.5px solid ${theme.border}`,
        position: 'sticky', top: 0, backgroundColor: theme.bg, zIndex: 5,
      }}>
        {(['overview', 'zeros', 'mount'] as DetailTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px',
              background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent',
              color: tab === t ? theme.accent : theme.textMuted,
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.8px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {t === 'overview' ? 'OVERVIEW' : t === 'zeros' ? `ZEROS (${zeros.length})` : 'MOUNT'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            {/* Current assignment */}
            <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '10px' }}>CURRENT ASSIGNMENT</div>
              {activeGun ? (
                <>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
                    {activeGun.make} {activeGun.model}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '12px' }}>
                    Mounted {formatDate(activeAssignment!.assignedDate)}
                    {activeMount ? ` · ${activeMount.brand} ${activeMount.model}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowReassign(true)}
                      style={{
                        flex: 1, padding: '8px',
                        backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`,
                        borderRadius: '5px', color: theme.textSecondary,
                        fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      REASSIGN
                    </button>
                    <button
                      onClick={() => {
                        if (activeAssignment) removeOpticFromGun(activeAssignment.id, 'Removed');
                        reload();
                      }}
                      style={{
                        flex: 1, padding: '8px',
                        backgroundColor: 'transparent', border: `0.5px solid rgba(255,107,107,0.4)`,
                        borderRadius: '5px', color: '#ff9999',
                        fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>Not currently mounted on any firearm.</div>
                  <button
                    onClick={() => setShowReassign(true)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: theme.accent, border: 'none',
                      borderRadius: '5px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    MOUNT ON GUN
                  </button>
                </div>
              )}
            </div>

            {/* Specs */}
            <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '4px' }}>SPECIFICATIONS</div>
              {specRow('Type', optic.opticType)}
              {specRow('Magnification', mag)}
              {specRow('Objective', optic.objectiveMM ? `${optic.objectiveMM}mm` : undefined)}
              {specRow('Tube Diameter', optic.tubeDiameterMM ? `${optic.tubeDiameterMM}mm` : undefined)}
              {specRow('Focal Plane', optic.focalPlane !== 'N/A' ? optic.focalPlane : undefined)}
              {specRow('Reticle', optic.reticleName)}
              {specRow('Illuminated', optic.illuminated != null ? (optic.illuminated ? 'Yes' : 'No') : undefined)}
              {specRow('Turret Unit', optic.turretUnit)}
              {specRow('Click Value', optic.turretUnit === 'MOA' && optic.clickValueMOA ? `${optic.clickValueMOA} MOA/click` : optic.turretUnit === 'MRAD' && optic.clickValueMRAD ? `${optic.clickValueMRAD} MRAD/click` : undefined)}
              {specRow('Parallax', optic.parallaxType)}
              {specRow('Battery', optic.batteryType)}
              {specRow('Weight', optic.weightOz ? `${optic.weightOz} oz` : undefined)}
              {specRow('Serial', optic.serialNumber)}
            </div>

            {/* Purchase */}
            {(optic.purchasePrice || optic.purchaseDate) && (
              <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '4px' }}>PURCHASE</div>
                {specRow('Price', optic.purchasePrice ? `$${optic.purchasePrice.toLocaleString()}` : undefined)}
                {specRow('Date', optic.purchaseDate ? formatDate(optic.purchaseDate) : undefined)}
                {specRow('Purchased From', optic.purchasedFrom)}
              </div>
            )}

            {/* Assignment history */}
            {assignments.filter(a => a.removedDate).length > 0 && (
              <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '10px' }}>ASSIGNMENT HISTORY</div>
                {assignments.filter(a => a.removedDate).map(a => {
                  const g = gunMap.get(a.gunId);
                  return (
                    <div key={a.id} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: `0.5px solid ${theme.border}` }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>
                        {g ? `${g.make} ${g.model}` : 'Unknown gun'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                        {formatDate(a.assignedDate)} → {a.removedDate ? formatDate(a.removedDate) : 'Current'}
                        {a.removalReason ? ` · ${a.removalReason}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {optic.notes && (
              <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '8px' }}>NOTES</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.6 }}>{optic.notes}</div>
              </div>
            )}

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  width: '100%', padding: '10px',
                  backgroundColor: 'transparent', border: `0.5px solid rgba(255,107,107,0.3)`,
                  borderRadius: '6px', color: '#ff9999',
                  fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                }}
              >
                DELETE OPTIC
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}>CANCEL</button>
                <button
                  onClick={() => { deleteOptic(opticId); onDeleted(); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#ff6b6b', border: 'none', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  CONFIRM DELETE
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ZEROS TAB ────────────────────────────────────────── */}
        {tab === 'zeros' && (
          <div>
            {activeAssignment && (
              <button
                onClick={() => setShowZeroForm(true)}
                style={{
                  width: '100%', padding: '11px',
                  backgroundColor: theme.accent, border: 'none',
                  borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', marginBottom: '14px',
                }}
              >
                + LOG NEW ZERO
              </button>
            )}

            {!activeAssignment && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,212,59,0.06)', border: `0.5px solid ${theme.accent}`, borderRadius: '6px', marginBottom: '14px', fontFamily: 'monospace', fontSize: '11px', color: theme.accent }}>
                Mount this optic on a gun before logging a zero.
              </div>
            )}

            {zeros.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>
                No zeros logged yet.
              </div>
            ) : (
              zeros.map(z => {
                const assignment = assignments.find(a => a.id === z.assignmentId);
                const zGun = assignment ? gunMap.get(assignment.gunId) : undefined;
                const isActive = z.isActive;
                return (
                  <div
                    key={z.id}
                    style={{
                      backgroundColor: theme.surface,
                      border: `0.5px solid ${isActive ? theme.green : theme.border}`,
                      borderRadius: '8px', padding: '14px', marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: isActive ? theme.green : theme.textSecondary }}>
                          {z.zeroDistanceYards} yd
                        </div>
                        {zGun && (
                          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                            {zGun.make} {zGun.model}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {isActive && (
                          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.green, fontWeight: 700, marginBottom: '4px' }}>ACTIVE</div>
                        )}
                        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>{formatDate(z.date)}</div>
                      </div>
                    </div>
                    {z.ammoDescription && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginBottom: '6px' }}>
                        Ammo: {z.ammoDescription}
                      </div>
                    )}
                    {(z.elevationClicksFromMechanical != null || z.windageClicksFromMechanical != null) && (
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
                        {z.elevationClicksFromMechanical != null && (
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>ELEV </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, fontWeight: 700 }}>
                              {z.elevationClicksFromMechanical > 0 ? '+' : ''}{z.elevationClicksFromMechanical} clicks
                            </span>
                          </div>
                        )}
                        {z.windageClicksFromMechanical != null && (
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>WIND </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, fontWeight: 700 }}>
                              {z.windageClicksFromMechanical > 0 ? '+' : ''}{z.windageClicksFromMechanical} clicks
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {(z.tempF != null || z.altitudeFt != null) && (
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                        {z.tempF != null ? `${z.tempF}°F` : ''}{z.tempF != null && z.altitudeFt != null ? ' · ' : ''}{z.altitudeFt != null ? `${z.altitudeFt.toLocaleString()}ft` : ''}
                      </div>
                    )}
                    {z.notes && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px', lineHeight: 1.5 }}>{z.notes}</div>
                    )}
                    <button
                      onClick={() => { deleteZero(z.id); reload(); }}
                      style={{ marginTop: '8px', background: 'none', border: 'none', color: 'rgba(255,107,107,0.5)', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', padding: 0 }}
                    >
                      DELETE
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── MOUNT TAB ────────────────────────────────────────── */}
        {tab === 'mount' && (
          <div>
            <button
              onClick={() => setShowAddMount(true)}
              style={{
                width: '100%', padding: '11px',
                backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`,
                borderRadius: '6px', color: theme.textSecondary,
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', marginBottom: '14px',
              }}
            >
              + ADD MOUNT
            </button>

            {mounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>
                No mounts logged for this optic.
              </div>
            ) : (
              mounts.map(mount => (
                <div
                  key={mount.id}
                  style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '8px', padding: '14px', marginBottom: '10px' }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
                    {mount.brand} {mount.model}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '10px' }}>
                    {mount.mountType}{mount.heightMM ? ` · ${mount.heightMM}mm height` : ''}{mount.railInterface ? ` · ${mount.railInterface}` : ''}
                  </div>

                  {/* Torque values — displayed large */}
                  {(mount.ringTorqueInLbs || mount.baseTorqueInLbs) && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      {mount.ringTorqueInLbs && (
                        <div style={{ flex: 1, backgroundColor: theme.bg, borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>RING TORQUE</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.accent }}>{mount.ringTorqueInLbs}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>in-lbs</div>
                        </div>
                      )}
                      {mount.baseTorqueInLbs && (
                        <div style={{ flex: 1, backgroundColor: theme.bg, borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '4px' }}>BASE TORQUE</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.accent }}>{mount.baseTorqueInLbs}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>in-lbs</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Torque confirm */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        updateMount(mount.id, { lastTorqueConfirmed: new Date().toISOString().slice(0, 10) });
                        reload();
                      }}
                      style={{
                        padding: '7px 14px', backgroundColor: theme.accent, border: 'none',
                        borderRadius: '4px', color: theme.bg, fontFamily: 'monospace',
                        fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      ✓ CONFIRM TORQUE
                    </button>
                    {mount.lastTorqueConfirmed && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                        Last: {formatDate(mount.lastTorqueConfirmed)}
                      </span>
                    )}
                  </div>

                  {mount.returnToZeroRated && (
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.green, marginTop: '8px' }}>✓ Return-to-zero rated</div>
                  )}
                  {mount.isQD && (
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.blue, marginTop: '4px' }}>QD mount</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {showReassign && (
        <ReassignModal
          opticId={opticId}
          mounts={mounts}
          guns={guns}
          currentGunId={activeAssignment?.gunId}
          onSave={(gunId, mountId) => {
            mountOpticOnGun(opticId, gunId, mountId, 'Reassigned');
            reload();
            setShowReassign(false);
          }}
          onCancel={() => setShowReassign(false)}
        />
      )}

      {showZeroForm && activeAssignment && (
        <ZeroForm
          assignmentId={activeAssignment.id}
          opticId={opticId}
          gunId={activeAssignment.gunId}
          optic={optic}
          onSave={(z) => {
            addZero(z);
            reload();
            setShowZeroForm(false);
          }}
          onCancel={() => setShowZeroForm(false)}
        />
      )}

      {showAddMount && (
        <AddMountForm
          opticId={opticId}
          onSave={(data) => {
            addMount(data);
            reload();
            setShowAddMount(false);
          }}
          onCancel={() => setShowAddMount(false)}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────

function ReassignModal({
  opticId, guns, mounts, currentGunId,
  onSave, onCancel,
}: {
  opticId: string;
  guns: Gun[];
  mounts: Mount[];
  currentGunId?: string;
  onSave: (gunId: string, mountId?: string) => void;
  onCancel: () => void;
}) {
  const [gunId, setGunId]   = useState(currentGunId || '');
  const [mountId, setMountId] = useState('');

  const availableGuns = guns.filter(g => g.status !== 'Sold');

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: theme.surface, borderRadius: '12px 12px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '16px', letterSpacing: '1px' }}>
          MOUNT ON GUN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Select Gun *</div>
            <select
              value={gunId}
              onChange={e => setGunId(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', outline: 'none' }}
            >
              <option value="">— Select —</option>
              {availableGuns.map(g => (
                <option key={g.id} value={g.id}>{g.make} {g.model} ({g.caliber})</option>
              ))}
            </select>
          </div>
          {mounts.length > 0 && (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Select Mount (optional)</div>
              <select
                value={mountId}
                onChange={e => setMountId(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', outline: 'none' }}
              >
                <option value="">— None —</option>
                {mounts.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
            <button
              onClick={() => gunId && onSave(gunId, mountId || undefined)}
              disabled={!gunId}
              style={{ flex: 2, padding: '10px', backgroundColor: gunId ? theme.accent : theme.border, border: 'none', borderRadius: '6px', color: gunId ? theme.bg : theme.textMuted, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: gunId ? 'pointer' : 'default' }}
            >
              CONFIRM MOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Zero Form ────────────────────────────────────────────────────────────────

function ZeroForm({
  assignmentId, opticId, gunId, optic,
  onSave, onCancel,
}: {
  assignmentId: string;
  opticId: string;
  gunId: string;
  optic: Optic;
  onSave: (z: Omit<OpticZero, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [dist, setDist]     = useState('');
  const [ammoDesc, setAmmoDesc] = useState('');
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [elevClicks, setElevClicks] = useState('');
  const [windClicks, setWindClicks] = useState('');
  const [temp, setTemp]     = useState('');
  const [alt, setAlt]       = useState('');
  const [notes, setNotes]   = useState('');

  const unit = optic.turretUnit || 'MOA';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`, borderRadius: '6px',
    color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ margin: '20px auto', maxWidth: '480px', backgroundColor: theme.surface, borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '16px', letterSpacing: '1px' }}>LOG ZERO</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Distance (yd) *</div>
              <input type="number" style={inputStyle} value={dist} onChange={e => setDist(e.target.value)} placeholder="100" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Date</div>
              <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Ammo</div>
            <input style={inputStyle} value={ammoDesc} onChange={e => setAmmoDesc(e.target.value)} placeholder="Federal 77gr OTM" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Elev Clicks (from zero)</div>
              <input type="number" style={inputStyle} value={elevClicks} onChange={e => setElevClicks(e.target.value)} placeholder="+12" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Wind Clicks (from zero)</div>
              <input type="number" style={inputStyle} value={windClicks} onChange={e => setWindClicks(e.target.value)} placeholder="-3" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Temp (°F)</div>
              <input type="number" style={inputStyle} value={temp} onChange={e => setTemp(e.target.value)} placeholder="72" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Altitude (ft)</div>
              <input type="number" style={inputStyle} value={alt} onChange={e => setAlt(e.target.value)} placeholder="1200" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Notes</div>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions, load details..." />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
            <button
              onClick={() => {
                if (!dist) return;
                onSave({
                  assignmentId, opticId, gunId,
                  zeroDistanceYards: parseFloat(dist),
                  ammoDescription: ammoDesc.trim() || undefined,
                  date,
                  elevationClicksFromMechanical: elevClicks !== '' ? parseInt(elevClicks) : undefined,
                  windageClicksFromMechanical: windClicks !== '' ? parseInt(windClicks) : undefined,
                  tempF: temp !== '' ? parseFloat(temp) : undefined,
                  altitudeFt: alt !== '' ? parseFloat(alt) : undefined,
                  notes: notes.trim() || undefined,
                  isActive: true,
                });
              }}
              disabled={!dist}
              style={{ flex: 2, padding: '11px', backgroundColor: dist ? theme.accent : theme.border, border: 'none', borderRadius: '6px', color: dist ? theme.bg : theme.textMuted, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: dist ? 'pointer' : 'default' }}
            >
              SAVE ZERO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Mount Form ───────────────────────────────────────────────────────────

const MOUNT_TYPES = ['Rings', 'Cantilever', 'QD Mount', 'Co-Witness', 'Offset', 'Integrated', 'Other'] as const;
const RAIL_INTERFACES = ['Picatinny / MIL-STD-1913', 'MLOK', 'KeyMod', 'Weaver', 'Dovetail', 'Proprietary'] as const;

function AddMountForm({
  opticId, onSave, onCancel,
}: {
  opticId: string;
  onSave: (m: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [brand, setBrand]           = useState('');
  const [model, setModel]           = useState('');
  const [mountType, setMountType]   = useState<typeof MOUNT_TYPES[number]>('Rings');
  const [height, setHeight]         = useState('');
  const [ringDiam, setRingDiam]     = useState('');
  const [ringTorque, setRingTorque] = useState('');
  const [baseTorque, setBaseTorque] = useState('');
  const [rail, setRail]             = useState<typeof RAIL_INTERFACES[number]>('Picatinny / MIL-STD-1913');
  const [isQD, setIsQD]             = useState(false);
  const [rtz, setRtz]               = useState(false);
  const [price, setPrice]           = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`, borderRadius: '6px',
    color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ margin: '20px auto', maxWidth: '480px', backgroundColor: theme.surface, borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '16px', letterSpacing: '1px' }}>ADD MOUNT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Brand *</div>
              <input style={inputStyle} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Nightforce" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Model *</div>
              <input style={inputStyle} value={model} onChange={e => setModel(e.target.value)} placeholder="BEAST" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {MOUNT_TYPES.map(t => (
                <button key={t} onClick={() => setMountType(t)} style={{ padding: '5px 9px', backgroundColor: mountType === t ? theme.accent : 'transparent', border: `0.5px solid ${mountType === t ? theme.accent : theme.border}`, borderRadius: '4px', color: mountType === t ? theme.bg : theme.textSecondary, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 600 }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Ring Torque (in-lbs)</div>
              <input type="number" style={inputStyle} value={ringTorque} onChange={e => setRingTorque(e.target.value)} placeholder="15" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Base Torque (in-lbs)</div>
              <input type="number" style={inputStyle} value={baseTorque} onChange={e => setBaseTorque(e.target.value)} placeholder="65" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Height (mm)</div>
              <input type="number" style={inputStyle} value={height} onChange={e => setHeight(e.target.value)} placeholder="35" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Ring Diam (mm)</div>
              <input type="number" style={inputStyle} value={ringDiam} onChange={e => setRingDiam(e.target.value)} placeholder="30" />
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '5px', textTransform: 'uppercase' }}>Price ($)</div>
              <input type="number" style={inputStyle} value={price} onChange={e => setPrice(e.target.value)} placeholder="199" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsQD(v => !v)} style={{ flex: 1, padding: '9px', backgroundColor: isQD ? theme.accent : 'transparent', border: `0.5px solid ${isQD ? theme.accent : theme.border}`, borderRadius: '5px', color: isQD ? theme.bg : theme.textSecondary, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>QD</button>
            <button onClick={() => setRtz(v => !v)} style={{ flex: 2, padding: '9px', backgroundColor: rtz ? theme.accent : 'transparent', border: `0.5px solid ${rtz ? theme.accent : theme.border}`, borderRadius: '5px', color: rtz ? theme.bg : theme.textSecondary, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>RETURN TO ZERO RATED</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
            <button
              onClick={() => {
                if (!brand.trim() || !model.trim()) return;
                onSave({
                  opticId,
                  brand: brand.trim(), model: model.trim(),
                  mountType,
                  heightMM: height ? parseFloat(height) : undefined,
                  ringDiameterMM: ringDiam ? parseFloat(ringDiam) : undefined,
                  ringTorqueInLbs: ringTorque ? parseFloat(ringTorque) : undefined,
                  baseTorqueInLbs: baseTorque ? parseFloat(baseTorque) : undefined,
                  railInterface: rail,
                  isQD, returnToZeroRated: rtz,
                  purchasePrice: price ? parseFloat(price) : undefined,
                });
              }}
              disabled={!brand.trim() || !model.trim()}
              style={{ flex: 2, padding: '11px', backgroundColor: brand.trim() && model.trim() ? theme.accent : theme.border, border: 'none', borderRadius: '6px', color: brand.trim() && model.trim() ? theme.bg : theme.textMuted, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              SAVE MOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
