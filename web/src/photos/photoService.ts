// Photo Service — Supabase Storage + DB operations for the photo system

import { supabase } from '../lib/supabase';
import type {
  PhotoSet, PhotoAsset, GradeAssessment, SetType, GunTypeProfile, AiReviewResult,
} from './photoTypes';

const BUCKET = 'gun-photos';

// ── Storage helpers ───────────────────────────────────────────────────────────

function storagePath(userId: string, gunId: string, filename: string): string {
  return `${userId}/${gunId}/${filename}`;
}

function uniqueFilename(shotType: string, ext = 'jpg'): string {
  return `${shotType}_${Date.now()}.${ext}`;
}

export async function uploadPhoto(
  userId: string,
  gunId: string,
  shotType: string,
  blob: Blob,
): Promise<{ path: string; url: string } | null> {
  const filename = uniqueFilename(shotType);
  const path = storagePath(userId, gunId, filename);

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) { console.error('[photoService] upload error:', error); return null; }

  const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  return { path, url: urlData?.signedUrl ?? '' };
}

export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

export async function deletePhoto(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

// ── Photo sets ────────────────────────────────────────────────────────────────

export async function getOrCreatePhotoSet(
  userId: string,
  gunId: string,
  setType: SetType,
  gunTypeProfile: GunTypeProfile,
): Promise<PhotoSet | null> {
  // Try to get existing
  const { data: existing } = await supabase
    .from('photo_sets')
    .select('*')
    .eq('user_id', userId)
    .eq('gun_id', gunId)
    .eq('set_type', setType)
    .single();

  if (existing) return rowToPhotoSet(existing);

  // Create new
  const { data: created, error } = await supabase
    .from('photo_sets')
    .insert({ user_id: userId, gun_id: gunId, set_type: setType, gun_type_profile: gunTypeProfile })
    .select()
    .single();

  if (error) { console.error('[photoService] create set error:', error); return null; }
  return rowToPhotoSet(created);
}

export async function getPhotoSetsForGun(userId: string, gunId: string): Promise<PhotoSet[]> {
  const { data } = await supabase
    .from('photo_sets')
    .select('*')
    .eq('user_id', userId)
    .eq('gun_id', gunId);
  return (data ?? []).map(rowToPhotoSet);
}

export async function updatePhotoSet(setId: string, updates: { watermark?: boolean; gun_type_profile?: string }): Promise<void> {
  await supabase.from('photo_sets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', setId);
}

// ── Photo assets ──────────────────────────────────────────────────────────────

export async function savePhotoAsset(params: {
  userId: string;
  gunId: string;
  setId: string | null;
  setType: SetType | null;
  shotType: string | null;
  storagePath: string;
  storageUrl: string;
  isAcquisitionPhoto?: boolean;
  aiReviewResult?: AiReviewResult;
}): Promise<PhotoAsset | null> {
  const { data, error } = await supabase
    .from('photo_assets')
    .insert({
      user_id: params.userId,
      gun_id: params.gunId,
      set_id: params.setId,
      set_type: params.setType,
      shot_type: params.shotType,
      storage_path: params.storagePath,
      storage_url: params.storageUrl,
      is_acquisition_photo: params.isAcquisitionPhoto ?? false,
      ai_review_passed: params.aiReviewResult?.approved ?? null,
      ai_review_result: params.aiReviewResult ?? null,
    })
    .select()
    .single();

  if (error) { console.error('[photoService] save asset error:', error); return null; }
  return rowToPhotoAsset(data);
}

export async function getPhotoAssetsForGun(userId: string, gunId: string): Promise<PhotoAsset[]> {
  const { data } = await supabase
    .from('photo_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('gun_id', gunId)
    .order('captured_at', { ascending: false });
  return (data ?? []).map(rowToPhotoAsset);
}

export async function deletePhotoAsset(assetId: string, storagePath: string): Promise<void> {
  await Promise.all([
    supabase.from('photo_assets').delete().eq('id', assetId),
    deletePhoto(storagePath),
  ]);
}

export async function markAsAcquisitionPhoto(assetId: string, gunId: string, userId: string): Promise<void> {
  // Clear existing acquisition anchor for this gun first
  await supabase
    .from('photo_assets')
    .update({ is_acquisition_photo: false })
    .eq('user_id', userId)
    .eq('gun_id', gunId)
    .eq('is_acquisition_photo', true);

  await supabase.from('photo_assets').update({ is_acquisition_photo: true }).eq('id', assetId);
}

// ── Grade assessments ─────────────────────────────────────────────────────────

export async function saveGradeAssessment(params: {
  userId: string;
  gunId: string;
  overallGrade: string;
  areaGrades: Record<string, { grade: string; note: string }>;
  photoAssetIds: string[];
}): Promise<GradeAssessment | null> {
  const { data, error } = await supabase
    .from('grade_assessments')
    .insert({
      user_id: params.userId,
      gun_id: params.gunId,
      overall_grade: params.overallGrade,
      area_grades: params.areaGrades,
      photo_asset_ids: params.photoAssetIds,
    })
    .select()
    .single();

  if (error) { console.error('[photoService] save grade error:', error); return null; }
  return rowToGradeAssessment(data);
}

export async function getLatestGradeAssessment(userId: string, gunId: string): Promise<GradeAssessment | null> {
  const { data } = await supabase
    .from('grade_assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('gun_id', gunId)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .single();
  return data ? rowToGradeAssessment(data) : null;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToPhotoSet(r: Record<string, unknown>): PhotoSet {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    gunId: r.gun_id as string,
    setType: r.set_type as SetType,
    gunTypeProfile: r.gun_type_profile as GunTypeProfile,
    watermark: r.watermark as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToPhotoAsset(r: Record<string, unknown>): PhotoAsset {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    gunId: r.gun_id as string,
    setId: r.set_id as string | null,
    setType: r.set_type as SetType | null,
    shotType: r.shot_type as string | null,
    storagePath: r.storage_path as string,
    storageUrl: r.storage_url as string | null,
    isFiltered: r.is_filtered as boolean,
    filterName: r.filter_name as string | null,
    isAcquisitionPhoto: r.is_acquisition_photo as boolean,
    aiReviewPassed: r.ai_review_passed as boolean | null,
    aiReviewResult: r.ai_review_result as AiReviewResult | null,
    capturedAt: r.captured_at as string,
    createdAt: r.created_at as string,
  };
}

function rowToGradeAssessment(r: Record<string, unknown>): GradeAssessment {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    gunId: r.gun_id as string,
    overallGrade: r.overall_grade as string,
    areaGrades: r.area_grades as Record<string, { grade: string; note: string }>,
    estimatedFmvLow: r.estimated_fmv_low as number | null,
    estimatedFmvHigh: r.estimated_fmv_high as number | null,
    photoAssetIds: (r.photo_asset_ids as string[]) ?? [],
    assessedAt: r.assessed_at as string,
    createdAt: r.created_at as string,
  };
}
