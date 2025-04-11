/*
  # Update hospitals data with complete list

  1. Changes
    - Clear existing hospitals data
    - Insert complete list of hospitals for each region
    - Maintain relationships and constraints
    
  2. Security
    - Preserve existing RLS policies
    - Maintain referential integrity
*/

-- First, clear existing hospitals
DELETE FROM hospitals;

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
            (v_region_id, 'Nemocnice Ostrov, příspěvková organizace');
    END IF;

    -- Ústecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Ústecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Masarykova nemocnice v Ústí nad Labem'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Teplice'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Chomutov'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Most'),
            (v_region_id, 'Krajská zdravotní, a.s. – Nemocnice Děčín');
    END IF;

    -- Liberecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Liberecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Krajská nemocnice Liberec'),
            (v_region_id, 'Nemocnice Česká Lípa'),
            (v_region_id, 'Nemocnice Jablonec nad Nisou'),
            (v_region_id, 'Nemocnice Frýdlant');
    END IF;

    -- Královéhradecký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Královéhradecký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Hradec Králové'),
            (v_region_id, 'Oblastní nemocnice Náchod'),
            (v_region_id, 'Oblastní nemocnice Trutnov'),
            (v_region_id, 'Oblastní nemocnice Jičín');
    END IF;

    -- Pardubický kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Pardubický kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Pardubická nemocnice'),
            (v_region_id, 'Orlickoústecká nemocnice'),
            (v_region_id, 'Nemocnice Chrudim'),
            (v_region_id, 'Nemocnice Svitavy');
    END IF;

    -- Olomoucký kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Olomoucký kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Olomouc'),
            (v_region_id, 'Nemocnice Šternberk'),
            (v_region_id, 'Nemocnice Přerov'),
            (v_region_id, 'Nemocnice Prostějov'),
            (v_region_id, 'Nemocnice Hranice');
    END IF;

    -- Moravskoslezský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Moravskoslezský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Ostrava'),
            (v_region_id, 'Nemocnice AGEL Nový Jičín'),
            (v_region_id, 'Nemocnice AGEL Třinec-Podlesí'),
            (v_region_id, 'Nemocnice Karviná-Ráj'),
            (v_region_id, 'Nemocnice Frýdek-Místek');
    END IF;

    -- Jihomoravský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Jihomoravský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Brno'),
            (v_region_id, 'Nemocnice Milosrdných bratří Brno'),
            (v_region_id, 'Nemocnice Znojmo'),
            (v_region_id, 'Nemocnice Kyjov'),
            (v_region_id, 'Nemocnice Boskovice');
    END IF;

    -- Zlínský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Zlínský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Krajská nemocnice T. Bati, a.s.'),
            (v_region_id, 'Nemocnice Uherské Hradiště'),
            (v_region_id, 'Nemocnice Valašské Meziříčí'),
            (v_region_id, 'Nemocnice Vsetín');
    END IF;

    -- Kraj Vysočina
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Kraj Vysočina' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice Jihlava'),
            (v_region_id, 'Nemocnice Havlíčkův Brod'),
            (v_region_id, 'Nemocnice Třebíč'),
            (v_region_id, 'Nemocnice Nové Město na Moravě');
    END IF;

    -- Jihočeský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Jihočeský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice České Budějovice'),
            (v_region_id, 'Nemocnice Strakonice'),
            (v_region_id, 'Nemocnice Písek'),
            (v_region_id, 'Nemocnice Tábor'),
            (v_region_id, 'Nemocnice Jindřichův Hradec');
    END IF;

    -- Plzeňský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Plzeňský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Fakultní nemocnice Plzeň'),
            (v_region_id, 'Nemocnice Stod'),
            (v_region_id, 'Nemocnice Klatovy'),
            (v_region_id, 'Nemocnice Rokycany');
    END IF;

    -- Středočeský kraj
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Středočeský kraj' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Nemocnice Mladá Boleslav'),
            (v_region_id, 'Nemocnice Kolín'),
            (v_region_id, 'Nemocnice Kladno'),
            (v_region_id, 'Nemocnice Příbram'),
            (v_region_id, 'Nemocnice Kutná Hora');
    END IF;

    -- Hlavní město Praha
    SELECT id INTO v_region_id FROM regions WHERE name_cs = 'Hlavní město Praha' LIMIT 1;
    IF FOUND THEN
        INSERT INTO hospitals (region_id, name) VALUES
            (v_region_id, 'Všeobecná fakultní nemocnice v Praze'),
            (v_region_id, 'Fakultní nemocnice Motol'),
            (v_region_id, 'Nemocnice Na Homolce'),
            (v_region_id, 'Nemocnice Na Bulovce'),
            (v_region_id, 'Nemocnice sv. Alžběty');
    END IF;
END $$;