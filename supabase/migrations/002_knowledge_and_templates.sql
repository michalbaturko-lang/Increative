-- =============================================================================
-- Knowledge Base & Task Templates - Run this in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- KNOWLEDGE ENTRIES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'template', 'best_practice', 'example', 'prompt', 'learning'
  title TEXT NOT NULL,
  description TEXT,

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  agent_types TEXT[] DEFAULT '{}', -- which agents can use this
  industries TEXT[] DEFAULT '{}',

  -- Content
  content TEXT NOT NULL,

  -- Source
  source_task_id UUID REFERENCES tasks(id),
  created_by TEXT, -- agent name or 'human'

  -- Usage stats
  times_used INTEGER NOT NULL DEFAULT 0,
  success_rate INTEGER DEFAULT 0, -- 0-100

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_type ON knowledge_entries(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_tags ON knowledge_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_agent_types ON knowledge_entries USING GIN(agent_types);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on knowledge" ON knowledge_entries;
CREATE POLICY "Allow all operations on knowledge" ON knowledge_entries FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- TASK TEMPLATES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- task type

  -- Template content
  default_title TEXT,
  default_description TEXT,
  prompt_template TEXT, -- with {placeholders}

  -- Settings
  default_priority TEXT DEFAULT 'medium',
  estimated_duration INTEGER, -- minutes

  -- Categorization
  industries TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Usage stats
  times_used INTEGER NOT NULL DEFAULT 0,
  avg_success_rate INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on templates" ON task_templates;
CREATE POLICY "Allow all operations on templates" ON task_templates FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- SEED DATA - Default Templates
-- -----------------------------------------------------------------------------

INSERT INTO task_templates (name, description, type, default_title, default_description, prompt_template, estimated_duration, tags) VALUES
(
  'SEO Audit Kompletní',
  'Kompletní SEO audit webu včetně technické, obsahové a konkurenční analýzy',
  'seo_audit',
  'SEO audit pro {client}',
  'Proveď kompletní SEO audit webu {url}',
  'Proveď kompletní SEO audit pro web {url}. Zaměř se na:
1. Technické SEO (rychlost, mobile-friendly, indexace)
2. On-page SEO (title, meta, headings, obsah)
3. Strukturu webu a interní prolinkování
4. Konkurenční srovnání
5. Konkrétní doporučení s prioritami',
  45,
  ARRAY['seo', 'audit', 'analýza']
),
(
  'Produktový popis e-shop',
  'Poutavý produktový popis pro e-shop optimalizovaný pro SEO',
  'content_creation',
  'Produktové popisky pro {client}',
  'Vytvoř produktové popisky pro {count} produktů',
  'Vytvoř poutavé produktové popisky pro e-shop.
Styl: {style}
Cílová skupina: {audience}
Pro každý produkt vytvoř:
- Hlavní popis (100-150 slov)
- Klíčové vlastnosti (bullet points)
- SEO meta popis
Tón: Přesvědčivý, ale autentický',
  30,
  ARRAY['content', 'e-shop', 'produkty']
),
(
  'Blog článek SEO',
  'SEO optimalizovaný blog článek na zadané téma',
  'content_creation',
  'Blog článek: {topic}',
  'Napiš blog článek na téma {topic}',
  'Napiš SEO optimalizovaný blog článek na téma: {topic}

Požadavky:
- Délka: 800-1200 slov
- Struktura: H1, H2, H3 nadpisy
- Klíčová slova: přirozeně zakomponovaná
- Meta popis: 155 znaků
- CTA na konci

Cílová skupina: {audience}
Tón: {tone}',
  40,
  ARRAY['content', 'blog', 'seo']
),
(
  'Google Ads kampaň',
  'Kompletní návrh Google Ads kampaně včetně struktury a textů',
  'ads_campaign',
  'Google Ads kampaň pro {client}',
  'Navrhni Google Ads kampaň pro {business_type}',
  'Navrhni kompletní Google Ads kampaň:

Byznys: {business_type}
Cíl: {goal}
Rozpočet: {budget} Kč/měsíc
Lokace: {location}

Dodej:
1. Struktura kampaně (kampaně, ad groups)
2. Klíčová slova s match types
3. Negativní klíčová slova
4. 3 varianty responsive search ads
5. Rozšíření (sitelinks, callouts)
6. Doporučený bidding',
  60,
  ARRAY['ads', 'google', 'ppc']
),
(
  'Analýza konkurence',
  'Detailní analýza konkurentů včetně online přítomnosti',
  'competitor_analysis',
  'Analýza konkurence pro {client}',
  'Analyzuj konkurenty v oblasti {industry}',
  'Proveď detailní analýzu konkurence:

Odvětví: {industry}
Region: {region}
Hlavní konkurenti: {competitors}

Analyzuj:
1. Online přítomnost (web, sociální sítě)
2. SEO pozice a klíčová slova
3. Marketingové aktivity
4. Cenová strategie
5. USP a diferenciace
6. SWOT analýza
7. Příležitosti pro klienta',
  50,
  ARRAY['analýza', 'konkurence', 'strategie']
),
(
  'Social Media plán',
  'Měsíční obsahový plán pro sociální sítě',
  'content_creation',
  'Social Media plán pro {client}',
  'Vytvoř měsíční plán pro sociální sítě',
  'Vytvoř měsíční obsahový plán pro sociální sítě:

Platformy: {platforms}
Frekvence: {frequency}
Cílová skupina: {audience}
Tón komunikace: {tone}

Dodej:
1. Obsahové pilíře (témata)
2. Kalendář příspěvků na měsíc
3. 10 konkrétních příspěvků s texty
4. Návrhy vizuálů (popis)
5. Hashtagy
6. Engagement strategie',
  45,
  ARRAY['social media', 'content', 'plán']
);

-- -----------------------------------------------------------------------------
-- SEED DATA - Initial Knowledge Entries
-- -----------------------------------------------------------------------------

INSERT INTO knowledge_entries (type, title, description, tags, agent_types, content, created_by) VALUES
(
  'best_practice',
  'SEO Title Tag Best Practices',
  'Jak psát efektivní title tagy pro lepší CTR',
  ARRAY['seo', 'on-page', 'title'],
  ARRAY['seo_analyst', 'content_writer'],
  'Title tag best practices:
- Délka: 50-60 znaků
- Klíčové slovo na začátku
- Brand na konci (oddělený | nebo -)
- Unikátní pro každou stránku
- Použij čísla a power words
- Vyvolej zvědavost nebo nabídni hodnotu
Příklad: "10 SEO tipů pro e-shopy | Zvyš návštěvnost o 50%"',
  'system'
),
(
  'best_practice',
  'E-shop produktový popis struktura',
  'Ideální struktura produktového popisu pro e-shop',
  ARRAY['content', 'e-shop', 'copywriting'],
  ARRAY['content_writer'],
  'Struktura produktového popisu:
1. Headline - hlavní benefit (ne název produktu)
2. Úvodní odstavec - pro koho je produkt a proč
3. Klíčové vlastnosti - 4-6 bullet points
4. Detailní popis - příběh, použití, materiály
5. Technické specifikace - tabulka
6. Social proof - recenze, certifikace
7. CTA - jasná výzva k akci

Tipy:
- Piš pro zákazníka, ne pro vyhledávače
- Používej smyslový jazyk
- Odpověz na časté otázky',
  'system'
),
(
  'template',
  'Meta description šablona',
  'Šablona pro psaní meta description',
  ARRAY['seo', 'meta', 'template'],
  ARRAY['seo_analyst', 'content_writer'],
  'Meta description šablony:

Pro produkty:
"{Produkt} - {hlavní benefit}. {Feature 1}, {Feature 2}. {CTA} Doprava zdarma nad X Kč."

Pro služby:
"{Služba} v {lokalita}. {Benefit 1} a {Benefit 2}. {Social proof}. {CTA}"

Pro blog:
"Zjistěte {co se naučí}. {Číslo} tipů od expertů. {Bonus/hodnota}. Čtěte více →"

Pravidla:
- Max 155 znaků
- Obsahuje klíčové slovo
- Má CTA
- Unikátní pro každou stránku',
  'system'
),
(
  'prompt',
  'Blog článek systémový prompt',
  'Efektivní prompt pro generování blog článků',
  ARRAY['content', 'blog', 'prompt'],
  ARRAY['content_writer'],
  'Prompt pro blog článek:

"Napiš blog článek na téma [TÉMA] pro [CÍLOVÁ SKUPINA].

Požadavky:
- Délka: [POČET] slov
- Tón: [odborný/přátelský/formální]
- Struktura: úvod, [POČET] hlavních sekcí s H2, závěr s CTA
- Zahrnuj praktické příklady
- Optimalizuj pro klíčové slovo: [KW]

Formát výstupu:
- Title tag (max 60 znaků)
- Meta description (max 155 znaků)
- Článek v markdown formátu
- 3 návrhy na interní prolinkování"',
  'system'
);
