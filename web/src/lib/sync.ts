// Supabase sync layer — fire-and-forget on top of localStorage
// Storage functions still read from localStorage (fast, offline-safe).
// Every write also syncs to Supabase in the background.
// On login, Supabase data is pulled down and hydrates localStorage.

import { supabase } from './supabase';
import type { Gun, Session, AmmoLot, Cartridge, TargetAnalysisRecord, Optic, Mount, OpticAssignment, OpticZero } from '../types';

// ── Auth helper ──────────────────────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Mappers: TypeScript (camelCase) ↔ Postgres (snake_case) ─────────────────

function gunToDb(gun: Gun, userId: string) {
  return {
    id: gun.id,
    user_id: userId,
    make: gun.make,
    model: gun.model,
    display_name: gun.displayName,
    caliber: gun.caliber,
    action: gun.action,
    type: gun.type,
    serial_number: gun.serialNumber,
    acquired_date: gun.acquiredDate,
    acquired_price: gun.acquiredPrice,
    acquired_from: gun.acquiredFrom,
    condition: gun.condition,
    status: gun.status,
    barrel_length: gun.barrelLength,
    overall_length: gun.overallLength,
    weight: gun.weight,
    finish: gun.finish,
    stock_grip: gun.stockGrip,
    notes: gun.notes,
    image_url: gun.imageUrl,
    insurance_value: gun.insuranceValue,
    estimated_fmv: gun.estimatedFMV,
    fmv_updated: gun.fmvUpdated,
    nfa_item: gun.nfaItem,
    nfa_approval_date: gun.nfaApprovalDate,
    suppressor_host: gun.suppressorHost,
    capacity: gun.capacity,
    purpose: gun.purpose,
    cr_flag: gun.crFlag,
    last_cleaned_date: gun.lastCleanedDate,
    last_cleaned_round_count: gun.lastCleanedRoundCount,
    last_zero_date: gun.lastZeroDate,
    last_zero_distance: gun.lastZeroDistance,
    open_issues: gun.openIssues,
    accessories: gun.accessories,
    sold_date: gun.soldDate,
    sold_price: gun.soldPrice,
    receipt_image_url: gun.receiptImageUrl,
    created_at: gun.createdAt,
    updated_at: gun.updatedAt,
  };
}

export function dbToGun(row: Record<string, unknown>): Gun {
  return {
    id: row.id as string,
    make: row.make as string,
    model: row.model as string,
    displayName: row.display_name as string | undefined,
    caliber: row.caliber as string,
    action: row.action as Gun['action'],
    type: row.type as Gun['type'],
    serialNumber: row.serial_number as string | undefined,
    acquiredDate: row.acquired_date as string | undefined,
    acquiredPrice: row.acquired_price as number | undefined,
    acquiredFrom: row.acquired_from as string | undefined,
    condition: row.condition as Gun['condition'],
    status: row.status as Gun['status'],
    barrelLength: row.barrel_length as number | undefined,
    overallLength: row.overall_length as number | undefined,
    weight: row.weight as number | undefined,
    finish: row.finish as string | undefined,
    stockGrip: row.stock_grip as string | undefined,
    notes: row.notes as string | undefined,
    imageUrl: row.image_url as string | undefined,
    insuranceValue: row.insurance_value as number | undefined,
    estimatedFMV: row.estimated_fmv as number | undefined,
    fmvUpdated: row.fmv_updated as string | undefined,
    nfaItem: row.nfa_item as boolean | undefined,
    nfaApprovalDate: row.nfa_approval_date as string | undefined,
    suppressorHost: row.suppressor_host as boolean | undefined,
    capacity: row.capacity as number | undefined,
    purpose: row.purpose as Gun['purpose'],
    crFlag: row.cr_flag as boolean | undefined,
    lastCleanedDate: row.last_cleaned_date as string | undefined,
    lastCleanedRoundCount: row.last_cleaned_round_count as number | undefined,
    lastZeroDate: row.last_zero_date as string | undefined,
    lastZeroDistance: row.last_zero_distance as number | undefined,
    openIssues: row.open_issues as string | undefined,
    accessories: row.accessories as Gun['accessories'],
    soldDate: row.sold_date as string | undefined,
    soldPrice: row.sold_price as number | undefined,
    receiptImageUrl: row.receipt_image_url as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function sessionToDb(session: Session, userId: string) {
  return {
    id: session.id,
    user_id: userId,
    gun_id: session.gunId,
    date: session.date,
    rounds_expended: session.roundsExpended,
    location: session.location,
    indoor_outdoor: session.indoorOutdoor,
    purpose: session.purpose,
    distance_yards: session.distanceYards,
    issues: session.issues,
    issue_types: session.issueTypes,
    issue_description: session.issueDescription,
    notes: session.notes,
    ai_narrative: session.aiNarrative,
    ammo_lot_id: session.ammoLotId,
    session_cost: session.sessionCost,
    is_carry_gun: session.isCarryGun,
    range_day_id: session.rangeDayId,
    target_analysis_id: session.targetAnalysisId,
    strings: session.strings,
    target_photos: session.targetPhotos,
    created_at: session.createdAt,
  };
}

export function dbToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    gunId: row.gun_id as string,
    date: row.date as string,
    roundsExpended: row.rounds_expended as number,
    location: row.location as string | undefined,
    indoorOutdoor: row.indoor_outdoor as Session['indoorOutdoor'],
    purpose: row.purpose as Session['purpose'],
    distanceYards: row.distance_yards as number | undefined,
    issues: row.issues as boolean | undefined,
    issueTypes: row.issue_types as Session['issueTypes'],
    issueDescription: row.issue_description as string | undefined,
    notes: row.notes as string | undefined,
    aiNarrative: row.ai_narrative as string | undefined,
    ammoLotId: row.ammo_lot_id as string | undefined,
    sessionCost: row.session_cost as number | undefined,
    isCarryGun: row.is_carry_gun as boolean | undefined,
    rangeDayId: row.range_day_id as string | undefined,
    targetAnalysisId: row.target_analysis_id as string | undefined,
    strings: row.strings as Session['strings'],
    targetPhotos: row.target_photos as Session['targetPhotos'],
    createdAt: row.created_at as string | undefined,
  };
}

