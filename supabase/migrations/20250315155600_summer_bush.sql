/*
  # Add regions and hospitals tables

  1. New Tables
    - `regions`
      - `id` (uuid, primary key)
      - `name_cs` (text) - Czech name
      - `name_en` (text) - English name
    
    - `hospitals`
      - `id` (uuid, primary key)
      - `region_id` (uuid) - reference to regions
      - `name` (text) - hospital name

  2. Security
    - Enable RLS
    - Add policies for public read access
*/

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_cs text NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES regions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Regions are viewable by everyone" ON regions;
    DROP POLICY IF EXISTS "Hospitals are viewable by everyone" ON hospitals;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Add policies
CREATE POLICY "Regions are viewable by everyone"
  ON regions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Hospitals are viewable by everyone"
  ON hospitals FOR SELECT
  TO public
  USING (true);

-- Add hospital_id to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'hospital_id'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Insert regions
INSERT INTO regions (name_cs, name_en) VALUES
  ('Karlovarský kraj', 'Karlovy Vary Region'),
  ('Ústecký kraj', 'Ústí Region'),
  ('Liberecký kraj', 'Liberec Region'),
  ('Královéhradecký kraj', 'Hradec Králové Region'),
  ('Pardubický kraj', 'Pardubice Region'),
  ('Olomoucký kraj', 'Olomouc Region'),
  ('Moravskoslezský kraj', 'Moravian-Silesian Region'),
  ('Jihomoravský kraj', 'South Moravian Region'),
  ('Zlínský kraj', 'Zlín Region'),
  ('Kraj Vysočina', 'Vysočina Region'),
  ('Jihočeský kraj', 'South Bohemian Region'),
  ('Plzeňský kraj', 'Plzeň Region'),
  ('Středočeský kraj', 'Central Bohemian Region'),
  ('Hlavní město Praha', 'Prague')
ON CONFLICT (id) DO NOTHING;

-- Insert hospitals for each region
DO $$
DECLARE
    v_region_id uuid;
BEGIN
    -- Karlovarský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Karlovarský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice Karlovy Vary, a.s.'),
            (v_region_id, 'Nemocnice Cheb, příspěvková organizace'),
            (v_region_id, 'Nemocnice Sokolov, příspěvková organizace'),
            (v_region_id, 'Lázeňská nemocnice Mariánské Lázně'),
            (v_region_id, 'Nemocnice Ostrov, příspěvková organizace')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Ústecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Ústecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Masarykova nemocnice v Ústí nad Labem'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Teplice'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Chomutov'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Most'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Děčín')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Liberecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Liberecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Krajská nemocnice Liberec'),
            (v_region_id, 'Nemocnice Česká Lípa'),
            (v_region_id, 'Nemocnice Jablonec nad Nisou'),
            (v_region_id, 'Nemocnice Frýdlant')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Královéhradecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Královéhradecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Hradec Králové'),
            (v_region_id, 'Oblastní nemocnice Náchod'),
            (v_region_id, 'Oblastní nemocnice Trutnov'),
            (v_region_id, 'Oblastní nemocnice Jičín')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pardubický kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Pardubický kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Pardubická nemocnice'),
            (v_region_id, 'Orlickoústecká nemocnice'),
            (v_region_id, 'Nemocnice Chrudim'),
            (v_region_id, 'Nemocnice Svitavy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Olomoucký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Olomoucký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Olomouc'),
            (v_region_id, 'Nemocnice Šternberk'),
            (v_region_id, 'Nemocnice Přerov'),
            (v_region_id, 'Nemocnice Prostějov'),
            (v_region_id, 'Nemocnice Hranice')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Moravskoslezský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Moravskoslezský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Ostrava'),
            (v_region_id, 'Nemocnice AGEL Nový Jičín'),
            (v_region_id, 'Nemocnice AGEL Třinec-Podlesí'),
            (v_region_id, 'Nemocnice Karviná-Ráj'),
            (v_region_id, 'Nemocnice Frýdek-Místek')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Jihomoravský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Jihomoravský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Brno'),
            (v_region_id, 'Nemocnice Milosrdných bratří Brno'),
            (v_region_id, 'Nemocnice Znojmo'),
            (v_region_id, 'Nemocnice Kyjov'),
            (v_region_id, 'Nemocnice Boskovice')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Zlínský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Zlínský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Krajská nemocnice T. Bati, a.s.'),
            (v_region_id, 'Nemocnice Uherské Hradiště'),
            (v_region_id, 'Nemocnice Valašské Meziříčí'),
            (v_region_id, 'Nemocnice Vsetín')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Kraj Vysočina
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Kraj Vysočina' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice Jihlava'),
            (v_region_id, 'Nemocnice Havlíčkův Brod'),
            (v_region_id, 'Nemocnice Třebíč'),
            (v_region_id, 'Nemocnice Nové Město na Moravě')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Jihočeský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Jihočeský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice České Budějovice'),
            (v_region_id, 'Nemocnice Strakonice'),
            (v_region_id, 'Nemocnice Písek'),
            (v_region_id, 'Nemocnice Tábor'),
            (v_region_id, 'Nemocnice Jindřichův Hradec')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Plzeňský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Plzeňský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Plzeň'),
            (v_region_id, 'Nemocnice Stod'),
            (v_region_id, 'Nemocnice Klatovy'),
            (v_region_id, 'Nemocnice Rokycany')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Středočeský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Středočeský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice Mladá Boleslav'),
            (v_region_id, 'Nemocnice Kolín'),
            (v_region_id, 'Nemocnice Kladno'),
            (v_region_id, 'Nemocnice Příbram'),
            (v_region_id, 'Nemocnice Kutná Hora')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Hlavní město Praha
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Hlavní město Praha' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Všeobecná fakultní nemocnice v Praze'),
            (v_region_id, 'Fakultní nemocnice Motol'),
            (v_region_id, 'Nemocnice Na Homolce'),
            (v_region_id, 'Nemocnice Na Bulovce'),
            (v_region_id, 'Nemocnice sv. Alžběty')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;