-- ============================================================================
-- PART 1: PREPEND to the TOP of the generated init migration.sql
-- (the trigram index in the generated SQL needs this extension to already exist)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================================
-- PART 2: APPEND to the BOTTOM of the generated init migration.sql
-- Keeps "searchVector" in sync. Prisma ignores triggers, so no schema drift.
-- 'simple' config for names/slugs (so "gpt-4o" is not stemmed), 'english' for descriptions.
-- Lab name is NOT in this vector; the search query also matches lab name via a join.
-- ============================================================================
CREATE OR REPLACE FUNCTION model_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple',  coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('simple',  coalesce(NEW."slug", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER model_search_vector_trigger
BEFORE INSERT OR UPDATE OF "name", "slug", "description" ON "Model"
FOR EACH ROW EXECUTE FUNCTION model_search_vector_update();