function ammoToDb(ammo: AmmoLot, userId: string) {
  return {
    id: ammo.id,
    user_id: userId,
    caliber: ammo.caliber,
    brand: ammo.brand,
    product_line: ammo.productLine,
    grain_weight: ammo.grainWeight,
    bullet_type: ammo.bulletType,
    quantity: ammo.quantity,
    advertised_fps: ammo.advertisedFPS,
    actual_fps: ammo.actualFPS,
    muzzle_energy: ammo.muzzleEnergy,
    ballistic_coefficient: ammo.ballisticCoefficient,
    standard_deviation: ammo.standardDeviation,
    quantity_purchased: ammo.quantityPurchased,
    purchase_date: ammo.purchaseDate,
    purchase_price_per_round: ammo.purchasePricePerRound,
    current_market_price: ammo.currentMarketPrice,
    average_cost_per_round: ammo.averageCostPerRound,
    category: ammo.category,
    storage_location: ammo.storageLocation,
    lot_number: ammo.lotNumber,
    is_handload: ammo.isHandload,
    reload_batch_id: ammo.reloadBatchId,
    assigned_gun_ids: ammo.assignedGunIds,
    is_favorite: ammo.isFavorite,
    min_stock_alert: ammo.minStockAlert,
    reserved: ammo.reserved,
    purchase_history: ammo.purchaseHistory,
    notes: ammo.notes,
    created_at: ammo.createdAt,
    updated_at: ammo.updatedAt,
  };
}

