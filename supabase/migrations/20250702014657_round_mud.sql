/*
  # Add metadata column to summaries table

  1. Changes
    - Add `metadata` column to existing `summaries` table
    - Column stores JSON metadata about summary generation (provider, user, etc.)

  2. Safety
    - Uses IF NOT EXISTS pattern to avoid conflicts
    - Only adds the column if it doesn't already exist
*/

-- Add metadata column to summaries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'summaries' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE summaries ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;