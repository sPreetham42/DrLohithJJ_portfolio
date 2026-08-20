-- ================================================================
-- 0005_fix_profile_photo_asset_fk.sql
-- Fix Profile Photo Asset Foreign-Key Integrity (Canonical Normalization)
-- ================================================================

UPDATE profile
SET photo_asset_id = (
  SELECT id
  FROM assets
  WHERE storage_key = profile.photo_asset_id
)
WHERE photo_asset_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM assets
    WHERE storage_key = profile.photo_asset_id
  );