export function dbToAmmo(row: Record<string, unknown>): AmmoLot {
  return {
    id: row.id as string,
    caliber: row.caliber as string,
    brand: row.brand as string,
    productLine: row.product_line as string,
    grainWeight: row.grain_weight as number,
    bulletType: row.bullet_type as string,
    quantity: row.quantity as number,
    advertisedFPS: row.advertised_fps as number | undefined,
    actualFPS: row.actual_fps as number | undefined,
    muzzleEnergy: row.muzzle_energy as number | undefined,
    ballisticCoefficient: row.ballistic_coefficient as number | undefined,
    standardDeviation: row.standard_deviation as number | undefined,
    quantityPurchased: row.quantity_purchased as number | undefined,
    purchaseDate: row.purchase_date as string | undefined,
    purchasePricePerRound: row.purchase_price_per_round as number | undefined,
    currentMarketPrice: row.current_market_price as number | undefined,
    averageCostPerRound: row.average_cost_per_round as number | undefined,
    category: row.category as AmmoLot['category'],
    storageLocation: row.storage_location as string | undefined,
    lotNumber: row.lot_number as string | undefined,
    isHandload: row.is_handload as boolean,
    reloadBatchId: row.reload_batch_id as string | undefined,
    assignedGunIds: row.assigned_gun_ids as string[] | undefined,
    isFavorite: row.is_favorite as boolean | undefined,
    minStockAlert: row.min_stock_alert as number | undefined,
    reserved: row.reserved as number | undefined,
    purchaseHistory: row.purchase_history as AmmoLot['purchaseHistory'],
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function analysisToDb(record: TargetAnalysisRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
    distance_yds: record.distanceYds,
    bullet_dia_in: record.bulletDiaIn,
    stats: record.stats,
    session_id: record.sessionId,
    gun_id: record.gunId,
    ammo_lot_id: record.ammoLotId,
    notes: record.notes,
    created_at: record.createdAt,
  };
}

export function dbToAnalysis(row: Record<string, unknown>): TargetAnalysisRecord {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    distanceYds: row.distance_yds as number,
    bulletDiaIn: row.bullet_dia_in as number,
    stats: row.stats as TargetAnalysisRecord['stats'],
    sessionId: row.session_id as string | undefined,
    gunId: row.gun_id as string | undefined,
    ammoLotId: row.ammo_lot_id as string | undefined,
    notes: row.notes as string | undefined,
  };
}

// ── Sync functions (fire-and-forget — call without await from storage.ts) ────

export async function syncGun(gun: Gun): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase.from('guns').upsert(gunToDb(gun, userId));
  if (error) console.warn('[sync] gun failed:', error.message);
}

export async function deleteGunFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('guns').delete().eq('id', id);
  if (error) console.warn('[sync] gun delete failed:', error.message);
}

export async function syncSession(session: Session): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase.from('sessions').upsert(sessionToDb(session, userId));
  if (error) console.warn('[sync] session failed:', error.message);
}

export async function deleteSessionFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) console.warn('[sync] session delete failed:', error.message);
}

export async function syncAmmo(ammo: AmmoLot): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase.from('ammo_lots').upsert(ammoToDb(ammo, userId));
  if (error) console.warn('[sync] ammo failed:', error.message);
}

export async function deleteAmmoFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('ammo_lots').delete().eq('id', id);
  if (error) console.warn('[sync] ammo delete failed:', error.message);
}

export async function syncAnalysis(record: TargetAnalysisRecord): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase.from('target_analyses').upsert(analysisToDb(record, userId));
  if (error) console.warn('[sync] analysis failed:', error.message);
}

export async function deleteAnalysisFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('target_analyses').delete().eq('id', id);
  if (error) console.warn('[sync] analysis delete failed:', error.message);
}

// ── Pull all user data from Supabase → localStorage (called on login) ────────

export async function pullFromSupabase(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  try {
    const [guns, sessions, ammo, analyses] = await Promise.all([
      supabase.from('guns').select('*').eq('user_id', userId),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('ammo_lots').select('*').eq('user_id', userId),
      supabase.from('target_analyses').select('*').eq('user_id', userId),
    ]);

    if (guns.data?.length) {
      // Strip roundCount (computed) before storing
      const mapped = guns.data.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { roundCount: _, ...gun } = dbToGun(row as Record<string, unknown>) as Gun & { roundCount?: number };
        return gun;
      });
      localStorage.setItem('gunvault_guns', JSON.stringify(mapped));
    }
    if (sessions.data?.length) {
      localStorage.setItem('gunvault_sessions', JSON.stringify(
        sessions.data.map(row => dbToSession(row as Record<string, unknown>))
      ));
    }
    if (ammo.data?.length) {
      localStorage.setItem('gunvault_ammo', JSON.stringify(
        ammo.data.map(row => dbToAmmo(row as Record<string, unknown>))
      ));
    }
    if (analyses.data?.length) {
      localStorage.setItem('gunvault_target_analyses', JSON.stringify(
        analyses.data.map(row => dbToAnalysis(row as Record<string, unknown>))
      ));
    }

    localStorage.setItem('gunvault_initialized', 'true');
    return true;
  } catch (err) {
    console.warn('[sync] pull failed:', err);
    return false;
  }
}

// ── Push all localStorage data → Supabase (called on first login) ────────────

