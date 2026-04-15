-- ============================================================
-- gun_clubs: public reference table
-- Shooting clubs and national organizations
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gun_clubs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  city              text,
  state             text,
  country           text DEFAULT 'USA',
  website           text,
  affiliations      text[],   -- ['NRA','USPSA','IDPA','CMP','NSSF','SASS','F-Class','PRS','Benchrest']
  membership_open   boolean DEFAULT true,
  description       text,
  founded_year      integer,
  latitude          numeric,
  longitude         numeric,
  verified          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gun_clubs_state       ON public.gun_clubs (state);
CREATE INDEX IF NOT EXISTS idx_gun_clubs_verified     ON public.gun_clubs (verified);
CREATE INDEX IF NOT EXISTS idx_gun_clubs_affiliations ON public.gun_clubs USING GIN (affiliations);
CREATE INDEX IF NOT EXISTS idx_gun_clubs_latlong      ON public.gun_clubs (latitude, longitude);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_gun_clubs_updated_at ON public.gun_clubs;
CREATE TRIGGER trg_gun_clubs_updated_at
  BEFORE UPDATE ON public.gun_clubs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.gun_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gun_clubs_public_read"   ON public.gun_clubs;
DROP POLICY IF EXISTS "gun_clubs_service_write" ON public.gun_clubs;

CREATE POLICY "gun_clubs_public_read"
  ON public.gun_clubs FOR SELECT
  USING (true);

CREATE POLICY "gun_clubs_service_write"
  ON public.gun_clubs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA — Major national organizations only
-- ============================================================

INSERT INTO public.gun_clubs
  (name, city, state, country, website, affiliations, membership_open, description, founded_year, latitude, longitude, verified)
VALUES

('National Rifle Association',
 'Fairfax','VA','USA',
 'nra.org',
 ARRAY['NRA'],
 true,
 'The oldest and largest civil rights organization in the US, founded in 1871. Provides firearms training, safety education, and legislative advocacy. Operates the NRA Whittington Center range in New Mexico and multiple museums. Over 5 million members.',
 1871, 38.8473, -77.3119, true),

('USPSA (United States Practical Shooting Association)',
 'Sedro-Woolley','WA','USA',
 'uspsa.org',
 ARRAY['USPSA','IPSC'],
 true,
 'The national governing body for practical shooting sport in the United States and the US affiliate of IPSC (International Practical Shooting Confederation). Governs matches in Carry Optics, Open, Limited, Production, PCC, and Single Stack divisions. 26,000+ active members.',
 1984, 48.5026, -122.2356, true),

('IDPA (International Defensive Pistol Association)',
 'Berryville','AR','USA',
 'idpa.com',
 ARRAY['IDPA'],
 true,
 'Founded in 1996 to create a shooting sport that simulates real-world defensive scenarios. Emphasizes concealed carry equipment and realistic defensive techniques. Divisions include SSP, ESP, CCP, CDP, CO, and BUG.',
 1996, 36.3645, -93.5693, true),

('CMP (Civilian Marksmanship Program)',
 'Anniston','AL','USA',
 'thecmp.org',
 ARRAY['CMP','NRA'],
 true,
 'Congressionally chartered organization descended from the National Board for the Promotion of Rifle Practice (1903). Operates Camp Perry National Matches, sells surplus military firearms (M1 Garand, 1911) to qualified civilians, and supports youth marksmanship programs. Operates ranges in Alabama and Ohio.',
 1903, 33.6584, -85.8311, true),

('SASS (Single Action Shooting Society)',
 'Edgewood','NM','USA',
 'sassnet.com',
 ARRAY['SASS'],
 true,
 'Founded in 1987 to create a standardized set of rules for Cowboy Action Shooting. Members adopt Western personas (aliases) and compete using period-correct firearms and costumes. Annual End of Trail World Championship. Over 90,000 registered members.',
 1987, 35.0582, -106.2195, true),

