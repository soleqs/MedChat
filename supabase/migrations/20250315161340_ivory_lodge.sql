/*
  # Remove duplicate regions and hospitals

  1. Changes
    - Remove duplicate entries from regions table
    - Remove duplicate entries from hospitals table
    - Add unique constraints to prevent future duplicates
    
  2. Security
    - Maintain existing RLS policies
    - No data loss during deduplication
*/

-- Create temporary table for unique regions
CREATE TEMP TABLE unique_regions AS
SELECT DISTINCT ON (name_cs) id, name_cs, name_en, created_at, updated_at
FROM regions
ORDER BY name_cs, created_at;

-- Delete all regions and reinsert unique ones
DELETE FROM regions;
INSERT INTO regions (id, name_cs, name_en, created_at, updated_at)
SELECT id, name_cs, name_en, created_at, updated_at
FROM unique_regions;

-- Add unique constraint on region names
ALTER TABLE regions ADD CONSTRAINT regions_name_cs_key UNIQUE (name_cs);
ALTER TABLE regions ADD CONSTRAINT regions_name_en_key UNIQUE (name_en);

-- Create temporary table for unique hospitals
CREATE TEMP TABLE unique_hospitals AS
SELECT DISTINCT ON (name, region_id) id, region_id, name, created_at, updated_at
FROM hospitals
ORDER BY name, region_id, created_at;

-- Delete all hospitals and reinsert unique ones
DELETE FROM hospitals;
INSERT INTO hospitals (id, region_id, name, created_at, updated_at)
SELECT id, region_id, name, created_at, updated_at
FROM unique_hospitals;

-- Add unique constraint on hospital name within region
ALTER TABLE hospitals ADD CONSTRAINT hospitals_name_region_key UNIQUE (name, region_id);

-- Drop temporary tables
DROP TABLE unique_regions;
DROP TABLE unique_hospitals;