export async function pushLocalDataToSupabase(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    const guns: Gun[] = JSON.parse(localStorage.getItem('gunvault_guns') || '[]');
    const sessions: Session[] = JSON.parse(localStorage.getItem('gunvault_sessions') || '[]');
    const ammo: AmmoLot[] = JSON.parse(localStorage.getItem('gunvault_ammo') || '[]');
    const analyses: TargetAnalysisRecord[] = JSON.parse(localStorage.getItem('gunvault_target_analyses') || '[]');

    if (guns.length) {
      await supabase.from('guns').upsert(guns.map(g => gunToDb(g, userId)));
    }
    if (sessions.length) {
      await supabase.from('sessions').upsert(sessions.map(s => sessionToDb(s, userId)));
    }
    if (ammo.length) {
      await supabase.from('ammo_lots').upsert(ammo.map(a => ammoToDb(a, userId)));
    }
    if (analyses.length) {
      await supabase.from('target_analyses').upsert(analyses.map(a => analysisToDb(a, userId)));
    }

    console.log('[sync] initial push complete');
  } catch (err) {
    console.warn('[sync] initial push failed:', err);
  }
}

// ── Optics sync (pass-through — optics types are complex, store as-is) ───────

export async function syncOptic(optic: Optic): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const row = {
    id: optic.id, user_id: userId, brand: optic.brand, model: optic.model,
    serial_number: optic.serialNumber, optic_type: optic.opticType,
    magnification_min: optic.magnificationMin, magnification_max: optic.magnificationMax,
    objective_mm: optic.objectiveMM, tube_diameter_mm: optic.tubeDiameterMM,
    focal_plane: optic.focalPlane, reticle_name: optic.reticleName,
    illuminated: optic.illuminated, turret_unit: optic.turretUnit,
    click_value_moa: optic.clickValueMOA, click_value_mrad: optic.clickValueMRAD,
    adjustment_range_elevation_moa: optic.adjustmentRangeElevationMOA,
    adjustment_range_windage_moa: optic.adjustmentRangeWindageMOA,
    parallax_type: optic.parallaxType, battery_type: optic.batteryType,
    weight_oz: optic.weightOz, purchase_price: optic.purchasePrice,
    purchase_date: optic.purchaseDate, purchased_from: optic.purchasedFrom,
    status: optic.status, notes: optic.notes,
    created_at: optic.createdAt, updated_at: optic.updatedAt,
  };
  const { error } = await supabase.from('optics').upsert(row);
  if (error) console.warn('[sync] optic failed:', error.message);
}

export async function syncMount(mount: Mount): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const row = {
    id: mount.id, user_id: userId, optic_id: mount.opticId,
    brand: mount.brand, model: mount.model, mount_type: mount.mountType,
    height_mm: mount.heightMM, ring_diameter_mm: mount.ringDiameterMM,
    ring_torque_in_lbs: mount.ringTorqueInLbs, base_torque_in_lbs: mount.baseTorqueInLbs,
    rail_interface: mount.railInterface, is_qd: mount.isQD,
    return_to_zero_rated: mount.returnToZeroRated,
    last_torque_confirmed: mount.lastTorqueConfirmed,
    notes: mount.notes, purchase_price: mount.purchasePrice,
    created_at: mount.createdAt, updated_at: mount.updatedAt,
  };
  const { error } = await supabase.from('mounts').upsert(row);
  if (error) console.warn('[sync] mount failed:', error.message);
}

export async function syncAssignment(a: OpticAssignment): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const row = {
    id: a.id, user_id: userId, optic_id: a.opticId, gun_id: a.gunId,
    mount_id: a.mountId, assigned_date: a.assignedDate,
    removed_date: a.removedDate, removal_reason: a.removalReason,
  };
  const { error } = await supabase.from('optic_assignments').upsert(row);
  if (error) console.warn('[sync] assignment failed:', error.message);
}

export async function syncZero(z: OpticZero): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const row = {
    id: z.id, user_id: userId, assignment_id: z.assignmentId,
    optic_id: z.opticId, gun_id: z.gunId,
    zero_distance_yards: z.zeroDistanceYards,
    ammo_description: z.ammoDescription, ammo_lot_id: z.ammoLotId,
    date: z.date,
    elevation_clicks_from_mechanical: z.elevationClicksFromMechanical,
    windage_clicks_from_mechanical: z.windageClicksFromMechanical,
    temp_f: z.tempF, altitude_ft: z.altitudeFt,
    notes: z.notes, is_active: z.isActive, created_at: z.createdAt,
  };
  const { error } = await supabase.from('optic_zeros').upsert(row);
  if (error) console.warn('[sync] zero failed:', error.message);
}

// ── Account deletion ──────────────────────────────────────────────────────────

