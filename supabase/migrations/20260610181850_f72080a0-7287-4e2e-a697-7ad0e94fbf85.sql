ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.lessons
SET slug = regexp_replace(
  regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
  '(^-+|-+$)', '', 'g'
)
WHERE slug IS NULL;

-- de-dup any collisions by appending sort_order
WITH dups AS (
  SELECT id, slug,
    row_number() OVER (PARTITION BY slug ORDER BY sort_order, id) AS rn
  FROM public.lessons
)
UPDATE public.lessons l
SET slug = l.slug || '-' || l.sort_order::text
FROM dups
WHERE dups.id = l.id AND dups.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS lessons_slug_unique ON public.lessons (slug);

-- Allow public (anon) read of lessons + lesson_blocks for SEO pages
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT ON public.lesson_blocks TO anon;
GRANT SELECT ON public.sections TO anon;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='Public can read lessons') THEN
    CREATE POLICY "Public can read lessons" ON public.lessons FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lesson_blocks' AND policyname='Public can read lesson_blocks') THEN
    CREATE POLICY "Public can read lesson_blocks" ON public.lesson_blocks FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sections' AND policyname='Public can read sections') THEN
    CREATE POLICY "Public can read sections" ON public.sections FOR SELECT TO anon USING (true);
  END IF;
END $$;