('NSSF (National Shooting Sports Foundation)',
 'Newtown','CT','USA',
 'nssf.org',
 ARRAY['NSSF'],
 true,
 'The trade association for the firearms, ammunition, hunting, and recreational shooting sports industry. Founded in 1961. Produces the SHOT Show (largest trade show in the industry). Advocates for industry interests and promotes safe, responsible firearms use.',
 1961, 41.4148, -73.2954, true),

('Precision Rifle Series',
 'Chino Valley','AZ','USA',
 'precisionrifleseries.com',
 ARRAY['PRS'],
 true,
 'Professional competitive rifle shooting series featuring long-range positional rifle shooting. Known as the most demanding rifle shooting sport. Matches typically feature distances from 200 to 1,000+ yards with positional challenges. The PRS Pro Series is the premier division.',
 2012, 34.7550, -112.4534, true),

('IPSC (International Practical Shooting Confederation)',
 NULL,NULL,'International',
 'ipsc.org',
 ARRAY['IPSC','USPSA'],
 true,
 'Global governing body for practical shooting competition. Founded in 1976. Encompasses over 100 national affiliates. Conducts World Shoots every three years. US affiliate is USPSA.',
 1976, NULL, NULL, true),

('F-Class International',
 NULL,'VA','USA',
 'fclasstc.org',
 ARRAY['F-Class'],
 true,
 'Governing body for F-Class long-range rifle competition in the United States. Disciplines include F-Open (bench rest equipment off a bipod) and F-TR (limited sling equipment, limited calibers). Shot at 300m, 500m, 600y, 900y, and 1,000y.',
 2004, NULL, NULL, true),

('International Benchrest Shooters',
 NULL,'NY','USA',
 'internationalbenches.com',
 ARRAY['Benchrest'],
 true,
 'Organization governing benchrest precision shooting competition at short range (100 and 200 yards). Founded in the early 1970s. The IBS Record Book maintains world records for smallest groups ever shot.',
 1970, NULL, NULL, true),

('National Benchrest Shooters Association',
 NULL,'OH','USA',
 'nbrsa.com',
 ARRAY['Benchrest'],
 true,
 'One of the founding organizations of organized benchrest competition in the US. Governs Sporter, Light Varmint, Heavy Varmint, and Unlimited benchrest classes. Maintains a world record book separate from IBS.',
 1951, NULL, NULL, true),

('Steel Challenge Shooting Association',
 'Sedro-Woolley','WA','USA',
 'steelchallenge.com',
 ARRAY['USPSA','SCSA'],
 true,
 'Governs Steel Challenge competition — a speed shooting format with 8 standardized stages of steel targets. Now managed under the USPSA umbrella. Annual World Speed Shooting Championship held in California.',
 1981, 48.5026, -122.2356, true),

('3-Gun Nation',
 NULL,NULL,'USA',
 '3gunnation.com',
 ARRAY['3-Gun'],
 true,
 'National 3-Gun competition series where competitors use pistol, rifle, and shotgun in the same match. Multiple divisions based on equipment class. Annual Pro Series and Club Series competitions.',
 2010, NULL, NULL, true),

('National Muzzle Loading Rifle Association',
 'Friendship','IN','USA',
 'nmlra.org',
 ARRAY['NRA'],
 true,
 'Governing body for muzzle-loading rifle competition and black powder shooting sports. Operates the national shooting complex in Friendship, Indiana where the National Championships are held twice yearly.',
 1933, 38.9979, -85.1425, true),

('Appleseed Project',
 'Ramseur','NC','USA',
 'appleseedinfo.org',
 ARRAY['NRA'],
 true,
 'Nonprofit organization teaching American heritage and rifle marksmanship at events held nationwide. Uses the M1-style firing position (prone, sitting, standing) with standard-issue military rifle scoring.',
 2006, NULL, NULL, true)

ON CONFLICT DO NOTHING;
