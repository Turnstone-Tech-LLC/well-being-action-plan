-- =============================================================================
-- Add Revision Metadata to action_plan_revisions
-- =============================================================================
-- This migration adds fields to support the revision workflow:
-- - revision_type: Distinguishes between initial creation, quick edits, and follow-up revisions
-- - revision_notes: Summary of what changed in this revision
-- - what_worked_notes: Notes from revision conversation about what worked well
-- - what_didnt_work_notes: Notes from revision conversation about what should change
-- - check_in_summary: JSONB snapshot of check-in data imported from patient PDF export
-- =============================================================================

-- Add new columns to action_plan_revisions
ALTER TABLE action_plan_revisions
  ADD COLUMN IF NOT EXISTS revision_type TEXT
    CHECK (revision_type IN ('initial', 'edit', 'revision'))
    DEFAULT 'edit';

ALTER TABLE action_plan_revisions
  ADD COLUMN IF NOT EXISTS revision_notes TEXT;

ALTER TABLE action_plan_revisions
  ADD COLUMN IF NOT EXISTS what_worked_notes TEXT;

ALTER TABLE action_plan_revisions
  ADD COLUMN IF NOT EXISTS what_didnt_work_notes TEXT;

ALTER TABLE action_plan_revisions
  ADD COLUMN IF NOT EXISTS check_in_summary JSONB;

-- Add comments for documentation
COMMENT ON COLUMN action_plan_revisions.revision_type IS
  'Type of revision: initial (first creation), edit (quick fix), revision (follow-up visit workflow)';

COMMENT ON COLUMN action_plan_revisions.revision_notes IS
  'Summary of what changed in this revision - displayed to patients during updates';

COMMENT ON COLUMN action_plan_revisions.what_worked_notes IS
  'Notes from revision conversation: what strategies worked well for the patient';

COMMENT ON COLUMN action_plan_revisions.what_didnt_work_notes IS
  'Notes from revision conversation: what should change or improve';

COMMENT ON COLUMN action_plan_revisions.check_in_summary IS
  'JSONB snapshot of check-in data imported from patient PDF export during revision. Schema: {dateRange, totalCheckIns, zoneDistribution, topCopingSkills, feelingNotes, adultsContacted, importedAt}';

-- Update existing revisions to have appropriate revision_type
-- Version 1 revisions are initial, others are edits (since we didn't have the revision workflow before)
UPDATE action_plan_revisions
SET revision_type = CASE
  WHEN version = 1 THEN 'initial'
  ELSE 'edit'
END
WHERE revision_type IS NULL;

-- Create index for querying revisions by type (useful for filtering revision vs edit history)
CREATE INDEX IF NOT EXISTS idx_action_plan_revisions_type
  ON action_plan_revisions(revision_type);