/** Delete all of the current user's data from every Supabase table. */
export async function deleteAccountData(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const tables = [
    'guns', 'sessions', 'ammo_lots', 'target_analyses',
    'optics', 'mounts', 'optic_assignments', 'optic_zeros',
  ] as const;
  await Promise.allSettled(
    tables.map(t => supabase.from(t).delete().eq('user_id', userId))
  );
}

// ── Cartridge encyclopedia — public read, no user_id ─────────────────────────

function cartridgeFromDb(row: Record<string, unknown>): Cartridge {
  const parseMilitaryAdoption = (raw: unknown) => {
    if (!Array.isArray(raw)) return undefined;
    const parsed = raw
      .map((s: unknown) => { try { return JSON.parse(s as string); } catch { return null; } })
      .filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  };

  return {
    id:                 row.id as string,
    name:               row.name as string,
    alternateNames:     (row.alternate_names as string[] | null) ?? undefined,
    type:               row.type as Cartridge['type'],
    standardization:    row.standardization as Cartridge['standardization'],
    productionStatus:   row.production_status as Cartridge['productionStatus'],
    availability:       row.availability as Cartridge['availability'],
    yearIntroduced:     row.year_introduced as number,
    inventor:           (row.inventor as string | null) ?? undefined,
    manufacturer:       (row.manufacturer as string | null) ?? undefined,
    countryOfOrigin:    row.country_of_origin as string,
    parentCase:         (row.parent_case as string | null) ?? undefined,
    derivedFrom:        (row.derived_from as string | null) ?? undefined,

    bulletDiameterInch: Number(row.bullet_diameter_inch),
    bulletDiameterMM:   Number(row.bullet_diameter_mm),
    baseDiameterInch:   Number(row.base_diameter_inch),
    baseDiameterMM:     Number(row.base_diameter_mm),
    rimDiameterInch:    Number(row.rim_diameter_inch),
    rimDiameterMM:      Number(row.rim_diameter_mm),
    caseLengthInch:     Number(row.case_length_inch),
    caseLengthMM:       Number(row.case_length_mm),
    overallLengthInch:  Number(row.overall_length_inch),
    overallLengthMM:    Number(row.overall_length_mm),
    caseCapacityGrains: row.case_capacity_grains != null ? Number(row.case_capacity_grains) : undefined,
    maxPressurePSI:     (row.max_pressure_psi as number | null) ?? undefined,
    rimType:            (row.rim_type as Cartridge['rimType'] | null) ?? undefined,
    primerType:         (row.primer_type as string | null) ?? undefined,
    typicalTwistRate:   (row.typical_twist_rate as string | null) ?? undefined,

    commonBulletWeights: ((row.common_bullet_weights as unknown[] | null) ?? []).map(Number),
    velocityRangeFPS:    { min: (row.velocity_min_fps as number) ?? 0, max: (row.velocity_max_fps as number) ?? 0 },
    energyRangeFTLBS:    { min: (row.energy_min_ftlbs as number) ?? 0, max: (row.energy_max_ftlbs as number) ?? 0 },
    effectiveRangeYards: (row.effective_range_yards as number | null) ?? undefined,
    maxRangeYards:       (row.max_range_yards as number | null) ?? undefined,

    primaryUse:          (row.primary_use as Cartridge['primaryUse'] | null) ?? [],
    huntingGameSize:     (row.hunting_game_size as Cartridge['huntingGameSize'] | null) ?? undefined,
    militaryAdoption:    parseMilitaryAdoption(row.military_adoption),
    currentMilitaryUse:  (row.current_military_use as string[] | null) ?? undefined,
    lawEnforcementUse:   (row.law_enforcement_use as boolean | null) ?? undefined,
    similarCartridges:   (row.similar_cartridges as string[] | null) ?? undefined,

    description:         (row.description as string | null) ?? undefined,
    history:             (row.history as string | null) ?? undefined,
    notableFirearms:     (row.notable_firearms as string[] | null) ?? undefined,
    trivia:              (row.trivia as string | null) ?? undefined,

    // Personal tracking — filled in by storage layer from local state
    ownGunForThis:  false,
    ownAmmoForThis: false,
    onWishlist:     false,
  };
}

export async function fetchCartridgesFromSupabase(): Promise<Cartridge[]> {
  const { data, error } = await supabase
    .from('cartridges')
    .select('*')
    .order('name')
    .limit(2000);
  if (error || !data || data.length === 0) return [];
  return data.map(cartridgeFromDb);
}
